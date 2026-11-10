// Life Flow - Emotions Module
// Mood can be set for any day (today or past); calendar days are clickable.
window.Emotions = {
    moods: [
        { id: 0, emoji: '😊', label: 'Отлично', color: '#7A9B6D', score: 5 },
        { id: 1, emoji: '🙂', label: 'Хорошо', color: '#8FBC8F', score: 4 },
        { id: 2, emoji: '😐', label: 'Нормально', color: '#C4A35A', score: 3 },
        { id: 3, emoji: '😔', label: 'Грустно', color: '#D4A574', score: 2 },
        { id: 4, emoji: '😢', label: 'Тяжело', color: '#C45C5C', score: 1 }
    ],

    supportBad: [
        'Ты не обязан(а) быть в порядке каждый день. Это нормально — просто быть.',
        'Плохие дни тоже часть пути. Отдохни, попей воды, сделай один маленький шаг.',
        'Ты уже справился(ась) со многим. Этот день тоже пройдёт.',
        'Может, стоит прогуляться или написать, что чувствуешь?',
        'Мягкость к себе — тоже сила. Разреши себе замедлиться сегодня.'
    ],
    supportGood: [
        'Как здорово, что тебе хорошо! Запомни это ощущение.',
        'Отличное настроение — момент сделать что-то приятное для себя.',
        'Пусть хорошие дни накапливаются. Ты заслуживаешь радости.',
        'Сохрани этот момент: что помогло тебе почувствовать себя так?',
        'Прекрасный день, чтобы отметить маленький прогресс.'
    ],
    supportNeutral: [
        'Спокойный день — тоже подарок. Можно просто быть.',
        'Ровное настроение — хорошая база. Что сделает день чуть теплее?'
    ],

    calMonth: null,
    selectedDate: null, // YYYY-MM-DD

    init: function() {
        this.calMonth = new Date();
        this.calMonth.setDate(1);
        this.selectedDate = this.todayStr();
        var saved = Storage.get('moodLabels', null);
        if (saved && saved.length) {
            var self = this;
            saved.forEach(function(m, i) {
                if (self.moods[i]) {
                    if (m.label) self.moods[i].label = m.label;
                    if (m.color) self.moods[i].color = m.color;
                    if (m.emoji) self.moods[i].emoji = m.emoji;
                }
            });
        }
        var btn = document.getElementById('emotionRemindBtn') || document.getElementById('openRemindersBtn');
        if (btn) btn.addEventListener('click', function() {
            if (window.Reminders) Reminders.showSettings();
        });
    },

    todayStr: function() {
        return new Date().toISOString().slice(0, 10);
    },

    formatDateLabel: function(ds) {
        if (!ds) return '';
        var parts = ds.split('-');
        var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        var today = this.todayStr();
        if (ds === today) return 'Сегодня';
        var yest = new Date();
        yest.setDate(yest.getDate() - 1);
        if (ds === yest.toISOString().slice(0, 10)) return 'Вчера';
        var months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    },

    shiftSelected: function(deltaDays) {
        var parts = (this.selectedDate || this.todayStr()).split('-');
        var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        d.setDate(d.getDate() + deltaDays);
        var today = new Date();
        today.setHours(23, 59, 59, 999);
        if (d > today) d = new Date(); // no future
        this.selectedDate = d.toISOString().slice(0, 10);
        this.calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        this.render();
    },

    render: function() {
        var container = document.getElementById('emotionsContent');
        if (!container) return;
        if (!this.selectedDate) this.selectedDate = this.todayStr();

        var moodsLog = Storage.getMoods();
        var sel = this.selectedDate;
        var today = this.todayStr();
        var dayMood = moodsLog.find(function(m) { return m.date === sel; });
        var isToday = sel === today;
        var isFuture = sel > today;

        var html = '';

        // Day navigation
        html += '<div class="card mb-16">';
        html += '<div class="flex-between mb-16 flex-wrap gap-12" style="align-items:center;">';
        html += '<button type="button" class="btn btn-sm btn-secondary" id="moodDayPrev" title="Предыдущий день">←</button>';
        html += '<div style="text-align:center;flex:1;">';
        html += '<div style="font-family:var(--font-serif);font-size:1.15rem;font-weight:600;" id="moodDayLabel">' + this.formatDateLabel(sel) + '</div>';
        html += '<div class="text-muted" style="font-size:0.85rem;">' + sel + '</div>';
        html += '</div>';
        html += '<button type="button" class="btn btn-sm btn-secondary" id="moodDayNext" title="Следующий день"' + (isToday || isFuture ? ' disabled' : '') + '>→</button>';
        html += '</div>';
        html += '<div class="flex-between flex-wrap gap-8 mb-16">';
        html += '<button type="button" class="btn btn-sm btn-secondary" id="moodDayToday">К сегодня</button>';
        html += '<input type="date" class="form-control" id="moodDatePicker" value="' + sel + '" max="' + today + '" style="width:auto;max-width:160px;">';
        html += '</div>';

        // Mood picker for selected day
        html += '<h3 class="mb-12">' + (isToday ? 'Как ты себя чувствуешь сегодня?' : 'Какое было настроение в этот день?') + '</h3>';
        html += '<div class="mood-pick-row">';
        this.moods.forEach(function(m) {
            var active = dayMood && dayMood.moodId === m.id;
            html += '<button type="button" class="mood-pick-btn' + (active ? ' active' : '') + '" data-mood-id="' + m.id + '" style="' + (active ? 'border-color:' + m.color + ';background:' + m.color + '22;' : '') + '">' +
                '<span class="mood-emoji">' + m.emoji + '</span><small>' + m.label + '</small></button>';
        });
        html += '</div>';
        if (dayMood) {
            var mInfo = this.moods[dayMood.moodId] || this.moods[2];
            html += '<div class="mt-16 emotion-today-badge">' + (isToday ? 'Сегодня' : this.formatDateLabel(sel)) + ': <strong>' + mInfo.emoji + ' ' + mInfo.label + '</strong>';
            html += ' <button type="button" class="btn btn-sm btn-secondary" id="moodClearDay" style="margin-left:8px;">Сбросить</button></div>';
        } else if (!isFuture) {
            html += '<div class="mt-12 text-muted" style="font-size:0.9rem;">Настроение ещё не отмечено — можно добавить сейчас.</div>';
        }
        html += '</div>';

        // Support
        var support = this.getSupportMessage(moodsLog);
        if (support) {
            html += '<div class="ghibli-reminder mb-16">' + support + '</div>';
        }

        // Calendar
        html += '<div class="card mb-16"><div class="flex-between mb-12">' +
            '<button type="button" class="btn btn-sm btn-secondary" id="moodCalPrev">←</button>' +
            '<h3 style="margin:0;" id="moodCalTitle"></h3>' +
            '<button type="button" class="btn btn-sm btn-secondary" id="moodCalNext">→</button></div>';
        html += '<p class="text-muted mb-12" style="font-size:0.85rem;">Нажми на день, чтобы выбрать его и отметить эмоцию (можно и за прошлые дни).</p>';
        html += '<div class="mood-calendar" id="moodCalendar"></div>';
        html += '<div class="mood-cal-legend mt-12">';
        this.moods.forEach(function(m) {
            html += '<span class="mood-legend-item"><span class="mood-legend-dot" style="background:' + m.color + ';"></span>' + m.emoji + ' ' + m.label + '</span>';
        });
        html += '</div></div>';

        // Charts
        var weekData = this.getLastDays(moodsLog, 7);
        html += '<div class="card mb-16"><h4 class="mb-12">Последние 7 дней</h4>' + this.renderBarChart(weekData) + '</div>';
        html += '<div class="card mb-16"><h4 class="mb-12">Распределение</h4>' + this.renderPie(moodsLog) + '</div>';

        // History
        html += '<div class="card mb-16"><h4 class="mb-12">История</h4>';
        var sorted = moodsLog.slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
        if (!sorted.length) {
            html += '<div class="text-muted">Пока нет записей. Выбери день и отметь настроение.</div>';
        } else {
            sorted.slice(0, 30).forEach(function(entry) {
                var m = Emotions.moods[entry.moodId] || Emotions.moods[2];
                var dateLabel = Emotions.formatDateLabel(entry.date);
                html += '<div class="list-item emotion-history-item" data-goto-date="' + entry.date + '" style="cursor:pointer;">' +
                    '<span class="mood-emoji">' + m.emoji + '</span><div><strong>' + m.label + '</strong>' +
                    '<div class="text-muted" style="font-size:0.85rem;">' + dateLabel + ' · ' + entry.date + '</div></div></div>';
            });
        }
        html += '</div>';

        container.innerHTML = html;
        this.renderMoodCalendar();
        this.bindEvents(container);
    },

    bindEvents: function(container) {
        var self = this;
        container.onclick = function(e) {
            var btn = e.target.closest('[data-mood-id]');
            if (btn) {
                self.logMood(Number(btn.getAttribute('data-mood-id')), self.selectedDate);
                return;
            }
            var hist = e.target.closest('[data-goto-date]');
            if (hist) {
                self.selectedDate = hist.getAttribute('data-goto-date');
                var parts = self.selectedDate.split('-');
                self.calMonth = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
                self.render();
                return;
            }
            var dayCell = e.target.closest('.mood-cal-day[data-date]');
            if (dayCell) {
                var ds = dayCell.getAttribute('data-date');
                if (ds && ds <= self.todayStr()) {
                    self.selectedDate = ds;
                    self.render();
                }
            }
        };

        var prev = document.getElementById('moodDayPrev');
        var next = document.getElementById('moodDayNext');
        var todayBtn = document.getElementById('moodDayToday');
        var picker = document.getElementById('moodDatePicker');
        var clearBtn = document.getElementById('moodClearDay');

        if (prev) prev.onclick = function() { self.shiftSelected(-1); };
        if (next) next.onclick = function() { self.shiftSelected(1); };
        if (todayBtn) todayBtn.onclick = function() {
            self.selectedDate = self.todayStr();
            self.calMonth = new Date();
            self.calMonth.setDate(1);
            self.render();
        };
        if (picker) picker.onchange = function() {
            if (picker.value && picker.value <= self.todayStr()) {
                self.selectedDate = picker.value;
                var p = picker.value.split('-');
                self.calMonth = new Date(Number(p[0]), Number(p[1]) - 1, 1);
                self.render();
            }
        };
        if (clearBtn) clearBtn.onclick = function() {
            self.clearMood(self.selectedDate);
        };

        var calPrev = document.getElementById('moodCalPrev');
        var calNext = document.getElementById('moodCalNext');
        if (calPrev) calPrev.onclick = function() {
            self.calMonth.setMonth(self.calMonth.getMonth() - 1);
            self.renderMoodCalendar();
        };
        if (calNext) calNext.onclick = function() {
            self.calMonth.setMonth(self.calMonth.getMonth() + 1);
            self.renderMoodCalendar();
        };
    },

    renderMoodCalendar: function() {
        var el = document.getElementById('moodCalendar');
        var title = document.getElementById('moodCalTitle');
        if (!el) return;
        if (!this.calMonth) {
            this.calMonth = new Date();
            this.calMonth.setDate(1);
        }
        var year = this.calMonth.getFullYear();
        var month = this.calMonth.getMonth();
        var monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
        if (title) title.textContent = monthNames[month] + ' ' + year;

        var moodsLog = Storage.getMoods();
        var byDate = {};
        moodsLog.forEach(function(m) { byDate[m.date] = m; });

        var firstDay = new Date(year, month, 1);
        var startWeekday = firstDay.getDay();
        var offset = (startWeekday + 6) % 7;
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var today = this.todayStr();
        var selected = this.selectedDate;

        var html = '<div class="mood-cal-weekdays">';
        ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach(function(d) {
            html += '<div class="mood-cal-wd">' + d + '</div>';
        });
        html += '</div><div class="mood-cal-grid">';

        for (var i = 0; i < offset; i++) {
            html += '<div class="mood-cal-day empty"></div>';
        }
        for (var day = 1; day <= daysInMonth; day++) {
            var ds = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
            var entry = byDate[ds];
            var isToday = ds === today;
            var isSelected = ds === selected;
            var isFuture = ds > today;
            var emoji = '';
            var bg = '';
            if (entry) {
                var m = this.moods[entry.moodId] || this.moods[2];
                emoji = m.emoji;
                bg = m.color;
            }
            var cls = 'mood-cal-day';
            if (isToday) cls += ' today';
            if (isSelected) cls += ' selected';
            if (entry) cls += ' has-mood';
            if (isFuture) cls += ' future';
            html += '<div class="' + cls + '" data-date="' + ds + '" title="' + ds + (entry ? ' — ' + (this.moods[entry.moodId] || {}).label : '') + '"' +
                (isFuture ? ' style="opacity:0.35;cursor:default;"' : ' style="cursor:pointer;"') + '>' +
                '<span class="mood-cal-num">' + day + '</span>' +
                (emoji ? '<span class="mood-cal-emoji">' + emoji + '</span>' : '') +
                (bg ? '<span class="mood-cal-dot" style="background:' + bg + ';"></span>' : '') +
                '</div>';
        }
        html += '</div>';
        el.innerHTML = html;
    },

    logMood: function(moodId, dateStr) {
        var date = dateStr || this.selectedDate || this.todayStr();
        if (date > this.todayStr()) {
            App.showToast('Нельзя отметить будущее');
            return;
        }
        var moodsLog = Storage.getMoods();
        var existing = moodsLog.findIndex(function(m) { return m.date === date; });
        var entry = { id: Storage.generateId(), date: date, moodId: moodId, note: '', ts: new Date().toISOString() };
        if (existing >= 0) {
            entry.note = moodsLog[existing].note || '';
            entry.id = moodsLog[existing].id;
            moodsLog[existing] = entry;
        } else {
            moodsLog.push(entry);
        }
        Storage.saveMoods(moodsLog);
        this.render();
        var m = this.moods[moodId];
        App.showToast(m.emoji + ' ' + m.label + ' — ' + this.formatDateLabel(date));
        if (App.currentSection === 'dashboard') App.renderDashboard();
    },

    clearMood: function(dateStr) {
        var date = dateStr || this.selectedDate;
        var moodsLog = Storage.getMoods().filter(function(m) { return m.date !== date; });
        Storage.saveMoods(moodsLog);
        this.render();
        App.showToast('Запись удалена');
    },

    getLastDays: function(moodsLog, n) {
        var result = [];
        for (var i = n - 1; i >= 0; i--) {
            var d = new Date();
            d.setDate(d.getDate() - i);
            var ds = d.toISOString().slice(0, 10);
            var found = moodsLog.find(function(m) { return m.date === ds; });
            result.push({
                date: ds,
                label: d.getDate() + '.' + (d.getMonth() + 1),
                moodId: found ? found.moodId : null,
                score: found ? (Emotions.moods[found.moodId] || {}).score || 0 : 0
            });
        }
        return result;
    },

    renderBarChart: function(data) {
        var max = 5;
        var html = '<div class="bar-chart emotion-bars">';
        data.forEach(function(d) {
            var h = d.score ? Math.round((d.score / max) * 100) : 0;
            var color = d.moodId != null ? (Emotions.moods[d.moodId] || {}).color || '#ccc' : 'transparent';
            html += '<div class="bar-col" title="' + d.date + '"><div class="bar-fill" style="height:' + h + '%;background:' + color + ';"></div><span class="bar-label">' + d.label + '</span></div>';
        });
        html += '</div>';
        return html;
    },

    renderPie: function(moodsLog) {
        var counts = [0, 0, 0, 0, 0];
        moodsLog.forEach(function(m) {
            if (m.moodId >= 0 && m.moodId < 5) counts[m.moodId]++;
        });
        var total = counts.reduce(function(a, b) { return a + b; }, 0);
        if (!total) return '<div class="text-muted">Недостаточно данных</div>';
        var html = '<div class="mood-pie-legend">';
        this.moods.forEach(function(m, i) {
            var pct = Math.round((counts[i] / total) * 100);
            html += '<div class="mood-pie-row"><span class="mood-emoji">' + m.emoji + '</span> ' + m.label +
                '<span class="text-muted" style="margin-left:auto;">' + counts[i] + ' (' + pct + '%)</span></div>';
        });
        html += '</div>';
        return html;
    },

    getSupportMessage: function(moodsLog) {
        var recent = moodsLog.slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); }).slice(0, 5);
        if (!recent.length) return null;
        var avg = recent.reduce(function(s, m) {
            return s + ((Emotions.moods[m.moodId] || {}).score || 3);
        }, 0) / recent.length;
        var list = avg <= 2.2 ? this.supportBad : (avg >= 4 ? this.supportGood : this.supportNeutral);
        return list[Math.floor(Math.random() * list.length)];
    }
};
