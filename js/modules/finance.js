// Life Flow - Finance Module
window.Finance = {
    currentTab: 'overview',

    currencies: [
        { code: 'KZT', symbol: '₸', name: 'Тенге' },
        { code: 'USD', symbol: '$', name: 'Доллар США' },
        { code: 'EUR', symbol: '€', name: 'Евро' },
        { code: 'RUB', symbol: '₽', name: 'Рубль' },
        { code: 'GBP', symbol: '£', name: 'Фунт' },
        { code: 'CNY', symbol: '¥', name: 'Юань' },
        { code: 'TRY', symbol: '₺', name: 'Лира' },
        { code: 'UAH', symbol: '₴', name: 'Гривна' }
    ],

    getCurrency: function() {
        var s = Storage.getSettings();
        var code = (s && s.financeCurrency) || 'KZT';
        return this.currencies.find(function(c) { return c.code === code; }) || this.currencies[0];
    },

    // Approximate rates vs 1 USD (for conversion between currencies)
    ratesToUsd: {
        KZT: 1 / 480,
        USD: 1,
        EUR: 1.08,
        RUB: 1 / 92,
        GBP: 1.27,
        CNY: 1 / 7.2,
        TRY: 1 / 34,
        UAH: 1 / 41
    },

    convertAmount: function(amount, fromCode, toCode) {
        if (fromCode === toCode) return Number(amount) || 0;
        var rates = this.ratesToUsd;
        var from = rates[fromCode] || 1;
        var to = rates[toCode] || 1;
        var usd = (Number(amount) || 0) * from;
        var out = usd / to;
        // money-friendly rounding
        if (toCode === 'KZT' || toCode === 'RUB' || toCode === 'UAH' || toCode === 'TRY') {
            return Math.round(out);
        }
        return Math.round(out * 100) / 100;
    },

    convertAllFinanceData: function(fromCode, toCode) {
        if (fromCode === toCode) return;
        var self = this;
        var incomes = Storage.getIncomes().map(function(i) {
            return Object.assign({}, i, { amount: self.convertAmount(i.amount, fromCode, toCode) });
        });
        var expenses = Storage.getExpenses().map(function(e) {
            return Object.assign({}, e, { amount: self.convertAmount(e.amount, fromCode, toCode) });
        });
        Storage.saveIncomes(incomes);
        Storage.saveExpenses(expenses);
        var budget = Storage.getBudget() || {};
        budget = Object.assign({}, budget, {
            monthly: self.convertAmount(budget.monthly || 0, fromCode, toCode),
            savings: self.convertAmount(budget.savings || 0, fromCode, toCode)
        });
        Storage.saveBudget(budget);
        var goals = Storage.getSavingsGoals().map(function(g) {
            return Object.assign({}, g, {
                current: self.convertAmount(g.current || 0, fromCode, toCode),
                target: self.convertAmount(g.target || 0, fromCode, toCode)
            });
        });
        Storage.saveSavingsGoals(goals);
    },

    setCurrency: function(code, opts) {
        opts = opts || {};
        var s = Storage.getSettings();
        var from = (s && s.financeCurrency) || 'KZT';
        var to = code || from;
        if (from !== to && opts.convert !== false) {
            this.convertAllFinanceData(from, to);
        }
        s.financeCurrency = to;
        Storage.saveSettings(s);
        this.render();
        if (App.currentSection === 'dashboard' && App.renderDashboard) App.renderDashboard();
        var cur = this.getCurrency();
        if (from !== to && opts.convert !== false) {
            App.showToast('Валюта: ' + cur.name + ' — все суммы пересчитаны');
        } else {
            App.showToast('Валюта: ' + (cur.name || to));
        }
    },

    money: function(n) {
        var c = this.getCurrency();
        return Number(n || 0).toLocaleString('ru-RU') + ' ' + c.symbol;
    },

    showCurrencyPicker: function() {
        var cur = this.getCurrency();
        var html = '<div class="modal-header"><h2>Валюта</h2><button class="modal-close" id="mClose">×</button></div>';
        html += '<p class="text-muted mb-16" style="font-size:0.9rem;">При смене валюты <strong>все</strong> доходы, расходы, бюджет и цели будут автоматически пересчитаны по курсу (приблизительно).</p>';
        html += '<div style="display:grid;gap:8px;">';
        this.currencies.forEach(function(c) {
            var active = c.code === cur.code;
            html += '<button type="button" class="btn ' + (active ? 'btn-primary' : 'btn-secondary') + '" data-set-cur="' + c.code + '" style="justify-content:space-between;">' +
                '<span>' + c.symbol + ' · ' + c.name + '</span><span class="text-muted">' + c.code + (active ? ' ✓' : '') + '</span></button>';
        });
        html += '</div><div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Закрыть</button></div>';
        App.openModal(html);
        document.getElementById('mClose').onclick = document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('modalContent').onclick = function(e) {
            var b = e.target.closest('[data-set-cur]');
            if (b) {
                var next = b.getAttribute('data-set-cur');
                var curCode = Finance.getCurrency().code;
                if (next === curCode) { App.closeModal(); return; }
                var ok = confirm('Пересчитать все доходы, расходы, бюджет и цели из ' + curCode + ' в ' + next + '?\n\nКурсы приблизительные. Это изменит сохранённые суммы.');
                if (!ok) return;
                Finance.setCurrency(next, { convert: true });
                App.closeModal();
            }
        };
    },

    init: function() {
        document.querySelectorAll('.finance-tab').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.finance-tab').forEach(function(b) {
                    b.classList.remove('active', 'btn-primary');
                    b.classList.add('btn-secondary');
                });
                btn.classList.add('active', 'btn-primary');
                btn.classList.remove('btn-secondary');
                Finance.currentTab = btn.getAttribute('data-tab');
                Finance.render();
            });
        });
    },

    render: function() {
        this.renderSummary();
        var content = document.getElementById('financeContent');
        if (!content) return;
        if (this.currentTab === 'overview') this.renderOverview(content);
        else if (this.currentTab === 'income') this.renderIncome(content);
        else if (this.currentTab === 'expense') this.renderExpense(content);
        else if (this.currentTab === 'savings') this.renderSavings(content);
    },

    getMonthData: function() {
        var month = new Date().toISOString().slice(0, 7);
        var incomes = Storage.getIncomes().filter(function(i) { return i.date && i.date.indexOf(month) === 0; });
        var expenses = Storage.getExpenses().filter(function(e) { return e.date && e.date.indexOf(month) === 0; });
        var totalIncome = incomes.reduce(function(s, i) { return s + Number(i.amount); }, 0);
        var totalExpense = expenses.reduce(function(s, e) { return s + Number(e.amount); }, 0);
        return { incomes: incomes, expenses: expenses, totalIncome: totalIncome, totalExpense: totalExpense, balance: totalIncome - totalExpense };
    },

    renderSummary: function() {
        var d = this.getMonthData();
        var budget = Storage.getBudget();
        var el = document.getElementById('financeSummary');
        if (!el) return;
        var cur = this.getCurrency();
        el.innerHTML =
            '<div class="flex-between mb-12 flex-wrap gap-8" style="grid-column:1/-1;">' +
            '<button type="button" class="btn btn-secondary btn-sm" id="financeCurrencyBtn">Валюта: ' + cur.symbol + ' ' + cur.code + '</button>' +
            '</div>' +
            '<div class="dashboard-card"><div class="card-icon">📈</div><h3>Доход</h3><div class="stat">' + this.money(d.totalIncome) + '</div></div>' +
            '<div class="dashboard-card"><div class="card-icon">📉</div><h3>Расход</h3><div class="stat">' + this.money(d.totalExpense) + '</div></div>' +
            '<div class="dashboard-card"><div class="card-icon">💵</div><h3>Баланс</h3><div class="stat">' + this.money(d.balance) + '</div></div>' +
            '<div class="dashboard-card"><div class="card-icon">🎯</div><h3>Бюджет</h3><div class="stat">' + this.money(budget.monthly || 0) + '</div></div>';
        var btn = document.getElementById('financeCurrencyBtn');
        if (btn) btn.onclick = function() { Finance.showCurrencyPicker(); };
    },

    renderCharts: function(byCat, totalExpense) {
        var cats = Object.keys(byCat);
        if (cats.length === 0) return '<div class="text-muted">Добавьте расходы, чтобы увидеть диаграммы</div>';
        var maxVal = Math.max.apply(null, cats.map(function(c) { return byCat[c]; }));
        var colors = ['#7A9B6D', '#5C7A52', '#A8C99A', '#8FBC8F', '#6B8E6B', '#C4A35A', '#D4A574', '#8B6F47'];

        var bars = cats.map(function(c, i) {
            var h = maxVal ? Math.round((byCat[c] / maxVal) * 100) : 0;
            return '<div class="bar-col"><div class="bar-value">' + Math.round(byCat[c]).toLocaleString('ru-RU') + '</div>' +
                '<div class="bar-fill" style="height:' + h + '%;background:' + colors[i % colors.length] + ';"></div>' +
                '<div class="bar-label">' + c + '</div></div>';
        }).join('');

        var w = 280, h = 120, pad = 20;
        var points = cats.map(function(c, i) {
            var x = pad + (cats.length === 1 ? w / 2 : i * ((w - pad * 2) / Math.max(1, cats.length - 1)));
            var y = h - pad - (maxVal ? (byCat[c] / maxVal) * (h - pad * 2) : 0);
            return x + ',' + y;
        });
        var circles = cats.map(function(c, i) {
            var x = pad + (cats.length === 1 ? w / 2 : i * ((w - pad * 2) / Math.max(1, cats.length - 1)));
            var y = h - pad - (maxVal ? (byCat[c] / maxVal) * (h - pad * 2) : 0);
            return '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + colors[i % colors.length] + '"/>';
        }).join('');
        var lineSvg = '<svg viewBox="0 0 ' + w + ' ' + h + '"><polyline fill="none" stroke="#7A9B6D" stroke-width="2.5" points="' + points.join(' ') + '"/>' + circles + '</svg>';

        var acc = 0;
        var gradientParts = [];
        cats.forEach(function(c, i) {
            var pct = totalExpense ? (byCat[c] / totalExpense) * 100 : 0;
            gradientParts.push(colors[i % colors.length] + ' ' + acc + '% ' + (acc + pct) + '%');
            acc += pct;
        });
        var legend = cats.map(function(c, i) {
            var pct = totalExpense ? Math.round((byCat[c] / totalExpense) * 100) : 0;
            return '<div class="pie-legend-item"><span class="pie-dot" style="background:' + colors[i % colors.length] + ';"></span>' + c + ' — ' + pct + '% (' + Finance.money(Math.round(byCat[c])) + ')</div>';
        }).join('');

        return '<div class="chart-container">' +
            '<div class="chart-box"><h4>📊 Столбчатая</h4><div class="bar-chart">' + bars + '</div></div>' +
            '<div class="chart-box"><h4>📈 Линейная</h4><div class="line-chart">' + lineSvg + '</div></div>' +
            '<div class="chart-box"><h4>🥧 Круговая</h4><div class="pie-chart" style="background:conic-gradient(' + gradientParts.join(', ') + ');width:140px;height:140px;border-radius:50%;margin:0 auto;"></div><div class="pie-legend">' + legend + '</div></div>' +
            '</div>';
    },

    renderOverview: function(container) {
        var data = this.getMonthData();
        var byCat = {};
        (data.expenses || []).forEach(function(e) {
            byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);
        });
        var budget = Storage.getBudget();
        var totalExp = 0;
        Object.keys(byCat).forEach(function(k) { totalExp += byCat[k]; });
        var chartsHtml = this.renderCharts(byCat, totalExp);

        var catHtml = '';
        Object.keys(byCat).forEach(function(cat) {
            var sum = byCat[cat];
            catHtml += '<div class="flex-between mb-8"><span>' + cat + '</span><strong>' + Finance.money(sum) + '</strong></div>';
            catHtml += '<div class="progress-bar mb-12"><div class="progress-fill" style="width:' + Math.min(100, (sum / (budget.monthly || 1)) * 100) + '%"></div></div>';
        });
        if (!Object.keys(byCat).length) catHtml = '<div class="text-muted">Нет расходов за этот месяц</div>';

        container.innerHTML =
            '<div class="card mb-16"><h3 class="mb-16">Бюджет на месяц</h3>' +
            '<div class="form-group"><input type="number" class="form-control" id="budgetInput" value="' + (budget.monthly || 50000) + '" style="max-width:200px;">' +
            '<button class="btn btn-primary btn-sm mt-8" id="saveBudgetBtn">Сохранить</button></div></div>' +
            '<div class="card mb-16"><h3 class="mb-16">Расходы по категориям</h3>' + catHtml + '</div>' +
            '<div class="card"><h3 class="mb-16">Диаграммы расходов</h3>' + chartsHtml + '</div>';

        var saveBtn = document.getElementById('saveBudgetBtn');
        if (saveBtn) saveBtn.onclick = function() { Finance.saveBudget(); };
    },

    saveBudget: function() {
        var val = Number(document.getElementById('budgetInput').value) || 0;
        var budget = Storage.getBudget();
        budget.monthly = val;
        Storage.saveBudget(budget);
        this.render();
        App.showToast('Бюджет сохранён');
    },

    renderIncome: function(container) {
        var incomes = Storage.getIncomes().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
        var html = '<button class="btn btn-primary mb-16" id="addIncomeBtn">+ Доход</button>';
        if (!incomes.length) html += '<div class="empty-state"><div class="icon">💰</div><h3>Нет доходов</h3></div>';
        else {
            incomes.forEach(function(i) {
                html += '<div class="list-item"><div><strong>' + i.name + '</strong><div class="text-muted" style="font-size:0.85rem;">' + i.date + ' · ' + (i.category || '') + '</div></div>' +
                    '<strong style="color:var(--green-main);">+' + Finance.money(i.amount) + '</strong>' +
                    '<div class="actions"><button class="btn btn-sm btn-danger" data-del-income="' + i.id + '">🗑</button></div></div>';
            });
        }
        container.innerHTML = html;
        var addBtn = document.getElementById('addIncomeBtn');
        if (addBtn) addBtn.onclick = function() { Finance.showIncomeForm(); };
        container.onclick = function(e) {
            var del = e.target.closest('[data-del-income]');
            if (del) Finance.removeIncome(del.getAttribute('data-del-income'));
        };
    },

    showIncomeForm: function() {
        App.openModal(
            '<div class="modal-header"><h2>Добавить доход</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Источник</label><input class="form-control" id="incName"></div>' +
            '<div class="form-group"><label>Сумма</label><input type="number" class="form-control" id="incAmount"></div>' +
            '<div class="form-group"><label>Дата</label><input type="date" class="form-control" id="incDate" value="' + new Date().toISOString().slice(0, 10) + '"></div>' +
            '<div class="form-group"><label>Категория</label><select class="form-control" id="incCat"><option>Зарплата</option><option>Фриланс</option><option>Подарок</option><option>Другое</option></select></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="mSave">Сохранить</button></div>'
        );
        document.getElementById('mClose').onclick = function() { App.closeModal(); };
        document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('mSave').onclick = function() { Finance.saveIncome(); };
    },

    saveIncome: function() {
        var name = document.getElementById('incName').value.trim();
        var amount = Number(document.getElementById('incAmount').value);
        if (!name || !amount) { App.showToast('Заполните поля', 'error'); return; }
        var incomes = Storage.getIncomes();
        incomes.push({ id: Storage.generateId(), name: name, amount: amount, date: document.getElementById('incDate').value, category: document.getElementById('incCat').value });
        Storage.saveIncomes(incomes);
        App.closeModal();
        this.render();
        App.showToast('Доход добавлен');
    },

    removeIncome: function(id) {
        if (!App.confirm('Удалить?')) return;
        Storage.saveIncomes(Storage.getIncomes().filter(function(i) { return i.id !== id; }));
        this.render();
        App.showToast('Удалено');
    },

    renderExpense: function(container) {
        var expenses = Storage.getExpenses().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
        var html = '<button class="btn btn-primary mb-16" id="addExpenseBtn">+ Расход</button>';
        if (!expenses.length) html += '<div class="empty-state"><div class="icon">🛒</div><h3>Нет расходов</h3></div>';
        else {
            expenses.forEach(function(e) {
                html += '<div class="list-item"><div><strong>' + e.name + '</strong><div class="text-muted" style="font-size:0.85rem;">' + e.date + ' · ' + (e.category || '') + '</div></div>' +
                    '<strong style="color:#C45C5C;">-' + Finance.money(e.amount) + '</strong>' +
                    '<div class="actions"><button class="btn btn-sm btn-danger" data-del-expense="' + e.id + '">🗑</button></div></div>';
            });
        }
        container.innerHTML = html;
        var addBtn = document.getElementById('addExpenseBtn');
        if (addBtn) addBtn.onclick = function() { Finance.showExpenseForm(); };
        container.onclick = function(e) {
            var del = e.target.closest('[data-del-expense]');
            if (del) Finance.removeExpense(del.getAttribute('data-del-expense'));
        };
    },

    showExpenseForm: function() {
        var cats = ['Продукты', 'Транспорт', 'Покупки', 'Развлечения', 'Образование', 'Здоровье', 'Дом', 'Другое'];
        App.openModal(
            '<div class="modal-header"><h2>Добавить расход</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Название</label><input class="form-control" id="expName"></div>' +
            '<div class="form-group"><label>Сумма</label><input type="number" class="form-control" id="expAmount"></div>' +
            '<div class="form-group"><label>Дата</label><input type="date" class="form-control" id="expDate" value="' + new Date().toISOString().slice(0, 10) + '"></div>' +
            '<div class="form-group"><label>Категория</label><select class="form-control" id="expCat">' + cats.map(function(c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="mSave">Сохранить</button></div>'
        );
        document.getElementById('mClose').onclick = function() { App.closeModal(); };
        document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('mSave').onclick = function() { Finance.saveExpense(); };
    },

    saveExpense: function() {
        var name = document.getElementById('expName').value.trim();
        var amount = Number(document.getElementById('expAmount').value);
        if (!name || !amount) { App.showToast('Заполните поля', 'error'); return; }
        var expenses = Storage.getExpenses();
        expenses.push({ id: Storage.generateId(), name: name, amount: amount, date: document.getElementById('expDate').value, category: document.getElementById('expCat').value });
        Storage.saveExpenses(expenses);
        App.closeModal();
        this.render();
        App.showToast('Расход добавлен');
    },

    removeExpense: function(id) {
        if (!App.confirm('Удалить?')) return;
        Storage.saveExpenses(Storage.getExpenses().filter(function(e) { return e.id !== id; }));
        this.render();
        App.showToast('Удалено');
    },

    renderSavings: function(container) {
        var goals = Storage.getSavingsGoals();
        var html = '<button class="btn btn-primary mb-16" id="addGoalBtn">+ Цель накопления</button>';
        if (!goals.length) html += '<div class="empty-state"><div class="icon">🏦</div><h3>Нет целей</h3></div>';
        else {
            goals.forEach(function(g) {
                var pct = Math.min(100, Math.round((g.current / g.target) * 100));
                html += '<div class="card mb-16"><div class="flex-between"><h3>' + g.name + '</h3><button class="btn btn-sm btn-danger" data-del-goal="' + g.id + '">🗑</button></div>' +
                    '<div class="stat mt-8">' + Finance.money(g.current) + ' / ' + Finance.money(g.target) + '</div>' +
                    '<div class="progress-bar mt-8"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
                    '<div class="text-muted mt-8">' + pct + '% · Срок: ' + (g.deadline || '—') + '</div>' +
                    '<button class="btn btn-sm btn-secondary mt-8" data-add-goal="' + g.id + '">+ Пополнить</button></div>';
            });
        }
        container.innerHTML = html;
        var addBtn = document.getElementById('addGoalBtn');
        if (addBtn) addBtn.onclick = function() { Finance.showGoalForm(); };
        container.onclick = function(e) {
            var del = e.target.closest('[data-del-goal]');
            if (del) Finance.removeGoal(del.getAttribute('data-del-goal'));
            var add = e.target.closest('[data-add-goal]');
            if (add) Finance.addToGoal(add.getAttribute('data-add-goal'));
        };
    },

    showGoalForm: function() {
        App.openModal(
            '<div class="modal-header"><h2>Новая цель</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Название</label><input class="form-control" id="goalName"></div>' +
            '<div class="form-group"><label>Необходимая сумма</label><input type="number" class="form-control" id="goalTarget"></div>' +
            '<div class="form-group"><label>Текущие накопления</label><input type="number" class="form-control" id="goalCurrent" value="0"></div>' +
            '<div class="form-group"><label>Срок</label><input type="date" class="form-control" id="goalDeadline"></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="mSave">Сохранить</button></div>'
        );
        document.getElementById('mClose').onclick = function() { App.closeModal(); };
        document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('mSave').onclick = function() { Finance.saveGoal(); };
    },

    saveGoal: function() {
        var name = document.getElementById('goalName').value.trim();
        var target = Number(document.getElementById('goalTarget').value);
        if (!name || !target) { App.showToast('Заполните поля', 'error'); return; }
        var goals = Storage.getSavingsGoals();
        goals.push({ id: Storage.generateId(), name: name, target: target, current: Number(document.getElementById('goalCurrent').value) || 0, deadline: document.getElementById('goalDeadline').value });
        Storage.saveSavingsGoals(goals);
        App.closeModal();
        this.render();
        App.showToast('Цель создана');
    },

    addToGoal: function(id) {
        var amount = prompt('Сумма пополнения:');
        if (!amount || isNaN(amount)) return;
        var goals = Storage.getSavingsGoals();
        var g = goals.find(function(x) { return x.id === id; });
        if (g) {
            g.current = Number(g.current) + Number(amount);
            Storage.saveSavingsGoals(goals);
            this.render();
            App.showToast('Пополнено');
        }
    },

    removeGoal: function(id) {
        if (!App.confirm('Удалить цель?')) return;
        Storage.saveSavingsGoals(Storage.getSavingsGoals().filter(function(g) { return g.id !== id; }));
        this.render();
        App.showToast('Удалено');
    }
};
