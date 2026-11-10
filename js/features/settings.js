// Life Flow - Settings Module
window.Settings = {
    init: function() {
        var self = this;
        self.bindCloudUI();

        var remBtn = document.getElementById('openRemindersBtn');
        if (remBtn) remBtn.addEventListener('click', function() {
            if (window.Reminders) Reminders.showSettings();
        });

        ['settingUserName', 'settingTheme', 'settingAccent', 'settingWeekStart', 'settingTimeFormat', 'settingNotifications'].forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            var event = (el.type === 'checkbox' || el.tagName === 'SELECT') ? 'change' : 'input';
            el.addEventListener(event, function() { self.save(true); });
        });

        // Password: save when user leaves the field or presses Enter (only if no password yet or setting first time)
        var passEl = document.getElementById('settingPassword');
        if (passEl) {
            passEl.addEventListener('change', function() { self.savePassword(); });
        }
        var changeBtn = document.getElementById('changePasswordBtn');
        if (changeBtn) {
            changeBtn.addEventListener('click', function() { self.changePassword(); });
        }
    },

    render: function() {
        var s = Storage.getSettings();
        var set = function(id, val, isCheck) {
            var el = document.getElementById(id);
            if (!el) return;
            if (isCheck) el.checked = !!val;
            else el.value = val != null ? val : '';
        };
        set('settingUserName', s.userName || '');
        /* email shown from AuthGate */
        set('settingTheme', s.theme || 'light');
        set('settingAccent', s.accentColor || 'default');
        set('settingWeekStart', String(s.weekStart != null ? s.weekStart : 1));
        set('settingTimeFormat', s.timeFormat || '24');
        set('settingNotifications', s.notifications !== false, true);

        var passEl = document.getElementById('settingPassword');
        var hint = document.getElementById('passwordHint');
        var changeBlock = document.getElementById('changePasswordBlock');
        if (s.passwordHash) {
            if (passEl) {
                passEl.value = '';
                passEl.placeholder = '••••••••';
                passEl.disabled = true;
            }
            if (hint) hint.textContent = 'Пароль уже задан. Чтобы сменить — заполните поля ниже.';
            if (changeBlock) changeBlock.style.display = 'block';
        } else {
            if (passEl) {
                passEl.disabled = false;
                passEl.placeholder = 'Придумайте пароль';
            }
            if (hint) hint.textContent = 'Пароль хранится только на этом устройстве';
            if (changeBlock) changeBlock.style.display = 'none';
        }
        this.updateCloudAuthUI();
        this.refreshMemoryStats();
    },


    bindCloudUI: function() {
        var self = this;
        var bind = function(id, fn) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('click', fn);
        };
        bind('cloudSignOutBtn', function() { self.cloudSignOut(); });
        bind('changePassOpenBtn', function() {
            var p = document.getElementById('changePassPanel');
            if (p) p.style.display = 'block';
        });
        bind('changePassCancelBtn', function() {
            var p = document.getElementById('changePassPanel');
            if (p) p.style.display = 'none';
        });
        bind('changePassConfirmBtn', function() { self.confirmChangePassword(); });
        bind('cloudSyncNowBtn', async function() {
            if (!window.Cloud) return;
            App.showToast('Синхронизация…');
            try {
                await Cloud.flushOutbox();
                await Cloud.pullAll();
                App.showToast('Синхронизация завершена');
                self.refreshMemoryStats();
            } catch (e) {
                App.showToast(e.message || 'Ошибка синхронизации', 'error');
            }
        });
        bind('memoryRefreshBtn', function() { self.refreshMemoryStats(); });
        bind('memoryClearCacheBtn', async function() {
            if (window.LFIDB) await LFIDB.clearCacheOnly();
            if ('caches' in window) {
                var keys = await caches.keys();
                // Keep shell, recreate soft — only delete non-primary if multiple
                App.showToast('Временные метки кэша сброшены');
            }
            self.refreshMemoryStats();
        });
        if (window.Cloud) {
            Cloud.onAuth(function() { self.updateCloudAuthUI(); });
            Cloud.onStatus(function() { self.refreshMemoryStats(); });
        }
        this.updateCloudAuthUI();
        this.refreshMemoryStats();
    },

    updateCloudAuthUI: function() {
        var acc = null;
        var emailEl = document.getElementById('settingAccountEmail');
        var passEl = document.getElementById('settingAccountPassword');
        if (emailEl) emailEl.value = (acc && acc.email) || '';
        if (passEl) {
            var n = (acc && acc.passwordDots) ? Math.min(24, Math.max(6, Number(acc.passwordDots))) : 8;
            passEl.value = Array(n + 1).join('•');
        }
        if (window.Cloud && Cloud._emitStatus) Cloud._emitStatus();
    },

    confirmChangePassword: function() {
        var oldP = (document.getElementById('changePassOld') || {}).value || '';
        var newP = (document.getElementById('changePassNew') || {}).value || '';
        var newP2 = (document.getElementById('changePassNew2') || {}).value || '';
        if (!oldP || !newP) { App.showToast('Заполните поля пароля', 'error'); return; }
        if (newP !== newP2) { App.showToast('Новые пароли не совпадают', 'error'); return; }
        if (newP.length < 6) { App.showToast('Пароль не менее 6 символов', 'error'); return; }
        if (!window.confirm('Подтвердить смену пароля?')) return;
        App.showToast('Смена пароля через облако — в разделе данных'); return; var res = {ok:false};
        if (!res.ok) { App.showToast(res.error || 'Не удалось сменить', 'error'); return; }
        // try cloud update if possible
        if (window.Cloud && Cloud.isConfigured && Cloud.isConfigured() && Cloud.isSignedIn && Cloud.isSignedIn()) {
            // best-effort; supabase needs re-auth for updateUser in some setups
            try {
                if (window.supabase && Cloud.getSession && Cloud.getSession()) {
                    /* optional */
                }
            } catch (e) {}
        }
        var panel = document.getElementById('changePassPanel');
        if (panel) panel.style.display = 'none';
        ['changePassOld','changePassNew','changePassNew2'].forEach(function(id) {
            var el = document.getElementById(id); if (el) el.value = '';
        });
        this.updateCloudAuthUI();
        App.showToast('Пароль изменён');
    },

    cloudSignIn: async function() {
        if (!window.Cloud || !Cloud.isConfigured()) {
            App.showToast('Укажите URL и anon-ключ в js/core/supabase-config.js', 'error');
            return;
        }
        var email = (document.getElementById('cloudEmail') || {}).value || '';
        var password = (document.getElementById('cloudPassword') || {}).value || '';
        if (!email || !password) { App.showToast('Введите email и пароль', 'error'); return; }
        try {
            await Cloud.signIn(email.trim(), password);
            App.showToast('Вход выполнен');
            this.updateCloudAuthUI();
            this.refreshMemoryStats();
        } catch (e) {
            App.showToast(e.message || 'Ошибка входа', 'error');
        }
    },

    cloudSignUp: async function() {
        if (!window.Cloud || !Cloud.isConfigured()) {
            App.showToast('Укажите URL и anon-ключ в js/core/supabase-config.js', 'error');
            return;
        }
        var email = (document.getElementById('cloudEmail') || {}).value || '';
        var password = (document.getElementById('cloudPassword') || {}).value || '';
        if (!email || !password) { App.showToast('Введите email и пароль', 'error'); return; }
        if (password.length < 6) { App.showToast('Пароль от 6 символов', 'error'); return; }
        try {
            await Cloud.signUp(email.trim(), password);
            App.showToast('Аккаунт создан. Проверьте почту, если включено подтверждение.');
            this.updateCloudAuthUI();
        } catch (e) {
            App.showToast(e.message || 'Ошибка регистрации', 'error');
        }
    },

    cloudSignOut: async function() {
        if (window.Cloud && Cloud.signOut) {
            try { await Cloud.signOut(); } catch (e) {}
        }
        /* local logout */ try { localStorage.removeItem("lifeflow_account"); } catch(e) {}
        App.showToast('Вы вышли из аккаунта');
        this.updateCloudAuthUI();
    },

    refreshMemoryStats: async function() {
        var el = document.getElementById('memoryStats');
        if (!el) return;
        function fmt(n) {
            if (!n) return '0 Б';
            if (n < 1024) return n + ' Б';
            if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' КБ';
            return (n / (1024 * 1024)).toFixed(2) + ' МБ';
        }
        try {
            var s = window.Cloud && Cloud.getStatusSummary ? await Cloud.getStatusSummary() : {
                online: navigator.onLine, configured: false, signedIn: false,
                usage: 0, quota: 0, outboxCount: 0, imageCount: 0
            };
            el.innerHTML =
                '<div>Сеть: <strong>' + (s.online ? 'онлайн' : 'офлайн') + '</strong></div>' +
                '<div>Облако: <strong>' + (s.configured ? (s.signedIn ? 'вход выполнен' : 'без входа') : 'не настроено') + '</strong></div>' +
                '<div>Хранилище браузера: <strong>' + fmt(s.usage) + '</strong>' + (s.quota ? (' из ~' + fmt(s.quota)) : '') + '</div>' +
                '<div>Очередь синхронизации: <strong>' + (s.outboxCount || 0) + '</strong></div>' +
                '<div>Локальные копии изображений: <strong>' + (s.imageCount || 0) + '</strong></div>' +
                (s.lastSyncAt ? ('<div>Последняя синхронизация: <strong>' + new Date(s.lastSyncAt).toLocaleString('ru-RU') + '</strong></div>') : '');
        } catch (e) {
            el.textContent = 'Не удалось оценить хранилище';
        }
    },

    // Simple hash for local storage (not cryptographic security — local only)
    hashPassword: function(str) {
        var h = 5381;
        for (var i = 0; i < str.length; i++) {
            h = ((h << 5) + h) ^ str.charCodeAt(i);
        }
        // second pass
        var h2 = 0;
        for (var j = 0; j < str.length; j++) {
            h2 = (Math.imul(31, h2) + str.charCodeAt(j)) | 0;
        }
        return 'lf_' + (h >>> 0).toString(16) + '_' + (h2 >>> 0).toString(16) + '_' + str.length;
    },

    savePassword: function() {
        var passEl = document.getElementById('settingPassword');
        if (!passEl || passEl.disabled) return;
        var pwd = passEl.value;
        if (!pwd) return;
        if (pwd.length < 4) {
            App.showToast('Пароль слишком короткий (минимум 4 символа)', 'error');
            return;
        }
        var s = Storage.getSettings();
        s.passwordHash = this.hashPassword(pwd);
        Storage.saveSettings(s);
        passEl.value = '';
        passEl.placeholder = '••••••••';
        passEl.disabled = true;
        var hint = document.getElementById('passwordHint');
        if (hint) hint.textContent = 'Пароль сохранён. Чтобы сменить — используйте блок ниже.';
        var changeBlock = document.getElementById('changePasswordBlock');
        if (changeBlock) changeBlock.style.display = 'block';
        App.showToast('Пароль сохранён');
    },

    changePassword: function() {
        var oldEl = document.getElementById('settingOldPassword');
        var newEl = document.getElementById('settingNewPassword');
        if (!oldEl || !newEl) return;
        var oldP = oldEl.value;
        var newP = newEl.value;
        var s = Storage.getSettings();
        if (!s.passwordHash) {
            App.showToast('Сначала задайте пароль', 'error');
            return;
        }
        if (this.hashPassword(oldP) !== s.passwordHash) {
            App.showToast('Текущий пароль неверный', 'error');
            return;
        }
        if (!newP || newP.length < 4) {
            App.showToast('Новый пароль слишком короткий', 'error');
            return;
        }
        s.passwordHash = this.hashPassword(newP);
        Storage.saveSettings(s);
        oldEl.value = '';
        newEl.value = '';
        App.showToast('Пароль успешно изменён');
    },

    save: function(silent) {
        var nameEl = document.getElementById('settingUserName');
        var emailEl = document.getElementById('settingEmail');
        var themeEl = document.getElementById('settingTheme');
        var accentEl = document.getElementById('settingAccent');
        var weekEl = document.getElementById('settingWeekStart');
        var timeEl = document.getElementById('settingTimeFormat');
        var notifEl = document.getElementById('settingNotifications');
        if (!themeEl) return;

        var prev = Storage.getSettings();
        var settings = {
            userName: nameEl ? (nameEl.value.trim() || 'Пользователь') : 'Пользователь',
            email: emailEl ? emailEl.value.trim() : (prev.email || ''),
            passwordHash: prev.passwordHash || null,
            theme: themeEl.value,
            accentColor: accentEl ? accentEl.value : 'default',
            weekStart: weekEl ? Number(weekEl.value) : 1,
            timeFormat: timeEl ? timeEl.value : '24',
            notifications: notifEl ? notifEl.checked : true
        };
        Storage.saveSettings(settings);
        App.applySettings();
        App.updateDateAndGreeting();
        // silent auto-save — no toast spam
    }
};
