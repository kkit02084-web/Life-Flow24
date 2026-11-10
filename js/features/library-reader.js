// Life Flow - Online Public Domain Reader
window.LibraryReader = {
    open: false,
    bookId: null,
    chapters: [],
    chapterIndex: 0,
    pageIndex: 0,
    pages: [],
    charsPerPage: 2000,
    loading: false,

    // bookId -> local asset path (public domain texts bundled with app)
    textSources: {
        b6:  { lang: 'ru' },
        b70: { lang: 'ru' },
        b71: { lang: 'ru' },
        b72: { lang: 'ru' },
        b73: { lang: 'ru' },
        b74: { lang: 'ru' },
        b75: { lang: 'ru' },
        b76: { lang: 'ru' }
    },

    isReadable: function(bookId) {
        return !!(this.textSources[bookId]);
    },

    getSource: function(bookId) {
        return this.textSources[bookId] || null;
    },

    openBook: function(bookId) {
        if (!this.isReadable(bookId)) {
            App.showToast('Полный текст этой книги пока недоступен в приложении', 'error');
            return;
        }
        var self = this;
        this.bookId = bookId;
        this.loading = true;
        this.open = true;
        this.showLoadingShell(bookId);

        // status -> reading
        var my = Storage.getMyBooks();
        var idx = my.findIndex(function(x) { return x.bookId === bookId; });
        if (idx < 0) {
            my.push({
                bookId: bookId, status: 'reading', favorite: false,
                currentPage: 0, totalPages: 0,
                startDate: new Date().toISOString().slice(0, 10),
                endDate: '', rating: 0, review: '', note: '',
                addedAt: new Date().toISOString(),
                chapterIndex: 0, pageIndex: 0, percent: 0,
                lastRead: new Date().toISOString(),
                bookmarks: [], quotes: []
            });
            Storage.saveMyBooks(my);
        } else {
            if (my[idx].status === 'want') my[idx].status = 'reading';
            if (!my[idx].startDate) my[idx].startDate = new Date().toISOString().slice(0, 10);
            if (!my[idx].bookmarks) my[idx].bookmarks = [];
            if (!my[idx].quotes) my[idx].quotes = [];
            Storage.saveMyBooks(my);
        }

        self.loadBookText(bookId, function(err, text) {
            self.loading = false;
            if (err || !text) {
                console.error(err);
                App.showToast('Не удалось загрузить книгу', 'error');
                self.close();
                return;
            }
            text = self.cleanGutenberg(text);
            self.chapters = self.splitChapters(text);
            var progress = self.getProgress(bookId);
            self.chapterIndex = Math.min(progress.chapterIndex || 0, Math.max(0, self.chapters.length - 1));
            self.buildPages();
            self.pageIndex = Math.min(progress.pageIndex || 0, Math.max(0, self.pages.length - 1));
            self.render();
        });
    },

    cleanGutenberg: function(text) {
        text = (text || '').replace(/\r\n/g, '\n');
        // Strip Gutenberg header/footer
        var startMarkers = [
            '*** START OF THE PROJECT GUTENBERG',
            '*** START OF THIS PROJECT GUTENBERG',
            '***START OF THE PROJECT GUTENBERG'
        ];
        var endMarkers = [
            '*** END OF THE PROJECT GUTENBERG',
            '*** END OF THIS PROJECT GUTENBERG',
            '***END OF THE PROJECT GUTENBERG'
        ];
        var start = 0;
        for (var i = 0; i < startMarkers.length; i++) {
            var s = text.indexOf(startMarkers[i]);
            if (s >= 0) {
                var nl = text.indexOf('\n', s);
                start = nl >= 0 ? nl + 1 : s;
                break;
            }
        }
        var end = text.length;
        for (var j = 0; j < endMarkers.length; j++) {
            var e = text.indexOf(endMarkers[j]);
            if (e >= 0) { end = e; break; }
        }
        return text.slice(start, end).trim();
    },

    


    loadBookText: function(bookId, cb) {
        var self = this;
        function done() {
            window.__LF_BOOKS = window.__LF_BOOKS || {};
            var text = window.__LF_BOOKS[bookId] || '';
            if (text && String(text).length > 50) cb(null, text);
            else cb(new Error('text missing for ' + bookId));
        }
        if (window.__LF_BOOKS && window.__LF_BOOKS[bookId]) {
            done();
            return;
        }
        if (window.LFLoader) {
            LFLoader.ensureBooksText().then(done).catch(function(e) { cb(e); });
        } else {
            var s = document.createElement('script');
            s.src = 'assets/books/all-ru-books.js';
            s.onload = done;
            s.onerror = function() { cb(new Error('books load failed')); };
            document.head.appendChild(s);
        }
    },


showLoadingShell: function(bookId) {
        var book = Library.getBook(bookId);
        var existing = document.getElementById('readerShell');
        if (existing) existing.remove();
        var shell = document.createElement('div');
        shell.id = 'readerShell';
        shell.className = 'reader-shell';
        shell.innerHTML = '<div class="reader-topbar"><button type="button" class="btn btn-sm btn-secondary" id="readerClose">← Назад</button>' +
            '<div class="reader-title-wrap"><strong>' + (book ? book.title : 'Загрузка…') + '</strong></div></div>' +
            '<div class="reader-text-wrap" style="display:flex;align-items:center;justify-content:center;"><p>Загрузка текста…</p></div>';
        document.body.appendChild(shell);
        document.getElementById('readerClose').onclick = function() { LibraryReader.close(); };
    },

    splitChapters: function(text) {
        text = (text || '').trim();
        if (!text) return [{ title: 'Текст', body: '' }];
        var re = /(?:^|\n)((?:CHAPTER|Chapter|CHAPTER\s+[IVXLC\d]+|Chapter\s+\d+|ACT\s+[IVXLC]+|SCENE\s+[IVXLC\d]+|Глава\s+[^\n]{0,60}|LETTER\s+\d+|Letter\s+\d+)\b[^\n]{0,60})\n/g;
        var titles = [], indices = [], match;
        while ((match = re.exec(text)) !== null) {
            indices.push(match.index + (match[0][0] === '\n' ? 1 : 0));
            titles.push(match[1].trim());
        }
        if (indices.length < 2) {
            // Split by size into sections
            var chunks = [], start = 0, n = 1;
            while (start < text.length) {
                var end = Math.min(text.length, start + 10000);
                if (end < text.length) {
                    var cut = text.lastIndexOf('\n\n', end);
                    if (cut > start + 3000) end = cut;
                }
                chunks.push({ title: 'Часть ' + n, body: text.slice(start, end).trim() });
                start = end; n++;
            }
            return chunks.length ? chunks : [{ title: 'Полный текст', body: text }];
        }
        var parts = [];
        if (indices[0] > 100) {
            var pre = text.slice(0, indices[0]).trim();
            if (pre) parts.push({ title: 'Предисловие', body: pre });
        }
        for (var i = 0; i < indices.length; i++) {
            var from = indices[i];
            var to = i + 1 < indices.length ? indices[i + 1] : text.length;
            var body = text.slice(from, to).trim();
            var nl = body.indexOf('\n');
            if (nl > 0) body = body.slice(nl).trim();
            parts.push({ title: titles[i], body: body || '…' });
        }
        return parts;
    },

    buildPages: function() {
        var ch = this.chapters[this.chapterIndex] || { body: '' };
        var body = ch.body || '';
        var size = this.charsPerPage;
        this.pages = [];
        var i = 0;
        while (i < body.length) {
            var end = Math.min(body.length, i + size);
            if (end < body.length) {
                var space = body.lastIndexOf(' ', end);
                var nl = body.lastIndexOf('\n', end);
                var cut = Math.max(space, nl);
                if (cut > i + size * 0.4) end = cut;
            }
            this.pages.push(body.slice(i, end).trim());
            i = end;
        }
        if (!this.pages.length) this.pages = [body || ''];
    },

    getProgress: function(bookId) {
        return Storage.getMyBooks().find(function(x) { return x.bookId === bookId; }) || {
            chapterIndex: 0, pageIndex: 0, percent: 0, bookmarks: [], quotes: []
        };
    },

    saveProgress: function() {
        if (!this.bookId) return;
        var list = Storage.getMyBooks();
        var idx = list.findIndex(function(x) { return x.bookId === LibraryReader.bookId; });
        if (idx < 0) return;
        var totalPages = 0, passed = 0;
        for (var c = 0; c < this.chapters.length; c++) {
            var len = (this.chapters[c].body || '').length;
            var pCount = Math.max(1, Math.ceil(len / this.charsPerPage));
            if (c < this.chapterIndex) passed += pCount;
            if (c === this.chapterIndex) passed += this.pageIndex;
            totalPages += pCount;
        }
        var percent = totalPages ? Math.min(99, Math.round((passed / totalPages) * 100)) : 0;
        if (this.chapterIndex >= this.chapters.length - 1 && this.pageIndex >= this.pages.length - 1) percent = 100;
        list[idx].chapterIndex = this.chapterIndex;
        list[idx].pageIndex = this.pageIndex;
        list[idx].percent = percent;
        list[idx].lastRead = new Date().toISOString();
        list[idx].currentPage = passed + 1;
        list[idx].totalPages = totalPages;
        Storage.saveMyBooks(list);
    },

    close: function() {
        if (this.open && this.chapters.length) this.saveProgress();
        this.open = false;
        this.bookId = null;
        var shell = document.getElementById('readerShell');
        if (shell) shell.remove();
        if (window.Library) Library.render();
    },

    applySettings: function() {
        var s = Storage.getReaderSettings();
        var area = document.getElementById('readerText');
        var shell = document.getElementById('readerShell');
        if (shell) { shell.style.background = s.bg; shell.style.color = s.color; }
        if (area) {
            area.style.fontSize = s.fontSize + 'px';
            area.style.lineHeight = String(s.lineHeight);
            area.style.fontFamily = s.fontFamily === 'serif' ? 'Georgia, "Times New Roman", serif' :
                (s.fontFamily === 'mono' ? '"Courier New", monospace' : 'system-ui, sans-serif');
            area.style.maxWidth = s.maxWidth + 'px';
        }
    },

    setThemePreset: function(name) {
        var presets = {
            light: { bg: '#FFFFFF', color: '#1A1A1A', theme: 'light' },
            dark: { bg: '#1A1A1F', color: '#E8E4D9', theme: 'dark' },
            paper: { bg: '#F7F0E3', color: '#2C2A26', theme: 'paper' }
        };
        var p = presets[name] || presets.paper;
        var s = Storage.getReaderSettings();
        s.bg = p.bg; s.color = p.color; s.theme = p.theme;
        Storage.saveReaderSettings(s);
        this.applySettings();
        this.renderSettingsPanel();
    },

    escapeHtml: function(str) {
        return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    },

    render: function() {
        var book = Library.getBook(this.bookId);
        var author = book && book.authorId ? Library.getAuthor(book.authorId) : null;
        var title = book ? book.title : 'Книга';
        var authorName = author ? author.name : (book && book.authorName) || '';
        var ch = this.chapters[this.chapterIndex] || { title: '', body: '' };
        var pageText = this.pages[this.pageIndex] || '';
        var progress = this.getProgress(this.bookId);

        var existing = document.getElementById('readerShell');
        if (existing) existing.remove();
        var shell = document.createElement('div');
        shell.id = 'readerShell';
        shell.className = 'reader-shell';

        var html = '<div class="reader-topbar">' +
            '<button type="button" class="btn btn-sm btn-secondary" id="readerClose">← Назад</button>' +
            '<div class="reader-title-wrap"><strong>' + title + '</strong><span class="text-muted">' + authorName + '</span></div>' +
            '<button type="button" class="btn btn-sm btn-secondary" id="readerBookmark">🔖</button>' +
            '<button type="button" class="btn btn-sm btn-secondary" id="readerSettingsBtn">Aa</button></div>';
        html += '<div class="reader-settings" id="readerSettingsPanel" style="display:none;"></div>';
        html += '<div class="reader-chapter-bar">' +
            '<button type="button" class="btn btn-sm btn-secondary" id="readerPrevCh">← Глава</button>' +
            '<select id="readerChapterSelect" class="form-control" style="width:auto;max-width:55%;">';
        this.chapters.forEach(function(c, i) {
            html += '<option value="' + i + '"' + (i === LibraryReader.chapterIndex ? ' selected' : '') + '>' + c.title + '</option>';
        });
        html += '</select><button type="button" class="btn btn-sm btn-secondary" id="readerNextCh">Глава →</button></div>';
        html += '<div class="reader-text-wrap"><div class="reader-text" id="readerText">' +
            '<h2 class="reader-ch-title">' + this.escapeHtml(ch.title) + '</h2>' +
            '<div class="reader-body" id="readerBody">' + this.escapeHtml(pageText).replace(/\n/g, '<br>') + '</div></div></div>';
        html += '<div class="reader-toolbar">' +
            '<button type="button" class="btn btn-secondary" id="readerPrevPage">← Назад</button>' +
            '<span class="reader-page-info">Стр. ' + (this.pageIndex + 1) + '/' + this.pages.length +
            ' · Гл. ' + (this.chapterIndex + 1) + '/' + this.chapters.length +
            ' · ' + (progress.percent || 0) + '%</span>' +
            '<button type="button" class="btn btn-primary" id="readerNextPage">Далее →</button></div>';
        html += '<div class="reader-toolbar secondary">' +
            '<button type="button" class="btn btn-sm btn-secondary" id="readerSaveQuote">Сохранить цитату</button>' +
            '<button type="button" class="btn btn-sm btn-secondary" id="readerShowMarks">Закладки и цитаты</button>' +
            '<button type="button" class="btn btn-sm btn-secondary" id="readerMarkRead">Прочитано</button></div>';

        shell.innerHTML = html;
        document.body.appendChild(shell);
        this.bind();
        this.applySettings();
        this.renderSettingsPanel();
    },

    renderSettingsPanel: function() {
        var panel = document.getElementById('readerSettingsPanel');
        if (!panel) return;
        var s = Storage.getReaderSettings();
        panel.innerHTML = '<div class="reader-settings-grid">' +
            '<label>Размер <input type="range" id="rsFontSize" min="14" max="28" value="' + s.fontSize + '"></label>' +
            '<label>Интервал <input type="range" id="rsLine" min="13" max="25" value="' + Math.round(s.lineHeight * 10) + '"></label>' +
            '<label>Ширина <input type="range" id="rsWidth" min="400" max="900" step="20" value="' + s.maxWidth + '"></label>' +
            '<label>Шрифт <select id="rsFont"><option value="serif"' + (s.fontFamily==='serif'?' selected':'') + '>С засечками</option>' +
            '<option value="sans"' + (s.fontFamily==='sans'?' selected':'') + '>Без засечек</option></select></label>' +
            '<div class="flex gap-8"><button type="button" class="btn btn-sm btn-secondary" data-rs-theme="light">Светлая</button>' +
            '<button type="button" class="btn btn-sm btn-secondary" data-rs-theme="paper">Бумага</button>' +
            '<button type="button" class="btn btn-sm btn-secondary" data-rs-theme="dark">Тёмная</button></div></div>';
        var self = this;
        ['rsFontSize','rsLine','rsWidth','rsFont'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.oninput = el.onchange = function() { self.updateSettingsFromUI(); };
        });
        panel.querySelectorAll('[data-rs-theme]').forEach(function(btn) {
            btn.onclick = function() { self.setThemePreset(btn.getAttribute('data-rs-theme')); };
        });
    },

    updateSettingsFromUI: function() {
        var s = Storage.getReaderSettings();
        var fs = document.getElementById('rsFontSize');
        var lh = document.getElementById('rsLine');
        var w = document.getElementById('rsWidth');
        var ff = document.getElementById('rsFont');
        if (fs) s.fontSize = Number(fs.value);
        if (lh) s.lineHeight = Number(lh.value) / 10;
        if (w) s.maxWidth = Number(w.value);
        if (ff) s.fontFamily = ff.value;
        Storage.saveReaderSettings(s);
        this.charsPerPage = Math.round(2200 * (18 / s.fontSize));
        var oldPg = this.pageIndex;
        this.buildPages();
        this.pageIndex = Math.min(oldPg, this.pages.length - 1);
        this.applySettings();
        var body = document.getElementById('readerBody');
        if (body) body.innerHTML = this.escapeHtml(this.pages[this.pageIndex] || '').replace(/\n/g, '<br>');
        this.saveProgress();
    },

    bind: function() {
        var self = this;
        var el = function(id) { return document.getElementById(id); };
        if (el('readerClose')) el('readerClose').onclick = function() { self.close(); };
        if (el('readerSettingsBtn')) el('readerSettingsBtn').onclick = function() {
            var p = el('readerSettingsPanel');
            if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
        };
        if (el('readerPrevCh')) el('readerPrevCh').onclick = function() { self.goChapter(self.chapterIndex - 1); };
        if (el('readerNextCh')) el('readerNextCh').onclick = function() { self.goChapter(self.chapterIndex + 1); };
        if (el('readerChapterSelect')) el('readerChapterSelect').onchange = function() { self.goChapter(Number(el('readerChapterSelect').value)); };
        if (el('readerPrevPage')) el('readerPrevPage').onclick = function() { self.goPage(-1); };
        if (el('readerNextPage')) el('readerNextPage').onclick = function() { self.goPage(1); };
        if (el('readerMarkRead')) el('readerMarkRead').onclick = function() { self.markRead(); };
        if (el('readerBookmark')) el('readerBookmark').onclick = function() { self.addBookmark(); };
        if (el('readerSaveQuote')) el('readerSaveQuote').onclick = function() { self.saveQuote(); };
        if (el('readerShowMarks')) el('readerShowMarks').onclick = function() { self.showMarks(); };
    },

    goChapter: function(i) {
        if (i < 0 || i >= this.chapters.length) return;
        this.chapterIndex = i;
        this.buildPages();
        this.pageIndex = 0;
        this.saveProgress();
        this.render();
    },

    goPage: function(delta) {
        var next = this.pageIndex + delta;
        if (next >= this.pages.length) {
            if (this.chapterIndex < this.chapters.length - 1) {
                this.chapterIndex++; this.buildPages(); this.pageIndex = 0;
            } else {
                this.pageIndex = this.pages.length - 1;
                App.showToast('Конец книги');
            }
        } else if (next < 0) {
            if (this.chapterIndex > 0) {
                this.chapterIndex--; this.buildPages(); this.pageIndex = this.pages.length - 1;
            } else this.pageIndex = 0;
        } else this.pageIndex = next;
        this.saveProgress();
        this.render();
    },

    addBookmark: function() {
        var list = Storage.getMyBooks();
        var idx = list.findIndex(function(x) { return x.bookId === LibraryReader.bookId; });
        if (idx < 0) return;
        if (!list[idx].bookmarks) list[idx].bookmarks = [];
        var ch = this.chapters[this.chapterIndex];
        list[idx].bookmarks.push({
            chapterIndex: this.chapterIndex,
            pageIndex: this.pageIndex,
            title: (ch && ch.title) || ('Глава ' + (this.chapterIndex + 1)),
            date: new Date().toISOString()
        });
        Storage.saveMyBooks(list);
        App.showToast('Закладка сохранена');
    },

    saveQuote: function() {
        var sel = window.getSelection ? String(window.getSelection()) : '';
        if (!sel || sel.length < 3) {
            // save current page excerpt
            sel = (this.pages[this.pageIndex] || '').slice(0, 280);
        }
        if (!sel.trim()) { App.showToast('Выделите текст цитаты', 'error'); return; }
        var list = Storage.getMyBooks();
        var idx = list.findIndex(function(x) { return x.bookId === LibraryReader.bookId; });
        if (idx < 0) return;
        if (!list[idx].quotes) list[idx].quotes = [];
        list[idx].quotes.push({
            text: sel.trim().slice(0, 500),
            chapterIndex: this.chapterIndex,
            pageIndex: this.pageIndex,
            date: new Date().toISOString()
        });
        Storage.saveMyBooks(list);
        App.showToast('Цитата сохранена');
    },

    showMarks: function() {
        var p = this.getProgress(this.bookId);
        var bm = p.bookmarks || [];
        var q = p.quotes || [];
        var html = '<div class="modal-header"><h2>Закладки и цитаты</h2><button class="modal-close" id="mClose">×</button></div>';
        html += '<h4>Закладки</h4>';
        if (!bm.length) html += '<p class="text-muted">Нет закладок</p>';
        bm.forEach(function(b, i) {
            html += '<div class="list-item"><div><strong>' + b.title + '</strong><div class="text-muted" style="font-size:0.8rem;">Стр. главы: ' + ((b.pageIndex||0)+1) + '</div></div>' +
                '<button type="button" class="btn btn-sm btn-primary" data-goto-bm="' + i + '">Перейти</button></div>';
        });
        html += '<h4 class="mt-16">Цитаты</h4>';
        if (!q.length) html += '<p class="text-muted">Нет цитат</p>';
        q.forEach(function(item) {
            html += '<div class="card mb-8" style="padding:12px;"><p style="font-size:0.9rem;">«' + item.text + '»</p></div>';
        });
        html += '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Закрыть</button></div>';
        App.openModal(html);
        document.getElementById('mClose').onclick = function() { App.closeModal(); };
        document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        var self = this;
        document.querySelectorAll('[data-goto-bm]').forEach(function(btn) {
            btn.onclick = function() {
                var b = bm[Number(btn.getAttribute('data-goto-bm'))];
                if (!b) return;
                App.closeModal();
                self.chapterIndex = b.chapterIndex || 0;
                self.buildPages();
                self.pageIndex = Math.min(b.pageIndex || 0, self.pages.length - 1);
                self.saveProgress();
                self.render();
            };
        });
    },

    markRead: function() {
        var list = Storage.getMyBooks();
        var idx = list.findIndex(function(x) { return x.bookId === LibraryReader.bookId; });
        if (idx >= 0) {
            list[idx].status = 'read';
            list[idx].percent = 100;
            list[idx].endDate = new Date().toISOString().slice(0, 10);
            Storage.saveMyBooks(list);
            App.showToast('Отмечено как прочитанное');
        }
        this.close();
    }
};

window.openLifeFlowBook = function(id) { if (window.LibraryReader) LibraryReader.openBook(id); };
