// Life Flow — Full Admin Panel
window.Admin = {
    _ph: 1848079596,
    _sessionKey: 'lifeflow_admin_ok',
    tab: 'overview',
    panelActive: false,

    _hash: function(str) {
        var h = 5381;
        for (var i = 0; i < str.length; i++) {
            h = ((h << 5) + h) ^ str.charCodeAt(i);
            h = h >>> 0;
        }
        return h;
    },
    isAuthed: function() {
        try { return sessionStorage.getItem(this._sessionKey) === '1'; } catch (e) { return false; }
    },
    setAuthed: function(ok) {
        try {
            if (ok) sessionStorage.setItem(this._sessionKey, '1');
            else sessionStorage.removeItem(this._sessionKey);
        } catch (e) {}
    },
    checkPassword: function(input) {
        if (!input) return false;
        return this._hash(String(input).trim()) === this._ph;
    },
    setPasswordHash: function(newPass) {
        this._ph = this._hash(String(newPass).trim());
        try { localStorage.setItem('lifeflow_admin_ph', String(this._ph)); } catch (e) {}
    },
    loadCustomHash: function() {
        try {
            var stored = localStorage.getItem('lifeflow_admin_ph');
            if (stored) this._ph = Number(stored) >>> 0;
        } catch (e) {}
    },

    getAppearance: function() {
        try { return JSON.parse(localStorage.getItem('lifeflow_appearance') || '{}'); } catch (e) { return {}; }
    },
    saveAppearance: function(obj) {
        try { localStorage.setItem('lifeflow_appearance', JSON.stringify(obj)); } catch (e) {}
        this.applyAppearance();
    },
    applyAppearance: function() {
        var a = this.getAppearance();
        var root = document.documentElement;
        var keys = ['bgPrimary','bgCard','greenMain','greenDark','greenLight','textMain'];
        var map = {
            bgPrimary: '--bg-primary', bgCard: '--bg-card', greenMain: '--green-main',
            greenDark: '--green-dark', greenLight: '--green-light', textMain: '--text-main'
        };
        keys.forEach(function(k) {
            if (a[k]) root.style.setProperty(map[k], a[k]);
            else root.style.removeProperty(map[k]);
        });
        if (a.greenMain) root.style.setProperty('--accent', a.greenMain);
        else root.style.removeProperty('--accent');
        if (a.dustyPink) root.style.setProperty('--botanical-dusty-pink', a.dustyPink);
        else root.style.removeProperty('--botanical-dusty-pink');

        var op = a.plantOpacity;
        if (op == null || op === '') op = 78;
        op = Math.max(0, Math.min(100, Number(op)));
        root.style.setProperty('--plant-opacity', String(op / 100));
        root.style.setProperty('--plant-opacity-dark', String(Math.max(0.12, (op / 100) * 0.85)));

        if (a.plantsHidden) document.body.classList.add('plants-hidden');
        else document.body.classList.remove('plants-hidden');
    },

    init: function() {
        this.loadCustomHash();
        this.applyAppearance();
        if (location.hash === '#admin') this.openGate();
        window.addEventListener('hashchange', function() {
            if (location.hash === '#admin') Admin.openGate();
        });
    },

    openGate: function() {
        if (this.isAuthed()) { this.enter(); return; }
        this.showLoginModal();
    },

    _passField: function(id, placeholder) {
        return '<div class="admin-pass-wrap" style="position:relative;">' +
            '<input type="password" class="form-control" id="' + id + '" autocomplete="current-password" placeholder="' + (placeholder || '••••••••') + '" style="padding-right:44px;">' +
            '<button type="button" class="admin-eye-btn" data-eye-for="' + id + '" title="Показать/скрыть" ' +
            'style="position:absolute;right:8px;top:50%;transform:translateY(-50%);border:none;background:transparent;cursor:pointer;font-size:1.15rem;line-height:1;padding:4px;opacity:0.75;">👁</button></div>';
    },
    _bindEyeToggles: function(root) {
        (root || document).querySelectorAll('[data-eye-for]').forEach(function(btn) {
            btn.onclick = function() {
                var inp = document.getElementById(btn.getAttribute('data-eye-for'));
                if (!inp) return;
                if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; btn.style.opacity = '1'; }
                else { inp.type = 'password'; btn.textContent = '👁'; btn.style.opacity = '0.75'; }
            };
        });
    },

    showLoginModal: function() {
        var html =
            '<div class="modal-header"><h2>Админ-панель</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<p class="text-muted mb-16" style="font-size:0.9rem;">Введите пароль. Проверка мгновенная.</p>' +
            '<div class="form-group"><label>Пароль</label>' + this._passField('adminPassInput') + '</div>' +
            '<div id="adminPassError" style="color:#C45C5C;font-size:0.9rem;min-height:1.2em;margin-bottom:8px;"></div>' +
            '<div class="modal-footer">' +
            '<button class="btn btn-secondary" id="mCancel">Отмена</button>' +
            '<button class="btn btn-primary" id="adminLoginBtn">Войти</button></div>';
        App.openModal(html);
        this._bindEyeToggles(document.getElementById('modalContent'));
        var input = document.getElementById('adminPassInput');
        var err = document.getElementById('adminPassError');
        var tryLogin = function() {
            var val = input ? input.value : '';
            if (Admin.checkPassword(val)) {
                Admin.setAuthed(true);
                App.closeModal();
                Admin.enter();
            } else {
                if (err) err.textContent = 'Неверный пароль';
                if (input) { input.value = ''; input.focus(); }
            }
        };
        document.getElementById('adminLoginBtn').onclick = tryLogin;
        document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('mClose').onclick = function() { App.closeModal(); };
        if (input) {
            input.focus();
            input.onkeydown = function(e) { if (e.key === 'Enter') tryLogin(); };
        }
    },


    isAdminMode: function() {
        // Strict: only while panel is open (not merely session still valid after "back to site")
        return !!this.panelActive && this.isAuthed();
    },

    openSectionTab: function(navSection, tab) {
        this.panelActive = true;
        this.tab = tab || 'overview';
        App.currentSection = 'admin';
        document.body.classList.add('admin-mode');
        document.body.setAttribute('data-section', 'admin');
        document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
        var adminSec = document.getElementById('section-admin');
        if (adminSec) adminSec.classList.add('active');
        document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
        var navBtn = navSection ? document.querySelector('.nav-item[data-section="' + navSection + '"]') : null;
        if (navBtn) navBtn.classList.add('active');
        var titleEl = document.getElementById('pageTitle');
        if (titleEl) {
            var label = navBtn ? navBtn.textContent.replace(/^\s*\S+\s*/, '').trim() : this.tab;
            titleEl.textContent = 'Админ · ' + label;
        }
        this.render();
    },

    enter: function() {
        this.panelActive = true;
        document.body.classList.add('admin-mode');
        document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
        document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
        var sec = document.getElementById('section-admin');
        if (sec) {
            sec.classList.add('active');
            App.currentSection = 'admin';
            document.body.setAttribute('data-section', 'admin');
            var titleEl = document.getElementById('pageTitle');
            if (titleEl) titleEl.textContent = 'Админ-панель';
            this.render();
        }
    },

    logout: function() {
        this.panelActive = false;
        this.setAuthed(false);
        document.body.classList.remove('admin-mode');
        if (location.hash === '#admin') history.replaceState(null, '', location.pathname + location.search);
        App.navigateTo('dashboard');
        App.showToast('Выход из админ-панели');
    },
    backToSite: function() {
        // Leave admin UI but keep session so #admin / button re-enter without password until logout
        this.panelActive = false;
        document.body.classList.remove('admin-mode');
        if (location.hash === '#admin') history.replaceState(null, '', location.pathname + location.search);
        App.navigateTo('dashboard');
        App.showToast('С возвращением на сайт');
    },

    tabs: [
        { id: 'overview', label: 'Обзор' },
        { id: 'recipes', label: 'Рецепты' },
        { id: 'exercises', label: 'Упражнения' },
        { id: 'habits', label: 'Привычки' },
        { id: 'interests', label: 'Увлечения' },
        { id: 'skills', label: 'Навыки' },
        { id: 'library', label: 'Библиотека' },
        { id: 'emotions', label: 'Эмоции' },
        { id: 'notes', label: 'Заметки' },
        { id: 'finance', label: 'Финансы' },
        { id: 'quotes', label: 'Цитаты' },
        { id: 'appearance', label: 'Оформление' },
        { id: 'password', label: 'Пароль' }
    ],

    render: function() {
        var container = document.getElementById('adminContent');
        if (!container) return;
        if (!this.isAuthed()) {
            container.innerHTML = '<div class="card"><p>Требуется вход.</p><button class="btn btn-primary" id="adminReLogin">Войти</button></div>';
            document.getElementById('adminReLogin').onclick = function() { Admin.openGate(); };
            return;
        }
        var html = '';
        html += '<div class="admin-banner card mb-16" style="border:2px solid var(--green-main);">';
        html += '<div class="flex-between flex-wrap gap-12" style="align-items:center;"><div>';
        html += '<h2 style="margin:0 0 4px;">Админ-панель</h2>';
        html += '<p class="text-muted" style="margin:0;font-size:0.9rem;">Управление контентом. Боковое меню переключает разделы админки — выход только кнопкой «Вернуться на сайт».</p>';
        html += '</div><div style="display:flex;gap:8px;flex-wrap:wrap;">';
        html += '<button class="btn btn-primary btn-sm" id="adminBackSiteBtn">← Вернуться на сайт</button>';
        html += '<button class="btn btn-secondary btn-sm" id="adminLogoutBtn">Выйти из сессии</button>';
        html += '</div></div></div>';

        html += '<div class="admin-tabs mb-16" style="display:flex;gap:6px;flex-wrap:wrap;">';
        this.tabs.forEach(function(t) {
            html += '<button type="button" class="btn btn-sm ' + (Admin.tab === t.id ? 'btn-primary' : 'btn-secondary') + ' admin-tab" data-admin-tab="' + t.id + '">' + t.label + '</button>';
        });
        html += '</div><div id="adminTabBody"></div>';
        container.innerHTML = html;

        document.getElementById('adminBackSiteBtn').onclick = function() { Admin.backToSite(); };
        document.getElementById('adminLogoutBtn').onclick = function() { Admin.logout(); };
        container.querySelectorAll('.admin-tab').forEach(function(btn) {
            btn.onclick = function() { Admin.tab = btn.getAttribute('data-admin-tab'); Admin.render(); };
        });

        var body = document.getElementById('adminTabBody');
        var map = {
            overview: this.renderOverview, recipes: this.renderRecipesAdmin, exercises: this.renderExercisesAdmin,
            habits: this.renderHabitsAdmin, interests: this.renderInterestsAdmin, skills: this.renderSkillsAdmin,
            library: this.renderLibraryAdmin, emotions: this.renderEmotionsAdmin,
            notes: this.renderNotesAdmin, finance: this.renderFinanceAdmin, quotes: this.renderQuotesAdmin,
            appearance: this.renderAppearanceAdmin, password: this.renderPasswordAdmin
        };
        if (map[this.tab]) map[this.tab].call(this, body);
    },

    renderOverview: function(el) {
        var cards = [
            { tab: 'recipes', icon: '🍵', title: 'Рецепты', count: Storage.getRecipes().length },
            { tab: 'exercises', icon: '🚶', title: 'Упражнения', count: Storage.getExercises().length },
            { tab: 'habits', icon: '🌱', title: 'Привычки', count: Storage.getHabits().length },
            { tab: 'interests', icon: '🎨', title: 'Увлечения', count: (window.Interests && Interests.hobbiesDB) ? Interests.hobbiesDB.length : 0 },
            { tab: 'skills', icon: '📖', title: 'Навыки', count: Object.keys(Storage.getSkills() || {}).length },
            { tab: 'library', icon: '📚', title: 'Библиотека', count: (window.Library && Library.books) ? Library.books.length : '—' },
            { tab: 'emotions', icon: '💭', title: 'Эмоции', count: Storage.getMoods().length },
            { tab: 'notes', icon: '📒', title: 'Заметки', count: Storage.getNotes().length },
            { tab: 'finance', icon: '🪙', title: 'Финансы', count: Storage.getIncomes().length + Storage.getExpenses().length },
            { tab: 'quotes', icon: '💬', title: 'Цитаты', count: '—' },
            { tab: 'appearance', icon: '✨', title: 'Оформление', count: '—' }
        ];
        var html = '<p class="text-muted mb-16">Выберите раздел или вкладку сверху.</p><div class="dashboard-grid">';
        cards.forEach(function(c) {
            html += '<button type="button" class="dashboard-card admin-goto" data-goto-tab="' + c.tab + '" style="text-align:left;cursor:pointer;border:1px solid var(--border);">';
            html += '<div class="card-icon">' + c.icon + '</div><h3>' + c.title + '</h3><div class="stat">' + c.count + '</div></button>';
        });
        html += '</div>';
        html += '<div class="card mt-16"><h4 class="mb-8">Сводка</h4><div class="text-muted" style="font-size:0.9rem;">Эмоции: ' + Storage.getMoods().length +
            ' · События: ' + Storage.getEvents().length + ' · Доходы: ' + Storage.getIncomes().length + ' · Расходы: ' + Storage.getExpenses().length + '</div></div>';
        
        el.innerHTML = html;
        el.querySelectorAll('.admin-goto').forEach(function(b) {
            b.onclick = function() { Admin.tab = b.getAttribute('data-goto-tab'); Admin.render(); };
        });
    },

    renderRecipesAdmin: function(el) {
        var recipes = Storage.getRecipes();
        var html = '<div class="flex-between mb-16 flex-wrap gap-8"><h3 style="margin:0;">Рецепты (' + recipes.length + ')</h3>' +
            '<button class="btn btn-primary btn-sm" id="adminAddRecipe">+ Добавить</button></div>';
        recipes.forEach(function(r) {
            html += '<div class="card mb-12"><div class="flex-between flex-wrap gap-12" style="align-items:flex-start;">';
            html += '<div style="display:flex;gap:12px;flex:1;min-width:180px;">';
            html += r.image ? '<img src="' + r.image + '" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:10px;flex-shrink:0;">' :
                '<div style="width:72px;height:72px;border-radius:10px;background:var(--green-light);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;">🍵</div>';
            html += '<div><strong>' + Admin.esc(r.name) + '</strong><div class="text-muted" style="font-size:0.85rem;">' + Admin.esc(r.category || '') + ' · ' + (r.calories || '—') + ' ккал</div>';
            html += '<div class="text-muted" style="font-size:0.8rem;margin-top:4px;">' + Admin.esc(((r.ingredients || []).slice(0, 3).join(', ') || 'нет состава')) + '</div></div></div>';
            html += '<div style="display:flex;gap:6px;"><button class="btn btn-sm btn-secondary" data-edit-recipe="' + r.id + '">Изменить</button>';
            html += '<button class="btn btn-sm btn-danger" data-del-recipe="' + r.id + '">Удалить</button></div></div></div>';
        });
        el.innerHTML = html;
        document.getElementById('adminAddRecipe').onclick = function() { Admin.editRecipe(null); };
        el.querySelectorAll('[data-edit-recipe]').forEach(function(b) {
            b.onclick = function() { Admin.editRecipe(b.getAttribute('data-edit-recipe')); };
        });
        el.querySelectorAll('[data-del-recipe]').forEach(function(b) {
            b.onclick = function() {
                if (!confirm('Удалить рецепт?')) return;
                Storage.saveRecipes(Storage.getRecipes().filter(function(r) { return r.id !== b.getAttribute('data-del-recipe'); }));
                App.showToast('Удалено'); Admin.render();
            };
        });
    },

    editRecipe: function(id) {
        var r = id ? Storage.getRecipes().find(function(x) { return x.id === id; }) : null;
        var isNew = !r;
        r = r || { name: '', category: 'завтраки', image: '', ingredients: [], portions: 1, time: 15, calories: 0, proteins: 0, fats: 0, carbs: 0, instructions: '', isUser: false };
        var html = '<div class="modal-header"><h2>' + (isNew ? 'Новый рецепт' : 'Редактировать') + '</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Название</label><input class="form-control" id="arName" value="' + this.esc(r.name) + '"></div>' +
            '<div class="form-group"><label>Категория</label><select class="form-control" id="arCat">' +
            ['завтраки','обеды','ужины','перекусы','десерты','напитки'].map(function(c) {
                return '<option value="' + c + '"' + (r.category === c ? ' selected' : '') + '>' + c + '</option>';
            }).join('') + '</select></div>' +
            this._imageFields('arImage', 'arImageFile', 'arImagePrev', r.image || '') +
            '<div class="form-group"><label>Состав (по строке)</label><textarea class="form-control" id="arIng" rows="5">' + this.esc((r.ingredients || []).join('\n')) + '</textarea></div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:10px;">' +
            '<div class="form-group"><label>Порции</label><input type="number" class="form-control" id="arPortions" value="' + (r.portions || 1) + '"></div>' +
            '<div class="form-group"><label>Мин</label><input type="number" class="form-control" id="arTime" value="' + (r.time || 0) + '"></div>' +
            '<div class="form-group"><label>Ккал</label><input type="number" class="form-control" id="arCal" value="' + (r.calories || 0) + '"></div>' +
            '<div class="form-group"><label>Белки</label><input type="number" class="form-control" id="arProt" value="' + (r.proteins || 0) + '"></div>' +
            '<div class="form-group"><label>Жиры</label><input type="number" class="form-control" id="arFat" value="' + (r.fats || 0) + '"></div>' +
            '<div class="form-group"><label>Углеводы</label><input type="number" class="form-control" id="arCarb" value="' + (r.carbs || 0) + '"></div></div>' +
            '<div class="form-group"><label>Инструкция</label><textarea class="form-control" id="arInstr" rows="4">' + this.esc(r.instructions || '') + '</textarea></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="arSave">Сохранить</button></div>';
        App.openModal(html);
        this._bindImagePick('arImageFile', 'arImage', 'arImagePrev');
        document.getElementById('mClose').onclick = document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('arSave').onclick = function() {
            var name = document.getElementById('arName').value.trim();
            if (!name) { App.showToast('Укажите название'); return; }
            var list = Storage.getRecipes();
            var data = {
                id: isNew ? Storage.generateId() : r.id, name: name,
                category: document.getElementById('arCat').value,
                image: document.getElementById('arImage').value.trim(),
                ingredients: document.getElementById('arIng').value.split('\n').map(function(l) { return l.trim(); }).filter(Boolean),
                portions: Number(document.getElementById('arPortions').value) || 1,
                time: Number(document.getElementById('arTime').value) || 0,
                calories: Number(document.getElementById('arCal').value) || 0,
                proteins: Number(document.getElementById('arProt').value) || 0,
                fats: Number(document.getElementById('arFat').value) || 0,
                carbs: Number(document.getElementById('arCarb').value) || 0,
                instructions: document.getElementById('arInstr').value.trim(), isUser: r.isUser || false
            };
            if (isNew) list.push(data);
            else { var i = list.findIndex(function(x) { return x.id === r.id; }); if (i >= 0) list[i] = data; }
            Storage.saveRecipes(list); App.closeModal(); App.showToast('Сохранено'); Admin.render();
        };
    },

    renderExercisesAdmin: function(el) {
        var list = Storage.getExercises();
        var html = '<div class="flex-between mb-16"><h3 style="margin:0;">Упражнения (' + list.length + ')</h3>' +
            '<button class="btn btn-primary btn-sm" id="adminAddEx">+ Добавить</button></div>';
        list.forEach(function(e) {
            html += '<div class="card mb-12"><div class="flex-between flex-wrap gap-12"><div style="display:flex;gap:12px;">' +
                (e.image ? '<img src="' + e.image + '" style="width:64px;height:64px;object-fit:cover;border-radius:10px;">' : '') +
                '<div><strong>' + Admin.esc(e.name) + '</strong><div class="text-muted" style="font-size:0.85rem;">' +
                Admin.esc(e.category || '') + ' · ' + (e.duration || '—') + ' мин</div></div></div>' +
                '<div style="display:flex;gap:6px;"><button class="btn btn-sm btn-secondary" data-edit-ex="' + e.id + '">Изменить</button>' +
                '<button class="btn btn-sm btn-danger" data-del-ex="' + e.id + '">Удалить</button></div></div></div>';
        });
        el.innerHTML = html;
        document.getElementById('adminAddEx').onclick = function() { Admin.editExercise(null); };
        el.querySelectorAll('[data-edit-ex]').forEach(function(b) {
            b.onclick = function() { Admin.editExercise(b.getAttribute('data-edit-ex')); };
        });
        el.querySelectorAll('[data-del-ex]').forEach(function(b) {
            b.onclick = function() {
                if (!confirm('Удалить?')) return;
                Storage.saveExercises(Storage.getExercises().filter(function(x) { return x.id !== b.getAttribute('data-del-ex'); }));
                App.showToast('Удалено'); Admin.render();
            };
        });
    },

    editExercise: function(id) {
        var e = id ? Storage.getExercises().find(function(x) { return x.id === id; }) : null;
        var isNew = !e;
        e = e || { name: '', category: 'йога', description: '', howto: '', duration: 15, level: 'лёгкий', equipment: '', image: '', video: '', isUser: false };
        var html = '<div class="modal-header"><h2>' + (isNew ? 'Новое упражнение' : 'Редактировать') + '</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Название</label><input class="form-control" id="aeName" value="' + this.esc(e.name) + '"></div>' +
            '<div class="form-group"><label>Категория</label><input class="form-control" id="aeCat" value="' + this.esc(e.category || '') + '"></div>' +
            this._imageFields('aeImage', 'aeImageFile', 'aeImagePrev', e.image || '') +
            '<div class="form-group"><label>Описание</label><textarea class="form-control" id="aeDesc" rows="2">' + this.esc(e.description || '') + '</textarea></div>' +
            '<div class="form-group"><label>Как выполнять</label><textarea class="form-control" id="aeHow" rows="4">' + this.esc(e.howto || '') + '</textarea></div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">' +
            '<div class="form-group"><label>Минуты</label><input type="number" class="form-control" id="aeDur" value="' + (e.duration || 15) + '"></div>' +
            '<div class="form-group"><label>Уровень</label><input class="form-control" id="aeLevel" value="' + this.esc(e.level || '') + '"></div>' +
            '<div class="form-group"><label>Инвентарь</label><input class="form-control" id="aeEq" value="' + this.esc(e.equipment || '') + '"></div></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="aeSave">Сохранить</button></div>';
        App.openModal(html);
        this._bindImagePick('aeImageFile', 'aeImage', 'aeImagePrev');
        document.getElementById('mClose').onclick = document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('aeSave').onclick = function() {
            var name = document.getElementById('aeName').value.trim();
            if (!name) { App.showToast('Укажите название'); return; }
            var list = Storage.getExercises();
            var data = {
                id: isNew ? Storage.generateId() : e.id, name: name,
                category: document.getElementById('aeCat').value.trim(),
                image: document.getElementById('aeImage').value.trim(),
                description: document.getElementById('aeDesc').value.trim(),
                howto: document.getElementById('aeHow').value.trim(),
                duration: Number(document.getElementById('aeDur').value) || 15,
                level: document.getElementById('aeLevel').value.trim(),
                equipment: document.getElementById('aeEq').value.trim(),
                video: e.video || '', isUser: e.isUser || false
            };
            if (isNew) list.push(data);
            else { var i = list.findIndex(function(x) { return x.id === e.id; }); if (i >= 0) list[i] = data; }
            Storage.saveExercises(list); App.closeModal(); App.showToast('Сохранено'); Admin.render();
        };
    },

    renderHabitsAdmin: function(el) {
        var list = Storage.getHabits();
        var html = '<div class="flex-between mb-16"><h3 style="margin:0;">Привычки (' + list.length + ')</h3>' +
            '<button class="btn btn-primary btn-sm" id="adminAddHabit">+ Добавить</button></div>';
        list.forEach(function(h) {
            html += '<div class="card mb-12"><div class="flex-between flex-wrap gap-12"><div><span style="font-size:1.3rem;margin-right:8px;">' + (h.icon || '🌱') + '</span><strong>' + Admin.esc(h.name) + '</strong>' +
                '<div class="text-muted" style="font-size:0.85rem;">' + Admin.esc(h.description || '') + '</div></div>' +
                '<div style="display:flex;gap:6px;"><button class="btn btn-sm btn-secondary" data-edit-hab="' + h.id + '">Изменить</button>' +
                '<button class="btn btn-sm btn-danger" data-del-hab="' + h.id + '">Удалить</button></div></div></div>';
        });
        el.innerHTML = html;
        document.getElementById('adminAddHabit').onclick = function() { Admin.editHabit(null); };
        el.querySelectorAll('[data-edit-hab]').forEach(function(b) {
            b.onclick = function() { Admin.editHabit(b.getAttribute('data-edit-hab')); };
        });
        el.querySelectorAll('[data-del-hab]').forEach(function(b) {
            b.onclick = function() {
                if (!confirm('Удалить?')) return;
                Storage.saveHabits(Storage.getHabits().filter(function(x) { return x.id !== b.getAttribute('data-del-hab'); }));
                App.showToast('Удалено'); Admin.render();
            };
        });
    },

    editHabit: function(id) {
        var h = id ? Storage.getHabits().find(function(x) { return x.id === id; }) : null;
        var isNew = !h;
        h = h || { name: '', description: '', icon: '🌱', color: '#647348', frequency: 'daily', days: [0,1,2,3,4,5,6], target: 1 };
        var html = '<div class="modal-header"><h2>' + (isNew ? 'Новая привычка' : 'Редактировать') + '</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Название</label><input class="form-control" id="ahName" value="' + this.esc(h.name) + '"></div>' +
            '<div class="form-group"><label>Описание</label><input class="form-control" id="ahDesc" value="' + this.esc(h.description || '') + '"></div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">' +
            '<div class="form-group"><label>Иконка</label><input class="form-control" id="ahIcon" value="' + this.esc(h.icon || '🌱') + '"></div>' +
            '<div class="form-group"><label>Цвет</label><input type="color" class="form-control" id="ahColor" value="' + (h.color || '#647348') + '"></div>' +
            '<div class="form-group"><label>Цель/день</label><input type="number" class="form-control" id="ahTarget" value="' + (h.target || 1) + '"></div></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="ahSave">Сохранить</button></div>';
        App.openModal(html);
        document.getElementById('mClose').onclick = document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('ahSave').onclick = function() {
            var name = document.getElementById('ahName').value.trim();
            if (!name) { App.showToast('Укажите название'); return; }
            var list = Storage.getHabits();
            var data = {
                id: isNew ? Storage.generateId() : h.id, name: name,
                description: document.getElementById('ahDesc').value.trim(),
                icon: document.getElementById('ahIcon').value.trim() || '🌱',
                color: document.getElementById('ahColor').value,
                frequency: h.frequency || 'daily', days: h.days || [0,1,2,3,4,5,6],
                target: Number(document.getElementById('ahTarget').value) || 1,
                created: h.created || new Date().toISOString()
            };
            if (isNew) list.push(data);
            else { var i = list.findIndex(function(x) { return x.id === h.id; }); if (i >= 0) list[i] = data; }
            Storage.saveHabits(list); App.closeModal(); App.showToast('Сохранено'); Admin.render();
        };
    },

    getHobbyOverrides: function() { return Storage.get('hobbyOverrides', {}); },
    saveHobbyOverrides: function(obj) { Storage.set('hobbyOverrides', obj); },

    renderInterestsAdmin: function(el) {
        var db = (window.Interests && Interests.hobbiesDB) ? Interests.hobbiesDB.slice() : [];
        var overrides = this.getHobbyOverrides();
        var list = db.map(function(h) {
            var o = overrides[h.id];
            if (o && o._hidden) return null;
            return o ? Object.assign({}, h, o) : h;
        }).filter(Boolean);
        Object.keys(overrides).forEach(function(id) {
            if (!db.some(function(h) { return h.id === id; }) && overrides[id] && overrides[id]._custom && !overrides[id]._hidden)
                list.push(overrides[id]);
        });
        var html = '<div class="flex-between mb-16"><h3 style="margin:0;">Увлечения (' + list.length + ')</h3>' +
            '<button class="btn btn-primary btn-sm" id="adminAddHobby">+ Добавить</button></div>';
        list.forEach(function(h) {
            var photo = h.image || (window.Interests && Interests.photoFor ? Interests.photoFor(h.id) : '');
            html += '<div class="card mb-12"><div class="flex-between flex-wrap gap-12">';
            html += '<div style="display:flex;gap:12px;flex:1;min-width:160px;">';
            html += photo
                ? '<img src="' + photo + '" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:10px;flex-shrink:0;">'
                : '<div style="width:72px;height:72px;border-radius:10px;background:var(--green-light);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0;">✨</div>';
            html += '<div><strong>' + Admin.esc(h.name) + '</strong>' +
                '<div class="text-muted" style="font-size:0.85rem;">' + Admin.esc((h.categories || []).join(', ')) + '</div></div></div>' +
                '<div style="display:flex;gap:6px;"><button class="btn btn-sm btn-secondary" data-edit-hobby="' + h.id + '">Изменить</button>' +
                '<button class="btn btn-sm btn-danger" data-del-hobby="' + h.id + '">Скрыть</button></div></div></div>';
        });
        el.innerHTML = html;
        document.getElementById('adminAddHobby').onclick = function() { Admin.editHobby(null); };
        el.querySelectorAll('[data-edit-hobby]').forEach(function(b) {
            b.onclick = function() { Admin.editHobby(b.getAttribute('data-edit-hobby')); };
        });
        el.querySelectorAll('[data-del-hobby]').forEach(function(b) {
            b.onclick = function() {
                if (!confirm('Скрыть увлечение?')) return;
                var o = Admin.getHobbyOverrides();
                o[b.getAttribute('data-del-hobby')] = Object.assign({}, o[b.getAttribute('data-del-hobby')] || {}, { _hidden: true });
                Admin.saveHobbyOverrides(o); App.showToast('Скрыто'); Admin.render();
            };
        });
    },

    editHobby: function(id) {
        var db = (window.Interests && Interests.hobbiesDB) || [];
        var overrides = this.getHobbyOverrides();
        var base = id ? (db.find(function(h) { return h.id === id; }) || overrides[id]) : null;
        var isNew = !base;
        var h = Object.assign({ id: id || ('custom_' + Date.now()), name: '', categories: [], desc: '', needs: '', difficulty: 'лёгкий', _custom: true }, base || {}, overrides[id] || {});
        var html = '<div class="modal-header"><h2>' + (isNew ? 'Новое увлечение' : 'Редактировать') + '</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Название</label><input class="form-control" id="hoName" value="' + this.esc(h.name) + '"></div>' +
            '<div class="form-group"><label>Категории (через запятую)</label><input class="form-control" id="hoCat" value="' + this.esc((h.categories || []).join(', ')) + '"></div>' +
            '<div class="form-group"><label>Описание</label><textarea class="form-control" id="hoDesc" rows="3">' + this.esc(h.desc || '') + '</textarea></div>' +
            '<div class="form-group"><label>Что нужно</label><input class="form-control" id="hoNeeds" value="' + this.esc(h.needs || '') + '"></div>' +
            '<div class="form-group"><label>Сложность</label><select class="form-control" id="hoDiff">' +
            ['лёгкий','средний','сложный'].map(function(d) { return '<option value="' + d + '"' + (h.difficulty === d ? ' selected' : '') + '>' + d + '</option>'; }).join('') + '</select></div>' +
            this._imageFields('hoImage', 'hoImageFile', 'hoImagePrev', h.image || (window.Interests && Interests.photoFor ? Interests.photoFor(h.id) : '') || '') +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="hoSave">Сохранить</button></div>';
        App.openModal(html);
        this._bindImagePick('hoImageFile', 'hoImage', 'hoImagePrev');
        document.getElementById('mClose').onclick = document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('hoSave').onclick = function() {
            var name = document.getElementById('hoName').value.trim();
            if (!name) { App.showToast('Укажите название'); return; }
            var o = Admin.getHobbyOverrides();
            var img = document.getElementById('hoImage').value.trim();
            o[h.id] = {
                id: h.id, name: name,
                categories: document.getElementById('hoCat').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean),
                desc: document.getElementById('hoDesc').value.trim(),
                needs: document.getElementById('hoNeeds').value.trim(),
                difficulty: document.getElementById('hoDiff').value,
                image: img,
                _custom: isNew || !!h._custom, _hidden: false
            };
            Admin.saveHobbyOverrides(o); App.closeModal(); App.showToast('Сохранено'); Admin.render();
        };
    },

    renderSkillsAdmin: function(el) {
        var skills = Storage.getSkills() || {};
        var keys = Object.keys(skills);
        var html = '<div class="flex-between mb-16"><h3 style="margin:0;">Навыки (' + keys.length + ')</h3>' +
            '<button class="btn btn-primary btn-sm" id="adminAddSkill">+ Дерево</button></div>';
        keys.forEach(function(key) {
            var s = skills[key];
            html += '<div class="card mb-12"><div class="flex-between flex-wrap gap-12"><div><strong>' + Admin.esc(s.name || key) + '</strong>' +
                '<div class="text-muted" style="font-size:0.85rem;">Узлов: ' + ((s.nodes || []).length) + '</div></div>' +
                '<div style="display:flex;gap:6px;"><button class="btn btn-sm btn-secondary" data-edit-skill="' + Admin.esc(key) + '">Изменить</button>' +
                '<button class="btn btn-sm btn-danger" data-del-skill="' + Admin.esc(key) + '">Удалить</button></div></div></div>';
        });
        el.innerHTML = html;
        document.getElementById('adminAddSkill').onclick = function() { Admin.editSkillTree(null); };
        el.querySelectorAll('[data-edit-skill]').forEach(function(b) {
            b.onclick = function() { Admin.editSkillTree(b.getAttribute('data-edit-skill')); };
        });
        el.querySelectorAll('[data-del-skill]').forEach(function(b) {
            b.onclick = function() {
                if (!confirm('Удалить?')) return;
                var sk = Storage.getSkills(); delete sk[b.getAttribute('data-del-skill')]; Storage.saveSkills(sk);
                App.showToast('Удалено'); Admin.render();
            };
        });
    },

    editSkillTree: function(key) {
        var skills = Storage.getSkills() || {};
        var isNew = !key || !skills[key];
        var s = isNew ? { name: '', nodes: [] } : skills[key];
        var nodesText = (s.nodes || []).map(function(n) {
            return (n.name || '') + ' | ' + (n.description || '') + ' | ' + (n.status || 'не начато');
        }).join('\n');
        var html = '<div class="modal-header"><h2>' + (isNew ? 'Новое дерево' : 'Редактировать') + '</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Название</label><input class="form-control" id="skName" value="' + this.esc(s.name || key || '') + '"></div>' +
            '<div class="form-group"><label>Узлы (Название | Описание | статус)</label><textarea class="form-control" id="skNodes" rows="8">' + this.esc(nodesText) + '</textarea></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="skSave">Сохранить</button></div>';
        App.openModal(html);
        document.getElementById('mClose').onclick = document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('skSave').onclick = function() {
            var name = document.getElementById('skName').value.trim();
            if (!name) { App.showToast('Укажите название'); return; }
            var newKey = isNew ? name.toLowerCase().replace(/\s+/g, '-') : key;
            var nodes = document.getElementById('skNodes').value.split('\n').map(function(line, i) {
                line = line.trim(); if (!line) return null;
                var parts = line.split('|').map(function(p) { return p.trim(); });
                return { id: 'n' + i + '_' + Date.now(), name: parts[0] || 'Узел', description: parts[1] || '', status: parts[2] || 'не начато', links: [], tasks: [], order: i + 1 };
            }).filter(Boolean);
            var all = Storage.getSkills() || {};
            all[newKey] = { name: name, nodes: nodes };
            Storage.saveSkills(all); App.closeModal(); App.showToast('Сохранено'); Admin.render();
        };
    },

    renderNotesAdmin: function(el) {
        var notes = Storage.getNotes().slice().sort(function(a, b) {
            return (b.updated || b.created || '').localeCompare(a.updated || a.created || '');
        });
        var html = '<h3 class="mb-16">Заметки (' + notes.length + ')</h3>';
        if (!notes.length) html += '<div class="text-muted">Заметок нет</div>';
        notes.forEach(function(n) {
            html += '<div class="card mb-12"><div class="flex-between flex-wrap gap-8"><div><strong>' + Admin.esc(n.title || 'Без названия') + '</strong>' +
                '<div class="text-muted" style="font-size:0.85rem;">' + Admin.esc((n.content || '').slice(0, 120)) + '</div></div>' +
                '<button class="btn btn-sm btn-danger" data-del-note="' + n.id + '">Удалить</button></div></div>';
        });
        el.innerHTML = html;
        el.querySelectorAll('[data-del-note]').forEach(function(b) {
            b.onclick = function() {
                if (!confirm('Удалить?')) return;
                Storage.saveNotes(Storage.getNotes().filter(function(n) { return n.id !== b.getAttribute('data-del-note'); }));
                App.showToast('Удалено'); Admin.render();
            };
        });
    },

    renderFinanceAdmin: function(el) {
        var budget = Storage.getBudget();
        var html = '<h3 class="mb-16">Финансы</h3><div class="card mb-16">';
        html += '<div class="flex-between flex-wrap gap-12 mb-12"><div><div class="text-muted">Бюджет</div><strong>' + (budget.monthly || 0).toLocaleString('ru-RU') + '</strong></div>';
        html += '<div><div class="text-muted">Доходы</div><strong>' + Storage.getIncomes().length + '</strong></div>';
        html += '<div><div class="text-muted">Расходы</div><strong>' + Storage.getExpenses().length + '</strong></div></div>';
        html += '<label>Месячный бюджет</label><div style="display:flex;gap:8px;margin-top:6px;">';
        html += '<input type="number" class="form-control" id="adminBudget" value="' + (budget.monthly || 0) + '" style="max-width:160px;">';
        html += '<button class="btn btn-primary btn-sm" id="adminBudgetSave">Сохранить</button></div></div>';
        html += '<button class="btn btn-danger btn-sm mt-12" id="adminClearFinance">Очистить доходы и расходы</button>';
        el.innerHTML = html;
        document.getElementById('adminBudgetSave').onclick = function() {
            var b = Storage.getBudget(); b.monthly = Number(document.getElementById('adminBudget').value) || 0;
            Storage.saveBudget(b); App.showToast('Сохранено');
        };
        document.getElementById('adminClearFinance').onclick = function() {
            if (!confirm('Очистить все доходы и расходы?')) return;
            Storage.saveIncomes([]); Storage.saveExpenses([]); App.showToast('Очищено'); Admin.render();
        };
    },

    renderAppearanceAdmin: function(el) {
        var a = this.getAppearance();
        var html = '<h3 class="mb-16">Оформление</h3><div class="card mb-16"><h4 class="mb-12">Палитра</h4>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;">';
        [['bgPrimary','Фон','#F5F0E6'],['bgCard','Карточки','#FFFdf9'],['greenMain','Основной','#647348'],
         ['greenDark','Тёмный','#455536'],['greenLight','Светлый','#D9DDB7'],['textMain','Текст','#36382B'],
         ['dustyPink','Цветы','#C9A9A6']].forEach(function(item) {
            html += '<div class="form-group"><label style="font-size:0.8rem;">' + item[1] + '</label>' +
                '<input type="color" class="form-control" data-appear-key="' + item[0] + '" value="' + (a[item[0]] || item[2]) + '"></div>';
        });
        html += '</div></div>';
        var op = a.plantOpacity != null ? a.plantOpacity : 78;
        html += '<div class="card mb-16"><h4 class="mb-12">Растения</h4>';
        html += '<div class="form-group"><label>Прозрачность листьев: <strong id="plantOpLabel">' + op + '%</strong></label>';
        html += '<input type="range" min="0" max="100" id="plantOpacityRange" value="' + op + '" style="width:100%;"></div>';
        html += '<label class="checkbox-wrapper mt-12"><input type="checkbox" id="plantsHidden"' + (a.plantsHidden ? ' checked' : '') + '> <span>Скрыть все растения</span></label></div>';
        html += '<div style="display:flex;gap:8px;"><button class="btn btn-primary" id="appearSave">Применить</button>';
        html += '<button class="btn btn-secondary" id="appearReset">Сбросить</button></div>';
        el.innerHTML = html;
        var range = document.getElementById('plantOpacityRange');
        var label = document.getElementById('plantOpLabel');
        range.oninput = function() { label.textContent = range.value + '%'; };
        document.getElementById('appearSave').onclick = function() {
            var obj = Admin.getAppearance();
            el.querySelectorAll('[data-appear-key]').forEach(function(inp) { obj[inp.getAttribute('data-appear-key')] = inp.value; });
            obj.plantOpacity = Number(range.value);
            obj.plantsHidden = document.getElementById('plantsHidden').checked;
            Admin.saveAppearance(obj); App.showToast('Применено');
        };
        document.getElementById('appearReset').onclick = function() {
            Admin.saveAppearance({}); App.showToast('Сброшено'); Admin.render();
        };
    },

    renderDataAdmin: function(el) {
        var html = '<h3 class="mb-16">Данные</h3>';
        html += '<div class="card mb-16"><p class="text-muted mb-12">Экспорт JSON</p><button class="btn btn-primary" id="adminExport">Скачать backup</button></div>';
        html += '<div class="card mb-16"><p class="text-muted mb-12">Импорт JSON</p><input type="file" id="adminImportFile" accept="application/json,.json" class="form-control mb-12">';
        html += '<button class="btn btn-secondary" id="adminImport">Импортировать</button></div>';
        html += '<div class="card"><button class="btn btn-danger" id="adminWipe">Очистить все данные</button></div>';
        el.innerHTML = html;
        document.getElementById('adminExport').onclick = function() {
            var data = {};
            ['settings','events','habits','habitLogs','skills','recipes','menu','shoppingList','incomes','expenses','budget','savingsGoals','exercises','workouts','favorites','interests','hobbyStatuses','dayPlans','templates','notes','goals','quickNotes','moods','hobbyOverrides'].forEach(function(k) {
                data[k] = Storage.get(k);
            });
            var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
            a.download = 'lifeflow-backup-' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
        };
        document.getElementById('adminImport').onclick = function() {
            var f = document.getElementById('adminImportFile').files[0];
            if (!f) { App.showToast('Выберите файл'); return; }
            var reader = new FileReader();
            reader.onload = function() {
                try {
                    var data = JSON.parse(reader.result);
                    Object.keys(data).forEach(function(k) { Storage.set(k, data[k]); });
                    App.showToast('Импорт выполнен'); location.reload();
                } catch (e) { App.showToast('Ошибка файла'); }
            };
            reader.readAsText(f);
        };
        document.getElementById('adminWipe').onclick = function() {
            if (!confirm('Удалить ВСЕ данные?') || !confirm('Точно?')) return;
            Object.keys(localStorage).forEach(function(k) { if (k.indexOf('lifeflow_') === 0) localStorage.removeItem(k); });
            App.showToast('Очищено'); location.reload();
        };
    },

    renderPasswordAdmin: function(el) {
        el.innerHTML = '<div class="card"><h3 class="mb-12">Смена пароля</h3>' +
            '<p class="text-muted mb-16" style="font-size:0.9rem;">Пароль нигде не показывается. Только хеш.</p>' +
            '<div class="form-group"><label>Текущий</label>' + this._passField('apOld') + '</div>' +
            '<div class="form-group"><label>Новый</label>' + this._passField('apNew') + '</div>' +
            '<div class="form-group"><label>Повтор</label>' + this._passField('apNew2') + '</div>' +
            '<div id="apErr" style="color:#C45C5C;font-size:0.9rem;min-height:1.2em;"></div>' +
            '<button class="btn btn-primary mt-12" id="apSave">Сменить</button></div>';
        this._bindEyeToggles(el);
        document.getElementById('apSave').onclick = function() {
            var oldP = document.getElementById('apOld').value, n1 = document.getElementById('apNew').value, n2 = document.getElementById('apNew2').value;
            var err = document.getElementById('apErr');
            if (!Admin.checkPassword(oldP)) { err.textContent = 'Неверный текущий пароль'; return; }
            if (!n1 || n1.length < 4) { err.textContent = 'Слишком короткий'; return; }
            if (n1 !== n2) { err.textContent = 'Не совпадают'; return; }
            Admin.setPasswordHash(n1); err.style.color = 'var(--green-main)'; err.textContent = 'Пароль изменён';
            document.getElementById('apOld').value = document.getElementById('apNew').value = document.getElementById('apNew2').value = '';
        };
    },

    // File -> data URL for images
    _bindImagePick: function(fileInputId, urlInputId, previewId) {
        var fileInp = document.getElementById(fileInputId);
        var urlInp = document.getElementById(urlInputId);
        var prev = previewId ? document.getElementById(previewId) : null;
        if (!fileInp) return;
        fileInp.onchange = function() {
            var f = fileInp.files && fileInp.files[0];
            if (!f) return;
            if (f.size > 2.5 * 1024 * 1024) { App.showToast('Картинка больше 2.5 МБ'); return; }
            var reader = new FileReader();
            reader.onload = function() {
                if (urlInp) urlInp.value = reader.result;
                if (prev) { prev.src = reader.result; prev.style.display = 'block'; }
            };
            reader.readAsDataURL(f);
        };
        if (urlInp) {
            urlInp.oninput = function() {
                if (prev && urlInp.value) { prev.src = urlInp.value; prev.style.display = 'block'; }
            };
        }
    },

    _imageFields: function(urlId, fileId, previewId, currentUrl) {
        var url = currentUrl || '';
        return '<div class="form-group"><label>Картинка</label>' +
            (url ? '<img id="' + previewId + '" src="' + url.replace(/"/g, '') + '" alt="" style="max-width:100%;max-height:140px;border-radius:10px;margin-bottom:8px;object-fit:cover;display:block;">' :
                '<img id="' + previewId + '" alt="" style="max-width:100%;max-height:140px;border-radius:10px;margin-bottom:8px;object-fit:cover;display:none;">') +
            '<input type="file" class="form-control mb-8" id="' + fileId + '" accept="image/*" style="margin-bottom:8px;">' +
            '<input class="form-control" id="' + urlId + '" value="' + (url ? String(url).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;") : '') + '" placeholder="Или URL / путь к файлу"></div>';
    },



    renderQuotesAdmin: function(el) {
        var q = Storage.get('siteQuotes', null) || {
            main: 'Я выбираю мягкость как двигатель, порядок как союзника и любопытство как компас. Каждый маленький шаг важен. 🌿',
            reminder: '🌸 Тебе не нужно быть идеальным каждый день. Иди в своём темпе — ты уже делаешь достаточно.',
            heroSubtitle: 'Мягкие дни, спокойный ритм и маленькие шаги к себе'
        };
        var html = '<h3 class="mb-16">Цитаты на главной</h3>';
        html += '<div class="card mb-16">';
        html += '<div class="form-group"><label>Главная цитата (блок на дашборде)</label>';
        html += '<textarea class="form-control" id="qMain" rows="3">' + this.esc(q.main || '') + '</textarea></div>';
        html += '<div class="form-group"><label>Мягкое напоминание (внизу главной)</label>';
        html += '<textarea class="form-control" id="qRem" rows="2">' + this.esc(q.reminder || '') + '</textarea></div>';
        html += '<div class="form-group"><label>Подзаголовок баннера (hero)</label>';
        html += '<input class="form-control" id="qHero" value="' + this.esc(q.heroSubtitle || '') + '"></div>';
        html += '<button class="btn btn-primary" id="qSave">Сохранить цитаты</button></div>';
        el.innerHTML = html;
        document.getElementById('qSave').onclick = function() {
            Storage.set('siteQuotes', {
                main: document.getElementById('qMain').value,
                reminder: document.getElementById('qRem').value,
                heroSubtitle: document.getElementById('qHero').value
            });
            var hs = document.getElementById('heroSubtitle');
            if (hs) hs.textContent = document.getElementById('qHero').value;
            App.showToast('Цитаты сохранены');
        };
    },

    renderLibraryAdmin: function(el) {
        if (window.Library && Library.initCatalog) Library.initCatalog();
        var books = (window.Library && Library.books) ? Library.books.slice() : [];
        var overrides = Storage.get('bookOverrides', {});
        books = books.map(function(b) {
            var o = overrides[b.id];
            if (o && o._hidden) return null;
            return o ? Object.assign({}, b, o) : b;
        }).filter(Boolean);
        Object.keys(overrides).forEach(function(id) {
            if (overrides[id] && overrides[id]._custom && !overrides[id]._hidden && !books.some(function(b) { return b.id === id; }))
                books.push(overrides[id]);
        });
        var html = '<div class="flex-between mb-16"><h3 style="margin:0;">Книги (' + books.length + ')</h3>';
        html += '<button class="btn btn-primary btn-sm" id="adminAddBook">+ Добавить книгу</button></div>';
        books.slice(0, 100).forEach(function(b) {
            var cover = b.cover || b.image || '';
            html += '<div class="card mb-12"><div class="flex-between flex-wrap gap-12">';
            html += '<div style="display:flex;gap:12px;flex:1;min-width:160px;">';
            html += cover ? '<img src="' + cover + '" style="width:48px;height:64px;object-fit:cover;border-radius:6px;">' :
                '<div style="width:48px;height:64px;background:var(--green-light);border-radius:6px;display:flex;align-items:center;justify-content:center;">📚</div>';
            html += '<div><strong>' + Admin.esc(b.title) + '</strong><div class="text-muted" style="font-size:0.85rem;">' +
                Admin.esc(b.genre || '') + (b.year ? ' · ' + b.year : '') + '</div></div></div>';
            html += '<div style="display:flex;gap:6px;"><button class="btn btn-sm btn-secondary" data-edit-book="' + b.id + '">Изменить</button>';
            html += '<button class="btn btn-sm btn-danger" data-del-book="' + b.id + '">Скрыть</button></div></div></div>';
        });
        
        if (window.Library && Library.applyBookOverrides) Library.applyBookOverrides();
        var authors = (window.Library && Library.authors) ? Library.authors.slice() : [];
        var ao = Storage.get('authorOverrides', {});
        authors = authors.map(function(a) {
            var o = ao[a.id];
            if (o && o._hidden) return null;
            return o ? Object.assign({}, a, o) : a;
        }).filter(Boolean);
        html += '<h3 class="mt-24 mb-16">Авторы (' + authors.length + ')</h3>';
        html += '<p class="text-muted mb-12" style="font-size:0.85rem;">Загрузите фото — оно появится на карточках авторов в библиотеке.</p>';
        authors.slice(0, 80).forEach(function(a) {
            var photo = a.photo || a.image || '';
            html += '<div class="card mb-12"><div class="flex-between flex-wrap gap-12">';
            html += '<div style="display:flex;gap:12px;align-items:center;flex:1;min-width:160px;">';
            html += photo
                ? '<img src="' + photo + '" alt="" style="width:56px;height:56px;border-radius:50%;object-fit:cover;">'
                : '<div style="width:56px;height:56px;border-radius:50%;background:var(--green-main);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;">' + Admin.esc((a.name || '?').charAt(0)) + '</div>';
            html += '<div><strong>' + Admin.esc(a.name) + '</strong><div class="text-muted" style="font-size:0.85rem;">' + Admin.esc(a.country || '') + '</div></div></div>';
            html += '<button class="btn btn-sm btn-secondary" data-edit-author="' + a.id + '">Фото / изменить</button></div></div>';
        });

        el.innerHTML = html;
        document.getElementById('adminAddBook').onclick = function() { Admin.editBook(null); };
        el.querySelectorAll('[data-edit-book]').forEach(function(btn) {
            btn.onclick = function() { Admin.editBook(btn.getAttribute('data-edit-book')); };
        });
        el.querySelectorAll('[data-del-book]').forEach(function(btn) {
            btn.onclick = function() {
                if (!confirm('Скрыть книгу?')) return;
                var o = Storage.get('bookOverrides', {});
                var id = btn.getAttribute('data-del-book');
                o[id] = Object.assign({}, o[id] || {}, { _hidden: true });
                Storage.set('bookOverrides', o);
                App.showToast('Скрыто'); Admin.render();
            };
        });
        el.querySelectorAll('[data-edit-author]').forEach(function(btn) {
            btn.onclick = function() { Admin.editAuthor(btn.getAttribute('data-edit-author')); };
        });

    },


    editAuthor: function(id) {
        if (window.Library && Library.initCatalog) Library.initCatalog();
        if (window.Library && Library.applyBookOverrides) Library.applyBookOverrides();
        var authors = (window.Library && Library.authors) || [];
        var ao = Storage.get('authorOverrides', {});
        var base = authors.find(function(a) { return a.id === id; }) || ao[id];
        if (!base) { App.showToast('Автор не найден'); return; }
        var a = Object.assign({}, base, ao[id] || {});
        var html = '<div class="modal-header"><h2>Автор: ' + this.esc(a.name) + '</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Имя</label><input class="form-control" id="auName" value="' + this.esc(a.name) + '"></div>' +
            '<div class="form-group"><label>Страна</label><input class="form-control" id="auCountry" value="' + this.esc(a.country || '') + '"></div>' +
            '<div class="form-group"><label>Годы</label><input class="form-control" id="auYears" value="' + this.esc(a.years || '') + '"></div>' +
            this._imageFields('auPhoto', 'auPhotoFile', 'auPhotoPrev', a.photo || a.image || '') +
            '<div class="form-group"><label>Биография</label><textarea class="form-control" id="auBio" rows="4">' + this.esc(a.bio || '') + '</textarea></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="auSave">Сохранить</button></div>';
        App.openModal(html);
        this._bindImagePick('auPhotoFile', 'auPhoto', 'auPhotoPrev');
        document.getElementById('mClose').onclick = document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('auSave').onclick = function() {
            var o = Storage.get('authorOverrides', {});
            o[a.id] = {
                id: a.id,
                name: document.getElementById('auName').value.trim() || a.name,
                country: document.getElementById('auCountry').value.trim(),
                years: document.getElementById('auYears').value.trim(),
                bio: document.getElementById('auBio').value.trim(),
                photo: document.getElementById('auPhoto').value.trim(),
                genres: a.genres || '',
                categories: a.categories || []
            };
            Storage.set('authorOverrides', o);
            App.closeModal();
            App.showToast('Автор сохранён');
            Admin.render();
        };
    },

    editBook: function(id) {
        if (window.Library && Library.initCatalog) Library.initCatalog();
        var books = (window.Library && Library.books) || [];
        var overrides = Storage.get('bookOverrides', {});
        var base = id ? (books.find(function(b) { return b.id === id; }) || overrides[id]) : null;
        var isNew = !base;
        var b = Object.assign({
            id: id || ('book_' + Date.now()), title: '', authorId: '', year: '', genre: '', pages: '', annotation: '', cover: '', categories: [], _custom: true
        }, base || {}, overrides[id] || {});
        var html = '<div class="modal-header"><h2>' + (isNew ? 'Новая книга' : 'Редактировать книгу') + '</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Название</label><input class="form-control" id="bkTitle" value="' + this.esc(b.title) + '"></div>' +
            '<div class="form-group"><label>Жанр</label><input class="form-control" id="bkGenre" value="' + this.esc(b.genre || '') + '"></div>' +
            '<div class="form-group"><label>Год</label><input class="form-control" id="bkYear" value="' + this.esc(b.year || '') + '"></div>' +
            '<div class="form-group"><label>Страниц</label><input type="number" class="form-control" id="bkPages" value="' + (b.pages || '') + '"></div>' +
            this._imageFields('bkCover', 'bkCoverFile', 'bkCoverPrev', b.cover || b.image || '') +
            '<div class="form-group"><label>Аннотация</label><textarea class="form-control" id="bkAnn" rows="4">' + this.esc(b.annotation || '') + '</textarea></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="bkSave">Сохранить</button></div>';
        App.openModal(html);
        this._bindImagePick('bkCoverFile', 'bkCover', 'bkCoverPrev');
        document.getElementById('mClose').onclick = document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('bkSave').onclick = function() {
            var title = document.getElementById('bkTitle').value.trim();
            if (!title) { App.showToast('Укажите название'); return; }
            var o = Storage.get('bookOverrides', {});
            o[b.id] = {
                id: b.id, title: title,
                genre: document.getElementById('bkGenre').value.trim(),
                year: document.getElementById('bkYear').value.trim(),
                pages: Number(document.getElementById('bkPages').value) || b.pages || 0,
                annotation: document.getElementById('bkAnn').value.trim(),
                cover: document.getElementById('bkCover').value.trim(),
                authorId: b.authorId || '',
                categories: b.categories || [],
                _custom: isNew || !!b._custom,
                _hidden: false
            };
            Storage.set('bookOverrides', o);
            App.closeModal(); App.showToast('Сохранено'); Admin.render();
        };
    },

    renderEmotionsAdmin: function(el) {
        var moods = Storage.getMoods().slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
        var labels = (window.Emotions && Emotions.moods) ? Emotions.moods : [];
        var saved = Storage.get('moodLabels', null);
        if (saved && window.Emotions) {
            saved.forEach(function(m, i) {
                if (Emotions.moods[i]) {
                    Emotions.moods[i].label = m.label || Emotions.moods[i].label;
                    Emotions.moods[i].color = m.color || Emotions.moods[i].color;
                }
            });
            labels = Emotions.moods;
        }
        var html = '<h3 class="mb-16">Эмоции</h3>';
        html += '<div class="card mb-16"><h4 class="mb-12">Подписи и цвета</h4>';
        labels.forEach(function(m, i) {
            html += '<div class="flex-between mb-8 gap-8 flex-wrap"><span style="font-size:1.3rem;">' + m.emoji + '</span>';
            html += '<input class="form-control" data-mood-label="' + i + '" value="' + Admin.esc(m.label) + '" style="flex:1;min-width:120px;">';
            html += '<input type="color" data-mood-color="' + i + '" value="' + (m.color || '#888888') + '" style="width:48px;height:36px;padding:2px;"></div>';
        });
        html += '<button class="btn btn-primary btn-sm mt-8" id="moodLabelsSave">Сохранить подписи</button></div>';
        html += '<div class="card mb-16"><div class="flex-between mb-12"><h4 style="margin:0;">Записи (' + moods.length + ')</h4>';
        html += '<button class="btn btn-danger btn-sm" id="moodWipe">Очистить все</button></div>';
        if (!moods.length) html += '<div class="text-muted">Нет отметок</div>';
        moods.slice(0, 50).forEach(function(entry) {
            var m = labels[entry.moodId] || { emoji: '?', label: '?' };
            html += '<div class="list-item"><span>' + m.emoji + ' ' + Admin.esc(m.label) + '</span><span class="text-muted">' + entry.date +
                ' <button class="btn btn-sm btn-secondary" data-del-mood="' + entry.date + '">×</button></span></div>';
        });
        html += '</div>';
        el.innerHTML = html;
        document.getElementById('moodLabelsSave').onclick = function() {
            if (!window.Emotions) return;
            el.querySelectorAll('[data-mood-label]').forEach(function(inp) {
                var i = Number(inp.getAttribute('data-mood-label'));
                if (Emotions.moods[i]) Emotions.moods[i].label = inp.value.trim() || Emotions.moods[i].label;
            });
            el.querySelectorAll('[data-mood-color]').forEach(function(inp) {
                var i = Number(inp.getAttribute('data-mood-color'));
                if (Emotions.moods[i]) Emotions.moods[i].color = inp.value;
            });
            Storage.set('moodLabels', Emotions.moods.map(function(m) {
                return { id: m.id, label: m.label, color: m.color, emoji: m.emoji, score: m.score };
            }));
            App.showToast('Сохранено');
        };
        document.getElementById('moodWipe').onclick = function() {
            if (!confirm('Удалить все записи эмоций?')) return;
            Storage.saveMoods([]); App.showToast('Очищено'); Admin.render();
        };
        el.querySelectorAll('[data-del-mood]').forEach(function(btn) {
            btn.onclick = function() {
                var d = btn.getAttribute('data-del-mood');
                Storage.saveMoods(Storage.getMoods().filter(function(m) { return m.date !== d; }));
                App.showToast('Удалено'); Admin.render();
            };
        });
    },


    esc: function(s) {
        return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
};
