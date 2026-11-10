// Life Flow - Calendar Module (clear & mobile-friendly)
window.Calendar = {
    currentDate: new Date(),
    view: 'month',
    selectedDate: null,
    categories: {
        'работа': '#7A9B6D',
        'учёба': '#5B7A8C',
        'отдых': '#8BA86B',
        'спорт': '#C45C5C',
        'личные дела': '#8B6F47',
        'встречи': '#6B5B95',
        'другое': '#888888'
    },

    init: function() {
        var prev = document.getElementById('calPrev');
        var next = document.getElementById('calNext');
        var add = document.getElementById('addEventBtn');
        if (prev) prev.addEventListener('click', function() { Calendar.navigate(-1); });
        if (next) next.addEventListener('click', function() { Calendar.navigate(1); });
        if (add) add.addEventListener('click', function() { Calendar.showEventForm(); });
        document.querySelectorAll('.cal-view-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.cal-view-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                Calendar.view = btn.getAttribute('data-view') || 'month';
                Calendar.render();
            });
        });
        this.selectedDate = new Date().toISOString().slice(0, 10);
    },

    navigate: function(dir) {
        if (this.view === 'month') this.currentDate.setMonth(this.currentDate.getMonth() + dir);
        else if (this.view === 'week') this.currentDate.setDate(this.currentDate.getDate() + dir * 7);
        else this.currentDate.setDate(this.currentDate.getDate() + dir);
        this.render();
    },

    render: function() {
        var title = document.getElementById('calTitle');
        var container = document.getElementById('calendarContainer');
        if (!container) return;
        var d = this.currentDate;
        if (this.view === 'month') {
            if (title) title.textContent = d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
            container.innerHTML = this.renderMonth();
        } else if (this.view === 'week') {
            if (title) title.textContent = 'Неделя: ' + this.getWeekRange();
            container.innerHTML = this.renderWeek();
        } else {
            if (title) title.textContent = d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
            container.innerHTML = this.renderDay();
        }
        this.bindCalendarClicks(container);
    },

    bindCalendarClicks: function(container) {
        container.onclick = function(e) {
            var day = e.target.closest('[data-date]');
            if (day) {
                Calendar.selectedDate = day.getAttribute('data-date');
                Calendar.renderDayEvents(Calendar.selectedDate);
                // highlight
                container.querySelectorAll('.cal-day').forEach(function(el) { el.classList.remove('selected'); });
                day.classList.add('selected');
                return;
            }
            var edit = e.target.closest('[data-edit-event]');
            if (edit) { Calendar.showEventForm(edit.getAttribute('data-edit-event')); return; }
            var del = e.target.closest('[data-del-event]');
            if (del) { Calendar.removeEvent(del.getAttribute('data-del-event')); }
        };
    },

    getWeekRange: function() {
        var start = new Date(this.currentDate);
        var day = start.getDay();
        var diff = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diff);
        var end = new Date(start);
        end.setDate(end.getDate() + 6);
        return start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ' – ' + end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    },

    getEventsForDate: function(dateStr) {
        return Storage.getEvents().filter(function(e) { return e.date === dateStr; })
            .sort(function(a, b) { return (a.start || '').localeCompare(b.start || ''); });
    },

    renderMonth: function() {
        var year = this.currentDate.getFullYear();
        var month = this.currentDate.getMonth();
        var first = new Date(year, month, 1);
        var last = new Date(year, month + 1, 0);
        var startDay = first.getDay(); // 0 Sun
        // Monday-first
        var offset = startDay === 0 ? 6 : startDay - 1;
        var today = new Date().toISOString().slice(0, 10);
        var weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

        var html = '<div class="cal-month">';
        html += '<div class="cal-weekdays">';
        weekDays.forEach(function(w) { html += '<div class="cal-weekday">' + w + '</div>'; });
        html += '</div><div class="cal-days">';

        // empty cells
        for (var i = 0; i < offset; i++) {
            html += '<div class="cal-day empty"></div>';
        }

        for (var day = 1; day <= last.getDate(); day++) {
            var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
            var events = this.getEventsForDate(dateStr);
            var isToday = dateStr === today;
            var isSelected = dateStr === this.selectedDate;
            var cls = 'cal-day';
            if (isToday) cls += ' today';
            if (isSelected) cls += ' selected';
            if (events.length) cls += ' has-events';

            html += '<div class="' + cls + '" data-date="' + dateStr + '">';
            html += '<span class="cal-day-num">' + day + '</span>';
            if (events.length) {
                html += '<div class="cal-dots">';
                events.slice(0, 3).forEach(function(ev) {
                    var color = Calendar.categories[ev.category] || '#888';
                    html += '<span class="cal-dot" style="background:' + color + ';" title="' + ev.title + '"></span>';
                });
                if (events.length > 3) html += '<span class="cal-more">+' + (events.length - 3) + '</span>';
                html += '</div>';
            }
            html += '</div>';
        }
        html += '</div></div>';

        // Day events panel
        html += '<div class="cal-day-panel" id="calDayPanel">';
        html += this.buildDayPanel(this.selectedDate || today);
        html += '</div>';

        // Legend
        html += '<div class="cal-legend">';
        Object.keys(this.categories).forEach(function(cat) {
            html += '<span class="cal-legend-item"><span class="cal-dot" style="background:' + Calendar.categories[cat] + ';"></span> ' + cat + '</span>';
        });
        html += '</div>';

        return html;
    },

    buildDayPanel: function(dateStr) {
        if (!dateStr) dateStr = new Date().toISOString().slice(0, 10);
        var events = this.getEventsForDate(dateStr);
        var label = dateStr;
        try {
            label = new Date(dateStr + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
        } catch (e) {}
        var html = '<div class="flex-between mb-12 flex-wrap gap-8"><h3 style="margin:0;text-transform:capitalize;">' + label + '</h3>';
        html += '<button class="btn btn-sm btn-primary" onclick="Calendar.showEventForm(null,\'' + dateStr + '\')">+ Событие</button></div>';
        if (!events.length) {
            html += '<div class="text-muted" style="padding:12px 0;">Нет событий. Нажмите «+ Событие», чтобы добавить.</div>';
        } else {
            events.forEach(function(ev) {
                var color = Calendar.categories[ev.category] || '#888';
                html += '<div class="cal-event-card" style="border-left:4px solid ' + color + ';">';
                html += '<div class="flex-between"><div><strong>' + ev.title + '</strong>';
                html += '<div class="text-muted" style="font-size:0.85rem;">' + (ev.start || '') + (ev.end ? ' – ' + ev.end : '') + ' · ' + (ev.category || '') + '</div>';
                if (ev.description) html += '<div style="font-size:0.9rem;margin-top:4px;">' + ev.description + '</div>';
                html += '</div><div class="flex gap-8"><button class="btn btn-sm btn-secondary" data-edit-event="' + ev.id + '">✏️</button>';
                html += '<button class="btn btn-sm btn-danger" data-del-event="' + ev.id + '">🗑</button></div></div></div>';
            });
        }
        return html;
    },

    renderDayEvents: function(dateStr) {
        var panel = document.getElementById('calDayPanel');
        if (panel) panel.innerHTML = this.buildDayPanel(dateStr);
    },

    renderWeek: function() {
        var start = new Date(this.currentDate);
        var day = start.getDay();
        var diff = day === 0 ? -6 : 1 - day;
        start.setDate(start.getDate() + diff);
        var today = new Date().toISOString().slice(0, 10);
        var html = '<div class="cal-week">';
        for (var i = 0; i < 7; i++) {
            var d = new Date(start);
            d.setDate(start.getDate() + i);
            var dateStr = d.toISOString().slice(0, 10);
            var events = this.getEventsForDate(dateStr);
            var isToday = dateStr === today;
            html += '<div class="cal-week-day' + (isToday ? ' today' : '') + '" data-date="' + dateStr + '">';
            html += '<div class="cal-week-head">' + d.toLocaleDateString('ru-RU', { weekday: 'short' }) + ' <strong>' + d.getDate() + '</strong></div>';
            if (!events.length) html += '<div class="text-muted" style="font-size:0.8rem;padding:8px 0;">—</div>';
            events.forEach(function(ev) {
                var color = Calendar.categories[ev.category] || '#888';
                html += '<div class="cal-week-event" style="background:' + color + '22;border-left:3px solid ' + color + ';">' + (ev.start || '') + ' ' + ev.title + '</div>';
            });
            html += '</div>';
        }
        html += '</div>';
        html += '<div class="cal-day-panel" id="calDayPanel">' + this.buildDayPanel(this.selectedDate || today) + '</div>';
        return html;
    },

    renderDay: function() {
        var dateStr = this.currentDate.toISOString().slice(0, 10);
        this.selectedDate = dateStr;
        return '<div class="cal-day-panel" id="calDayPanel">' + this.buildDayPanel(dateStr) + '</div>';
    },

    showEventForm: function(eventId, presetDate) {
        eventId = eventId || null;
        var events = Storage.getEvents();
        var ev = eventId ? events.find(function(e) { return e.id === eventId; }) : null;
        var dateVal = (ev && ev.date) || presetDate || this.selectedDate || new Date().toISOString().slice(0, 10);
        var catOptions = Object.keys(this.categories).map(function(c) {
            return '<option value="' + c + '"' + (ev && ev.category === c ? ' selected' : '') + '>' + c + '</option>';
        }).join('');
        App.openModal(
            '<div class="modal-header"><h2>' + (ev ? 'Редактировать событие' : 'Новое событие') + '</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Название</label><input class="form-control" id="evTitle" value="' + (ev ? ev.title : '') + '"></div>' +
            '<div class="form-group"><label>Дата</label><input type="date" class="form-control" id="evDate" value="' + dateVal + '"></div>' +
            '<div class="flex gap-12"><div class="form-group" style="flex:1;"><label>Начало</label><input type="time" class="form-control" id="evStart" value="' + (ev ? (ev.start || '') : '10:00') + '"></div>' +
            '<div class="form-group" style="flex:1;"><label>Конец</label><input type="time" class="form-control" id="evEnd" value="' + (ev ? (ev.end || '') : '') + '"></div></div>' +
            '<div class="form-group"><label>Категория</label><select class="form-control" id="evCat">' + catOptions + '</select></div>' +
            '<div class="form-group"><label>Описание</label><textarea class="form-control" id="evDesc">' + (ev ? (ev.description || '') : '') + '</textarea></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="mSave">Сохранить</button></div>'
        );
        document.getElementById('mClose').onclick = function() { App.closeModal(); };
        document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('mSave').onclick = function() { Calendar.saveEvent(eventId); };
    },

    saveEvent: function(id) {
        var title = document.getElementById('evTitle').value.trim();
        if (!title) { App.showToast('Введите название', 'error'); return; }
        var data = {
            id: id || Storage.generateId(),
            title: title,
            date: document.getElementById('evDate').value,
            start: document.getElementById('evStart').value,
            end: document.getElementById('evEnd').value,
            category: document.getElementById('evCat').value,
            description: document.getElementById('evDesc').value
        };
        var events = Storage.getEvents();
        if (id) {
            var idx = events.findIndex(function(e) { return e.id === id; });
            if (idx >= 0) events[idx] = data;
        } else {
            events.push(data);
        }
        Storage.saveEvents(events);
        this.selectedDate = data.date;
        App.closeModal();
        this.render();
        App.showToast(id ? 'Событие обновлено' : 'Событие добавлено');
    },

    removeEvent: function(id) {
        if (!App.confirm('Удалить событие?')) return;
        Storage.saveEvents(Storage.getEvents().filter(function(e) { return e.id !== id; }));
        this.render();
        App.showToast('Событие удалено');
    }
};
