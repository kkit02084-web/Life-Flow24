// Life Flow - Day Planner Module

window.Planner = {
    currentDate: new Date().toISOString().slice(0, 10),

    init() {
        const dateInput = document.getElementById('plannerDate');
        dateInput.value = this.currentDate;
        dateInput.addEventListener('change', () => {
            this.currentDate = dateInput.value;
            this.render();
        });
        document.getElementById('plannerToday').addEventListener('click', () => {
            this.currentDate = new Date().toISOString().slice(0, 10);
            dateInput.value = this.currentDate;
            this.render();
        });
        document.getElementById('addPlanItemBtn').addEventListener('click', () => this.showForm());
        document.getElementById('applyTemplateBtn').addEventListener('click', () => this.showTemplates());
    },

    render() {
        const plans = Storage.getDayPlans();
        const dayPlan = plans[this.currentDate] || [];
        const sorted = [...dayPlan].sort((a, b) => (a.start || '').localeCompare(b.start || ''));

        const container = document.getElementById('plannerTimeline');
        if (sorted.length === 0) {
            container.innerHTML = `<div class="empty-state">
                <div class="icon">⏰</div>
                <h3>Расписание пусто</h3>
                <p>Добавьте занятия или примените шаблон</p>
            </div>`;
            return;
        }

        // Visual timeline
        let html = '<div style="position:relative;padding-left:60px;">';
        sorted.forEach(item => {
            html += `
            <div class="list-item" style="margin-bottom:12px;position:relative;">
                <div style="position:absolute;left:-60px;width:50px;text-align:right;font-size:0.85rem;color:var(--text-muted);">${item.start || ''}</div>
                <div style="width:8px;height:100%;min-height:40px;background:var(--green-main);border-radius:4px;position:absolute;left:-12px;"></div>
                <div>
                    <strong>${item.title}</strong>
                    <div class="text-muted" style="font-size:0.85rem;">${item.start || ''} – ${item.end || ''} · ${item.category || ''}</div>
                    ${item.description ? `<div style="font-size:0.9rem;">${item.description}</div>` : ''}
                </div>
                <div class="actions">
                    <button class="btn btn-sm btn-secondary" onclick="Planner.showForm('${item.id}')">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="Planner.remove('${item.id}')">🗑</button>
                </div>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    },

    showForm(itemId = null) {
        const plans = Storage.getDayPlans();
        const dayPlan = plans[this.currentDate] || [];
        const item = itemId ? dayPlan.find(i => i.id === itemId) : null;
        const cats = ['работа', 'учёба', 'отдых', 'спорт', 'личные дела', 'встречи', 'другое'];

        App.openModal(`
            <div class="modal-header"><h2>${item ? 'Редактировать' : 'Новое занятие'}</h2><button class="modal-close" onclick="App.closeModal()">×</button></div>
            <div class="form-group"><label>Название</label><input class="form-control" id="planTitle" value="${item ? item.title : ''}"></div>
            <div class="flex gap-12">
                <div class="form-group" style="flex:1;"><label>Начало</label><input type="time" class="form-control" id="planStart" value="${item ? item.start || '' : ''}"></div>
                <div class="form-group" style="flex:1;"><label>Окончание</label><input type="time" class="form-control" id="planEnd" value="${item ? item.end || '' : ''}"></div>
            </div>
            <div class="form-group"><label>Категория</label>
                <select class="form-control" id="planCat">${cats.map(c => `<option value="${c}" ${item && item.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label>Описание</label><textarea class="form-control" id="planDesc">${item ? item.description || '' : ''}</textarea></div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="App.closeModal()">Отмена</button>
                <button class="btn btn-primary" onclick="Planner.save('${itemId || ''}')">Сохранить</button>
            </div>
        `);
    },

    save(itemId) {
        const title = document.getElementById('planTitle').value.trim();
        if (!title) { App.showToast('Введите название', 'error'); return; }
        const plans = Storage.getDayPlans();
        if (!plans[this.currentDate]) plans[this.currentDate] = [];

        const data = {
            id: itemId || Storage.generateId(),
            title,
            start: document.getElementById('planStart').value,
            end: document.getElementById('planEnd').value,
            category: document.getElementById('planCat').value,
            description: document.getElementById('planDesc').value
        };

        if (itemId) {
            const idx = plans[this.currentDate].findIndex(i => i.id === itemId);
            if (idx >= 0) plans[this.currentDate][idx] = data;
        } else {
            plans[this.currentDate].push(data);
        }
        Storage.saveDayPlans(plans);

        // Also add to calendar events
        const events = Storage.getEvents();
        const existing = events.find(e => e.planId === data.id);
        if (existing) {
            existing.title = data.title;
            existing.start = data.start;
            existing.end = data.end;
            existing.category = data.category;
        } else {
            events.push({
                id: Storage.generateId(),
                planId: data.id,
                title: data.title,
                date: this.currentDate,
                start: data.start,
                end: data.end,
                category: data.category,
                description: data.description
            });
        }
        Storage.saveEvents(events);

        App.closeModal();
        this.render();
        App.showToast('Сохранено');
    },

    remove(id) {
        if (!App.confirm('Удалить занятие?')) return;
        const plans = Storage.getDayPlans();
        if (plans[this.currentDate]) {
            plans[this.currentDate] = plans[this.currentDate].filter(i => i.id !== id);
            Storage.saveDayPlans(plans);
        }
        // Remove from events
        Storage.saveEvents(Storage.getEvents().filter(e => e.planId !== id));
        this.render();
        App.showToast('Удалено');
    },

    showTemplates() {
        App.openModal(`
            <div class="modal-header"><h2>Шаблоны дня</h2><button class="modal-close" onclick="App.closeModal()">×</button></div>
            <div class="flex gap-12 flex-wrap">
                <button class="btn btn-secondary" onclick="Planner.applyTemplate('work')">Рабочий день</button>
                <button class="btn btn-secondary" onclick="Planner.applyTemplate('weekend')">Выходной</button>
                <button class="btn btn-secondary" onclick="Planner.applyTemplate('study')">Учебный день</button>
                <button class="btn btn-secondary" onclick="Planner.applyTemplate('free')">Свободный день</button>
            </div>
        `);
    },

    applyTemplate(type) {
        const templates = {
            work: [
                { title: 'Утро / Зарядка', start: '07:00', end: '07:30', category: 'спорт' },
                { title: 'Работа', start: '09:00', end: '13:00', category: 'работа' },
                { title: 'Обед', start: '13:00', end: '14:00', category: 'отдых' },
                { title: 'Работа', start: '14:00', end: '18:00', category: 'работа' },
                { title: 'Свободное время', start: '19:00', end: '21:00', category: 'отдых' }
            ],
            weekend: [
                { title: 'Завтрак', start: '09:00', end: '10:00', category: 'отдых' },
                { title: 'Прогулка', start: '11:00', end: '13:00', category: 'спорт' },
                { title: 'Хобби', start: '15:00', end: '17:00', category: 'личные дела' },
                { title: 'Вечерний отдых', start: '19:00', end: '22:00', category: 'отдых' }
            ],
            study: [
                { title: 'Учёба', start: '09:00', end: '12:00', category: 'учёба' },
                { title: 'Перерыв', start: '12:00', end: '13:00', category: 'отдых' },
                { title: 'Учёба', start: '13:00', end: '16:00', category: 'учёба' },
                { title: 'Повторение', start: '17:00', end: '18:00', category: 'учёба' }
            ],
            free: [
                { title: 'Свободное утро', start: '10:00', end: '12:00', category: 'отдых' },
                { title: 'Активность', start: '14:00', end: '16:00', category: 'спорт' },
                { title: 'Вечер', start: '18:00', end: '21:00', category: 'личные дела' }
            ]
        };

        const plans = Storage.getDayPlans();
        plans[this.currentDate] = (templates[type] || []).map(t => ({
            ...t,
            id: Storage.generateId(),
            description: ''
        }));
        Storage.saveDayPlans(plans);
        App.closeModal();
        this.render();
        App.showToast('Шаблон применён');
    }
};
