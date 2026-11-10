// Life Flow - IndexedDB layer (offline durable store)
(function () {
    var DB_NAME = 'lifeflow_idb';
    var DB_VER = 1;
    var db = null;

    function open() {
        if (db) return Promise.resolve(db);
        return new Promise(function (resolve, reject) {
            var req = indexedDB.open(DB_NAME, DB_VER);
            req.onupgradeneeded = function (e) {
                var d = e.target.result;
                if (!d.objectStoreNames.contains('kv')) {
                    d.createObjectStore('kv', { keyPath: 'key' });
                }
                if (!d.objectStoreNames.contains('images')) {
                    d.createObjectStore('images', { keyPath: 'id' });
                }
                if (!d.objectStoreNames.contains('meta')) {
                    d.createObjectStore('meta', { keyPath: 'key' });
                }
                if (!d.objectStoreNames.contains('outbox')) {
                    var ob = d.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
                    ob.createIndex('by_time', 'ts', { unique: false });
                }
            };
            req.onsuccess = function (e) {
                db = e.target.result;
                resolve(db);
            };
            req.onerror = function () { reject(req.error); };
        });
    }

    function tx(store, mode) {
        return open().then(function (d) {
            return d.transaction(store, mode).objectStore(store);
        });
    }

    function reqToPromise(req) {
        return new Promise(function (resolve, reject) {
            req.onsuccess = function () { resolve(req.result); };
            req.onerror = function () { reject(req.error); };
        });
    }

    window.LFIDB = {
        open: open,

        get: function (key) {
            return open().then(function (d) {
                return reqToPromise(d.transaction('kv', 'readonly').objectStore('kv').get(key));
            }).then(function (row) {
                return row ? row.value : undefined;
            });
        },

        set: function (key, value) {
            return open().then(function (d) {
                return reqToPromise(d.transaction('kv', 'readwrite').objectStore('kv').put({
                    key: key,
                    value: value,
                    updatedAt: Date.now()
                }));
            });
        },

        getAllKeys: function () {
            return open().then(function (d) {
                return reqToPromise(d.transaction('kv', 'readonly').objectStore('kv').getAllKeys());
            });
        },

        getAll: function () {
            return open().then(function (d) {
                return reqToPromise(d.transaction('kv', 'readonly').objectStore('kv').getAll());
            }).then(function (rows) {
                var out = {};
                (rows || []).forEach(function (r) { out[r.key] = r.value; });
                return out;
            });
        },

        remove: function (key) {
            return open().then(function (d) {
                return reqToPromise(d.transaction('kv', 'readwrite').objectStore('kv').delete(key));
            });
        },

        // Image blobs: { id, blob, mime, remoteUrl, updatedAt }
        putImage: function (id, blob, meta) {
            meta = meta || {};
            return open().then(function (d) {
                return reqToPromise(d.transaction('images', 'readwrite').objectStore('images').put({
                    id: id,
                    blob: blob,
                    mime: meta.mime || blob.type || 'image/jpeg',
                    remoteUrl: meta.remoteUrl || '',
                    updatedAt: Date.now()
                }));
            });
        },

        getImage: function (id) {
            return open().then(function (d) {
                return reqToPromise(d.transaction('images', 'readonly').objectStore('images').get(id));
            });
        },

        getImageUrl: function (id) {
            return this.getImage(id).then(function (row) {
                if (!row || !row.blob) return null;
                return URL.createObjectURL(row.blob);
            });
        },

        deleteImage: function (id) {
            return open().then(function (d) {
                return reqToPromise(d.transaction('images', 'readwrite').objectStore('images').delete(id));
            });
        },

        listImages: function () {
            return open().then(function (d) {
                return reqToPromise(d.transaction('images', 'readonly').objectStore('images').getAll());
            });
        },

        metaGet: function (key) {
            return open().then(function (d) {
                return reqToPromise(d.transaction('meta', 'readonly').objectStore('meta').get(key));
            }).then(function (row) { return row ? row.value : null; });
        },

        metaSet: function (key, value) {
            return open().then(function (d) {
                return reqToPromise(d.transaction('meta', 'readwrite').objectStore('meta').put({ key: key, value: value }));
            });
        },

        outboxAdd: function (item) {
            item = Object.assign({ ts: Date.now() }, item);
            return open().then(function (d) {
                return reqToPromise(d.transaction('outbox', 'readwrite').objectStore('outbox').add(item));
            });
        },

        outboxAll: function () {
            return open().then(function (d) {
                return reqToPromise(d.transaction('outbox', 'readonly').objectStore('outbox').getAll());
            });
        },

        outboxClear: function (ids) {
            return open().then(function (d) {
                var store = d.transaction('outbox', 'readwrite').objectStore('outbox');
                if (!ids || !ids.length) {
                    return reqToPromise(store.clear());
                }
                return Promise.all(ids.map(function (id) {
                    return reqToPromise(store.delete(id));
                }));
            });
        },

        estimateSize: function () {
            if (navigator.storage && navigator.storage.estimate) {
                return navigator.storage.estimate();
            }
            return Promise.resolve({ usage: 0, quota: 0 });
        },

        clearCacheOnly: function () {
            // Does not clear kv personal data or outbox
            return open().then(function (d) {
                // keep images that may be offline copies of user photos — only clear meta cache flags
                return LFIDB.metaSet('cacheClearedAt', Date.now());
            });
        }
    };
})();
