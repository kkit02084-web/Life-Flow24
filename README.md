# Life Flow

Личный органайзер жизни (HTML + CSS + JavaScript).

## Как открыть в Visual Studio / VS Code

1. **File → Open Folder** → выберите папку `Life-Flow` (не один файл).
2. Откройте `index.html`.
3. Рекомендуется расширение **Live Server**:
   - ПКМ по `index.html` → **Open with Live Server**
4. Либо просто откройте `index.html` в браузере (двойной клик).

## Структура проекта

```
Life-Flow/
├── index.html              ← главная страница (оболочка)
├── css/
│   ├── variables.css       ← цвета и переменные
│   ├── style.css           ← базовые стили
│   ├── components.css      ← кнопки, карточки, формы
│   ├── responsive.css      ← мобильная вёрстка
│   ├── themes.css          ← светлая/тёмная тема
│   └── sections/           ← стили разделов
│       ├── books.css
│       └── calendar.css
├── js/
│   ├── core/               ← ядро приложения
│   │   ├── storage.js      ← LocalStorage
│   │   ├── loader.js       ← загрузчик модулей
│   │   └── app.js          ← навигация, главная
│   ├── modules/            ← основные разделы
│   │   ├── calendar.js
│   │   ├── habits.js
│   │   ├── skills.js
│   │   ├── nutrition.js
│   │   ├── finance.js
│   │   ├── fitness.js
│   │   ├── interests.js
│   │   ├── planner.js
│   │   └── notes.js
│   └── features/           ← доп. функции
│       ├── library.js
│       ├── library-reader.js
│       ├── emotions.js
│       ├── settings.js
│       └── reminders.js
├── data/                   ← описание данных
├── assets/
│   ├── images/
│   └── books/              ← тексты книг (all-ru-books.js)
└── html/sections/          ← заготовка под HTML-фрагменты
```

## Важно

- Открывайте **папку** проекта, а не отдельный файл — иначе пути к CSS/JS могут «ломаться».
- Данные пользователя хранятся в LocalStorage браузера (префикс `lifeflow_`).
- Книги подгружаются из `assets/books/all-ru-books.js`.
