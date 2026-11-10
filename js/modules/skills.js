// Life Flow - Skills Tree Module
window.Skills = {
    currentDirection: null,

    init: function() {
        var btn = document.getElementById('addSkillDirectionBtn');
        if (btn) btn.addEventListener('click', function() { Skills.showDirectionForm(); });
    },

    getDefaultStages: function(name) {
        var n = (name || '').toLowerCase();
        var templates = {
            'программ': [
                { name: 'Основы и синтаксис', description: 'Переменные, типы данных, базовые конструкции' },
                { name: 'Практика: простые задачи', description: 'Решение задач и мини-проекты' },
                { name: 'Структуры данных', description: 'Массивы, объекты, списки' },
                { name: 'Работа с DOM / API', description: 'Интерактивность и внешние данные' },
                { name: 'Свой проект', description: 'Полноценное приложение' }
            ],
            'язык': [
                { name: 'Алфавит и произношение', description: 'Звуки, буквы, базовая фонетика' },
                { name: 'Базовая лексика', description: '500–1000 самых частых слов' },
                { name: 'Грамматика: настоящее время', description: 'Основные конструкции' },
                { name: 'Разговорная практика', description: 'Диалоги и аудирование' },
                { name: 'Чтение и письмо', description: 'Тексты и короткие сочинения' }
            ],
            'рис': [
                { name: 'Линия и форма', description: 'Штрих, пропорции, простые объекты' },
                { name: 'Свет и тень', description: 'Объём, светотень' },
                { name: 'Композиция', description: 'Рамка, баланс, фокус' },
                { name: 'Цвет', description: 'Палитра, смешивание' },
                { name: 'Свой стиль', description: 'Серия работ в любимой технике' }
            ],
            'музык': [
                { name: 'Основы инструмента', description: 'Посадка, звукоизвлечение' },
                { name: 'Ноты и ритм', description: 'Чтение нот, простой ритм' },
                { name: 'Аккорды / гаммы', description: 'Базовые последовательности' },
                { name: 'Простые мелодии', description: 'Разучивание песен' },
                { name: 'Импровизация', description: 'Свободная игра' }
            ],
            'спорт': [
                { name: 'Разминка и техника', description: 'Безопасность и базовые движения' },
                { name: 'Регулярность', description: '2–3 занятия в неделю' },
                { name: 'Нагрузка', description: 'Увеличение интенсивности' },
                { name: 'Выносливость', description: 'Длинные сессии' },
                { name: 'Свой план', description: 'Персональная программа' }
            ],
            'кулин': [
                { name: 'Базовые техники', description: 'Нарезка, варка, жарка' },
                { name: 'Простые рецепты', description: 'Завтраки и гарниры' },
                { name: 'Основные блюда', description: 'Супы, вторые' },
                { name: 'Выпечка', description: 'Тесто и десерты' },
                { name: 'Свои рецепты', description: 'Эксперименты' }
            ],
            'дизайн': [
                { name: 'Основы композиции', description: 'Баланс, контраст, иерархия' },
                { name: 'Цвет и типографика', description: 'Палитры и шрифты' },
                { name: 'Инструменты', description: 'Figma, Photoshop или аналоги' },
                { name: 'UI-компоненты', description: 'Кнопки, формы, карточки' },
                { name: 'Свой макет', description: 'Полноценный экран или сайт' }
            ]
        };
        var keys = Object.keys(templates);
        for (var i = 0; i < keys.length; i++) {
            if (n.indexOf(keys[i]) >= 0) return templates[keys[i]];
        }
        return [
            { name: 'Знакомство с основами', description: 'Теория и первые шаги' },
            { name: 'Базовые навыки', description: 'Практика простых упражнений' },
            { name: 'Углубление', description: 'Более сложные темы' },
            { name: 'Практика', description: 'Регулярные занятия' },
            { name: 'Свободное применение', description: 'Свои проекты и цели' }
        ];
    },

    render: function() {
        var directions = Storage.getSkills();
        var container = document.getElementById('skillsDirections');
        var treeView = document.getElementById('skillsTreeView');
        if (!container) return;

        if (this.currentDirection && directions[this.currentDirection]) {
            container.classList.add('hidden');
            if (treeView) treeView.classList.remove('hidden');
            this.renderTree(this.currentDirection);
            return;
        }

        container.classList.remove('hidden');
        if (treeView) treeView.classList.add('hidden');

        var keys = Object.keys(directions);
        if (keys.length === 0) {
            container.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="icon">📖</div><h3>Нет направлений</h3><p>Добавьте первое направление развития</p><button class="btn btn-primary mt-16" id="emptyAddDir">+ Добавить</button></div>';
            var b = document.getElementById('emptyAddDir');
            if (b) b.onclick = function() { Skills.showDirectionForm(); };
            return;
        }

        container.innerHTML = keys.map(function(key) {
            var dir = directions[key];
            var total = dir.nodes.length;
            var done = dir.nodes.filter(function(n) { return n.status === 'освоено'; }).length;
            var progress = total ? Math.round((done / total) * 100) : 0;
            return '<div class="dashboard-card" data-open-dir="' + key + '">' +
                '<div class="card-icon">🌿</div><h3>' + dir.name + '</h3>' +
                '<div class="stat">' + progress + '%</div><div class="subtext">' + done + ' из ' + total + ' этапов</div>' +
                '<div class="progress-bar"><div class="progress-fill" style="width:' + progress + '%"></div></div></div>';
        }).join('');

        container.onclick = function(e) {
            var card = e.target.closest('[data-open-dir]');
            if (card) Skills.openDirection(card.getAttribute('data-open-dir'));
        };
    },

    openDirection: function(key) {
        this.currentDirection = key;
        this.render();
    },

    renderTree: function(key) {
        var directions = Storage.getSkills();
        var dir = directions[key];
        var treeView = document.getElementById('skillsTreeView');
        if (!treeView || !dir) return;
        var nodes = dir.nodes.slice().sort(function(a, b) { return a.order - b.order; });

        var inProgress = nodes.filter(function(n) { return n.status === 'в процессе'; });
        var mastered = nodes.filter(function(n) { return n.status === 'освоено'; });
        var notStarted = nodes.filter(function(n) { return n.status !== 'освоено' && n.status !== 'в процессе'; });
        var active = nodes.filter(function(n) { return n.status !== 'освоено'; }); // not mastered yet

        var total = nodes.length || 1;
        var cDone = mastered.length;
        var cProg = inProgress.length;
        var cNew = notStarted.length;

        // pie 1: overall status
        var pie1 = this._statusPie([
            { label: 'Освоено', count: cDone, color: '#647348' },
            { label: 'В процессе', count: cProg, color: '#C4A35A' },
            { label: 'Не начато', count: cNew, color: '#D9DDB7' }
        ]);

        var chartsHtml = '<div class="card mb-16"><h3 class="mb-12">Диаграмма прогресса</h3><div style="display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start;justify-content:center;">';
        chartsHtml += '<div style="text-align:center;"><div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px;">Все этапы</div>' + pie1 + '</div>';

        // pie 2: among those still learning (what's more)
        if (active.length > 0) {
            var pie2 = this._statusPie([
                { label: 'В процессе', count: cProg, color: '#C4A35A' },
                { label: 'Не начато', count: cNew, color: '#A8B89A' }
            ]);
            chartsHtml += '<div style="text-align:center;"><div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px;">Что осваивают сейчас</div>' + pie2 + '</div>';
        }
        // pie 3: mastered vs still learning when there is mastery
        if (cDone > 0) {
            var pie3 = this._statusPie([
                { label: 'Уже освоено', count: cDone, color: '#647348' },
                { label: 'Ещё осваивают', count: active.length, color: '#8FBC8F' }
            ]);
            chartsHtml += '<div style="text-align:center;"><div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px;">Освоено и в работе</div>' + pie3 + '</div>';
        }
        chartsHtml += '</div></div>';

        function nodeCard(n, i) {
            var statusColor = n.status === 'освоено' ? 'var(--green-main)' : (n.status === 'в процессе' ? 'var(--beige)' : 'var(--bg-secondary)');
            var statusText = n.status === 'освоено' ? '✓ Освоено' : (n.status === 'в процессе' ? '● В процессе' : '○ Не начато');
            return '<div class="card mb-16" style="margin-left:' + (Math.min(i, 4) * 12) + 'px;border-left:4px solid ' + statusColor + ';">' +
                '<div class="flex-between flex-wrap gap-8"><div><h3 style="margin:0;">' + n.name + '</h3><div class="text-muted" style="font-size:0.9rem;">' + (n.description || '') + '</div>' +
                '<div class="mt-8"><span class="badge badge-green">' + statusText + '</span></div></div>' +
                '<div class="flex gap-8 flex-wrap"><select class="form-control" style="width:auto;" data-status-node="' + n.id + '">' +
                '<option value="не начато"' + (n.status === 'не начато' ? ' selected' : '') + '>Не начато</option>' +
                '<option value="в процессе"' + (n.status === 'в процессе' ? ' selected' : '') + '>В процессе</option>' +
                '<option value="освоено"' + (n.status === 'освоено' ? ' selected' : '') + '>Освоено</option></select>' +
                '<button class="btn btn-sm btn-secondary" data-edit-node="' + n.id + '">✏️</button>' +
                '<button class="btn btn-sm btn-danger" data-del-node="' + n.id + '">🗑</button></div></div></div>';
        }

        var html = '<div class="flex-between mb-16 flex-wrap gap-8"><button class="btn btn-secondary" id="skillsBack">← Назад</button><h2 style="margin:0;">' + dir.name + '</h2><button class="btn btn-primary btn-sm" id="addNodeBtn">+ Этап</button></div>';
        html += chartsHtml;

        // Active learning section
        html += '<h3 class="mb-12">Осваивают</h3>';
        var learning = active.slice().sort(function(a, b) {
            // in progress first
            if (a.status === 'в процессе' && b.status !== 'в процессе') return -1;
            if (b.status === 'в процессе' && a.status !== 'в процессе') return 1;
            return (a.order || 0) - (b.order || 0);
        });
        if (!learning.length) {
            html += '<div class="text-muted mb-16">Все этапы освоены — отличная работа!</div>';
        } else {
            learning.forEach(function(n, i) { html += nodeCard(n, i); });
        }

        // Mastered at bottom
        html += '<h3 class="mb-12 mt-16">Освоено</h3>';
        if (!mastered.length) {
            html += '<div class="text-muted mb-16">Пока нет освоенных этапов — отметьте статус «Освоено», когда будете готовы.</div>';
        } else {
            mastered.forEach(function(n, i) { html += nodeCard(n, i); });
        }

        treeView.innerHTML = html;

        document.getElementById('skillsBack').onclick = function() { Skills.currentDirection = null; Skills.render(); };
        document.getElementById('addNodeBtn').onclick = function() { Skills.showNodeForm(key); };
        treeView.onchange = function(e) {
            var sel = e.target.closest('[data-status-node]');
            if (sel) Skills.updateStatus(key, sel.getAttribute('data-status-node'), sel.value);
        };
        treeView.onclick = function(e) {
            var edit = e.target.closest('[data-edit-node]');
            if (edit) Skills.showNodeForm(key, edit.getAttribute('data-edit-node'));
            var del = e.target.closest('[data-del-node]');
            if (del) Skills.removeNode(key, del.getAttribute('data-del-node'));
        };
    },

    _statusPie: function(parts) {
        var total = parts.reduce(function(s, p) { return s + p.count; }, 0) || 1;
        var acc = 0;
        var grad = [];
        parts.forEach(function(p) {
            var pct = (p.count / total) * 100;
            grad.push(p.color + ' ' + acc + '% ' + (acc + pct) + '%');
            acc += pct;
        });
        if (acc < 100) grad.push('#eee ' + acc + '% 100%');
        var legend = parts.map(function(p) {
            var pct = Math.round((p.count / total) * 100);
            return '<div class="pie-legend-item" style="font-size:0.8rem;"><span class="pie-dot" style="background:' + p.color + ';"></span> ' + p.label + ' — ' + p.count + ' (' + pct + '%)</div>';
        }).join('');
        return '<div class="pie-chart" style="background:conic-gradient(' + grad.join(', ') + ');width:120px;height:120px;border-radius:50%;margin:0 auto 10px;"></div><div class="pie-legend" style="text-align:left;">' + legend + '</div>';
    },


    showDirectionForm: function() {
        App.openModal(
            '<div class="modal-header"><h2>Новое направление</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Название</label><input type="text" class="form-control" id="dirName" placeholder="Например: Веб-разработка, Испанский, Рисунок"></div>' +
            '<p class="text-muted" style="font-size:0.85rem;">Этапы обучения добавятся автоматически по названию.</p>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="mSave">Создать</button></div>'
        );
        document.getElementById('mClose').onclick = function() { App.closeModal(); };
        document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('mSave').onclick = function() { Skills.saveDirection(); };
    },

    saveDirection: function() {
        var name = document.getElementById('dirName').value.trim();
        if (!name) { App.showToast('Введите название', 'error'); return; }
        var key = name.toLowerCase().replace(/\s+/g, '-');
        var skillsData = Storage.getSkills();
        if (skillsData[key]) { App.showToast('Такое направление уже есть', 'error'); return; }
        var stages = Skills.getDefaultStages(name);
        skillsData[key] = {
            name: name,
            nodes: stages.map(function(s, i) {
                return {
                    id: Storage.generateId(),
                    name: s.name,
                    description: s.description,
                    status: 'не начато',
                    links: [],
                    tasks: [],
                    order: i + 1
                };
            })
        };
        Storage.saveSkills(skillsData);
        App.closeModal();
        this.render();
        App.showToast('Направление создано · ' + stages.length + ' этапов');
    },

    showNodeForm: function(dirKey, nodeId) {
        nodeId = nodeId || null;
        var skillsData = Storage.getSkills();
        var dir = skillsData[dirKey];
        var node = nodeId ? dir.nodes.find(function(n) { return n.id === nodeId; }) : null;
        App.openModal(
            '<div class="modal-header"><h2>' + (node ? 'Редактировать этап' : 'Новый этап') + '</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Название</label><input type="text" class="form-control" id="nodeName" value="' + (node ? node.name : '') + '"></div>' +
            '<div class="form-group"><label>Описание</label><textarea class="form-control" id="nodeDesc">' + (node ? (node.description || '') : '') + '</textarea></div>' +
            '<div class="form-group"><label>Ссылки (через запятую)</label><input type="text" class="form-control" id="nodeLinks" value="' + (node && node.links ? node.links.join(', ') : '') + '"></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="mSave">Сохранить</button></div>'
        );
        document.getElementById('mClose').onclick = function() { App.closeModal(); };
        document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('mSave').onclick = function() { Skills.saveNode(dirKey, nodeId); };
    },

    saveNode: function(dirKey, nodeId) {
        var name = document.getElementById('nodeName').value.trim();
        if (!name) { App.showToast('Введите название', 'error'); return; }
        var skillsData = Storage.getSkills();
        var dir = skillsData[dirKey];
        var links = document.getElementById('nodeLinks').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        if (nodeId) {
            var idx = dir.nodes.findIndex(function(n) { return n.id === nodeId; });
            if (idx >= 0) {
                dir.nodes[idx].name = name;
                dir.nodes[idx].description = document.getElementById('nodeDesc').value;
                dir.nodes[idx].links = links;
            }
        } else {
            dir.nodes.push({
                id: Storage.generateId(),
                name: name,
                description: document.getElementById('nodeDesc').value,
                status: 'не начато',
                links: links,
                tasks: [],
                order: dir.nodes.length + 1
            });
        }
        Storage.saveSkills(skillsData);
        App.closeModal();
        this.renderTree(dirKey);
        App.showToast('Этап сохранён');
    },

    updateStatus: function(dirKey, nodeId, status) {
        var skillsData = Storage.getSkills();
        var node = skillsData[dirKey].nodes.find(function(n) { return n.id === nodeId; });
        if (node) {
            node.status = status;
            if (status === 'в процессе' && !node.startDate) node.startDate = new Date().toISOString().slice(0, 10);
            if (status === 'освоено') node.endDate = new Date().toISOString().slice(0, 10);
            Storage.saveSkills(skillsData);
            this.renderTree(dirKey);
        }
    },

    removeNode: function(dirKey, nodeId) {
        if (!App.confirm('Удалить этап?')) return;
        var skillsData = Storage.getSkills();
        skillsData[dirKey].nodes = skillsData[dirKey].nodes.filter(function(n) { return n.id !== nodeId; });
        Storage.saveSkills(skillsData);
        this.renderTree(dirKey);
        App.showToast('Этап удалён');
    }
};
