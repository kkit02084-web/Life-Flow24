// Life Flow auth — full screen switch (no overlay, no blur)
window.AuthGate = {
    ACCOUNT_KEY: 'lifeflow_account',
    _bound: false,

    getAccount: function () {
        try { return JSON.parse(localStorage.getItem(this.ACCOUNT_KEY) || 'null'); }
        catch (e) { return null; }
    },
    saveAccount: function (acc) {
        try {
            localStorage.setItem(this.ACCOUNT_KEY, JSON.stringify({
                email: acc.email,
                name: acc.name,
                passwordHash: acc.passwordHash,
                passwordDots: acc.passwordDots || 8,
                createdAt: acc.createdAt || new Date().toISOString()
            }));
        } catch (e) { console.warn(e); }
    },
    isLoggedIn: function () {
        var a = this.getAccount();
        return !!(a && a.email && a.passwordHash);
    },
    hash: function (str) {
        var s = String(str || ''), h = 5381, h2 = 0, i;
        for (i = 0; i < s.length; i++) { h = ((h << 5) + h) ^ s.charCodeAt(i); h >>>= 0; }
        for (i = 0; i < s.length; i++) { h2 = (Math.imul(31, h2) + s.charCodeAt(i)) | 0; }
        return 'lf_' + (h >>> 0).toString(16) + '_' + ((h2 >>> 0).toString(16)) + '_' + s.length;
    },

    _tap: function (el, fn) {
        if (!el || el._lfBound) return;
        el._lfBound = true;
        var lock = false;
        function run(e) {
            if (lock) return;
            lock = true;
            setTimeout(function () { lock = false; }, 400);
            try { if (e && e.preventDefault) e.preventDefault(); } catch (err) {}
            fn(e);
        }
        el.addEventListener('click', run, false);
        el.addEventListener('touchend', run, { passive: false });
    },

    _showPanel: function (mode) {
        this._mode = mode;
        var reg = document.getElementById('gateRegisterPanel');
        var log = document.getElementById('gateLoginPanel');
        var title = document.getElementById('gateTitle');
        var sub = document.getElementById('gateSub');
        if (reg) reg.classList.toggle('active', mode === 'register');
        if (log) log.classList.toggle('active', mode === 'login');
        if (title) title.textContent = mode === 'register' ? 'Регистрация' : 'Вход';
        if (sub) sub.textContent = mode === 'register' ? 'Создайте аккаунт для Life Flow' : 'Введите email и пароль';
        var acc = this.getAccount();
        if (mode === 'login' && acc && acc.email) {
            var em = document.getElementById('gateEmailLogin');
            if (em && !em.value) em.value = acc.email;
        }
    },

    showAuth: function () {
        document.body.classList.add('is-auth');
        document.body.classList.remove('is-app');
        var el = document.getElementById('authGate');
        if (el) {
            el.classList.add('is-open');
            el.setAttribute('aria-hidden', 'false');
        }
        this._bind();
        var acc = this.getAccount();
        this._showPanel(acc && acc.email ? 'login' : 'register');
    },

    showApp: function () {
        document.body.classList.remove('is-auth');
        document.body.classList.add('is-app');
        var el = document.getElementById('authGate');
        if (el) {
            el.classList.remove('is-open');
            el.setAttribute('aria-hidden', 'true');
            el.style.display = 'none';
        }
        var app = document.getElementById('appRoot');
        if (app) {
            app.style.display = 'flex';
            app.style.pointerEvents = '';
            app.style.filter = '';
            app.style.opacity = '';
        }
        // close mobile drawer if open
        var side = document.getElementById('sidebar');
        if (side) {
            side.classList.remove('open');
            side.style.pointerEvents = '';
            side.style.filter = '';
        }
        var ov = document.getElementById('sidebarOverlay');
        if (ov) {
            ov.classList.remove('active');
            ov.style.pointerEvents = '';
        }
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
        document.body.style.filter = '';
    },

    // aliases used elsewhere
    show: function () { this.showAuth(); },
    hide: function () { this.showApp(); },

    init: function () {
        try {
            this._bind();
            if (this.isLoggedIn()) this.showApp();
            else this.showAuth();
        } catch (e) {
            console.error(e);
            this.showAuth();
        }
    },

    _bind: function () {
        if (this._bound) return;
        var gate = document.getElementById('authGate');
        if (!gate) return;
        this._bound = true;
        var self = this;
        this._tap(document.getElementById('gateToLogin'), function () { self._showPanel('login'); });
        this._tap(document.getElementById('gateToRegister'), function () { self._showPanel('register'); });
        this._tap(document.getElementById('gateRegisterBtn'), function () { self._doRegister(); });
        this._tap(document.getElementById('gateLoginBtn'), function () { self._doLogin(); });
    },

    _err: function (id, msg) {
        var el = document.getElementById(id);
        if (el) el.textContent = msg || '';
    },

    _finish: function (acc, msg) {
        this.saveAccount(acc);
        this.showApp();
        try {
            if (window.Storage) {
                var s = Storage.getSettings();
                s.userName = acc.name || s.userName || 'Пользователь';
                s.email = acc.email;
                s.passwordHash = acc.passwordHash;
                Storage.saveSettings(s);
            }
        } catch (e) {}
        try {
            if (window.App && App.applySettings) App.applySettings();
            if (window.App && App.showToast) App.showToast(msg || 'Готово');
            if (window.Settings && Settings.render) Settings.render();
            if (window.App && App.renderDashboard) App.renderDashboard();
        } catch (e) {}
        if (acc._tmpPass && window.Cloud && Cloud.isConfigured && Cloud.isConfigured()) {
            var email = acc.email, pass = acc._tmpPass;
            setTimeout(function () {
                try {
                    Cloud.signIn(email, pass).catch(function () { return Cloud.signUp(email, pass); }).catch(function () {});
                } catch (e) {}
            }, 400);
        }
    },

    _doRegister: function () {
        this._err('gateErrorReg', '');
        var name = ((document.getElementById('gateName') || {}).value || '').trim() || 'Пользователь';
        var email = ((document.getElementById('gateEmailReg') || {}).value || '').trim().toLowerCase();
        var pass = ((document.getElementById('gatePassReg') || {}).value || '');
        var pass2 = ((document.getElementById('gatePass2') || {}).value || '');
        if (!email || email.indexOf('@') < 1) { this._err('gateErrorReg', 'Укажите корректный email'); return; }
        if (pass.length < 6) { this._err('gateErrorReg', 'Пароль не менее 6 символов'); return; }
        if (pass !== pass2) { this._err('gateErrorReg', 'Пароли не совпадают'); return; }
        this._finish({
            email: email, name: name,
            passwordHash: this.hash(pass),
            passwordDots: pass.length,
            _tmpPass: pass
        }, 'Добро пожаловать, ' + name + '!');
    },

    _doLogin: function () {
        this._err('gateErrorLogin', '');
        var email = ((document.getElementById('gateEmailLogin') || {}).value || '').trim().toLowerCase();
        var pass = ((document.getElementById('gatePassLogin') || {}).value || '');
        if (!email || email.indexOf('@') < 1) { this._err('gateErrorLogin', 'Укажите email'); return; }
        if (pass.length < 6) { this._err('gateErrorLogin', 'Пароль не менее 6 символов'); return; }
        var hashPass = this.hash(pass);
        var existing = this.getAccount();
        var ok = false, name = 'Пользователь';
        if (existing && existing.email === email && existing.passwordHash === hashPass) {
            ok = true; name = existing.name || name;
        } else {
            try {
                if (window.Storage) {
                    var s = Storage.getSettings();
                    if ((s.email || '').toLowerCase() === email && s.passwordHash === hashPass) {
                        ok = true; name = s.userName || name;
                    }
                }
            } catch (e) {}
        }
        if (!ok) {
            this._err('gateErrorLogin', existing && existing.email === email ? 'Неверный пароль' : 'Аккаунт не найден — нажмите «Регистрация»');
            return;
        }
        this._finish({
            email: email, name: name,
            passwordHash: hashPass,
            passwordDots: pass.length,
            _tmpPass: pass
        }, 'С возвращением!');
    },

    logoutLocal: function () {
        try { localStorage.removeItem(this.ACCOUNT_KEY); } catch (e) {}
        this.showAuth();
    },

    changePassword: function (oldPass, newPass) {
        var acc = this.getAccount();
        if (!acc) return { ok: false, error: 'Нет аккаунта' };
        if (acc.passwordHash !== this.hash(oldPass)) return { ok: false, error: 'Неверный текущий пароль' };
        if (!newPass || newPass.length < 6) return { ok: false, error: 'Новый пароль не менее 6 символов' };
        acc.passwordHash = this.hash(newPass);
        acc.passwordDots = newPass.length;
        this.saveAccount(acc);
        try {
            if (window.Storage) {
                var s = Storage.getSettings();
                s.passwordHash = acc.passwordHash;
                Storage.saveSettings(s);
            }
        } catch (e) {}
        return { ok: true };
    }
};

(function () {
    function boot() {
        try { if (window.AuthGate) AuthGate.init(); } catch (e) { console.error(e); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
    setTimeout(boot, 50);
})();
