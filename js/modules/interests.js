// Life Flow - Interests Module
window.Interests = {
    // Фото увлечений: assets/images/interests/<id>.jpg (id — из hobbiesDB, например h9).
    // Чтобы добавить фото, положите файл и впишите id сюда.
    photos: ['h3', 'h8', 'h9', 'h10', 'h11', 'h13', 'h14', 'h16', 'h17'],
    photoFor: function(id) {
        // Admin override (uploaded image or URL)
        try {
            var o = Storage.get('hobbyOverrides', {});
            if (o && o[id] && o[id].image) return o[id].image;
        } catch (e) {}
        if (this.photos.indexOf(id) >= 0) {
            var p = 'assets/images/interests/' + id + '.jpg';
            return window.OfflineAssets ? OfflineAssets.resolve(p) : p;
        }
        return '';
    },

    // Merged list for UI: base DB + overrides (name/desc/image) + custom hobbies
    getHobbies: function() {
        var overrides = {};
        try { overrides = Storage.get('hobbyOverrides', {}) || {}; } catch (e) {}
        var list = this.hobbiesDB.map(function(h) {
            var o = overrides[h.id];
            if (o && o._hidden) return null;
            return o ? Object.assign({}, h, o) : h;
        }).filter(Boolean);
        Object.keys(overrides).forEach(function(id) {
            if (overrides[id] && overrides[id]._custom && !overrides[id]._hidden &&
                !list.some(function(h) { return h.id === id; })) {
                list.push(overrides[id]);
            }
        });
        return list;
    },

    allCategories: ['Искусство', 'Творчество', 'Технологии', 'Наука', 'Музыка', 'Животные', 'Природа', 'Кулинария', 'Спорт', 'Рукоделие', 'Изучение языков', 'Кино', 'Путешествия', 'Фотография'],

    hobbiesDB: [
        { id: 'h1', name: 'Акварельная живопись', categories: ['Искусство', 'Творчество'], desc: 'Мягкая техника рисования водой', needs: 'Краски, кисти, бумага', difficulty: 'лёгкий',
          learn: { video: 'Поиск: «акварель для начинающих» на YouTube', steps: ['Купите набор акварели и бумагу 200+ г/м²', 'Научитесь делать заливки и градиенты', 'Рисуйте простые пейзажи и цветы', 'Практикуйтесь 15–20 минут в день'], tips: 'Не бойтесь «ошибок» — акварель любит спонтанность.' } },
        { id: 'h2', name: 'Игра на гитаре', categories: ['Музыка'], desc: 'Акустическая или электрогитара', needs: 'Гитара, тюнер', difficulty: 'средний',
          learn: { video: 'JustinGuitar или «гитара с нуля»', steps: ['Изучите названия струн и ладов', 'Выучите 4–5 основных аккордов (Am, C, G, D, Em)', 'Тренируйте переходы между аккордами', 'Разучите простую песню'], tips: 'Занимайтесь по 15 минут каждый день — лучше, чем 2 часа раз в неделю.' } },
        { id: 'h3', name: 'Выращивание суккулентов', categories: ['Природа', 'Животные'], desc: 'Неприхотливые растения', needs: 'Горшки, грунт', difficulty: 'лёгкий',
          learn: { video: '«Суккуленты уход»', steps: ['Выберите солнечное место', 'Поливайте редко, когда земля полностью сухая', 'Используйте дренаж', 'Пересаживайте раз в 1–2 года'], tips: 'Перелив — главная причина гибели суккулентов.' } },
        { id: 'h4', name: 'Программирование на Python', categories: ['Технологии'], desc: 'Универсальный язык', needs: 'Компьютер', difficulty: 'средний',
          learn: { video: 'freeCodeCamp Python / «Python для начинающих»', steps: ['Установите Python и редактор (VS Code)', 'Изучите переменные, циклы, функции', 'Решайте задачи на Codewars или Stepik', 'Сделайте маленький проект (калькулятор, бот)'], tips: 'Пишите код руками, а не только смотрите уроки.' } },
        { id: 'h5', name: 'Выпечка хлеба', categories: ['Кулинария'], desc: 'Домашний хлеб на закваске или дрожжах', needs: 'Мука, дрожжи', difficulty: 'средний',
          learn: { video: '«Домашний хлеб рецепт»', steps: ['Начните с простого дрожжевого хлеба', 'Научитесь замешивать и выдерживать тесто', 'Освойте форму и выпечку', 'Попробуйте закваску'], tips: 'Терпение важнее идеального рецепта.' } },
        { id: 'h6', name: 'Каллиграфия', categories: ['Искусство', 'Рукоделие'], desc: 'Красивый почерк', needs: 'Перья или брашпен, бумага', difficulty: 'лёгкий',
          learn: { video: 'Modern calligraphy для начинающих', steps: ['Купите брашпен и маркеры', 'Тренируйте базовые штрихи', 'Соединяйте буквы в слова', 'Оформляйте цитаты и открытки'], tips: 'Держите руку расслабленной, пишите медленно.' } },
        { id: 'h7', name: 'Астрономия', categories: ['Наука', 'Природа'], desc: 'Наблюдение за звёздами', needs: 'Бинокль или приложение', difficulty: 'лёгкий',
          learn: { video: 'Stellarium / «Астрономия для начинающих»', steps: ['Скачайте приложение звёздного неба', 'Научитесь находить основные созвездия', 'Следите за фазами Луны', 'Сходите на астровечер или смотрите метеорные потоки'], tips: 'Даже без телескопа небо впечатляет.' } },
        { id: 'h8', name: 'Вязание', categories: ['Рукоделие', 'Творчество'], desc: 'Шарфы, шапки, игрушки', needs: 'Спицы, пряжа', difficulty: 'лёгкий',
          learn: { video: 'Вязание лицевыми и изнаночными', steps: ['Научитесь набирать петли', 'Освойте лицевую и изнаночную', 'Свяжите простой шарф', 'Попробуйте круговое вязание'], tips: 'Начинайте с толстой пряжи — так проще видеть петли.' } },
        { id: 'h9', name: 'Йога', categories: ['Спорт'], desc: 'Практика осознанности и тела', needs: 'Коврик', difficulty: 'лёгкий',
          learn: { video: 'Yoga with Adriene — для начинающих', steps: ['Купите или найдите коврик', 'Начните с 10–15 минут в день', 'Изучите базовые асаны и дыхание', 'Слушайте тело, не форсируйте'], tips: 'Регулярность важнее сложности поз.' } },
        { id: 'h10', name: 'Изучение испанского', categories: ['Изучение языков'], desc: 'Один из самых популярных языков', needs: 'Приложения, учебники', difficulty: 'средний',
          learn: { video: 'Dreaming Spanish / SpanishPod101', steps: ['Duolingo или Anki для слов', 'Смотрите сериалы с субтитрами', 'Практикуйте говорение вслух', 'Найдите языкового партнёра'], tips: 'Погружение (сериалы, музыка) ускоряет прогресс.' } },
        { id: 'h11', name: 'Фотография', categories: ['Искусство', 'Творчество', 'Фотография'], desc: 'Съёмка на телефон или камеру', needs: 'Смартфон или камера', difficulty: 'лёгкий',
          learn: { video: 'Композиция в фотографии', steps: ['Изучите правило третей', 'Снимайте при хорошем свете', 'Экспериментируйте с ракурсами', 'Обрабатывайте в бесплатных приложениях'], tips: 'Лучшая камера — та, что с собой. Снимайте каждый день.' } },
        { id: 'h12', name: 'Шахматы', categories: ['Наука'], desc: 'Стратегическая игра', needs: 'Доска или приложение', difficulty: 'средний',
          learn: { video: 'GothamChess / «Шахматы для начинающих»', steps: ['Выучите ходы фигур', 'Изучите базовые дебюты и мат в 1–2 хода', 'Играйте онлайн (Lichess, Chess.com)', 'Разбирайте свои партии'], tips: 'Играйте медленно и думайте, зачем ходите.' } },
        { id: 'h13', name: 'Скетчинг', categories: ['Искусство', 'Творчество'], desc: 'Быстрые зарисовки от руки', needs: 'Блокнот, карандаш', difficulty: 'лёгкий',
          learn: { video: 'Sketching for beginners', steps: ['Рисуйте простые предметы дома', 'Тренируйте линии и штриховку', 'Делайте скетчи на прогулке', 'Не стирайте — рисуйте поверх'], tips: 'Скетчбук — для практики, не для шедевров.' } },
        { id: 'h14', name: 'Комнатная оранжерея', categories: ['Природа'], desc: 'Домашний сад на подоконнике', needs: 'Горшки, растения, свет', difficulty: 'лёгкий',
          learn: { video: 'Комнатные растения для начинающих', steps: ['Выберите неприхотливые растения', 'Изучите полив и свет для каждого', 'Группируйте по потребностям', 'Ведите дневник ухода'], tips: 'Начните с 2–3 растений, не покупайте сразу много.' } },
        { id: 'h15', name: 'Писательство', categories: ['Творчество'], desc: 'Рассказы, дневник, стихи', needs: 'Блокнот или компьютер', difficulty: 'лёгкий',
          learn: { video: 'Как начать писать', steps: ['Пишите каждый день хотя бы 10 минут', 'Ведите дневник или morning pages', 'Читайте много и анализируйте стиль', 'Делитесь текстами с друзьями'], tips: 'Пишите плохо — но пишите. Редактировать можно потом.' } },
        { id: 'h16', name: 'Настольные игры', categories: ['Творчество'], desc: 'Стратегии и вечеринки с друзьями', needs: 'Игры или онлайн', difficulty: 'лёгкий',
          learn: { video: 'Обзоры настольных игр', steps: ['Начните с простых (Cardinality, Ticket to Ride)', 'Соберите компанию', 'Изучите правила заранее', 'Попробуйте кооперативные игры'], tips: 'Главное — общение, а не победа.' } },
        { id: 'h17', name: 'Медитация', categories: ['Спорт'], desc: 'Практика осознанности', needs: 'Тихое место', difficulty: 'лёгкий',
          learn: { video: 'Headspace / «Медитация для начинающих»', steps: ['Сядьте удобно 5 минут', 'Следите за дыханием', 'Когда ум уносит — мягко возвращайтесь', 'Увеличивайте время постепенно'], tips: 'Не нужно «очищать ум» — достаточно замечать мысли.' } },
        { id: 'h18', name: 'Кино и анализ фильмов', categories: ['Кино'], desc: 'Осознанный просмотр', needs: 'Доступ к фильмам', difficulty: 'лёгкий',
          learn: { video: 'Разборы фильмов на YouTube', steps: ['Смотрите осознанно, без телефона', 'Замечайте кадр, музыку, сюжет', 'Читайте рецензии после', 'Ведите список любимых'], tips: 'Пересматривайте хорошие фильмы — каждый раз видите новое.' } }
    ],

    init: function() {},

    render: function() {
        var selected = Storage.getInterests();
        var statuses = Storage.getHobbyStatuses();

        var sel = document.getElementById('interestsSelector');
        if (sel) {
            sel.innerHTML = this.allCategories.map(function(c) {
                return '<label class="checkbox-wrapper" style="background:var(--bg-card);padding:8px 14px;border-radius:20px;border:1px solid var(--border);"><input type="checkbox" data-interest="' + c + '" ' + (selected.indexOf(c) >= 0 ? 'checked' : '') + '> <span>' + c + '</span></label>';
            }).join('');
            sel.onclick = function(e) {
                var cb = e.target.closest('input[data-interest]');
                if (cb) Interests.toggleInterest(cb.getAttribute('data-interest'), cb.checked);
            };
        }

        var recs = this.getHobbies().filter(function(h) {
            if (statuses[h.id] === 'не интересно') return false;
            if (selected.length === 0) return true;
            return h.categories.some(function(c) { return selected.indexOf(c) >= 0; });
        });
        // shuffle lightly
        recs = recs.sort(function() { return Math.random() - 0.5; }).slice(0, 12);

        var list = document.getElementById('recommendationsList');
        if (!list) return;
        if (recs.length === 0) {
            list.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="icon">✨</div><h3>Выберите интересы</h3></div>';
            return;
        }

        list.innerHTML = recs.map(function(h) {
            var st = statuses[h.id] || '';
            return '<div class="card">' +
                (Interests.photoFor(h.id)
                    ? '<img src="' + Interests.photoFor(h.id) + '" alt="' + h.name + '" loading="lazy" style="width:100%;height:160px;object-fit:cover;border-radius:12px;margin-bottom:12px;display:block;">'
                    : '<div style="height:90px;background:var(--green-light);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:12px;">✨</div>') +
                '<h3>' + h.name + '</h3>' +
                '<p style="font-size:0.9rem;">' + h.desc + '</p>' +
                '<div class="text-muted" style="font-size:0.85rem;">Нужно: ' + h.needs + ' · ' + h.difficulty + '</div>' +
                '<div class="flex gap-8 mt-12 flex-wrap">' +
                '<button class="btn btn-sm btn-primary" data-learn="' + h.id + '">Интересно</button>' +
                '<button class="btn btn-sm ' + (st === 'хочу попробовать' ? 'btn-primary' : 'btn-secondary') + '" data-status="' + h.id + '|хочу попробовать">Хочу</button>' +
                '<button class="btn btn-sm ' + (st === 'изучаю' ? 'btn-primary' : 'btn-secondary') + '" data-status="' + h.id + '|изучаю">Изучаю</button>' +
                '<button class="btn btn-sm ' + (st === 'освоено' ? 'btn-primary' : 'btn-secondary') + '" data-status="' + h.id + '|освоено">Освоено</button>' +
                '<button class="btn btn-sm btn-outline" data-status="' + h.id + '|не интересно">Не интересно</button>' +
                '</div></div>';
        }).join('');

        list.onclick = function(e) {
            var learn = e.target.closest('[data-learn]');
            if (learn) { Interests.openLearn(learn.getAttribute('data-learn')); return; }
            var st = e.target.closest('[data-status]');
            if (st) {
                var parts = st.getAttribute('data-status').split('|');
                Interests.setStatus(parts[0], parts[1]);
            }
        };
    },

    toggleInterest: function(cat, checked) {
        var selected = Storage.getInterests();
        if (checked) {
            if (selected.indexOf(cat) < 0) selected.push(cat);
        } else {
            selected = selected.filter(function(c) { return c !== cat; });
        }
        Storage.saveInterests(selected);
        this.render();
    },

    setStatus: function(id, status) {
        var statuses = Storage.getHobbyStatuses();
        statuses[id] = status;
        Storage.saveHobbyStatuses(statuses);
        this.render();
        App.showToast('Статус обновлён');
    },

    openLearn: function(id) {
        var h = this.getHobbies().find(function(x) { return x.id === id; });
        if (!h || !h.learn) {
            App.showToast('Материалы скоро появятся', 'error');
            return;
        }
        var L = h.learn;
        var stepsHtml = (L.steps || []).map(function(s, i) {
            return '<div class="learn-block"><h4>Шаг ' + (i + 1) + '</h4><p>' + s + '</p></div>';
        }).join('');
        App.openModal(
            '<div class="modal-header"><h2>📚 ' + h.name + '</h2><button class="modal-close" id="learnClose">×</button></div>' +
            '<p style="margin-bottom:16px;">' + h.desc + '</p>' +
            '<div class="learn-block"><h4>🎬 Видео и курсы</h4><div class="video-placeholder">Рекомендуем: ' + (L.video || 'поиск по названию увлечения') + '<br><small>Откройте YouTube или образовательную платформу</small></div></div>' +
            '<div class="learn-block"><h4>📋 План обучения</h4></div>' +
            stepsHtml +
            '<div class="learn-block"><h4>💡 Совет</h4><p>' + (L.tips || '') + '</p></div>' +
            '<div class="learn-block"><h4>🛠 Что понадобится</h4><p>' + h.needs + '</p></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="learnClose2">Закрыть</button>' +
            '<button class="btn btn-primary" id="learnStart">Начать изучать</button></div>'
        );
        document.getElementById('learnClose').onclick = function() { App.closeModal(); };
        document.getElementById('learnClose2').onclick = function() { App.closeModal(); };
        document.getElementById('learnStart').onclick = function() {
            Interests.setStatus(id, 'изучаю');
            App.closeModal();
            App.showToast('Добавлено в «Изучаю»');
        };
    }
};
