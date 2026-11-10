# Data layer

Крупные статические данные:
- `assets/books/all-ru-books.js` — тексты книг (ленивая загрузка при открытии «Библиотека» / «Читать»)
- Каталог авторов/книг — `js/library.js` (initCatalog)
- Рецепты/упражнения по умолчанию — `js/storage.js` (initDefaultData), пишутся в LocalStorage один раз

Пользовательские данные всегда в LocalStorage с префиксом `lifeflow_`.
