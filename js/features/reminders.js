// Life Flow - Global Reminders & Notifications
window.Reminders = {
    _lastSent: {},
    _checkInterval: null,

    init: function() {
        var self = this;
        // Start checking every 30 seconds
        if (this._checkInterval) clearInterval(this._checkInterval);
        this._checkInterval = setInterval(function() { self.checkDue(); }, 30000);
        // Also check shortly after load
        setTimeout(function() { self.checkDue(); }, 2000);

        // Bind settings button if present
        var btn = document.getElementById('openRemindersBtn');
        if (btn) btn.addEventListener('click', function() { Reminders.showSettings(); });
    },

    showSettings: function() {
        var s = Storage.getReminderSettings();
        App.openModal(
            '<div class="modal-header"><h2>🔔 Напоминания приложения</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<p class="text-muted mb-16" style="font-size:0.9rem;">Напоминания работают по всему Life Flow: привычки, настроение, вода, события календаря и план дня.</p>' +
            '<div class="form-group"><label class="checkbox-wrapper"><input type="checkbox" id="remEnabled" ' + (s.enabled ? 'checked' : '') + '> <span><strong>Включить напоминания</strong></span></label></div>' +
            '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0;">' +
            '<div class="form-group"><label class="checkbox-wrapper"><input type="checkbox" id="remHabits" ' + (s.habits !== false ? 'checked' : '') + '> <span>🌱 Привычки</span></label></div>' +
            '<div class="form-group"><label>Время напоминания о привычках</label><input type="time" class="form-control" id="remHabitsTime" value="' + (s.habitsTime || '09:00') + '"></div>' +
            '<div class="form-group"><label class="checkbox-wrapper"><input type="checkbox" id="remMood" ' + (s.mood !== false ? 'checked' : '') + '> <span>💭 Настроение</span></label></div>' +
            '<div class="form-group"><label>Время напоминания о настроении</label><input type="time" class="form-control" id="remMoodTime" value="' + (s.moodTime || '20:00') + '"></div>' +
            '<div class="form-group"><label class="checkbox-wrapper"><input type="checkbox" id="remWater" ' + (s.water !== false ? 'checked' : '') + '> <span>💧 Вода</span></label></div>' +
            '<div class="form-group"><label>Интервал воды (часы)</label><input type="number" class="form-control" id="remWaterInterval" value="' + (s.waterInterval || 2) + '" min="1" max="8"></div>' +
            '<div class="form-group"><label class="checkbox-wrapper"><input type="checkbox" id="remEvents" ' + (s.events !== false ? 'checked' : '') + '> <span>🗓️ События календаря (за 15 мин)</span></label></div>' +
            '<div class="form-group"><label class="checkbox-wrapper"><input type="checkbox" id="remPlanner" ' + (s.planner !== false ? 'checked' : '') + '> <span>📝 Незавершённые задачи дня (вечер)</span></label></div>' +
            '<div class="form-group"><label>Время напоминания о задачах</label><input type="time" class="form-control" id="remPlannerTime" value="' + (s.plannerTime || '18:00') + '"></div>' +
            '<div class="form-group"><label class="checkbox-wrapper"><input type="checkbox" id="remFitness" ' + (s.fitness !== false ? 'checked' : '') + '> <span>🚶 Активность / шаги</span></label></div>' +
            '<div class="form-group"><label>Время напоминания об активности</label><input type="time" class="form-control" id="remFitnessTime" value="' + (s.fitnessTime || '17:00') + '"></div>' +
            '<p class="text-muted" style="font-size:0.85rem;">Для браузерных уведомлений оставьте вкладку открытой и разрешите уведомления в браузере.</p>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Закрыть</button><button class="btn btn-primary" id="mSave">Сохранить</button></div>'
        );
        document.getElementById('mClose').onclick = function() { App.closeModal(); };
        document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('mSave').onclick = function() { Reminders.saveSettings(); };
    },

    saveSettings: function() {
        var s = {
            enabled: document.getElementById('remEnabled').checked,
            habits: document.getElementById('remHabits').checked,
            mood: document.getElementById('remMood').checked,
            water: document.getElementById('remWater').checked,
            events: document.getElementById('remEvents').checked,
            planner: document.getElementById('remPlanner').checked,
            fitness: document.getElementById('remFitness').checked,
            habitsTime: document.getElementById('remHabitsTime').value || '09:00',
            moodTime: document.getElementById('remMoodTime').value || '20:00',
            waterInterval: Number(document.getElementById('remWaterInterval').value) || 2,
            plannerTime: document.getElementById('remPlannerTime').value || '18:00',
            fitnessTime: document.getElementById('remFitnessTime').value || '17:00'
        };
        Storage.saveReminderSettings(s);
        App.closeModal();
        if (s.enabled) {
            this.requestPermission().then(function(ok) {
                App.showToast(ok ? 'Напоминания включены для всего приложения' : 'Включены уведомления в приложении');
            });
        } else {
            App.showToast('Напоминания выключены');
        }
    },

    requestPermission: function() {
        return new Promise(function(resolve) {
            if (!('Notification' in window)) { resolve(false); return; }
            if (Notification.permission === 'granted') { resolve(true); return; }
            if (Notification.permission === 'denied') { resolve(false); return; }
            Notification.requestPermission().then(function(p) { resolve(p === 'granted'); });
        });
    },

    notify: function(title, body) {
        if (window.App) App.showToast(title + (body ? ' — ' + body : ''));
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(title, { body: body || '', tag: title });
            } catch (e) {}
        }
    },

    checkDue: function() {
        var s = Storage.getReminderSettings();
        if (!s || !s.enabled) return;

        var now = new Date();
        var hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        var today = now.toISOString().slice(0, 10);
        var key;

        // Habits
        if (s.habits && s.habitsTime === hm) {
            key = 'habits_' + today;
            if (!this._lastSent[key]) {
                this._lastSent[key] = true;
                var habits = Storage.getHabits();
                var logs = Storage.getHabitLogs();
                var pending = habits.filter(function(h) {
                    var k = h.id + '_' + today;
                    return !(logs[k] && logs[k] >= (h.target || 1));
                });
                if (pending.length) {
                    this.notify('🌱 Привычки', 'Осталось: ' + pending.slice(0, 3).map(function(h) { return h.name; }).join(', '));
                } else {
                    this.notify('🌱 Привычки', 'Все привычки на сегодня отмечены — отлично!');
                }
            }
        }

        // Mood
        if (s.mood && s.moodTime === hm) {
            key = 'mood_' + today;
            if (!this._lastSent[key]) {
                this._lastSent[key] = true;
                var moods = Storage.getMoods();
                var hasToday = moods.some(function(m) { return m.date === today; });
                if (!hasToday) {
                    this.notify('💭 Настроение', 'Как прошёл день? Отметь эмоцию в разделе Эмоции');
                }
            }
        }

        // Water - every N hours at :00
        if (s.water && s.waterInterval) {
            if (now.getMinutes() === 0 && now.getHours() % s.waterInterval === 0) {
                key = 'water_' + today + '_' + now.getHours();
                if (!this._lastSent[key]) {
                    this._lastSent[key] = true;
                    var body = Storage.get('bodyParams') || {};
                    var water = body.water || 0;
                    var goal = body.waterGoal || 8;
                    this.notify('💧 Вода', 'Выпито ' + water + ' из ' + goal + ' стаканов. Самое время выпить ещё!');
                }
            }
        }

        // Calendar events - 15 min before
        if (s.events !== false) {
            var events = Storage.getEvents().filter(function(e) { return e.date === today && e.start; });
            events.forEach(function(ev) {
                var parts = (ev.start || '').split(':');
                if (parts.length < 2) return;
                var evDate = new Date();
                evDate.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
                var diffMin = Math.round((evDate - now) / 60000);
                if (diffMin >= 14 && diffMin <= 16) {
                    key = 'event_' + ev.id + '_' + today;
                    if (!Reminders._lastSent[key]) {
                        Reminders._lastSent[key] = true;
                        Reminders.notify('🗓️ Скоро событие', ev.title + ' в ' + ev.start);
                    }
                }
            });
        }

        // Planner unfinished tasks
        if (s.planner && s.plannerTime === hm) {
            key = 'planner_' + today;
            if (!this._lastSent[key]) {
                this._lastSent[key] = true;
                var tasks = [];
                try {
                    var dayPlan = Storage.get('dayPlans') || {};
                    var plan = dayPlan[today] || dayPlan[Object.keys(dayPlan).pop()] || null;
                    // Also try Storage.getTasks if exists
                    if (typeof Storage.getTasks === 'function') {
                        tasks = Storage.getTasks().filter(function(t) {
                            return !t.done && (!t.date || t.date === today);
                        });
                    }
                } catch (e) {}
                // Generic reminder
                this.notify('📝 План дня', tasks.length
                    ? 'Незавершённых задач: ' + tasks.length
                    : 'Проверь план на сегодня — что ещё можно закрыть?');
            }
        }

        // Fitness / steps
        if (s.fitness && s.fitnessTime === hm) {
            key = 'fitness_' + today;
            if (!this._lastSent[key]) {
                this._lastSent[key] = true;
                var body2 = Storage.get('bodyParams') || {};
                var steps = body2.steps || 0;
                var goal2 = body2.stepsGoal || 8000;
                if (steps < goal2) {
                    this.notify('🚶 Активность', 'Шаги: ' + steps + ' из ' + goal2 + '. Прогулка будет кстати!');
                } else {
                    this.notify('🚶 Активность', 'Цель по шагам достигнута — ' + steps + '!');
                }
            }
        }
    }
};
