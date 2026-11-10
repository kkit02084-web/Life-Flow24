// Life Flow - Fitness Module
window.Fitness = {
    currentCategory: 'все',
    init() {
        document.getElementById('addExerciseBtn').addEventListener('click', function() { Fitness.showForm(); });
    },
    render() {
        const body = Storage.get('bodyParams') || { weight: 70, height: 170, stepsGoal: 8000, waterGoal: 8, sleepGoal: 8, steps: 0, water: 0, sleep: 7 };
        const categories = ['все', 'растяжка', 'йога', 'кардио', 'танцы', 'силовые', 'домашние', 'расслабление'];
        let catHtml = '';
        categories.forEach(function(c) {
            const cls = Fitness.currentCategory === c ? 'btn-primary' : 'btn-secondary';
            catHtml += '<button class="btn btn-sm ' + cls + '" onclick="Fitness.filter(\'' + c + '\')">' + c.charAt(0).toUpperCase() + c.slice(1) + '</button>';
        });
        document.getElementById('fitnessCategories').innerHTML = catHtml;

        let statsHtml = '<div class="card mb-24" style="grid-column:1/-1;"><h3 class="mb-16">Параметры и активность</h3><div class="dashboard-grid">';
        statsHtml += '<div class="dashboard-card"><div class="card-icon">⚖️</div><h3>Вес</h3><div class="stat">' + (body.weight || '—') + ' кг</div><button class="btn btn-sm btn-secondary mt-8" onclick="Fitness.editBody()">Изменить</button></div>';
        statsHtml += '<div class="dashboard-card"><div class="card-icon">🚶</div><h3>Шаги</h3><div class="stat">' + (body.steps || 0) + '</div><div class="subtext">цель ' + (body.stepsGoal || 8000) + '</div>';
        statsHtml += '<div class="progress-bar"><div class="progress-fill" style="width:' + Math.min(100, ((body.steps||0)/(body.stepsGoal||8000))*100) + '%"></div></div>';
        statsHtml += '<button class="btn btn-sm btn-primary mt-8" onclick="Fitness.addSteps()">+ Шаги</button></div>';
        statsHtml += '<div class="dashboard-card"><div class="card-icon">💧</div><h3>Вода</h3><div class="stat">' + (body.water || 0) + '/' + (body.waterGoal || 8) + '</div>';
        statsHtml += '<div class="progress-bar"><div class="progress-fill" style="width:' + Math.min(100, ((body.water||0)/(body.waterGoal||8))*100) + '%"></div></div>';
        statsHtml += '<button class="btn btn-sm btn-primary mt-8" onclick="Fitness.addWater()">+ Стакан</button></div>';
        statsHtml += '<div class="dashboard-card"><div class="card-icon">😴</div><h3>Сон</h3><div class="stat">' + (body.sleep || 0) + ' ч</div><div class="subtext">цель ' + (body.sleepGoal || 8) + ' ч</div>';
        statsHtml += '<button class="btn btn-sm btn-secondary mt-8" onclick="Fitness.editSleep()">Изменить</button></div></div></div>';

        let exercises = Storage.getExercises();
        if (this.currentCategory !== 'все') {
            exercises = exercises.filter(function(e) { return e.category === Fitness.currentCategory; });
        }
        const list = document.getElementById('fitnessList');
        let exHtml = statsHtml;
        if (exercises.length === 0) {
            exHtml += '<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🧘</div><h3>Нет упражнений</h3></div>';
        } else {
            exercises.forEach(function(e) {
                exHtml += '<div class="card">' + (e.image
                    ? '<img src="' + (window.OfflineAssets ? OfflineAssets.resolve(e.image) : e.image) + '" alt="' + e.name + '" loading="lazy" style="width:100%;height:180px;object-fit:cover;border-radius:12px;margin-bottom:12px;display:block;">'
                    : '<div style="height:100px;background:var(--green-light);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:12px;">🏃</div>');
                exHtml += '<h3>' + e.name + '</h3><div class="text-muted" style="font-size:0.85rem;">' + e.category + ' · ' + e.duration + ' мин · ' + e.level + '</div>';
                exHtml += '<p style="font-size:0.9rem;margin-top:8px;">' + (e.description || '') + '</p>';
                exHtml += '<div class="text-muted" style="font-size:0.85rem;">Инвентарь: ' + (e.equipment || 'нет') + '</div>';
                exHtml += '<div class="flex gap-8 mt-12"><button class="btn btn-sm btn-primary" onclick="Fitness.showHowTo(\'' + e.id + '\')">Как выполнять</button>';
                exHtml += '<button class="btn btn-sm btn-secondary" onclick="Fitness.addToCalendar(\'' + e.id + '\')">В календарь</button></div></div>';
            });
        }
        list.innerHTML = exHtml;
    },
    filter(cat) {
        this.currentCategory = cat;
        this.render();
    },
    showHowTo(id) {
        const e = Storage.getExercises().find(function(x) { return x.id === id; });
        if (!e) return;
        const how = e.howto || e.description || 'Выполняйте упражнение медленно, следя за дыханием. Сделайте 2–3 подхода.';
        let html = '<div class="modal-header"><h2>' + e.name + '</h2><button class="modal-close" onclick="App.closeModal()">×</button></div>';
        if (e.image) html += '<img src="' + (window.OfflineAssets ? OfflineAssets.resolve(e.image) : e.image) + '" alt="' + e.name + '" style="width:100%;max-height:260px;object-fit:cover;border-radius:12px;margin-bottom:12px;display:block;">';
        html += '<div class="text-muted mb-16">' + e.category + ' · ' + e.duration + ' мин · ' + e.level + '</div>';
        html += '<h4>Как выполнять</h4><p style="white-space:pre-wrap;margin-top:8px;">' + how + '</p>';
        html += '<div class="mt-16 text-muted">Инвентарь: ' + (e.equipment || 'не требуется') + '</div>';
        html += '<div class="modal-footer"><button class="btn btn-secondary" onclick="App.closeModal()">Закрыть</button>';
        html += '<button class="btn btn-primary" onclick="Fitness.addToCalendar(\'' + e.id + '\');App.closeModal();">Добавить в календарь</button></div>';
        App.openModal(html);
    },
    addToCalendar(id) {
        const ex = Storage.getExercises().find(function(e) { return e.id === id; });
        if (!ex) return;
        const events = Storage.getEvents();
        events.push({ id: Storage.generateId(), title: ex.name, date: new Date().toISOString().slice(0, 10), start: '09:00', end: '', category: 'спорт', description: ex.description });
        Storage.saveEvents(events);
        App.showToast('Добавлено в календарь на сегодня');
    },
    editBody() {
        const body = Storage.get('bodyParams') || { weight: 70, height: 170 };
        let html = '<div class="modal-header"><h2>Параметры тела</h2><button class="modal-close" onclick="App.closeModal()">×</button></div>';
        html += '<div class="form-group"><label>Вес (кг)</label><input type="number" class="form-control" id="bodyWeight" value="' + (body.weight || 70) + '"></div>';
        html += '<div class="form-group"><label>Рост (см)</label><input type="number" class="form-control" id="bodyHeight" value="' + (body.height || 170) + '"></div>';
        html += '<div class="form-group"><label>Цель шагов</label><input type="number" class="form-control" id="bodyStepsGoal" value="' + (body.stepsGoal || 8000) + '"></div>';
        html += '<div class="form-group"><label>Цель воды (стаканы)</label><input type="number" class="form-control" id="bodyWaterGoal" value="' + (body.waterGoal || 8) + '"></div>';
        html += '<div class="modal-footer"><button class="btn btn-secondary" onclick="App.closeModal()">Отмена</button><button class="btn btn-primary" onclick="Fitness.saveBody()">Сохранить</button></div>';
        App.openModal(html);
    },
    saveBody() {
        const body = Storage.get('bodyParams') || {};
        body.weight = Number(document.getElementById('bodyWeight').value) || 70;
        body.height = Number(document.getElementById('bodyHeight').value) || 170;
        body.stepsGoal = Number(document.getElementById('bodyStepsGoal').value) || 8000;
        body.waterGoal = Number(document.getElementById('bodyWaterGoal').value) || 8;
        Storage.set('bodyParams', body);
        App.closeModal();
        this.render();
        App.showToast('Параметры сохранены');
    },
    addSteps() {
        const n = prompt('Сколько шагов добавить?', '1000');
        if (!n || isNaN(n)) return;
        const body = Storage.get('bodyParams') || {};
        body.steps = (body.steps || 0) + Number(n);
        Storage.set('bodyParams', body);
        this.render();
        if (App.currentSection === 'dashboard') App.renderDashboard();
        App.showToast('Шаги добавлены');
    },
    addWater() {
        const body = Storage.get('bodyParams') || {};
        body.water = (body.water || 0) + 1;
        Storage.set('bodyParams', body);
        this.render();
        if (App.currentSection === 'dashboard') App.renderDashboard();
        App.showToast('Стакан воды учтён');
    },
    editSleep() {
        const body = Storage.get('bodyParams') || {};
        const n = prompt('Часов сна:', body.sleep || 7);
        if (n === null || isNaN(n)) return;
        body.sleep = Number(n);
        Storage.set('bodyParams', body);
        this.render();
        App.showToast('Сон обновлён');
    },
    showForm() {
        const cats = ['растяжка', 'йога', 'кардио', 'танцы', 'силовые', 'домашние', 'расслабление'];
        let opts = '';
        cats.forEach(function(c) { opts += '<option value="' + c + '">' + c + '</option>'; });
        let html = '<div class="modal-header"><h2>Новое упражнение</h2><button class="modal-close" onclick="App.closeModal()">×</button></div>';
        html += '<div class="form-group"><label>Название</label><input class="form-control" id="exName"></div>';
        html += '<div class="form-group"><label>Категория</label><select class="form-control" id="exCat">' + opts + '</select></div>';
        html += '<div class="form-group"><label>Описание</label><textarea class="form-control" id="exDesc"></textarea></div>';
        html += '<div class="form-group"><label>Как выполнять</label><textarea class="form-control" id="exHowto" rows="4"></textarea></div>';
        html += '<div class="flex gap-12"><div class="form-group" style="flex:1;"><label>Длительность (мин)</label><input type="number" class="form-control" id="exDur" value="15"></div>';
        html += '<div class="form-group" style="flex:1;"><label>Уровень</label><select class="form-control" id="exLevel"><option>лёгкий</option><option>средний</option><option>сложный</option></select></div></div>';
        html += '<div class="form-group"><label>Инвентарь</label><input class="form-control" id="exEquip" value="нет"></div>';
        html += '<div class="modal-footer"><button class="btn btn-secondary" onclick="App.closeModal()">Отмена</button><button class="btn btn-primary" onclick="Fitness.save()">Сохранить</button></div>';
        App.openModal(html);
    },
    save() {
        const name = document.getElementById('exName').value.trim();
        if (!name) { App.showToast('Введите название', 'error'); return; }
        const exercises = Storage.getExercises();
        exercises.push({
            id: Storage.generateId(),
            name: name,
            category: document.getElementById('exCat').value,
            description: document.getElementById('exDesc').value,
            howto: document.getElementById('exHowto').value,
            duration: Number(document.getElementById('exDur').value) || 15,
            level: document.getElementById('exLevel').value,
            equipment: document.getElementById('exEquip').value,
            isUser: true
        });
        Storage.saveExercises(exercises);
        App.closeModal();
        this.render();
        App.showToast('Упражнение добавлено');
    }
};
