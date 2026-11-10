// Life Flow - Habits Module
window.Habits = {
    init: function() {
        var btn = document.getElementById('addHabitBtn');
        if (btn) {
            btn.addEventListener('click', function() { Habits.showForm(); });
        }
    },
    render: function() {
        var list = document.getElementById('habitsList');
        if (!list) return;
        var habits = Storage.getHabits();
        var logs = Storage.getHabitLogs();
        var today = new Date().toISOString().slice(0, 10);

        var groups = {
            'полезные': habits.filter(function(h) { return (h.type || 'полезные') === 'полезные'; }),
            'приобретённые': habits.filter(function(h) { return h.type === 'приобретённые'; }),
            'на контроле': habits.filter(function(h) { return h.type === 'на контроле'; })
        };

        if (habits.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="icon">✅</div><h3>Нет привычек</h3><p>Создайте первую полезную привычку</p><button class="btn btn-primary mt-16" id="emptyAddHabit">+ Создать привычку</button></div>';
            var emptyBtn = document.getElementById('emptyAddHabit');
            if (emptyBtn) emptyBtn.onclick = function() { Habits.showForm(); };
            return;
        }

        var html = '';
        Object.keys(groups).forEach(function(gName) {
            var group = groups[gName];
            if (group.length === 0) return;
            html += '<h3 class="mb-16 mt-16">' + gName + ' (' + group.length + ')</h3>';
            group.forEach(function(h) {
                var key = h.id + '_' + today;
                var count = logs[key] || 0;
                var target = h.target || 1;
                var done = count >= target;
                var weekStats = Habits.getWeekStats(h.id);
                var totalDone = Object.keys(logs).filter(function(k) { return k.indexOf(h.id + '_') === 0 && logs[k] >= target; }).length;
                html += '<div class="card mb-16">';
                html += '<div class="flex-between"><div class="flex gap-12" style="align-items:center;"><span style="font-size:1.8rem;">' + (h.icon || '•') + '</span><div><h3 style="margin:0;">' + h.name + '</h3><div class="text-muted" style="font-size:0.9rem;">' + (h.description || '') + '</div></div></div>';
                html += '<div class="flex gap-8"><button class="btn btn-sm btn-secondary" data-edit-habit="' + h.id + '">✏️</button><button class="btn btn-sm btn-danger" data-del-habit="' + h.id + '">🗑</button></div></div>';
                html += '<div class="mt-16 flex gap-16 flex-wrap" style="align-items:center;"><label class="checkbox-wrapper"><input type="checkbox" data-toggle-habit="' + h.id + '" ' + (done ? 'checked' : '') + '><span>' + (done ? 'Выполнено' : 'Отметить') + '</span></label>';
                if (target > 1) html += '<span class="badge badge-green">' + count + '/' + target + '</span>';
                html += '<span class="text-muted">Всего: ' + totalDone + ' дн.</span><span class="text-muted">Неделя: ' + weekStats + '/7</span></div>';
                html += '<div class="progress-bar mt-12"><div class="progress-fill" style="width:' + Math.min(100, (count / target) * 100) + '%"></div></div></div>';
            });
        });
        list.innerHTML = html;

        list.onclick = function(e) {
            var edit = e.target.closest('[data-edit-habit]');
            if (edit) { Habits.showForm(edit.getAttribute('data-edit-habit')); return; }
            var del = e.target.closest('[data-del-habit]');
            if (del) { Habits.remove(del.getAttribute('data-del-habit')); return; }
            var tog = e.target.closest('[data-toggle-habit]');
            if (tog) { Habits.toggleHabit(tog.getAttribute('data-toggle-habit'), tog.checked); }
        };

        Habits.renderHabitsCalendar();
    },
    getWeekStats: function(habitId) {
        var logs = Storage.getHabitLogs();
        var habits = Storage.getHabits();
        var h = habits.find(function(x) { return x.id === habitId; });
        var target = h ? (h.target || 1) : 1;
        var count = 0;
        for (var i = 0; i < 7; i++) {
            var d = new Date();
            d.setDate(d.getDate() - i);
            var key = habitId + '_' + d.toISOString().slice(0, 10);
            if (logs[key] && logs[key] >= target) count++;
        }
        return count;
    },
    renderHabitsCalendar: function() {
        var container = document.getElementById('habitsCalendar');
        if (!container) return;
        var habits = Storage.getHabits();
        var logs = Storage.getHabitLogs();
        if (habits.length === 0) { container.innerHTML = ''; return; }
        var html = '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:0.85rem;"><tr><th style="padding:8px;text-align:left;">Привычка</th>';
        for (var i = 6; i >= 0; i--) {
            var d = new Date();
            d.setDate(d.getDate() - i);
            html += '<th style="padding:6px;text-align:center;">' + d.getDate() + '.' + (d.getMonth() + 1) + '</th>';
        }
        html += '</tr>';
        habits.forEach(function(h) {
            var target = h.target || 1;
            html += '<tr><td style="padding:8px;">' + (h.icon || '') + ' ' + h.name + '</td>';
            for (var j = 6; j >= 0; j--) {
                var d2 = new Date();
                d2.setDate(d2.getDate() - j);
                var key = h.id + '_' + d2.toISOString().slice(0, 10);
                var val = logs[key] || 0;
                var done = val >= target;
                var bg = 'var(--bg-primary)';
                if (done) bg = 'var(--green-main)';
                else if (val > 0) bg = 'var(--green-light)';
                html += '<td style="padding:6px;text-align:center;"><div style="width:24px;height:24px;border-radius:6px;background:' + bg + ';margin:0 auto;color:white;font-size:0.7rem;line-height:24px;">' + (done ? '✓' : (val > 0 ? val : '')) + '</div></td>';
            }
            html += '</tr>';
        });
        html += '</table></div>';
        container.innerHTML = html;
    },
    toggleHabit: function(id, checked) {
        var logs = Storage.getHabitLogs();
        var today = new Date().toISOString().slice(0, 10);
        var key = id + '_' + today;
        var habits = Storage.getHabits();
        var h = habits.find(function(x) { return x.id === id; });
        var target = h ? (h.target || 1) : 1;
        if (checked) logs[key] = target;
        else delete logs[key];
        Storage.saveHabitLogs(logs);
        if (App.currentSection === 'habits') Habits.render();
        if (App.currentSection === 'dashboard') App.renderDashboard();
        App.showToast(checked ? 'Привычка отмечена' : 'Отметка снята');
    },
    showForm: function(habitId) {
        habitId = habitId || null;
        var habits = Storage.getHabits();
        var h = habitId ? habits.find(function(x) { return x.id === habitId; }) : null;
        var days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        var daysHtml = days.map(function(d, i) {
            return '<label class="checkbox-wrapper"><input type="checkbox" class="habit-day" value="' + i + '" checked> ' + d + '</label>';
        }).join('');
        App.openModal(
            '<div class="modal-header"><h2>' + (h ? 'Редактировать привычку' : 'Новая привычка') + '</h2><button class="modal-close" id="modalCloseBtn">×</button></div>' +
            '<div class="form-group"><label>Название</label><input type="text" class="form-control" id="habitName" value="' + (h ? h.name : '') + '"></div>' +
            '<div class="form-group"><label>Описание</label><input type="text" class="form-control" id="habitDesc" value="' + (h ? (h.description || '') : '') + '"></div>' +
            '<div class="form-group"><label>Тип</label><select class="form-control" id="habitType">' +
            '<option value="полезные"' + (!h || !h.type || h.type === 'полезные' ? ' selected' : '') + '>Полезные</option>' +
            '<option value="приобретённые"' + (h && h.type === 'приобретённые' ? ' selected' : '') + '>Приобретённые</option>' +
            '<option value="на контроле"' + (h && h.type === 'на контроле' ? ' selected' : '') + '>На контроле</option></select></div>' +
            '<div class="flex gap-12"><div class="form-group" style="flex:1;"><label>Иконка</label><input type="text" class="form-control" id="habitIcon" value="' + (h ? (h.icon || '⭐') : '⭐') + '" maxlength="2"></div>' +
            '<div class="form-group" style="flex:1;"><label>Цвет</label><input type="color" class="form-control" id="habitColor" value="' + (h ? (h.color || '#647348') : '#647348') + '" style="height:42px;"></div></div>' +
            '<div class="form-group"><label>Дни недели</label><div class="flex gap-8 flex-wrap">' + daysHtml + '</div></div>' +
            '<div class="form-group"><label>Целевое количество в день</label><input type="number" class="form-control" id="habitTarget" value="' + (h ? (h.target || 1) : 1) + '" min="1"></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="modalCancelBtn">Отмена</button><button class="btn btn-primary" id="habitSaveBtn">Сохранить</button></div>'
        );
        document.getElementById('modalCloseBtn').onclick = function() { App.closeModal(); };
        document.getElementById('modalCancelBtn').onclick = function() { App.closeModal(); };
        document.getElementById('habitSaveBtn').onclick = function() { Habits.save(habitId); };
    },
    save: function(id) {
        var name = document.getElementById('habitName').value.trim();
        if (!name) { App.showToast('Введите название', 'error'); return; }
        var days = [];
        document.querySelectorAll('.habit-day:checked').forEach(function(el) { days.push(Number(el.value)); });
        var data = {
            id: id || Storage.generateId(),
            name: name,
            description: document.getElementById('habitDesc').value,
            type: document.getElementById('habitType').value,
            icon: document.getElementById('habitIcon').value || '⭐',
            color: document.getElementById('habitColor').value,
            frequency: 'daily',
            days: days,
            target: Number(document.getElementById('habitTarget').value) || 1,
            created: id ? ((Storage.getHabits().find(function(h) { return h.id === id; }) || {}).created) : new Date().toISOString()
        };
        var habits = Storage.getHabits();
        if (id) {
            var idx = habits.findIndex(function(h) { return h.id === id; });
            if (idx >= 0) habits[idx] = data;
        } else {
            habits.push(data);
        }
        Storage.saveHabits(habits);
        App.closeModal();
        Habits.render();
        App.showToast(id ? 'Привычка обновлена' : 'Привычка создана');
    },
    remove: function(id) {
        if (!App.confirm('Удалить привычку?')) return;
        var habits = Storage.getHabits().filter(function(h) { return h.id !== id; });
        Storage.saveHabits(habits);
        var logs = Storage.getHabitLogs();
        Object.keys(logs).forEach(function(k) {
            if (k.indexOf(id + '_') === 0) delete logs[k];
        });
        Storage.saveHabitLogs(logs);
        Habits.render();
        App.showToast('Привычка удалена');
    }
};
