// Life Flow - Storage Module
// Dual-write: memory + localStorage (compat) + IndexedDB (durable) + Cloud outbox
window.Storage = {
    PREFIX: 'lifeflow_',
    _mem: {},
    _remoteTs: {},
    _booted: false,

    async boot() {
        if (this._booted) return;
        try {
            if (window.LFIDB) {
                await LFIDB.open();
                // Migrate localStorage → IDB once
                var migrated = await LFIDB.metaGet('lsMigrated');
                if (!migrated) {
                    for (var i = 0; i < localStorage.length; i++) {
                        var k = localStorage.key(i);
                        if (k && k.indexOf(this.PREFIX) === 0) {
                            var short = k.slice(this.PREFIX.length);
                            try {
                                var val = JSON.parse(localStorage.getItem(k));
                                await LFIDB.set(short, val);
                                this._mem[short] = val;
                            } catch (e) {}
                        }
                    }
                    await LFIDB.metaSet('lsMigrated', true);
                }
                var all = await LFIDB.getAll();
                Object.keys(all).forEach(function (key) {
                    Storage._mem[key] = all[key];
                });
            }
        } catch (e) {
            console.warn('Storage.boot IDB', e);
        }
        // Also hydrate from localStorage for any missing keys
        try {
            for (var j = 0; j < localStorage.length; j++) {
                var lk = localStorage.key(j);
                if (lk && lk.indexOf(this.PREFIX) === 0) {
                    var sk = lk.slice(this.PREFIX.length);
                    if (!(sk in this._mem)) {
                        try { this._mem[sk] = JSON.parse(localStorage.getItem(lk)); } catch (e) {}
                    }
                }
            }
        } catch (e) {}
        this._booted = true;
    },

    get(key, defaultValue = null) {
        if (Object.prototype.hasOwnProperty.call(this._mem, key)) {
            return this._mem[key];
        }
        try {
            const item = localStorage.getItem(this.PREFIX + key);
            if (item) {
                const parsed = JSON.parse(item);
                this._mem[key] = parsed;
                return parsed;
            }
            return defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },
    set(key, value) {
        try {
            this._mem[key] = value;
            this._remoteTs[key] = Date.now();
            try {
                localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
            } catch (e) {
                // quota — still keep mem + idb
                console.warn('localStorage full, using IDB only', key);
            }
            if (window.LFIDB) {
                LFIDB.set(key, value).catch(function (err) {
                    console.error('IDB set', err);
                });
            }
            if (window.Cloud && Cloud.markDirty) {
                Cloud.markDirty(key, value);
            }
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    remove(key) {
        delete this._mem[key];
        localStorage.removeItem(this.PREFIX + key);
        if (window.LFIDB) LFIDB.remove(key).catch(function () {});
    },

    // Apply remote data without re-pushing to cloud (LWW by updated_at)
    _applyRemote(key, data, updatedAtIso) {
        var remoteMs = updatedAtIso ? Date.parse(updatedAtIso) : 0;
        var localMs = this._remoteTs[key] || 0;
        // if local has pending newer change, skip overwrite
        if (localMs && remoteMs && localMs > remoteMs + 500) return;
        this._mem[key] = data;
        this._remoteTs[key] = remoteMs || Date.now();
        try {
            localStorage.setItem(this.PREFIX + key, JSON.stringify(data));
        } catch (e) {}
        if (window.LFIDB) {
            LFIDB.set(key, data).catch(function () {});
        }
    },
    getSettings() {
        return this.get('settings', {
            userName: 'Пользователь',
            theme: 'light',
            accentColor: '#647348',
            weekStart: 1,
            timeFormat: '24',
            notifications: true
        });
    },
    saveSettings(settings) { return this.set('settings', settings); },
    getEvents() { return this.get('events', []); },
    saveEvents(events) { return this.set('events', events); },
    getHabits() { return this.get('habits', []); },
    saveHabits(habits) { return this.set('habits', habits); },
    getHabitLogs() { return this.get('habitLogs', {}); },
    saveHabitLogs(logs) { return this.set('habitLogs', logs); },
    getSkills() { return this.get('skills', {}); },
    saveSkills(skills) { return this.set('skills', skills); },
    getRecipes() { return this.get('recipes', []); },
    saveRecipes(recipes) { return this.set('recipes', recipes); },
    getMenu() { return this.get('menu', {}); },
    saveMenu(menu) { return this.set('menu', menu); },
    getShoppingList() { return this.get('shoppingList', []); },
    saveShoppingList(list) { return this.set('shoppingList', list); },
    getIncomes() { return this.get('incomes', []); },
    saveIncomes(incomes) { return this.set('incomes', incomes); },
    getExpenses() { return this.get('expenses', []); },
    saveExpenses(expenses) { return this.set('expenses', expenses); },
    getBudget() { return this.get('budget', { monthly: 50000, savings: 0 }); },
    saveBudget(budget) { return this.set('budget', budget); },
    getSavingsGoals() { return this.get('savingsGoals', []); },
    saveSavingsGoals(goals) { return this.set('savingsGoals', goals); },
    getExercises() { return this.get('exercises', []); },
    saveExercises(exercises) { return this.set('exercises', exercises); },
    getWorkouts() { return this.get('workouts', []); },
    saveWorkouts(workouts) { return this.set('workouts', workouts); },
    getFavorites() { return this.get('favorites', { exercises: [], hobbies: [], recipes: [] }); },
    saveFavorites(favs) { return this.set('favorites', favs); },
    getInterests() { return this.get('interests', []); },
    saveInterests(interests) { return this.set('interests', interests); },
    getHobbyStatuses() { return this.get('hobbyStatuses', {}); },
    saveHobbyStatuses(statuses) { return this.set('hobbyStatuses', statuses); },
    getDayPlans() { return this.get('dayPlans', {}); },
    saveDayPlans(plans) { return this.set('dayPlans', plans); },
    getTemplates() { return this.get('templates', {}); },
    saveTemplates(templates) { return this.set('templates', templates); },
    getNotes() { return this.get('notes', []); },
    saveNotes(notes) { return this.set('notes', notes); },
    getGoals() { return this.get('goals', []); },
    saveGoals(goals) { return this.set('goals', goals); },
    getQuickNotes() { return this.get('quickNotes', []); },
    saveQuickNotes(notes) { return this.set('quickNotes', notes); },
    exportAll() {
        const data = {};
        const keys = ['settings','events','habits','habitLogs','skills','recipes','menu','shoppingList','incomes','expenses','budget','savingsGoals','exercises','workouts','favorites','interests','hobbyStatuses','dayPlans','templates','notes','goals','quickNotes'];
        keys.forEach(key => { data[key] = this.get(key); });
        return data;
    },
    importAll(data) {
        if (!data || typeof data !== 'object') return false;
        Object.keys(data).forEach(key => { this.set(key, data[key]); });
        return true;
    },
    getMoods() { return this.get('moods', []); },
    saveMoods(moods) { return this.set('moods', moods); },
    getReminderSettings() {
        return this.get('reminderSettings', {
            enabled: false,
            habits: true,
            mood: true,
            water: true,
            habitsTime: '09:00',
            moodTime: '20:00',
            waterInterval: 2
        });
    },
    saveReminderSettings(s) { return this.set('reminderSettings', s); },
    getMyBooks() { return this.get('myBooks', []); },
    saveMyBooks(books) { return this.set('myBooks', books); },
    getUserBooks() { return this.get('userBooks', []); },
    saveUserBooks(books) { return this.set('userBooks', books); },
    getReaderSettings() {
        return this.get('readerSettings', {
            fontSize: 18,
            fontFamily: 'serif',
            lineHeight: 1.7,
            maxWidth: 720,
            theme: 'paper',
            bg: '#F7F0E3',
            color: '#2C2A26'
        });
    },
    saveReaderSettings(s) { return this.set('readerSettings', s); },
    getBookTexts() { return this.get('bookTexts', {}); },
    saveBookTexts(t) { return this.set('bookTexts', t); },
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
};

// Фото блюд (assets/images/recipes). Подставляются в стандартные рецепты по названию,
// недостающие рецепты добавляются. Работает и для уже сохранённых данных (без потери своих рецептов).
const RECIPE_PHOTOS = {
    'Какао': 'kakao', 'Смузи банановый': 'smuzi', 'Блины': 'bliny', 'Салат Цезарь': 'cezar',
    'Творожная запеканка': 'zapekanka', 'Запечённая рыба': 'ryba', 'Рис с курицей': 'ris-kurica',
    'Паста с томатным соусом': 'pasta', 'Суп куриный с лапшой': 'sup', 'Тост с авокадо': 'avokado-tost',
    'Греческий йогурт с гранолой': 'jogurt', 'Омлет с овощами': 'omlet', 'Сырники': 'syrniki',
    'Овсянка с ягодами': 'ovsyanka', 'Куриный салат': 'kurinyj-salat', 'Гречка с овощами': 'grechka-ovoshchi',
    'Тыквенный суп': 'tykvennyj-sup', 'Оладьи из кабачков': 'oladi-kabachki', 'Энергетические шарики': 'energoshariki',
    'Домашний лимонад': 'limonad', 'Запечённые яблоки': 'zapechennye-yabloki', 'Куриный бульон': 'kurinyj-bulon',
    'Ризотто с грибами': 'rizotto', 'Скрамбл с сыром': 'skrambl', 'Салат из свёклы': 'salat-svyokla',
    'Куриные котлеты на пару': 'kotlety', 'Овощной суп-пюре': 'sup-pyure', 'Яблочный пирог': 'yablochnyj-pirog',
    'Чизкейк без выпечки': 'chizkejk', 'Индейка с овощами': 'indejka', 'Овощное рагу': 'ragu',
    'Салат с тунцом': 'tunec', 'Пшённая каша': 'pshyonka', 'Фаршированные перцы': 'farshirovannye-percy', 'Греческий салат': 'grecheskij'
};
const NEW_PHOTO_RECIPES = [
    { name: 'Курица с овощами на сковороде', category: 'обеды', photo: 'kurica-ovoshchi', ingredients: ['Куриное филе 200г', 'Болгарский перец', 'Кабачок', 'Баклажан', 'Лук', 'Зелень', 'Масло'], time: 30, calories: 260, proteins: 28, fats: 10, carbs: 14, instructions: 'Нарезать курицу и овощи кубиками. Обжарить курицу 7 мин, добавить овощи и тушить под крышкой 15 мин. Посыпать зеленью.' },
    { name: 'Тушёная капуста с картошкой и колбасками', category: 'ужины', photo: 'kapusta', ingredients: ['Капуста 300г', 'Картофель 2 шт', 'Колбаски 2 шт', 'Лук', 'Зелень', 'Масло'], time: 40, calories: 360, proteins: 14, fats: 20, carbs: 30, instructions: 'Обжарить колбаски и лук, добавить картофель и капусту, тушить под крышкой до мягкости. Посыпать зеленью.' },
    { name: 'Гречневый салат с овощами', category: 'перекусы', photo: 'grechnevyj-salat', ingredients: ['Гречка варёная 100г', 'Огурец', 'Помидор', 'Красный лук', 'Зелень', 'Оливковое масло'], time: 20, calories: 210, proteins: 7, fats: 7, carbs: 32, instructions: 'Смешать остывшую гречку с нарезанными овощами и зеленью, заправить маслом.' },
    { name: 'Салат «Мимоза»', category: 'обеды', photo: 'mimoza', ingredients: ['Курица варёная 150г', 'Картофель', 'Морковь', 'Яйца 2 шт', 'Йогурт или майонез', 'Укроп'], time: 40, calories: 330, proteins: 20, fats: 20, carbs: 16, instructions: 'Выкладывать слоями: картофель, курица, морковь, белки; промазывать соусом. Сверху натёртый желток и укроп. Дать настояться 1–2 часа.' },
    { name: 'Куриное филе с запечёнными овощами', category: 'ужины', photo: 'kurica-zapechennye-ovoshchi', ingredients: ['Куриное филе 200г', 'Стручковая фасоль', 'Болгарский перец', 'Кабачок', 'Красный лук', 'Черри', 'Розмарин', 'Оливковое масло'], time: 35, calories: 270, proteins: 30, fats: 10, carbs: 14, instructions: 'Курицу натереть специями и розмарином, овощи нарезать. Запекать при 190° 25–30 минут, посыпать зеленью.' },
    { name: 'Творог с ягодами и орехами', category: 'перекусы', photo: 'tvorog-yagody', ingredients: ['Творог 150г', 'Клубника', 'Черника', 'Миндаль', 'Корица'], time: 5, calories: 230, proteins: 24, fats: 9, carbs: 14, instructions: 'Выложить творог в миску, добавить ягоды и рубленый миндаль, посыпать корицей.' }
];
const EXERCISE_PHOTOS = {
    'Растяжка всего тела': 'rastyazhka-vsego-tela-2', 'Утренняя йога': 'utrennyaya-joga', 'Силовая тренировка дома': 'silovaya', 'Йога для спины': 'joga-spina-2',
    'Планка и кор': 'planka', 'Танцевальная разминка': 'tancy', 'Растяжка после тренировки': 'rastyazhka-posle-2',
    'Домашний кардио-комплекс': 'kardio-kompleks', 'Медитативная практика': 'meditaciya'
};
function syncExercisePhotos() {
    let list = Storage.getExercises();
    if (!list.length) return;
    let changed = false;
    const removed = ['Кардио-разминка', 'Парные приседания'];
    const kept = list.filter(function(e) { return e.isUser || removed.indexOf(e.name) < 0; });
    if (kept.length !== list.length) { list = kept; changed = true; }
    const base = 'assets/images/exercises/';
    list.forEach(function(e) {
        const key = EXERCISE_PHOTOS[e.name];
        if (!e.isUser && key && e.image !== base + key + '.jpg') { e.image = base + key + '.jpg'; changed = true; }
    });
    if (changed) Storage.saveExercises(list);
}
function syncRecipePhotos() {
    const recipes = Storage.getRecipes();
    let changed = false;
    const base = 'assets/images/recipes/';
    recipes.forEach(function(r) {
        const key = RECIPE_PHOTOS[r.name];
        if (!r.isUser && key) {
            var path = base + key + '.jpg';
            if (r.image !== path) { r.image = path; changed = true; }
        }
    });
    NEW_PHOTO_RECIPES.forEach(function(n) {
        if (!recipes.some(function(r) { return r.name === n.name; })) {
            recipes.push({ id: Storage.generateId(), name: n.name, category: n.category, image: base + n.photo + '.jpg',
                ingredients: n.ingredients, portions: 1, time: n.time, calories: n.calories, proteins: n.proteins,
                fats: n.fats, carbs: n.carbs, instructions: n.instructions, isUser: false });
            changed = true;
        }
    });
    if (changed) Storage.saveRecipes(recipes);
}

function initDefaultData() {
    if (Storage.getHabits().length === 0) {
        const defaultHabits = [
            { id: Storage.generateId(), name: 'Читать', description: 'Читать минимум 20 страниц', icon: '📚', color: '#647348', frequency: 'daily', days: [0,1,2,3,4,5,6], target: 1, created: new Date().toISOString() },
            { id: Storage.generateId(), name: 'Заниматься спортом', description: 'Любая физическая активность', icon: '🏃', color: '#455536', frequency: 'daily', days: [0,1,2,3,4,5,6], target: 1, created: new Date().toISOString() },
            { id: Storage.generateId(), name: 'Пить воду', description: '8 стаканов воды', icon: '💧', color: '#6B8E6B', frequency: 'daily', days: [0,1,2,3,4,5,6], target: 8, created: new Date().toISOString() }
        ];
        Storage.saveHabits(defaultHabits);
    }
    if (Storage.getRecipes().length === 0) {
        const defaultRecipes = [
            { id: Storage.generateId(), name: 'Овсянка с ягодами', category: 'завтраки', image: '', ingredients: ['Овсяные хлопья 50г', 'Молоко 200мл', 'Ягоды 100г', 'Мёд'], portions: 1, time: 10, calories: 280, proteins: 10, fats: 6, carbs: 45, instructions: 'Залить хлопья молоком, варить 5 мин. Добавить ягоды и мёд.', isUser: false },
            { id: Storage.generateId(), name: 'Омлет с овощами', category: 'завтраки', image: '', ingredients: ['Яйца 3шт', 'Помидор', 'Шпинат', 'Сыр 30г'], portions: 1, time: 15, calories: 350, proteins: 25, fats: 22, carbs: 8, instructions: 'Взбить яйца, добавить овощи, жарить.', isUser: false },
            { id: Storage.generateId(), name: 'Сырники', category: 'завтраки', image: '', ingredients: ['Творог 200г', 'Яйцо', 'Мука 2 ст.л.', 'Сахар'], portions: 1, time: 20, calories: 320, proteins: 18, fats: 12, carbs: 28, instructions: 'Смешать, сформировать, жарить на среднем огне.', isUser: false },
            { id: Storage.generateId(), name: 'Греческий йогурт с гранолой', category: 'завтраки', image: '', ingredients: ['Йогурт 150г', 'Гранола 40г', 'Мёд', 'Орехи'], portions: 1, time: 5, calories: 290, proteins: 12, fats: 10, carbs: 35, instructions: 'Выложить слоями.', isUser: false },
            { id: Storage.generateId(), name: 'Тост с авокадо', category: 'завтраки', image: '', ingredients: ['Хлеб цельнозерновой', 'Авокадо', 'Яйцо', 'Соль'], portions: 1, time: 10, calories: 310, proteins: 12, fats: 18, carbs: 25, instructions: 'Размять авокадо, выложить на тост, сверху яйцо.', isUser: false },
            { id: Storage.generateId(), name: 'Куриный салат', category: 'обеды', image: '', ingredients: ['Куриная грудка 150г', 'Салат', 'Огурец', 'Помидор', 'Масло'], portions: 1, time: 25, calories: 320, proteins: 35, fats: 12, carbs: 10, instructions: 'Отварить курицу, нарезать, смешать.', isUser: false },
            { id: Storage.generateId(), name: 'Суп куриный с лапшой', category: 'обеды', image: '', ingredients: ['Курица', 'Лапша', 'Морковь', 'Лук', 'Зелень'], portions: 1, time: 40, calories: 280, proteins: 22, fats: 8, carbs: 25, instructions: 'Сварить бульон, добавить лапшу и овощи.', isUser: false },
            { id: Storage.generateId(), name: 'Гречка с овощами', category: 'обеды', image: '', ingredients: ['Гречка 80г', 'Морковь', 'Лук', 'Перец', 'Масло'], portions: 1, time: 25, calories: 340, proteins: 10, fats: 8, carbs: 55, instructions: 'Отварить гречку, обжарить овощи, смешать.', isUser: false },
            { id: Storage.generateId(), name: 'Паста с томатным соусом', category: 'обеды', image: '', ingredients: ['Паста 100г', 'Томаты', 'Чеснок', 'Базилик', 'Оливковое масло'], portions: 1, time: 20, calories: 380, proteins: 12, fats: 10, carbs: 60, instructions: 'Отварить пасту, приготовить соус.', isUser: false },
            { id: Storage.generateId(), name: 'Рис с курицей', category: 'обеды', image: '', ingredients: ['Рис 80г', 'Курица 150г', 'Овощи', 'Специи'], portions: 1, time: 35, calories: 420, proteins: 30, fats: 10, carbs: 50, instructions: 'Обжарить курицу, добавить рис и овощи.', isUser: false },
            { id: Storage.generateId(), name: 'Овощное рагу', category: 'ужины', image: '', ingredients: ['Кабачок', 'Баклажан', 'Перец', 'Томат', 'Лук'], portions: 1, time: 30, calories: 180, proteins: 5, fats: 6, carbs: 25, instructions: 'Тушить овощи 25–30 минут.', isUser: false },
            { id: Storage.generateId(), name: 'Запечённая рыба', category: 'ужины', image: '', ingredients: ['Филе рыбы 200г', 'Лимон', 'Зелень', 'Оливковое масло'], portions: 1, time: 25, calories: 250, proteins: 35, fats: 10, carbs: 2, instructions: 'Запечь при 180° 20 минут.', isUser: false },
            { id: Storage.generateId(), name: 'Творожная запеканка', category: 'ужины', image: '', ingredients: ['Творог 300г', 'Яйца 2', 'Манка', 'Сахар'], portions: 1, time: 40, calories: 310, proteins: 25, fats: 12, carbs: 28, instructions: 'Смешать, запечь 30–35 мин.', isUser: false },
            { id: Storage.generateId(), name: 'Индейка с овощами', category: 'ужины', image: '', ingredients: ['Индейка 150г', 'Брокколи', 'Морковь', 'Специи'], portions: 1, time: 30, calories: 290, proteins: 32, fats: 8, carbs: 12, instructions: 'Запечь или потушить.', isUser: false },
            { id: Storage.generateId(), name: 'Салат Цезарь', category: 'обеды', image: '', ingredients: ['Курица', 'Салат романо', 'Сухарики', 'Пармезан', 'Соус'], portions: 1, time: 20, calories: 380, proteins: 28, fats: 22, carbs: 18, instructions: 'Собрать салат, заправить.', isUser: false },
            { id: Storage.generateId(), name: 'Блины', category: 'завтраки', image: '', ingredients: ['Мука', 'Молоко', 'Яйца', 'Сахар', 'Масло'], portions: 1, time: 30, calories: 250, proteins: 8, fats: 10, carbs: 35, instructions: 'Замесить тесто, жарить.', isUser: false },
            { id: Storage.generateId(), name: 'Смузи банановый', category: 'напитки', image: '', ingredients: ['Банан', 'Молоко', 'Мёд', 'Овсянка'], portions: 1, time: 5, calories: 220, proteins: 6, fats: 4, carbs: 40, instructions: 'Взбить в блендере.', isUser: false },
            { id: Storage.generateId(), name: 'Какао', category: 'напитки', image: '', ingredients: ['Какао', 'Молоко', 'Сахар'], portions: 1, time: 5, calories: 150, proteins: 5, fats: 5, carbs: 20, instructions: 'Разогреть молоко, добавить какао.', isUser: false },
            { id: Storage.generateId(), name: 'Чизкейк без выпечки', category: 'десерты', image: '', ingredients: ['Печенье', 'Творожный сыр', 'Сливки', 'Сахар'], portions: 1, time: 20, calories: 380, proteins: 8, fats: 28, carbs: 30, instructions: 'Собрать слоями, охладить.', isUser: false },
            { id: Storage.generateId(), name: 'Яблочный пирог', category: 'десерты', image: '', ingredients: ['Яблоки', 'Мука', 'Яйца', 'Сахар', 'Масло'], portions: 1, time: 50, calories: 320, proteins: 5, fats: 12, carbs: 45, instructions: 'Замесить тесто, выложить яблоки, выпечь.', isUser: false },
            { id: Storage.generateId(), name: 'Овощной суп-пюре', category: 'обеды', image: '', ingredients: ['Тыква', 'Морковь', 'Картофель', 'Сливки'], portions: 1, time: 35, calories: 200, proteins: 4, fats: 8, carbs: 28, instructions: 'Сварить, взбить блендером.', isUser: false },
            { id: Storage.generateId(), name: 'Куриные котлеты на пару', category: 'ужины', image: '', ingredients: ['Фарш куриный', 'Лук', 'Яйцо', 'Хлеб'], portions: 1, time: 30, calories: 280, proteins: 28, fats: 10, carbs: 12, instructions: 'Сформировать, готовить на пару.', isUser: false },
            { id: Storage.generateId(), name: 'Салат с тунцом', category: 'обеды', image: '', ingredients: ['Тунец', 'Яйцо', 'Огурец', 'Салат', 'Майонез'], portions: 1, time: 15, calories: 310, proteins: 25, fats: 18, carbs: 8, instructions: 'Смешать ингредиенты.', isUser: false },
            { id: Storage.generateId(), name: 'Пшённая каша', category: 'завтраки', image: '', ingredients: ['Пшено', 'Молоко', 'Масло', 'Сахар'], portions: 1, time: 25, calories: 260, proteins: 7, fats: 6, carbs: 45, instructions: 'Варить на молоке.', isUser: false },
            { id: Storage.generateId(), name: 'Фаршированные перцы', category: 'ужины', image: '', ingredients: ['Перец', 'Фарш', 'Рис', 'Томаты'], portions: 1, time: 50, calories: 350, proteins: 22, fats: 14, carbs: 30, instructions: 'Начинить, тушить или запечь.', isUser: false },
            { id: Storage.generateId(), name: 'Греческий салат', category: 'обеды', image: '', ingredients: ['Огурец', 'Помидор', 'Оливки', 'Сыр фета', 'Масло'], portions: 1, time: 10, calories: 240, proteins: 8, fats: 18, carbs: 10, instructions: 'Нарезать, заправить.', isUser: false },
            { id: Storage.generateId(), name: 'Тыквенный суп', category: 'обеды', image: '', ingredients: ['Тыква', 'Имбирь', 'Сливки', 'Лук'], portions: 1, time: 30, calories: 180, proteins: 3, fats: 8, carbs: 22, instructions: 'Сварить, взбить.', isUser: false },
            { id: Storage.generateId(), name: 'Оладьи из кабачков', category: 'перекусы', image: '', ingredients: ['Кабачок', 'Яйцо', 'Мука', 'Зелень'], portions: 1, time: 20, calories: 180, proteins: 8, fats: 6, carbs: 20, instructions: 'Натереть, жарить.', isUser: false },
            { id: Storage.generateId(), name: 'Энергетические шарики', category: 'перекусы', image: '', ingredients: ['Финики', 'Орехи', 'Какао', 'Кокос'], portions: 1, time: 15, calories: 120, proteins: 3, fats: 7, carbs: 12, instructions: 'Измельчить, скатать.', isUser: false },
            { id: Storage.generateId(), name: 'Домашний лимонад', category: 'напитки', image: '', ingredients: ['Лимон', 'Мята', 'Мёд', 'Вода'], portions: 1, time: 10, calories: 60, proteins: 0, fats: 0, carbs: 15, instructions: 'Выжать лимон, добавить мяту и мёд.', isUser: false },
            { id: Storage.generateId(), name: 'Запечённые яблоки', category: 'десерты', image: '', ingredients: ['Яблоки', 'Творог', 'Мёд', 'Корица'], portions: 1, time: 25, calories: 180, proteins: 6, fats: 4, carbs: 30, instructions: 'Начинить, запечь.', isUser: false },
            { id: Storage.generateId(), name: 'Куриный бульон', category: 'обеды', image: '', ingredients: ['Курица', 'Морковь', 'Лук', 'Зелень'], portions: 1, time: 60, calories: 120, proteins: 12, fats: 4, carbs: 5, instructions: 'Варить на медленном огне.', isUser: false },
            { id: Storage.generateId(), name: 'Ризотто с грибами', category: 'ужины', image: '', ingredients: ['Рис арборио', 'Грибы', 'Бульон', 'Пармезан'], portions: 1, time: 35, calories: 380, proteins: 12, fats: 12, carbs: 50, instructions: 'Постепенно вливать бульон, помешивая.', isUser: false },
            { id: Storage.generateId(), name: 'Скрамбл с сыром', category: 'завтраки', image: '', ingredients: ['Яйца', 'Сыр', 'Молоко', 'Масло'], portions: 1, time: 10, calories: 280, proteins: 18, fats: 20, carbs: 4, instructions: 'Медленно помешивать на маленьком огне.', isUser: false },
            { id: Storage.generateId(), name: 'Салат из свёклы', category: 'перекусы', image: '', ingredients: ['Свёкла', 'Чеснок', 'Майонез или йогурт'], portions: 1, time: 15, calories: 140, proteins: 3, fats: 8, carbs: 15, instructions: 'Натереть, смешать.', isUser: false }
        ];
        Storage.saveRecipes(defaultRecipes);
    }
    syncRecipePhotos();
    if (Storage.getExercises().length === 0) {
        const defaultExercises = [
            { id: Storage.generateId(), name: 'Растяжка всего тела', category: 'растяжка', description: 'Комплекс на основные группы мышц', howto: 'Встаньте прямо. Тянитесь руками вверх 20 сек. Наклонитесь вперёд к носкам. Повороты корпуса. По 3 подхода.', duration: 15, level: 'лёгкий', equipment: 'коврик', video: '', isUser: false },
            { id: Storage.generateId(), name: 'Утренняя йога', category: 'йога', description: 'Мягкая практика для пробуждения', howto: 'Поза ребёнка 1 мин. Кошка-корова 10 раз. Собака мордой вниз 30 сек. Поза воина. Дышите глубоко.', duration: 20, level: 'лёгкий', equipment: 'коврик', video: '', isUser: false },
            { id: Storage.generateId(), name: 'Силовая тренировка дома', category: 'силовые', description: 'Отжимания, приседания, планка', howto: 'Отжимания 10-15. Приседания 20. Планка 30-60 сек. Выпады 10 на ногу. 3 круга.', duration: 30, level: 'средний', equipment: 'нет', video: '', isUser: false },
            { id: Storage.generateId(), name: 'Йога для спины', category: 'йога', description: 'Снятие напряжения со спины', howto: 'Поза кошки. Скрутки лёжа. Поза голубя. Растяжка позвоночника. 5-7 дыханий в каждой позе.', duration: 15, level: 'лёгкий', equipment: 'коврик', video: '', isUser: false },
            { id: Storage.generateId(), name: 'Планка и кор', category: 'силовые', description: 'Укрепление мышц кора', howto: 'Классическая планка 40 сек. Боковая планка 30 сек. Скручивания 15. 3 раза.', duration: 15, level: 'средний', equipment: 'коврик', video: '', isUser: false },
            { id: Storage.generateId(), name: 'Танцевальная разминка', category: 'танцы', description: 'Энергичные движения', howto: 'Включите музыку. Двигайтесь свободно 5-10 минут. Добавьте приседания и повороты.', duration: 15, level: 'лёгкий', equipment: 'нет', video: '', isUser: false },
            { id: Storage.generateId(), name: 'Растяжка после тренировки', category: 'растяжка', description: 'Восстановление мышц', howto: 'Растяжка квадрицепса, задней поверхности бедра, груди, плеч. Держите 30 сек.', duration: 10, level: 'лёгкий', equipment: 'коврик', video: '', isUser: false },
            { id: Storage.generateId(), name: 'Домашний кардио-комплекс', category: 'кардио', description: 'Без оборудования', howto: 'Берпи 8. Прыжки 30 сек. Альпинист 20. Приседания с выпрыгиванием 12. 3-4 круга.', duration: 20, level: 'сложный', equipment: 'нет', video: '', isUser: false },
            { id: Storage.generateId(), name: 'Медитативная практика', category: 'расслабление', description: 'Дыхание и расслабление', howto: 'Сядьте удобно. Вдох 4 сек, выдох 4 сек. Сканируйте тело. 10-15 минут.', duration: 15, level: 'лёгкий', equipment: 'нет', video: '', isUser: false }
        ];
        Storage.saveExercises(defaultExercises);
    }
    syncExercisePhotos();
    if (Object.keys(Storage.getSkills()).length === 0) {
        const defaultSkills = {
            'программирование': {
                name: 'Программирование',
                nodes: [
                    { id: 'html', name: 'HTML', description: 'Основы разметки', status: 'освоено', links: [], tasks: [], order: 1 },
                    { id: 'css', name: 'CSS', description: 'Стилизация', status: 'освоено', links: [], tasks: [], order: 2 },
                    { id: 'responsive', name: 'Адаптивная вёрстка', description: 'Media queries и flex/grid', status: 'в процессе', links: [], tasks: [], order: 3 },
                    { id: 'js', name: 'JavaScript', description: 'Основы языка', status: 'не начато', links: [], tasks: [], order: 4 },
                    { id: 'interactive', name: 'Интерактивные сайты', description: 'DOM, события', status: 'не начато', links: [], tasks: [], order: 5 }
                ]
            },
            'рисование': {
                name: 'Рисование',
                nodes: [
                    { id: 'basics', name: 'Основы рисунка', description: 'Линии, формы, пропорции', status: 'не начато', links: [], tasks: [], order: 1 },
                    { id: 'shading', name: 'Штриховка и тени', description: 'Объём и свет', status: 'не начато', links: [], tasks: [], order: 2 },
                    { id: 'portrait', name: 'Портрет', description: 'Лицо человека', status: 'не начато', links: [], tasks: [], order: 3 }
                ]
            }
        };
        Storage.saveSkills(defaultSkills);
    }
}
if (typeof window !== 'undefined') {
    initDefaultData();
}
