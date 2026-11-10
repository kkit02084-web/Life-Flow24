// Life Flow - Nutrition Module
window.Nutrition = {
    currentTab: 'recipes',

    init: function() {
        document.querySelectorAll('.nutrition-tab').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.nutrition-tab').forEach(function(b) {
                    b.classList.remove('active', 'btn-primary');
                    b.classList.add('btn-secondary');
                });
                btn.classList.add('active', 'btn-primary');
                btn.classList.remove('btn-secondary');
                Nutrition.currentTab = btn.getAttribute('data-tab');
                Nutrition.render();
            });
        });
    },

    render: function() {
        var content = document.getElementById('nutritionContent');
        if (!content) return;
        if (this.currentTab === 'recipes') this.renderRecipes(content);
        else if (this.currentTab === 'menu') this.renderMenu(content);
        else if (this.currentTab === 'myrecipes') this.renderMyRecipes(content);
        else if (this.currentTab === 'shopping') this.renderShopping(content);
    },

    renderRecipes: function(container) {
        var recipes = Storage.getRecipes().filter(function(r) { return !r.isUser; });
        var categories = ['все', 'завтраки', 'обеды', 'ужины', 'перекусы', 'десерты', 'напитки'];
        container.innerHTML =
            '<div class="flex gap-8 mb-16 flex-wrap">' +
            '<input type="search" class="form-control" id="recipeSearch" placeholder="Поиск рецептов..." style="max-width:250px;">' +
            '<select class="form-control" id="recipeCategory" style="width:auto;">' +
            categories.map(function(c) { return '<option value="' + c + '">' + c.charAt(0).toUpperCase() + c.slice(1) + '</option>'; }).join('') +
            '</select></div><div class="dashboard-grid" id="recipesGrid">' + this.recipeCards(recipes) + '</div>';
        var self = this;
        document.getElementById('recipeSearch').oninput = function() { self.filterRecipes(); };
        document.getElementById('recipeCategory').onchange = function() { self.filterRecipes(); };
    },

    recipeCards: function(recipes) {
        if (!recipes.length) return '<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🍵</div><h3>Рецепты не найдены</h3></div>';
        return recipes.map(function(r) {
            return '<div class="card">' +
                (r.image
                    ? '<img src="' + (window.OfflineAssets ? OfflineAssets.resolve(r.image) : r.image) + '" alt="' + r.name + '" loading="lazy" style="width:100%;height:160px;object-fit:cover;border-radius:12px;margin-bottom:12px;display:block;">'
                    : '<div style="height:120px;background:var(--green-light);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;margin-bottom:12px;">🍽️</div>') +
                '<h3>' + r.name + '</h3>' +
                '<div class="text-muted" style="font-size:0.85rem;">' + r.category + ' · ' + r.time + ' мин · ' + r.calories + ' ккал</div>' +
                '<div class="mt-8 text-muted" style="font-size:0.85rem;">Б: ' + r.proteins + 'г · Ж: ' + r.fats + 'г · У: ' + r.carbs + 'г</div>' +
                '<div class="flex gap-8 mt-12">' +
                '<button class="btn btn-sm btn-primary" data-view-recipe="' + r.id + '">Подробнее</button>' +
                '<button class="btn btn-sm btn-secondary" data-menu-recipe="' + r.id + '">В меню</button></div></div>';
        }).join('');
    },

    filterRecipes: function() {
        var q = (document.getElementById('recipeSearch') && document.getElementById('recipeSearch').value || '').toLowerCase();
        var cat = (document.getElementById('recipeCategory') && document.getElementById('recipeCategory').value) || 'все';
        var recipes = Storage.getRecipes().filter(function(r) { return !r.isUser; });
        if (cat !== 'все') recipes = recipes.filter(function(r) { return r.category === cat; });
        if (q) recipes = recipes.filter(function(r) { return r.name.toLowerCase().indexOf(q) >= 0; });
        var grid = document.getElementById('recipesGrid');
        if (grid) {
            grid.innerHTML = this.recipeCards(recipes);
            this.bindRecipeCards(grid);
        }
    },

    bindRecipeCards: function(container) {
        var self = this;
        container.onclick = function(e) {
            var v = e.target.closest('[data-view-recipe]');
            if (v) { self.viewRecipe(v.getAttribute('data-view-recipe')); return; }
            var m = e.target.closest('[data-menu-recipe]');
            if (m) { self.addToMenu(m.getAttribute('data-menu-recipe')); }
        };
    },

    viewRecipe: function(id) {
        var r = Storage.getRecipes().find(function(x) { return x.id === id; });
        if (!r) return;
        App.openModal(
            '<div class="modal-header"><h2>' + r.name + '</h2><button class="modal-close" id="mClose">×</button></div>' +
            (r.image ? '<img src="' + (window.OfflineAssets ? OfflineAssets.resolve(r.image) : r.image) + '" alt="' + r.name + '" style="width:100%;max-height:260px;object-fit:cover;border-radius:12px;margin-bottom:12px;display:block;">' : '') +
            '<div class="text-muted mb-16">' + r.category + ' · ' + r.portions + ' порц. · ' + r.time + ' мин · ' + r.calories + ' ккал</div>' +
            '<h4>Ингредиенты</h4><ul style="margin:8px 0 16px 20px;">' + (r.ingredients || []).map(function(i) { return '<li>' + i + '</li>'; }).join('') + '</ul>' +
            '<h4>Приготовление</h4><p>' + (r.instructions || '') + '</p>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Закрыть</button>' +
            '<button class="btn btn-primary" id="mAddMenu">Добавить в меню</button></div>'
        );
        document.getElementById('mClose').onclick = function() { App.closeModal(); };
        document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('mAddMenu').onclick = function() { Nutrition.addToMenu(r.id); App.closeModal(); };
    },

    addToMenu: function(recipeId) {
        var menu = Storage.getMenu();
        var today = new Date().toISOString().slice(0, 10);
        if (!menu[today]) menu[today] = { 'завтрак': [], 'обед': [], 'ужин': [], 'перекус': [] };
        menu[today]['обед'].push(recipeId);
        Storage.saveMenu(menu);
        this.updateShoppingFromMenu();
        App.showToast('Добавлено в меню на сегодня');
    },

    renderMenu: function(container) {
        var menu = Storage.getMenu();
        var recipes = Storage.getRecipes();
        var days = [];
        for (var i = 0; i < 7; i++) {
            var d = new Date();
            d.setDate(d.getDate() + i);
            days.push(d.toISOString().slice(0, 10));
        }
        var html = '';
        days.forEach(function(date) {
            var dayMenu = menu[date] || { 'завтрак': [], 'обед': [], 'ужин': [], 'перекус': [] };
            var dayName = new Date(date + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
            html += '<div class="card mb-16"><h3>' + dayName + '</h3>';
            ['завтрак', 'обед', 'ужин', 'перекус'].forEach(function(meal) {
                html += '<div class="mt-12"><strong>' + meal + '</strong><div class="mt-4">';
                var items = dayMenu[meal] || [];
                if (!items.length) html += '<span class="text-muted">—</span>';
                items.forEach(function(rid) {
                    var r = recipes.find(function(x) { return x.id === rid; });
                    if (r) html += '<span class="badge badge-green" style="margin:2px;">' + r.name + ' <button style="border:none;background:none;cursor:pointer;" data-rm-menu="' + date + '|' + meal + '|' + rid + '">×</button></span>';
                });
                html += '</div></div>';
            });
            html += '</div>';
        });
        container.innerHTML = html;
        container.onclick = function(e) {
            var btn = e.target.closest('[data-rm-menu]');
            if (btn) {
                var p = btn.getAttribute('data-rm-menu').split('|');
                Nutrition.removeFromMenu(p[0], p[1], p[2]);
            }
        };
    },

    removeFromMenu: function(date, meal, rid) {
        var menu = Storage.getMenu();
        if (menu[date] && menu[date][meal]) {
            menu[date][meal] = menu[date][meal].filter(function(id) { return id !== rid; });
            Storage.saveMenu(menu);
            this.updateShoppingFromMenu();
            this.render();
        }
    },

    renderMyRecipes: function(container) {
        var recipes = Storage.getRecipes().filter(function(r) { return r.isUser; });
        container.innerHTML = '<button class="btn btn-primary mb-16" id="addMyRecipeBtn">+ Мой рецепт</button>' +
            '<div class="dashboard-grid" id="myRecipesGrid">' + (recipes.length ? this.recipeCards(recipes) : '') + '</div>' +
            (!recipes.length ? '<div class="empty-state"><div class="icon">🍳</div><h3>Нет своих рецептов</h3></div>' : '');
        document.getElementById('addMyRecipeBtn').onclick = function() { Nutrition.showRecipeForm(); };
        var grid = document.getElementById('myRecipesGrid');
        if (grid) this.bindRecipeCards(grid);
    },

    showRecipeForm: function() {
        App.openModal(
            '<div class="modal-header"><h2>Новый рецепт</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Название</label><input class="form-control" id="recName"></div>' +
            '<div class="form-group"><label>Категория</label><select class="form-control" id="recCat">' +
            '<option value="завтраки">Завтраки</option><option value="обеды">Обеды</option><option value="ужины">Ужины</option>' +
            '<option value="перекусы">Перекусы</option><option value="десерты">Десерты</option><option value="напитки">Напитки</option></select></div>' +
            '<div class="form-group"><label>Ингредиенты (каждый с новой строки)</label><textarea class="form-control" id="recIng" rows="4"></textarea></div>' +
            '<div class="flex gap-12">' +
            '<div class="form-group" style="flex:1;"><label>Время (мин)</label><input type="number" class="form-control" id="recTime" value="30"></div>' +
            '<div class="form-group" style="flex:1;"><label>Ккал (пусто = авто)</label><input type="number" class="form-control" id="recCal" placeholder="авто"></div></div>' +
            '<div class="form-group"><label>Приготовление</label><textarea class="form-control" id="recInstr"></textarea></div>' +
            '<p class="text-muted" style="font-size:0.85rem;">Если не указать калории — они посчитаются по ингредиентам и времени.</p>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="mSave">Сохранить</button></div>'
        );
        document.getElementById('mClose').onclick = function() { App.closeModal(); };
        document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('mSave').onclick = function() { Nutrition.saveRecipe(); };
        // Live estimate
        function updateEst() {
            var calEl = document.getElementById('recCal');
            if (calEl && !calEl.value) {
                var est = Nutrition.estimateCalories(document.getElementById('recIng').value, document.getElementById('recTime').value);
                calEl.placeholder = '≈ ' + est;
            }
        }
        document.getElementById('recIng').oninput = updateEst;
        document.getElementById('recTime').oninput = updateEst;
    },

    estimateCalories: function(ingredientsText, timeMin) {
        var lines = (ingredientsText || '').split('\n').filter(function(l) { return l.trim(); });
        var base = 80;
        var perIng = 35;
        var timeFactor = Math.min(120, Number(timeMin) || 20) * 1.5;
        var keywords = { 'масло': 80, 'сыр': 60, 'мясо': 90, 'курица': 70, 'рыба': 50, 'сахар': 50, 'мука': 40, 'рис': 45, 'макарон': 45, 'сливки': 70, 'яйц': 40, 'молоко': 25, 'овощ': 15, 'орех': 70, 'шоколад': 90, 'мёд': 40 };
        var bonus = 0;
        var text = (ingredientsText || '').toLowerCase();
        Object.keys(keywords).forEach(function(k) { if (text.indexOf(k) >= 0) bonus += keywords[k]; });
        var cal = Math.round(base + lines.length * perIng + timeFactor * 0.3 + bonus);
        return Math.max(50, Math.min(900, cal));
    },

    saveRecipe: function() {
        var name = document.getElementById('recName').value.trim();
        if (!name) { App.showToast('Введите название', 'error'); return; }
        var ingText = document.getElementById('recIng').value;
        var time = Number(document.getElementById('recTime').value) || 30;
        var calInput = Number(document.getElementById('recCal').value);
        var calories = calInput || this.estimateCalories(ingText, time);
        var recipes = Storage.getRecipes();
        recipes.push({
            id: Storage.generateId(),
            name: name,
            category: document.getElementById('recCat').value,
            ingredients: ingText.split('\n').filter(function(l) { return l.trim(); }),
            portions: 1,
            time: time,
            calories: calories,
            proteins: Math.round(calories * 0.15 / 4),
            fats: Math.round(calories * 0.3 / 9),
            carbs: Math.round(calories * 0.55 / 4),
            instructions: document.getElementById('recInstr').value,
            isUser: true
        });
        Storage.saveRecipes(recipes);
        App.closeModal();
        this.render();
        App.showToast('Рецепт сохранён · ' + calories + ' ккал');
    },

    renderShopping: function(container) {
        var list = Storage.getShoppingList();
        var html = '<div class="flex-between mb-16 flex-wrap gap-8">' +
            '<h3>Список продуктов</h3><div class="flex gap-8">' +
            '<button class="btn btn-secondary btn-sm" id="updShopBtn">Обновить из меню</button>' +
            '<button class="btn btn-primary btn-sm" id="addProdBtn">+ Свой продукт</button></div></div>';
        html += '<div class="form-group mb-16"><div class="flex gap-8">' +
            '<input type="text" class="form-control" id="customProductInput" placeholder="Например: Молоко 1л">' +
            '<button class="btn btn-primary" id="addProdBtn2">Добавить</button></div></div>';
        if (!list.length) {
            html += '<div class="empty-state"><div class="icon">🛒</div><h3>Список пуст</h3><p>Добавьте продукты вручную или из меню</p></div>';
        } else {
            list.forEach(function(item, i) {
                html += '<div class="list-item"><label class="checkbox-wrapper">' +
                    '<input type="checkbox" data-bought="' + i + '" ' + (item.bought ? 'checked' : '') + '>' +
                    '<span style="' + (item.bought ? 'text-decoration:line-through;opacity:0.6;' : '') + '">' + item.name + '</span></label>' +
                    '<button class="btn btn-sm btn-danger" data-del-prod="' + i + '" style="margin-left:auto;">🗑</button></div>';
            });
        }
        container.innerHTML = html;
        document.getElementById('updShopBtn').onclick = function() { Nutrition.updateShoppingFromMenu(); };
        document.getElementById('addProdBtn').onclick = function() { Nutrition.addCustomProduct(); };
        document.getElementById('addProdBtn2').onclick = function() { Nutrition.addCustomProductFromInput(); };
        document.getElementById('customProductInput').onkeydown = function(e) {
            if (e.key === 'Enter') Nutrition.addCustomProductFromInput();
        };
        container.onclick = function(e) {
            var b = e.target.closest('[data-bought]');
            if (b) Nutrition.toggleBought(Number(b.getAttribute('data-bought')), b.checked);
            var d = e.target.closest('[data-del-prod]');
            if (d) Nutrition.removeProduct(Number(d.getAttribute('data-del-prod')));
        };
        // bind cards after recipes render
        var grid = document.getElementById('recipesGrid');
        if (grid) this.bindRecipeCards(grid);
    },

    addCustomProduct: function() {
        var name = prompt('Название продукта:');
        if (!name || !name.trim()) return;
        var list = Storage.getShoppingList();
        list.push({ name: name.trim(), bought: false, custom: true });
        Storage.saveShoppingList(list);
        this.render();
        App.showToast('Продукт добавлен');
    },

    addCustomProductFromInput: function() {
        var input = document.getElementById('customProductInput');
        if (!input) return;
        var name = input.value.trim();
        if (!name) { App.showToast('Введите название', 'error'); return; }
        var list = Storage.getShoppingList();
        list.push({ name: name, bought: false, custom: true });
        Storage.saveShoppingList(list);
        input.value = '';
        this.render();
        App.showToast('Продукт добавлен');
    },

    removeProduct: function(idx) {
        var list = Storage.getShoppingList();
        list.splice(idx, 1);
        Storage.saveShoppingList(list);
        this.render();
    },

    updateShoppingFromMenu: function() {
        var menu = Storage.getMenu();
        var recipes = Storage.getRecipes();
        var items = {};
        // Keep custom items
        Storage.getShoppingList().forEach(function(it) {
            if (it.custom) items[it.name] = { name: it.name, bought: it.bought, custom: true };
        });
        Object.keys(menu).forEach(function(date) {
            Object.keys(menu[date]).forEach(function(meal) {
                (menu[date][meal] || []).forEach(function(rid) {
                    var r = recipes.find(function(x) { return x.id === rid; });
                    if (r && r.ingredients) {
                        r.ingredients.forEach(function(ing) {
                            if (!items[ing]) items[ing] = { name: ing, bought: false, custom: false };
                        });
                    }
                });
            });
        });
        Storage.saveShoppingList(Object.keys(items).map(function(k) { return items[k]; }));
        if (this.currentTab === 'shopping') this.render();
        App.showToast('Список обновлён');
    },

    toggleBought: function(idx, checked) {
        var list = Storage.getShoppingList();
        if (list[idx]) {
            list[idx].bought = checked;
            Storage.saveShoppingList(list);
            this.render();
        }
    }
};
