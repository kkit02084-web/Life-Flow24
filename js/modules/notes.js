// Life Flow - Notes Module

window.Notes = {
    currentCategory: 'все',
    _pendingImages: [], // data URLs while form open

    init() {
        const addBtn = document.getElementById('addNoteBtn');
        if (addBtn) addBtn.addEventListener('click', () => this.showForm());
        const search = document.getElementById('notesSearch');
        if (search) search.addEventListener('input', () => this.render());
    },

    render() {
        const categories = ['все', 'личное', 'учёба', 'работа', 'идеи', 'проекты', 'покупки', 'другое'];
        const catEl = document.getElementById('notesCategories');
        if (catEl) {
            catEl.innerHTML = categories.map(c =>
                `<button class="btn btn-sm ${this.currentCategory === c ? 'btn-primary' : 'btn-secondary'}" onclick="Notes.filter('${c}')">${c.charAt(0).toUpperCase() + c.slice(1)}</button>`
            ).join('');
        }

        let notes = Storage.getNotes();
        const q = (document.getElementById('notesSearch')?.value || '').toLowerCase();

        if (this.currentCategory !== 'все') {
            notes = notes.filter(n => n.category === this.currentCategory);
        }
        if (q) {
            notes = notes.filter(n => n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q) || (n.tags || []).some(t => t.includes(q)));
        }

        notes.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return (b.updated || b.created || '').localeCompare(a.updated || a.created || '');
        });

        const list = document.getElementById('notesList');
        if (!list) return;
        if (notes.length === 0) {
            list.innerHTML = `<div class="empty-state"><div class="icon">📝</div><h3>Нет заметок</h3><p>Создайте первую заметку</p></div>`;
            return;
        }

        list.innerHTML = notes.map(n => {
            const imgs = n.images || [];
            const imgHtml = imgs.length ? `
                <div class="note-images mt-12" style="display:flex;flex-wrap:wrap;gap:8px;">
                    ${imgs.map(src => `<img src="${src}" alt="" style="width:96px;height:96px;object-fit:cover;border-radius:10px;cursor:pointer;" onclick="Notes.previewImage('${src.replace(/'/g, "\\'")}')">`).join('')}
                </div>` : '';
            return `
            <div class="card mb-12" style="${n.pinned ? 'border-left:4px solid var(--green-main);' : ''}">
                <div class="flex-between">
                    <div>
                        <h3 style="margin:0;">${n.pinned ? '📌 ' : ''}${n.title}</h3>
                        <div class="text-muted" style="font-size:0.85rem;">${n.category || ''} · ${App.formatDate ? App.formatDate(n.updated || n.created) : (n.updated || n.created || '').slice(0,10)}</div>
                    </div>
                    <div class="flex gap-8">
                        <button class="btn btn-sm btn-secondary" onclick="Notes.togglePin('${n.id}')">${n.pinned ? '📌' : '📍'}</button>
                        <button class="btn btn-sm btn-secondary" onclick="Notes.showForm('${n.id}')">✏️</button>
                        <button class="btn btn-sm btn-danger" onclick="Notes.remove('${n.id}')">🗑</button>
                    </div>
                </div>
                <div style="margin-top:10px;font-size:0.95rem;white-space:pre-wrap;">${this.truncate(n.content, 150)}</div>
                ${imgHtml}
                ${n.checklist && n.checklist.length ? `
                    <div class="mt-12">
                        ${n.checklist.map((item, i) => `
                            <label class="checkbox-wrapper" style="margin-bottom:4px;">
                                <input type="checkbox" ${item.done ? 'checked' : ''} onchange="Notes.toggleCheck('${n.id}',${i},this.checked)">
                                <span style="${item.done ? 'text-decoration:line-through;opacity:0.6;' : ''}">${item.text}</span>
                            </label>
                        `).join('')}
                    </div>
                ` : ''}
            </div>`;
        }).join('');
    },

    truncate(str, len) {
        if (!str) return '';
        return str.length > len ? str.slice(0, len) + '…' : str;
    },

    filter(cat) {
        this.currentCategory = cat;
        this.render();
    },

    previewImage(src) {
        App.openModal(`<div class="modal-header"><h2>Фото</h2><button class="modal-close" onclick="App.closeModal()">×</button></div>
            <img src="${src}" alt="" style="width:100%;max-height:70vh;object-fit:contain;border-radius:12px;">
            <div class="modal-footer"><button class="btn btn-secondary" onclick="App.closeModal()">Закрыть</button></div>`);
    },

    showForm(noteId = null) {
        const notes = Storage.getNotes();
        const n = noteId ? notes.find(x => x.id === noteId) : null;
        const cats = ['личное', 'учёба', 'работа', 'идеи', 'проекты', 'покупки', 'другое'];
        this._pendingImages = n && n.images ? n.images.slice() : [];

        App.openModal(`
            <div class="modal-header"><h2>${n ? 'Редактировать заметку' : 'Новая заметка'}</h2><button class="modal-close" onclick="App.closeModal()">×</button></div>
            <div class="form-group"><label>Заголовок</label><input class="form-control" id="noteTitle" value="${n ? this.esc(n.title) : ''}"></div>
            <div class="form-group"><label>Категория</label>
                <select class="form-control" id="noteCat">${cats.map(c => `<option value="${c}" ${n && n.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label>Содержание</label><textarea class="form-control" id="noteContent" rows="5">${n ? this.esc(n.content || '') : ''}</textarea></div>
            <div class="form-group"><label>Фотографии</label>
                <input type="file" class="form-control" id="noteImageFile" accept="image/*" multiple style="margin-bottom:8px;">
                <div id="noteImagesPreview" style="display:flex;flex-wrap:wrap;gap:8px;"></div>
            </div>
            <div class="form-group"><label>Теги (через запятую)</label><input class="form-control" id="noteTags" value="${n && n.tags ? this.esc(n.tags.join(', ')) : ''}"></div>
            <div class="form-group"><label>Чек-лист (каждый пункт с новой строки)</label><textarea class="form-control" id="noteCheck" rows="3">${n && n.checklist ? n.checklist.map(c => c.text).join('\n') : ''}</textarea></div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="App.closeModal()">Отмена</button>
                <button class="btn btn-primary" onclick="Notes.save('${noteId || ''}')">Сохранить</button>
            </div>
        `);
        this._renderImagePreviews();
        const fileInp = document.getElementById('noteImageFile');
        if (fileInp) {
            fileInp.onchange = () => {
                const files = Array.from(fileInp.files || []);
                files.forEach(f => {
                    if (f.size > 2.5 * 1024 * 1024) {
                        App.showToast('Файл больше 2.5 МБ: ' + f.name, 'error');
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                        Notes._pendingImages.push(reader.result);
                        Notes._renderImagePreviews();
                    };
                    reader.readAsDataURL(f);
                });
                fileInp.value = '';
            };
        }
    },

    _renderImagePreviews() {
        const box = document.getElementById('noteImagesPreview');
        if (!box) return;
        if (!this._pendingImages.length) {
            box.innerHTML = '<span class="text-muted" style="font-size:0.85rem;">Пока нет фото — выберите файлы выше</span>';
            return;
        }
        box.innerHTML = this._pendingImages.map((src, i) => `
            <div style="position:relative;">
                <img src="${src}" alt="" style="width:80px;height:80px;object-fit:cover;border-radius:10px;display:block;">
                <button type="button" class="btn btn-sm btn-danger" style="position:absolute;top:2px;right:2px;padding:2px 6px;font-size:0.7rem;" onclick="Notes.removePendingImage(${i})">×</button>
            </div>
        `).join('');
    },

    removePendingImage(i) {
        this._pendingImages.splice(i, 1);
        this._renderImagePreviews();
    },

    esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    save(id) {
        const title = document.getElementById('noteTitle').value.trim();
        if (!title) { App.showToast('Введите заголовок', 'error'); return; }
        const notes = Storage.getNotes();
        const checklistText = document.getElementById('noteCheck').value;
        const checklist = checklistText.split('\n').filter(Boolean).map(text => ({ text, done: false }));

        if (id) {
            const old = notes.find(n => n.id === id);
            if (old && old.checklist) {
                checklist.forEach((item, i) => {
                    if (old.checklist[i] && old.checklist[i].text === item.text) {
                        item.done = old.checklist[i].done;
                    }
                });
            }
        }

        const data = {
            id: id || Storage.generateId(),
            title,
            content: document.getElementById('noteContent').value,
            category: document.getElementById('noteCat').value,
            tags: document.getElementById('noteTags').value.split(',').map(t => t.trim()).filter(Boolean),
            checklist,
            images: this._pendingImages.slice(),
            pinned: id ? (notes.find(n => n.id === id) || {}).pinned : false,
            created: id ? (notes.find(n => n.id === id) || {}).created : new Date().toISOString(),
            updated: new Date().toISOString()
        };

        if (id) {
            const idx = notes.findIndex(n => n.id === id);
            if (idx >= 0) notes[idx] = data;
        } else {
            notes.unshift(data);
        }
        Storage.saveNotes(notes);
        this._pendingImages = [];
        App.closeModal();
        this.render();
        App.showToast('Заметка сохранена');
    },

    togglePin(id) {
        const notes = Storage.getNotes();
        const n = notes.find(x => x.id === id);
        if (n) {
            n.pinned = !n.pinned;
            Storage.saveNotes(notes);
            this.render();
        }
    },

    toggleCheck(noteId, idx, checked) {
        const notes = Storage.getNotes();
        const n = notes.find(x => x.id === noteId);
        if (n && n.checklist && n.checklist[idx]) {
            n.checklist[idx].done = checked;
            n.updated = new Date().toISOString();
            Storage.saveNotes(notes);
            this.render();
        }
    },

    remove(id) {
        if (!App.confirm('Удалить заметку?')) return;
        Storage.saveNotes(Storage.getNotes().filter(n => n.id !== id));
        this.render();
        App.showToast('Удалено');
    }
};
