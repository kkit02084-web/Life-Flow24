// Life Flow - Main Application
window.App = {
    loadAndRenderSection: function(section) {
        var self = this;
        var run = function() {
            try {
                if (section === 'dashboard') self.renderDashboard();
                else if (section === 'calendar' && window.Calendar) Calendar.render();
                else if (section === 'habits' && window.Habits) Habits.render();
                else if (section === 'skills' && window.Skills) Skills.render();
                else if (section === 'nutrition' && window.Nutrition) Nutrition.render();
                else if (section === 'finance' && window.Finance) Finance.render();
                else if (section === 'fitness' && window.Fitness) Fitness.render();
                else if (section === 'interests' && window.Interests) Interests.render();
                else if (section === 'planner' && window.Planner) Planner.render();
                else if (section === 'notes' && window.Notes) Notes.render();
                else if (section === 'library' && window.Library) {
                    Library.render();
                }
                else if (section === 'emotions' && window.Emotions) Emotions.render();
                else if (section === 'settings' && window.Settings) {
                    if (Settings.render) Settings.render();
                }
                // init module once after load
                var map = {
                    calendar: 'Calendar', habits: 'Habits', skills: 'Skills', nutrition: 'Nutrition',
                    finance: 'Finance', fitness: 'Fitness', interests: 'Interests', planner: 'Planner',
                    notes: 'Notes', library: 'Library', emotions: 'Emotions', settings: 'Settings'
                };
                var name = map[section];
                if (name && window[name] && typeof window[name].init === 'function' && !window[name].__lfInited) {
                    window[name].init();
                    window[name].__lfInited = true;
                    // re-render after init for modules that need DOM bindings first
                    if (section === 'library' && window.Library) Library.render();
                    if (section === 'settings' && window.Settings && Settings.render) Settings.render();
                }
            } catch (e) {
                console.error('Section render error', section, e);
            }
        };
        if (window.LFLoader && LFLoader.ensureSection) {
            LFLoader.ensureSection(section).then(run).catch(function(err) {
                console.error(err);
                run();
            });
        } else {
            run();
        }
    },

    currentSection: 'dashboard',
    init: function() {
        var selfBoot = this;
                if (window.Storage && Storage.boot) {
            Storage.boot().then(function () {
                // Cloud in background with timeout — never blocks UI
                if (window.Cloud && Cloud.init) {
                    var timed = Promise.race([
                        Cloud.init(),
                        new Promise(function (resolve) { setTimeout(resolve, 2500); })
                    ]);
                    return timed.catch(function (e) { console.warn('cloud', e); });
                }
            }).catch(function (e) { console.warn('boot', e); });
        }
        // SW disabled temporarily — was serving broken cached builds on phones

        try {
            this.applySettings();
            document.body.setAttribute('data-section', 'dashboard');
            this.setupNavigation();
            this.setupMobileMenu();
            this.updateDateAndGreeting();
            this.renderDashboard();
            this.bindGlobalEvents();
            // Force clean overlays — prevents black film on mobile
            try {
                var mo = document.getElementById('modalOverlay');
                if (mo) { mo.classList.remove('active'); mo.style.display = 'none'; mo.style.pointerEvents = 'none'; }
                var so = document.getElementById('sidebarOverlay');
                if (so) { so.classList.remove('active'); }
                var side = document.getElementById('sidebar');
                if (side) side.classList.remove('open');
                document.body.classList.remove('is-auth', 'auth-gate-open');
                document.body.style.pointerEvents = '';
                document.body.style.filter = '';
            } catch (e) {}

            // Init modules safely
            var modules = ['Calendar','Habits','Skills','Nutrition','Finance','Fitness','Interests','Planner','Notes','Library','Emotions','Settings','Reminders','Admin'];
            modules.forEach(function(name) {
                try {
                    if (window[name] && typeof window[name].init === 'function') {
                        window[name].init();
                    }
                } catch (e) {
                    console.error('Init error ' + name + ':', e);
                }
            });
                    } catch (e) {
            console.error('App.init error:', e);
            alert('Ошибка загрузки: ' + e.message);
        }
    },
    applySettings: function() {
        var s = Storage.getSettings();
        document.body.classList.toggle('theme-dark', s.theme === 'dark');
        var sq = Storage.get('siteQuotes', null);
        var hs = document.getElementById('heroSubtitle');
        if (hs && sq && sq.heroSubtitle) hs.textContent = sq.heroSubtitle;
        if (s.accentColor && s.accentColor !== 'default') {
            document.body.setAttribute('data-accent', s.accentColor);
        } else {
            document.body.removeAttribute('data-accent');
        }
        var g = document.getElementById('greeting');
        if (g) g.textContent = 'Привет, ' + (s.userName || 'Пользователь') + '!';
    },
    setupNavigation: function() {
        // Event delegation - works even if elements change
        document.body.addEventListener('click', function(e) {
            var btn = e.target.closest('.nav-item[data-section]');
            if (btn) {
                e.preventDefault();
                App.navigateTo(btn.getAttribute('data-section'));
                var sidebar = document.getElementById('sidebar');
                var overlay = document.getElementById('sidebarOverlay');
                if (sidebar) sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
            }
        });
    },
    navigateTo: function(section) {
        // Admin mode: sidebar NEVER leaves admin until "Вернуться на сайт" / logout
        if (window.Admin && typeof Admin.isAdminMode === 'function' && Admin.isAdminMode()) {
            var adminTabMap = {
                dashboard: 'quotes',
                nutrition: 'recipes',
                fitness: 'exercises',
                habits: 'habits',
                interests: 'interests',
                skills: 'skills',
                library: 'library',
                emotions: 'emotions',
                notes: 'notes',
                finance: 'finance',
                settings: 'appearance',
                calendar: 'overview',
                planner: 'overview'
            };
            var tab = adminTabMap[section] || 'overview';
            Admin.openSectionTab(section, tab);
            return;
        }

        document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
        document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
        var sectionEl = document.getElementById('section-' + section);
        if (sectionEl) {
            sectionEl.classList.add('active');
            App.currentSection = section;
        }
        document.body.setAttribute('data-section', section || 'dashboard');
        var navBtn = document.querySelector('.nav-item[data-section="' + section + '"]');
        if (navBtn) navBtn.classList.add('active');
        var titles = {
            dashboard: 'Главная', calendar: 'Календарь', habits: 'Привычки',
            skills: 'Развитие навыков', nutrition: 'Питание', finance: 'Финансы',
            fitness: 'Спорт', interests: 'Увлечения', planner: 'Планировщик дня',
            notes: 'Заметки', library: 'Библиотека', emotions: 'Эмоции', settings: 'Настройки'
        };
        var titleEl = document.getElementById('pageTitle');
        if (titleEl) titleEl.textContent = titles[section] || 'Life Flow';
        App.refreshSection(section);
    },
    refreshSection: function(section) {
        // Lazy-load module scripts then render
        this.loadAndRenderSection(section);
    },
    setupMobileMenu: function() {
        var btn = document.getElementById('mobileMenuBtn');
        var sidebar = document.getElementById('sidebar');
        var overlay = document.getElementById('sidebarOverlay');
        if (btn) {
            var toggleMenu = function(e) {
                if (e) e.preventDefault();
                if (sidebar) sidebar.classList.toggle('open');
                if (overlay) overlay.classList.toggle('active');
            };
            btn.addEventListener('click', toggleMenu);
            btn.addEventListener('touchend', toggleMenu, { passive: false });
        }
        if (overlay) {
            overlay.addEventListener('click', function() {
                if (sidebar) sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });
        }
    },
    updateDateAndGreeting: function() {
        var now = new Date();
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        var dateEl = document.getElementById('currentDate');
        if (dateEl) dateEl.textContent = now.toLocaleDateString('ru-RU', options);
        var hour = now.getHours();
        var greet = 'Добрый день';
        if (hour < 6) greet = 'Доброй ночи';
        else if (hour < 12) greet = 'Доброе утро';
        else if (hour < 18) greet = 'Добрый день';
        else greet = 'Добрый вечер';
        var s = Storage.getSettings();
        var g = document.getElementById('greeting');
        if (g) g.textContent = greet + ', ' + (s.userName || 'Пользователь') + '!';
    },
    renderDashboard: function() {
        var grid = document.getElementById('dashboardGrid');
        if (!grid) return;
        var habits = Storage.getHabits();
        var logs = Storage.getHabitLogs();
        var today = new Date().toISOString().slice(0, 10);
        var events = Storage.getEvents();
        var incomes = Storage.getIncomes();
        var expenses = Storage.getExpenses();
        var skills = Storage.getSkills();
        var notes = Storage.getQuickNotes();
        var body = Storage.get('bodyParams') || { weight: 70, height: 170, steps: 0, water: 0, sleep: 7, stepsGoal: 8000, waterGoal: 8 };
        var todayHabits = habits.filter(function(h) {
            var day = new Date().getDay();
            return h.frequency === 'daily' || (h.days && h.days.indexOf(day) >= 0);
        });
        var doneHabits = 0;
        todayHabits.forEach(function(h) {
            var key = h.id + '_' + today;
            if (logs[key] && logs[key] >= (h.target || 1)) doneHabits++;
        });
        var todayEvents = events.filter(function(e) { return e.date === today; }).sort(function(a, b) {
            return (a.start || '').localeCompare(b.start || '');
        });
        var nextEvent = todayEvents[0];
        var month = today.slice(0, 7);
        var monthIncome = incomes.filter(function(i) { return i.date && i.date.indexOf(month) === 0; }).reduce(function(s, i) { return s + Number(i.amount); }, 0);
        var monthExpense = expenses.filter(function(e) { return e.date && e.date.indexOf(month) === 0; }).reduce(function(s, e) { return s + Number(e.amount); }, 0);
        var balance = monthIncome - monthExpense;
        var totalNodes = 0, doneNodes = 0;
        Object.keys(skills).forEach(function(k) {
            (skills[k].nodes || []).forEach(function(n) {
                totalNodes++;
                if (n.status === 'освоено') doneNodes++;
            });
        });
        var skillsProgress = totalNodes ? Math.round((doneNodes / totalNodes) * 100) : 0;
        var now = new Date();
        var timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

        var html = '';

        // Quote / soft message (editable in admin)
        var siteQuotes = Storage.get('siteQuotes', null);
        if (!siteQuotes || !siteQuotes.main) {
            siteQuotes = {
                main: 'Я выбираю мягкость как двигатель, порядок как союзника и любопытство как компас. Каждый маленький шаг важен. 🌿',
                reminder: '🌸 Тебе не нужно быть идеальным каждый день. Иди в своём темпе — ты уже делаешь достаточно.',
                heroSubtitle: 'Мягкие дни, спокойный ритм и маленькие шаги к себе'
            };
        }
        html += '<div class="ghibli-quote" style="grid-column:1/-1;">' + siteQuotes.main + '</div>';

        // Left column style blocks
        // Routine of the day
        html += '<div class="card ghibli-block">';
        html += '<h3 class="ghibli-block-title">🍃 Распорядок дня</h3>';
        html += '<div class="routine-section"><strong>Утро</strong><div class="text-muted" style="font-size:0.9rem;">07:00 Подъём · 07:30 Вода · 08:00 Чтение · 09:00 План дня</div></div>';
        html += '<div class="routine-section"><strong>День</strong><div class="text-muted" style="font-size:0.9rem;">12:00 Обед · 13:00 Глубокая работа · 15:00 Пауза · 16:00 Творчество</div></div>';
        html += '<div class="routine-section"><strong>Вечер</strong><div class="text-muted" style="font-size:0.9rem;">18:00 Итоги · 19:00 Ужин · 20:00 Отдых · 21:30 Без экранов</div></div>';
        if (nextEvent) {
            html += '<div class="mt-12" style="padding:10px;background:var(--green-light);border-radius:10px;font-size:0.9rem;">Ближайшее: <strong>' + nextEvent.title + '</strong> ' + (nextEvent.start || '') + '</div>';
        }
        html += '</div>';

        // Today's checklist / habits
        html += '<div class="card ghibli-block">';
        html += '<h3 class="ghibli-block-title">🌷 Сделать сегодня</h3>';
        if (todayHabits.length === 0) {
            html += '<div class="text-muted">Нет привычек на сегодня</div>';
        } else {
            todayHabits.slice(0, 6).forEach(function(h) {
                var key = h.id + '_' + today;
                var done = logs[key] && logs[key] >= (h.target || 1);
                html += '<label class="checkbox-wrapper" style="margin-bottom:8px;display:flex;"><input type="checkbox" data-habit-id="' + h.id + '" ' + (done ? 'checked' : '') + '> <span>' + (h.icon || '○') + ' ' + h.name + '</span></label>';
            });
        }
        html += '<div class="mt-12 text-muted" style="font-size:0.85rem;">' + doneHabits + ' из ' + todayHabits.length + ' выполнено</div>';
        html += '</div>';

        // Modules grid (like the design icons)
        html += '<div class="card ghibli-block" style="grid-column:1/-1;">';
        html += '<h3 class="ghibli-block-title">🌸 Разделы</h3>';
        html += '<div class="modules-grid">';
        var modules = [
            { goto: 'habits', icon: '🌱', label: 'Привычки' },
            { goto: 'finance', icon: '🪙', label: 'Финансы' },
            { goto: 'skills', icon: '📖', label: 'Развитие' },
            { goto: 'notes', icon: '📒', label: 'Дневник' },
            { goto: 'fitness', icon: '🚶', label: 'Прогулки' },
            { goto: 'interests', icon: '🎨', label: 'Увлечения' },
            { goto: 'planner', icon: '📝', label: 'План дня' },
            { goto: 'nutrition', icon: '🍵', label: 'Питание' },
            { goto: 'calendar', icon: '🗓️', label: 'Календарь' }
        ];
        modules.forEach(function(m) {
            html += '<div class="module-tile" data-goto="' + m.goto + '"><span class="module-icon">' + m.icon + '</span><span class="module-label">' + m.label + '</span></div>';
        });
        html += '</div></div>';

        // Stats row
        html += '<div class="dashboard-card" data-goto="finance"><div class="card-icon">🪙</div><h3>Финансы</h3><div class="stat">' + balance.toLocaleString('ru-RU') + ' ₸</div><div class="subtext">баланс за месяц</div></div>';
        html += '<div class="dashboard-card" data-goto="skills"><div class="card-icon">📖</div><h3>Навыки</h3><div class="stat">' + skillsProgress + '%</div><div class="subtext">прогресс</div><div class="progress-bar"><div class="progress-fill" style="width:' + skillsProgress + '%"></div></div></div>';
        html += '<div class="dashboard-card" data-goto="fitness"><div class="card-icon">🚶</div><h3>Активность</h3><div class="stat">' + (body.steps || 0) + '</div><div class="subtext">шагов · вода ' + (body.water || 0) + '/' + (body.waterGoal || 8) + '</div></div>';

        // Mood + time widgets
        html += '<div class="card ghibli-block">';
        html += '<h3 class="ghibli-block-title">🌤 Настроение</h3>';
        html += '<p class="text-muted" style="font-size:0.9rem;margin-bottom:10px;">Как ты себя чувствуешь?</p>';
        html += '<div class="mood-row">';
        ['😊','🙂','😐','😔','😢'].forEach(function(m, i) {
            html += '<button class="mood-btn" data-mood="' + i + '">' + m + '</button>';
        });
        html += '</div></div>';

        html += '<div class="card ghibli-block ghibli-time">';
        html += '<h3 class="ghibli-block-title">🕰 Сейчас</h3>';
        html += '<div class="time-display">' + timeStr + '</div>';
        html += '<div class="text-muted" style="font-size:0.9rem;">Продолжай в своём ритме</div></div>';

        // Monthly goals soft icons
        html += '<div class="card ghibli-block" style="grid-column:1/-1;">';
        html += '<h3 class="ghibli-block-title">🎯 Цели месяца</h3>';
        html += '<div class="goals-row">';
        var goals = [
            { icon: '💧', label: 'Пить воду' },
            { icon: '👟', label: 'Гулять' },
            { icon: '📚', label: 'Читать' },
            { icon: '💰', label: 'Копить' },
            { icon: '✏️', label: 'Учиться' },
            { icon: '🌳', label: 'На природе' },
            { icon: '🍲', label: 'Есть дома' },
            { icon: '🎨', label: 'Творить' }
        ];
        goals.forEach(function(g) {
            html += '<div class="goal-circle"><span>' + g.icon + '</span><small>' + g.label + '</small></div>';
        });
        html += '</div></div>';

        // Kind reminder
        html += '<div class="ghibli-reminder" style="grid-column:1/-1;">' + (siteQuotes.reminder || '') + '</div>';

        // Quick notes
        html += '<div class="card ghibli-block" style="grid-column:1/-1;">';
        html += '<h3 class="ghibli-block-title">✏️ Быстрая заметка</h3>';
        html += '<div class="form-group"><textarea class="form-control" id="quickNoteInput" placeholder="Записать мысль..." rows="2"></textarea></div>';
        html += '<button class="btn btn-primary btn-sm" id="quickNoteBtn">Сохранить</button>';
        html += '<div class="mt-12" id="quickNotesList">';
        notes.slice(0, 3).forEach(function(n) {
            html += '<div class="list-item" style="padding:8px;font-size:0.9rem;">' + n.text + ' <button class="btn-icon btn-sm" style="width:28px;height:28px;margin-left:auto;" data-del-note="' + n.id + '">×</button></div>';
        });
        html += '</div></div>';

        grid.innerHTML = html;

        grid.onclick = function(e) {
            var card = e.target.closest('[data-goto]');
            if (card) { App.navigateTo(card.getAttribute('data-goto')); return; }
            var cb = e.target.closest('input[data-habit-id]');
            if (cb && window.Habits) { Habits.toggleHabit(cb.getAttribute('data-habit-id'), cb.checked); return; }
            if (e.target.id === 'quickNoteBtn' || e.target.closest('#quickNoteBtn')) { App.addQuickNote(); return; }
            var del = e.target.closest('[data-del-note]');
            if (del) { App.deleteQuickNote(del.getAttribute('data-del-note')); return; }
            var mood = e.target.closest('[data-mood]');
            if (mood && window.Emotions) { Emotions.logMood(Number(mood.getAttribute('data-mood'))); } else if (mood) { App.showToast('Настроение сохранено 🌤'); }
        };
    },

    addQuickNote: function() {
        var input = document.getElementById('quickNoteInput');
        if (!input) return;
        var text = input.value.trim();
        if (!text) return;
        var notes = Storage.getQuickNotes();
        notes.unshift({ id: Storage.generateId(), text: text, date: new Date().toISOString() });
        Storage.saveQuickNotes(notes.slice(0, 20));
        input.value = '';
        this.renderDashboard();
        this.showToast('Заметка сохранена');
    },
    deleteQuickNote: function(id) {
        var notes = Storage.getQuickNotes().filter(function(n) { return n.id !== id; });
        Storage.saveQuickNotes(notes);
        this.renderDashboard();
    },
    openModal: function(html) {
        var m = document.getElementById('modalOverlay');
        if (m) {
            m.style.display = 'flex';
            m.style.pointerEvents = 'auto';
        }

        var overlay = document.getElementById('modalOverlay');
        var content = document.getElementById('modalContent');
        if (content) content.innerHTML = html;
        if (overlay) overlay.classList.add('active');
    },
    closeModal: function() {
        var overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.display = 'none';
            overlay.style.pointerEvents = 'none';
        }
    },
    showToast: function(message, type) {
        type = type || 'success';
        var container = document.getElementById('toastContainer');
        if (!container) return;
        var toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
        }, 3000);
    },
    confirm: function(message) {
        return window.confirm(message);
    },
    bindGlobalEvents: function() {
        // Secret admin access: 5 clicks on logo / brand, or URL #admin
        var logoClicks = 0;
        var logoTimer = null;
        var brand = document.querySelector('.sidebar-brand, .logo, #sidebarBrand, .app-logo');
        if (!brand) brand = document.querySelector('#sidebar .logo-text, #sidebar h1, #sidebar .brand');
        if (!brand) {
            // fallback: Life Flow title in sidebar
            var side = document.getElementById('sidebar');
            if (side) brand = side.querySelector('h1, .brand, [class*="logo"]');
        }
        if (brand) {
            brand.style.cursor = 'default';
            brand.addEventListener('click', function(e) {
                logoClicks++;
                clearTimeout(logoTimer);
                logoTimer = setTimeout(function() { logoClicks = 0; }, 2000);
                if (logoClicks >= 5) {
                    logoClicks = 0;
                    if (window.Admin) Admin.openGate();
                }
            });
        }

        var overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target.id === 'modalOverlay') App.closeModal();
            });
        }
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') App.closeModal();
        });
    },
    formatDate: function(dateStr) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('ru-RU');
    },
    formatMoney: function(n) {
        return (window.Finance && Finance.money) ? Finance.money(n) : (Number(n).toLocaleString('ru-RU') + ' ₸');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
