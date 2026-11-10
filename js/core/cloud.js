// Life Flow - Auth, cloud sync, image upload (Supabase)
(function () {
    var PERSONAL_KEYS = [
        'settings', 'events', 'habits', 'habitLogs', 'skills', 'menu', 'shoppingList',
        'incomes', 'expenses', 'budget', 'savingsGoals', 'workouts', 'favorites',
        'interests', 'hobbyStatuses', 'dayPlans', 'templates', 'notes', 'goals',
        'quickNotes', 'moods', 'reminderSettings', 'myBooks', 'userBooks',
        'readerSettings', 'bookTexts', 'bodyStats', 'waterLog', 'stepsLog'
    ];

    var SHARED_KEYS = [
        'recipes', 'exercises', 'bookOverrides', 'authorOverrides', 'hobbyOverrides',
        'siteQuotes', 'moodLabels'
    ];

    var client = null;
    var session = null;
    var syncing = false;
    var lastSyncAt = null;
    var pendingKeys = {};
    var online = typeof navigator !== 'undefined' ? navigator.onLine : true;

    function cfg() { return window.LF_SUPABASE || {}; }

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            if (document.querySelector('script[src="' + src + '"]')) {
                resolve();
                return;
            }
            var s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    async function ensureClient() {
        if (client) return client;
        if (!cfg().enabled()) return null;
        if (!window.supabase) {
            await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
        }
        if (!window.supabase) throw new Error('Supabase SDK failed to load');
        client = window.supabase.createClient(cfg().url, cfg().anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: window.localStorage
            }
        });
        var res = await client.auth.getSession();
        session = res.data && res.data.session ? res.data.session : null;
        client.auth.onAuthStateChange(function (event, s) {
            session = s;
            Cloud._emitAuth();
            if (s && event === 'SIGNED_IN') {
                Cloud.pullAll().then(function () { return Cloud.flushOutbox(); });
            }
        });
        return client;
    }

    function userId() {
        return session && session.user ? session.user.id : null;
    }

    function isPersonal(key) { return PERSONAL_KEYS.indexOf(key) >= 0; }
    function isShared(key) { return SHARED_KEYS.indexOf(key) >= 0; }

    function dataUrlToBlob(dataUrl) {
        var parts = dataUrl.split(',');
        var mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
        var bin = atob(parts[1]);
        var arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return new Blob([arr], { type: mime });
    }

    function hashId(str) {
        var h = 0;
        for (var i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
        return 'img_' + Math.abs(h).toString(16) + '_' + str.length;
    }

    window.Cloud = {
        PERSONAL_KEYS: PERSONAL_KEYS,
        SHARED_KEYS: SHARED_KEYS,

        isOnline: function () { return online; },
        isConfigured: function () { return cfg().enabled(); },
        isSignedIn: function () { return !!userId(); },
        getSession: function () { return session; },
        getUser: function () { return session && session.user ? session.user : null; },
        isSyncing: function () { return syncing; },
        lastSync: function () { return lastSyncAt; },

        init: async function () {
            window.addEventListener('online', function () {
                online = true;
                Cloud._emitStatus();
                Cloud.flushOutbox();
                Cloud.pullAll();
            });
            window.addEventListener('offline', function () {
                online = false;
                Cloud._emitStatus();
            });
            try {
                await ensureClient();
            } catch (e) {
                console.warn('Cloud init:', e);
            }
            if (session) {
                await Cloud.pullAll();
                await Cloud.flushOutbox();
            }
            Cloud._emitAuth();
            Cloud._emitStatus();
        },

        _listeners: { auth: [], status: [] },
        onAuth: function (fn) { this._listeners.auth.push(fn); },
        onStatus: function (fn) { this._listeners.status.push(fn); },
        _emitAuth: function () {
            this._listeners.auth.forEach(function (fn) { try { fn(session); } catch (e) {} });
        },
        _emitStatus: function () {
            var st = {
                online: online,
                configured: cfg().enabled(),
                signedIn: !!userId(),
                syncing: syncing,
                lastSyncAt: lastSyncAt
            };
            this._listeners.status.forEach(function (fn) { try { fn(st); } catch (e) {} });
            var el = document.getElementById('syncStatusText');
            if (el) {
                if (!st.configured) el.textContent = 'Облако не настроено (локальный режим)';
                else if (!st.online) el.textContent = 'Офлайн — изменения сохраняются локально';
                else if (!st.signedIn) el.textContent = 'Онлайн · войдите, чтобы синхронизировать';
                else if (st.syncing) el.textContent = 'Синхронизация…';
                else el.textContent = st.lastSyncAt
                    ? ('Синхронизировано: ' + new Date(st.lastSyncAt).toLocaleString('ru-RU'))
                    : 'Готово к синхронизации';
            }
        },

        signUp: async function (email, password) {
            var c = await ensureClient();
            if (!c) throw new Error('Supabase не настроен');
            var res = await c.auth.signUp({ email: email, password: password });
            if (res.error) throw res.error;
            session = res.data.session;
            Cloud._emitAuth();
            return res.data;
        },

        signIn: async function (email, password) {
            var c = await ensureClient();
            if (!c) throw new Error('Supabase не настроен');
            var res = await c.auth.signInWithPassword({ email: email, password: password });
            if (res.error) throw res.error;
            session = res.data.session;
            Cloud._emitAuth();
            await Cloud.pullAll();
            await Cloud.flushOutbox();
            return res.data;
        },

        signOut: async function () {
            var c = await ensureClient();
            if (c) await c.auth.signOut();
            session = null;
            Cloud._emitAuth();
            Cloud._emitStatus();
        },

        // Called by Storage.set — never blocks UI
        markDirty: function (key, value) {
            pendingKeys[key] = true;
            if (!cfg().enabled()) return;
            if (!online || !userId()) {
                // queue for later
                if (window.LFIDB) {
                    LFIDB.outboxAdd({
                        type: isShared(key) ? 'shared' : 'personal',
                        key: key,
                        value: value,
                        updatedAt: Date.now()
                    });
                }
                return;
            }
            // debounce burst
            clearTimeout(Cloud._flushTimer);
            Cloud._flushTimer = setTimeout(function () {
                Cloud.pushKey(key, value).catch(function (e) {
                    console.warn('push failed, queued', key, e);
                    if (window.LFIDB) {
                        LFIDB.outboxAdd({
                            type: isShared(key) ? 'shared' : 'personal',
                            key: key,
                            value: value,
                            updatedAt: Date.now()
                        });
                    }
                });
            }, 600);
        },

        pushKey: async function (key, value) {
            var c = await ensureClient();
            if (!c || !userId()) return;
            value = await Cloud._processImagesInValue(key, value);
            if (isShared(key)) {
                // only admins should succeed — RLS enforces
                var { error } = await c.from('shared_content').upsert({
                    key: key,
                    data: value,
                    updated_at: new Date().toISOString(),
                    updated_by: userId()
                }, { onConflict: 'key' });
                if (error) throw error;
            } else if (isPersonal(key)) {
                var res = await c.from('user_data').upsert({
                    user_id: userId(),
                    key: key,
                    data: value,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,key' });
                if (res.error) throw res.error;
            }
            lastSyncAt = Date.now();
            delete pendingKeys[key];
            Cloud._emitStatus();
        },

        flushOutbox: async function () {
            if (!online || !cfg().enabled() || !userId() || !window.LFIDB) return;
            if (syncing) return;
            syncing = true;
            Cloud._emitStatus();
            try {
                var items = await LFIDB.outboxAll();
                if (!items || !items.length) return;
                // last-write-wins per key
                var byKey = {};
                items.forEach(function (it) {
                    var prev = byKey[it.key];
                    if (!prev || (it.updatedAt || it.ts) >= (prev.updatedAt || prev.ts)) byKey[it.key] = it;
                });
                var doneIds = items.map(function (it) { return it.id; });
                for (var key in byKey) {
                    try {
                        await Cloud.pushKey(key, byKey[key].value);
                    } catch (e) {
                        console.warn('outbox item failed', key, e);
                        // keep in outbox — clear only successful batch later selectively
                        doneIds = doneIds.filter(function (id) {
                            return items.find(function (x) { return x.id === id && x.key !== key; });
                        });
                    }
                }
                await LFIDB.outboxClear(doneIds);
                lastSyncAt = Date.now();
            } finally {
                syncing = false;
                Cloud._emitStatus();
            }
        },

        pullAll: async function () {
            var c = await ensureClient();
            if (!c || !userId()) return;
            if (syncing) return;
            syncing = true;
            Cloud._emitStatus();
            try {
                // Personal
                var pers = await c.from('user_data').select('key,data,updated_at').eq('user_id', userId());
                if (pers.error) throw pers.error;
                (pers.data || []).forEach(function (row) {
                    if (row && row.key != null) {
                        Storage._applyRemote(row.key, row.data, row.updated_at);
                    }
                });
                // Shared
                var sh = await c.from('shared_content').select('key,data,updated_at');
                if (!sh.error) {
                    (sh.data || []).forEach(function (row) {
                        if (row && row.key != null) {
                            Storage._applyRemote(row.key, row.data, row.updated_at);
                        }
                    });
                }
                lastSyncAt = Date.now();
            } catch (e) {
                console.warn('pullAll', e);
            } finally {
                syncing = false;
                Cloud._emitStatus();
            }
        },

        // Upload data-URL or Blob → Storage, cache in IDB, return public URL
        uploadImage: async function (dataUrlOrBlob, opts) {
            opts = opts || {};
            var blob = typeof dataUrlOrBlob === 'string' ? dataUrlToBlob(dataUrlOrBlob) : dataUrlOrBlob;
            var id = opts.id || hashId((opts.name || '') + blob.size + Date.now());
            if (window.LFIDB) {
                await LFIDB.putImage(id, blob, { mime: blob.type });
            }
            if (!cfg().enabled() || !online || !userId()) {
                // offline: keep data URL for now
                if (typeof dataUrlOrBlob === 'string') return dataUrlOrBlob;
                return await new Promise(function (resolve) {
                    var r = new FileReader();
                    r.onload = function () { resolve(r.result); };
                    r.readAsDataURL(blob);
                });
            }
            var c = await ensureClient();
            var bucket = opts.shared ? cfg().buckets.sharedImages : cfg().buckets.userImages;
            var path = (opts.shared ? 'shared/' : (userId() + '/')) + id + (blob.type === 'image/png' ? '.png' : '.jpg');
            var up = await c.storage.from(bucket).upload(path, blob, { upsert: true, contentType: blob.type });
            if (up.error) throw up.error;
            var pub = c.storage.from(bucket).getPublicUrl(path);
            var url = pub.data && pub.data.publicUrl ? pub.data.publicUrl : '';
            if (window.LFIDB) await LFIDB.putImage(id, blob, { mime: blob.type, remoteUrl: url });
            return url || dataUrlOrBlob;
        },

        _processImagesInValue: async function (key, value) {
            // Walk shallow structures for data:image fields commonly used
            async function walk(obj) {
                if (!obj || typeof obj !== 'object') return obj;
                if (Array.isArray(obj)) {
                    var arr = [];
                    for (var i = 0; i < obj.length; i++) arr.push(await walk(obj[i]));
                    return arr;
                }
                var out = {};
                for (var k in obj) {
                    if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
                    var v = obj[k];
                    if (typeof v === 'string' && v.indexOf('data:image') === 0 && v.length > 256) {
                        try {
                            out[k] = await Cloud.uploadImage(v, { shared: isShared(key) });
                        } catch (e) {
                            out[k] = v;
                        }
                    } else if (k === 'images' && Array.isArray(v)) {
                        out[k] = await walk(v);
                    } else if (v && typeof v === 'object' && (k === 'image' || k === 'cover' || k === 'photo')) {
                        out[k] = await walk(v);
                    } else {
                        out[k] = v;
                    }
                }
                return out;
            }
            try {
                return await walk(value);
            } catch (e) {
                return value;
            }
        },

        // Resolve remote image to local object URL when offline
        resolveImageSrc: async function (src) {
            if (!src) return src;
            if (src.indexOf('data:') === 0 || src.indexOf('blob:') === 0 || src.indexOf('assets/') === 0) return src;
            if (!window.LFIDB) return src;
            var rows = await LFIDB.listImages();
            var hit = (rows || []).find(function (r) { return r.remoteUrl === src; });
            if (hit && hit.blob) return URL.createObjectURL(hit.blob);
            return src;
        },

        getStatusSummary: async function () {
            var usage = { usage: 0, quota: 0 };
            if (window.LFIDB) usage = await LFIDB.estimateSize();
            var outbox = window.LFIDB ? await LFIDB.outboxAll() : [];
            var images = window.LFIDB ? await LFIDB.listImages() : [];
            return {
                online: online,
                configured: cfg().enabled(),
                signedIn: !!userId(),
                email: session && session.user ? session.user.email : '',
                usage: usage.usage || 0,
                quota: usage.quota || 0,
                outboxCount: (outbox || []).length,
                imageCount: (images || []).length,
                lastSyncAt: lastSyncAt
            };
        }
    };
})();
