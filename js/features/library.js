// Life Flow - Library Module
window.Library = {
    tab: 'catalog',
    view: 'home', // home | category | author | book | mine
    category: null,
    authorId: null,
    bookId: null,
    mineFilter: 'all',
    searchQ: '',

    categories: [
        'Классическая литература', 'Современная проза', 'Фантастика', 'Фэнтези',
        'Детективы', 'Романтика', 'Ужасы и триллеры', 'Психология', 'Философия',
        'Приключения', 'Научная литература', 'Биографии', 'Поэзия', 'Историческая литература'
    ],

    // Catalog data
    authors: [],
    books: [],

    initCatalog: function() {

        if (this.authors.length) return;
        var A = function(id, name, country, years, bio, genres, cats) {
            return { id: id, name: name, country: country, years: years, bio: bio, genres: genres, categories: cats };
        };
        var B = function(id, authorId, title, year, genre, pages, ann, cats) {
            return { id: id, authorId: authorId, title: title, year: year, genre: genre, pages: pages, annotation: ann, categories: cats, isUser: false };
        };

        this.authors = [
            A('a1','Фёдор Достоевский','Россия','1821–1881','Русский писатель, мыслитель, философ. Один из величайших романистов мировой литературы. Исследовал глубины человеческой психологии и морали.','Психологический роман, философия',['Классическая литература','Философия','Психология']),
            A('a2','Лев Толстой','Россия','1828–1910','Классик русской литературы, автор эпопей и философских трактатов. Размышлял о смысле жизни, войне и мире, семье.','Реализм, эпопея',['Классическая литература','Философия','Историческая литература']),
            A('a3','Александр Пушкин','Россия','1799–1837','Основоположник современной русской литературы, поэт и прозаик. Создал нормы литературного русского языка.','Поэзия, драма, проза',['Классическая литература','Поэзия','Приключения']),
            A('a4','Михаил Булгаков','Россия','1891–1940','Прозаик и драматург. Сочетал сатиру, фантастику и философскую притчу. «Мастер и Маргарита» — вершина его творчества.','Сатира, мистика',['Классическая литература','Фантастика','Философия']),
            A('a5','Антон Чехов','Россия','1860–1904','Мастер короткого рассказа и драмы. Точность детали и психологическая глубина обыденности.','Рассказ, драма',['Классическая литература','Современная проза']),
            A('a6','Джейн Остин','Великобритания','1775–1817','Английская романистка. Ирония, нравы общества и женские судьбы в эпоху регентства.','Роман нравов',['Классическая литература','Романтика']),
            A('a7','Чарльз Диккенс','Великобритания','1812–1870','Один из крупнейших англоязычных романистов. Социальная критика и яркие персонажи.','Реализм, социальный роман',['Классическая литература','Приключения']),
            A('a8','Виктор Гюго','Франция','1802–1885','Французский романтик, поэт и романист. Гуманизм и масштаб исторического повествования.','Романтизм',['Классическая литература','Историческая литература','Приключения']),
            A('a9','Жюль Верн','Франция','1828–1905','Отец научной фантастики. Путешествия, наука и приключения по всему миру.','Научная фантастика, приключения',['Фантастика','Приключения','Научная литература']),
            A('a10','Агата Кристи','Великобритания','1890–1976','Королева детектива. Пуаро, Мисс Марпл и сотни замысловатых загадок.','Детектив',['Детективы']),
            A('a11','Артур Конан Дойл','Великобритания','1859–1930','Создатель Шерлока Холмса. Детективы, приключения и историческая проза.','Детектив, приключения',['Детективы','Приключения']),
            A('a12','Джордж Оруэлл','Великобритания','1903–1950','Писатель и эссеист. Антиутопии о тоталитаризме и языке власти.','Антиутопия, эссе',['Фантастика','Философия','Современная проза']),
            A('a13','Джон Толкин','Великобритания','1892–1973','Филолог и создатель Средиземья. Основоположник современного фэнтези.','Высокое фэнтези',['Фэнтези','Приключения']),
            A('a14','Клайв Льюис','Великобритания','1898–1963','Писатель и христианский мыслитель. Хроники Нарнии и богословские эссе.','Фэнтези, апологетика',['Фэнтези','Философия']),
            A('a15','Фрэнсис Скотт Фицджеральд','США','1896–1940','Голос «века джаза». О богатстве, мечте и разочаровании американского общества.','Модернизм',['Классическая литература','Современная проза','Романтика']),
            A('a16','Эрнест Хемингуэй','США','1899–1961','Лауреат Нобелевской премии. Лаконичный стиль, война, природа и достоинство.','Модернизм',['Классическая литература','Приключения','Современная проза']),
            A('a17','Франц Кафка','Австро-Венгрия','1883–1924','Абсурд бюрократии и одиночество человека. «Превращение», «Процесс».','Абсурдизм',['Классическая литература','Философия','Ужасы и триллеры']),
            A('a18','Габриэль Гарсиа Маркес','Колумбия','1927–2014','Магический реализм. «Сто лет одиночества» изменил мировую прозу.','Магический реализм',['Современная проза','Фантастика','Романтика']),
            A('a19','Харуки Мураками','Япония','1949–','Современный японский прозаик. Сны, одиночество, музыка и параллельные миры.','Магический реализм, современная проза',['Современная проза','Фантастика','Романтика']),
            A('a20','Стивен Кинг','США','1947–','Мастер ужасов и триллеров. Маленькие города, обычные люди и сверхъестественное.','Ужасы, триллер',['Ужасы и триллеры','Фантастика']),
            A('a21','Артур Шопенгауэр','Германия','1788–1860','Философ воли и представления. Влияние на литературу и психологию.','Философия',['Философия']),
            A('a22','Зигмунд Фрейд','Австрия','1856–1939','Основатель психоанализа. Работы о бессознательном, снах и культуре.','Психология',['Психология','Научная литература']),
            A('a23','Мария Монтессори','Италия','1870–1952','Педагог и врач. Система воспитания, ориентированная на ребёнка.','Педагогика',['Научная литература','Биографии']),
            A('a24','Анна Ахматова','Россия','1889–1966','Одна из величайших русских поэтесс XX века. Лирика и «Реквием».','Поэзия',['Поэзия','Классическая литература']),
            
            A('a26','Мэри Шелли','Великобритания','1797–1851','Автор «Франкенштейна», одного из первых научно-фантастических романов.','Готика, фантастика',['Фантастика','Ужасы и триллеры','Классическая литература']),
            A('a27','Льюис Кэрролл','Великобритания','1832–1898','Математик и автор «Алисы в Стране чудес».','Сказка, нонсенс',['Классическая литература','Фэнтези','Приключения']),
            A('a28','Брэм Стокер','Ирландия','1847–1912','Автор романа «Дракула».','Ужасы',['Ужасы и триллеры','Классическая литература']),
            A('a29','Герберт Уэллс','Великобритания','1866–1946','Классик научной фантастики.','Научная фантастика',['Фантастика','Научная литература','Приключения']),
            A('a30','Шарлотта Бронте','Великобритания','1816–1855','Автор «Джейн Эйр».','Роман',['Классическая литература','Романтика']),
            A('a31','Оскар Уайльд','Ирландия','1854–1900','Драматург и прозаик, «Портрет Дориана Грея».','Эстетизм',['Классическая литература','Философия','Ужасы и триллеры']),
            A('a25','Уильям Шекспир','Англия','1564–1616','Драматург и поэт. Трагедии, комедии и сонеты, определившие европейский театр.','Драма, поэзия',['Классическая литература','Поэзия','Романтика'])
        ,

            A('a36','Николай Гоголь','Россия','1809–1852','Классик русской прозы, автор «Шинели» и «Мёртвых душ».','Реализм, сатира',['Классическая литература']),
            A('a37','Иван Тургенев','Россия','1818–1883','Русский прозаик, автор «Муму», «Отцы и дети».','Реализм',['Классическая литература']),
];

        this.books = [
            B('b1','a1','Преступление и наказание',1866,'Роман',672,'Студент Раскольников совершает убийство и проходит через муки совести и искупления.',['Классическая литература','Психология','Философия']),
            B('b2','a1','Идиот',1869,'Роман',640,'Князь Мышкин — «положительно прекрасный человек» в мире расчёта и страстей.',['Классическая литература','Психология']),
            B('b3','a1','Братья Карамазовы',1880,'Роман',800,'Семейная драма, вера, сомнение и суд — вершина творчества Достоевского.',['Классическая литература','Философия','Психология']),
            B('b4','a2','Война и мир',1869,'Роман-эпопея',1274,'Судьбы русских семей на фоне Наполеоновских войн.',['Классическая литература','Историческая литература']),
            B('b5','a2','Анна Каренина',1877,'Роман',864,'Любовь, брак и общество в истории Анны и Левина.',['Классическая литература','Романтика']),
            B('b6','a3','Евгений Онегин',1833,'Роман в стихах',240,'«Энциклопедия русской жизни» в стихах: Онегин, Татьяна и их эпоха.',['Классическая литература','Поэзия','Романтика']),

            B('b70','a1','Белые ночи',1848,'Повесть',120,'Сентиментальный роман о белых ночах Петербурга.',['Классическая литература','Романтика']),
            B('b71','a36','Шинель',1842,'Повесть',80,'История чиновника Башмачкина и его шинели.',['Классическая литература']),
            B('b72','a5','Дама с собачкой',1899,'Рассказ',40,'Любовь Гурова и Анны Сергеевны в Ялте.',['Классическая литература','Романтика']),
            B('b73','a37','Муму',1854,'Рассказ',50,'Герасим и его собака Муму.',['Классическая литература']),
            B('b74','a5','Студент',1894,'Рассказ',10,'Студент духовной академии холодным вечером.',['Классическая литература']),
            B('b75','a5','Ионыч',1898,'Рассказ',40,'Врач Старцев и превращение в Ионыча.',['Классическая литература']),
            B('b76','a5','Тоска',1886,'Рассказ',15,'Извозчик Иона и его горе.',['Классическая литература']),
            B('b7','a3','Капитанская дочка',1836,'Повесть',160,'Пугачёвщина глазами молодого дворянина Гринёва.',['Классическая литература','Историческая литература','Приключения']),
            B('b8','a4','Мастер и Маргарита',1967,'Роман',480,'Дьявол в Москве, любовь Мастера и Маргариты, Понтий Пилат.',['Классическая литература','Фантастика','Философия']),
            B('b9','a4','Собачье сердце',1925,'Повесть',160,'Эксперимент профессора Преображенского и сатира на нэп.',['Классическая литература','Фантастика']),
            B('b10','a5','Вишнёвый сад',1904,'Пьеса',96,'Уходящая эпоха дворянства и продажа родового сада.',['Классическая литература']),
            B('b11','a5','Палата №6',1892,'Повесть',80,'Врач и пациент психиатрической палаты — притча о несвободе.',['Классическая литература','Психология']),
            B('b12','a6','Гордость и предубеждение',1813,'Роман',432,'Элизабет Беннет и мистер Дарси: предрассудки и настоящие чувства.',['Классическая литература','Романтика']),
            B('b13','a6','Разум и чувства',1811,'Роман',384,'Сёстры Дэшвуд и выбор между чувствами и рассудком.',['Классическая литература','Романтика']),
            B('b14','a7','Оливер Твист',1838,'Роман',480,'Сирота в Лондоне, трущобы и надежда на справедливость.',['Классическая литература','Приключения']),
            B('b15','a7','Большие надежды',1861,'Роман',544,'Пип, тайный благодетель и цена амбиций.',['Классическая литература']),
            B('b16','a8','Отверженные',1862,'Роман',1232,'Жан Вальжан, Козетта и Франция XIX века.',['Классическая литература','Историческая литература']),
            B('b17','a8','Собор Парижской Богоматери',1831,'Роман',656,'Квазимодо, Эсмеральда и средневековый Париж.',['Классическая литература','Историческая литература','Романтика']),
            B('b18','a9','Двадцать тысяч льё под водой',1870,'Роман',480,'Капитан Немо и «Наутилус» в глубинах океана.',['Фантастика','Приключения']),
            B('b19','a9','Вокруг света за 80 дней',1873,'Роман',288,'Фогг принимает пари и мчится вокруг земного шара.',['Приключения']),
            B('b20','a9','Путешествие к центру Земли',1864,'Роман',320,'Экспедиция в недра планеты через исландский вулкан.',['Фантастика','Приключения','Научная литература']),
            B('b21','a10','Убийство в «Восточном экспрессе»',1934,'Роман',256,'Пуаро расследует убийство в застрявшем поезде.',['Детективы']),
            B('b22','a10','Десять негритят',1939,'Роман',288,'Десять гостей на острове — и никто не должен выжить.',['Детективы','Ужасы и триллеры']),
            B('b23','a11','Этюд в багровых тонах',1887,'Повесть',160,'Первое появление Шерлока Холмса и доктора Ватсона.',['Детективы']),
            B('b24','a11','Собака Баскервилей',1902,'Роман',256,'Проклятие рода и туманы Дартмура.',['Детективы','Ужасы и триллеры']),
            B('b25','a12','1984',1949,'Роман',320,'Тоталитарное государство, Большой Брат и война с правдой.',['Фантастика','Философия']),
            B('b26','a12','Скотный двор',1945,'Повесть',112,'Аллегория революции: животные свергают хозяина.',['Фантастика','Философия']),
            B('b27','a13','Хоббит',1937,'Повесть',320,'Бильбо Бэггинс отправляется за сокровищами к дракону.',['Фэнтези','Приключения']),
            B('b28','a13','Властелин колец',1954,'Роман',1178,'Кольцо Всевластия и поход к Роковой горе.',['Фэнтези','Приключения']),
            B('b29','a14','Лев, Колдунья и Платяной шкаф',1950,'Повесть',192,'Дети попадают в Нарнию через шкаф.',['Фэнтези']),
            B('b30','a15','Великий Гэтсби',1925,'Роман',180,'Джей Гэтсби, зелёный огонёк и американская мечта.',['Классическая литература','Современная проза','Романтика']),
            B('b31','a16','Старик и море',1952,'Повесть',128,'Рыбак Сантьяго и его поединок с марлином.',['Классическая литература','Приключения']),
            B('b32','a16','Прощай, оружие!',1929,'Роман',352,'Любовь и война на итальянском фронте.',['Классическая литература','Романтика']),
            B('b33','a17','Превращение',1915,'Повесть',80,'Грегор Замза просыпается насекомым.',['Классическая литература','Ужасы и триллеры','Философия']),
            B('b34','a17','Процесс',1925,'Роман',320,'Йозеф К. арестован — но в чём обвинение?',['Классическая литература','Философия']),
            B('b35','a18','Сто лет одиночества',1967,'Роман',416,'Семья Буэндиа и город Макондо.',['Современная проза','Фантастика']),
            B('b36','a19','Норвежский лес',1987,'Роман',384,'Токио, любовь, потеря и взросление.',['Современная проза','Романтика']),
            B('b37','a19','Кафка на пляже',2002,'Роман',512,'Два героя, загадки и параллельные судьбы.',['Современная проза','Фантастика']),
            B('b38','a20','Сияние',1977,'Роман',512,'Отель «Оверлук» и семья Торрансов.',['Ужасы и триллеры']),
            B('b39','a20','Оно',1986,'Роман',1138,'Клоун Пеннивайз и детские страхи Дерри.',['Ужасы и триллеры']),
            B('b40','a21','Мир как воля и представление',1819,'Трактат',688,'Метафизика воли и пессимизм Шопенгауэра.',['Философия']),
            B('b41','a22','Толкование сновидений',1899,'Научный труд',560,'Сон как исполнение желания и ключ к бессознательному.',['Психология','Научная литература']),
            B('b42','a24','Реквием',1963,'Поэма',48,'Память о репрессиях и материнской боли.',['Поэзия','Классическая литература']),
            B('b43','a25','Гамлет',1603,'Трагедия',160,'Принц Датский, месть и «быть или не быть».',['Классическая литература','Поэзия']),
            B('b44','a25','Ромео и Джульетта',1597,'Трагедия',128,'Любовь и вражда двух семей Вероны.',['Классическая литература','Романтика','Поэзия']),
            B('b45','a12','Дорога на причал Уиган',1937,'Документальная проза',240,'Оруэлл о жизни рабочих севера Англии.',['Биографии','Научная литература']),
            B('b46','a2','Смерть Ивана Ильича',1886,'Повесть',96,'Чиновник перед лицом смерти и смысла жизни.',['Классическая литература','Философия','Психология']),
            B('b47','a10','Убийство Роджера Экройда',1926,'Роман',288,'Один из самых неожиданных финалов Кристи.',['Детективы']),
            
            B('b50','a26','Frankenstein',1818,'Роман',280,'Учёный создаёт живое существо из мёртвой материи — и сталкивается с последствиями.',['Фантастика','Ужасы и триллеры','Классическая литература']),
            B('b51','a27','Alice’s Adventures in Wonderland',1865,'Сказка',200,'Алиса проваливается в кроличью нору и попадает в абсурдный мир.',['Классическая литература','Фэнтези','Приключения']),
            B('b52','a28','Dracula',1897,'Роман',400,'Граф Дракула и охота на вампира.',['Ужасы и триллеры','Классическая литература']),
            B('b53','a29','The Time Machine',1895,'Роман',150,'Путешествие в далёкое будущее человечества.',['Фантастика','Научная литература','Приключения']),
            B('b54','a7','A Christmas Carol',1843,'Повесть',100,'Скрудж и духи Рождества.',['Классическая литература']),
            B('b55','a31','The Picture of Dorian Gray',1890,'Роман',250,'Портрет стареет вместо героя.',['Классическая литература','Философия','Ужасы и триллеры']),
            B('b56','a30','Jane Eyre',1847,'Роман',500,'Сирота Джейн Эйр, любовь и независимость.',['Классическая литература','Романтика']),

            B('b57','a11','The Adventures of Sherlock Holmes',1892,'Сборник',350,'Классические рассказы о Холмсе и Ватсоне.',['Детективы','Классическая литература']),
            B('b58','a7','A Tale of Two Cities',1859,'Роман',400,'Лондон и Париж во времена революции.',['Классическая литература','Историческая литература']),
            B('b59','a32','The Wonderful Wizard of Oz',1900,'Сказка',160,'Дороти, Toto и изумрудный город.',['Фэнтези','Приключения','Классическая литература']),
            B('b60','a29','The War of the Worlds',1898,'Роман',200,'Вторжение марсиан на Землю.',['Фантастика','Научная литература']),
            B('b61','a33','Treasure Island',1883,'Роман',280,'Пираты, карта и остров сокровищ.',['Приключения','Классическая литература']),
            B('b62','a34','Little Women',1868,'Роман',450,'Четыре сестры Марч в годы гражданской войны.',['Классическая литература','Романтика']),
            B('b63','a35','The Yellow Wallpaper',1892,'Рассказ',30,'Психологический рассказ о заточении и безумии.',['Классическая литература','Ужасы и триллеры','Психология']),
            B('b48','a13','Сильмариллион',1977,'Сборник',480,'Мифология Средиземья: создание мира и Первая эпоха.',['Фэнтези'])
        ];
    },

    
    
    
    preloadReadableBooks: function() {
        if (!window.LibraryReader) return;
        // preload a few smaller texts in background
        var ids = ['b76', 'b74', 'b72', 'b6', 'b71'];
        ids.forEach(function(id) {
            if (!LibraryReader.isReadable(id)) return;
            if (window.__LF_BOOKS && window.__LF_BOOKS[id]) return;
            var src = LibraryReader.getSource(id);
            if (!src || !src.js) return;
            var s = document.createElement('script');
            s.src = src.js;
            s.async = true;
            document.head.appendChild(s);
        });
    },

    init: function() {
        this.initCatalog();
        if (window.LFLoader) {
            // прогрев текстов книг в фоне после открытия раздела
            setTimeout(function() { LFLoader.ensureBooksText().catch(function(){}); }, 100);
        }
        var self = this;
        setTimeout(function(){ self.preloadReadableBooks(); }, 300);
        
        var self = this;
        document.querySelectorAll('.library-tab').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.library-tab').forEach(function(b) {
                    b.classList.remove('active', 'btn-primary');
                    b.classList.add('btn-secondary');
                });
                btn.classList.add('active', 'btn-primary');
                btn.classList.remove('btn-secondary');
                self.tab = btn.getAttribute('data-lib-tab');
                self.view = self.tab === 'mine' ? 'mine' : 'home';
                self.category = null;
                self.authorId = null;
                self.bookId = null;
                self.render();
            });
        });
    },

    
    hasReadableText: function(bookId) {
        if (window.LibraryReader && typeof LibraryReader.isReadable === 'function') {
            return LibraryReader.isReadable(bookId);
        }
        return false;
    },

    externalLink: function(book) {
        if (!book) return null;
        var map = {
            'b6': 'https://ru.wikisource.org/wiki/%D0%95%D0%B2%D0%B3%D0%B5%D0%BD%D0%B8%D0%B9_%D0%9E%D0%BD%D0%B5%D0%B3%D0%B8%D0%BD',
            'b23': 'https://www.gutenberg.org/ebooks/244',
            'b25': 'https://www.gutenberg.org/ebooks/search/?query=1984',
            'b27': 'https://www.gutenberg.org/ebooks/search/?query=hobbit',
            'b43': 'https://www.gutenberg.org/ebooks/1524',
            'b44': 'https://www.gutenberg.org/ebooks/1112'
        };
        return map[book.id] || null;
    },

    getAuthor: function(id) {
        return this.authors.find(function(a) { return a.id === id; });
    },
    getBook: function(id) {
        var b = this.books.find(function(x) { return x.id === id; });
        if (b) return b;
        return Storage.getUserBooks().find(function(x) { return x.id === id; });
    },
    getAuthorBooks: function(authorId) {
        return this.books.filter(function(b) { return b.authorId === authorId; });
    },
    authorsInCategory: function(cat) {
        var self = this;
        return this.authors.filter(function(a) {
            return (a.categories || []).indexOf(cat) >= 0 ||
                self.books.some(function(b) { return b.authorId === a.id && (b.categories || []).indexOf(cat) >= 0; });
        });
    },

    applyBookOverrides: function() {
        // Re-build from original catalog so repeated renders don't shrink the list
        this.authors = [];
        this.books = [];
        this.initCatalog();
        var o = Storage.get('bookOverrides', {});
        if (o && Object.keys(o).length) {
            this.books = this.books.map(function(b) {
                var ov = o[b.id];
                if (ov && ov._hidden) return null;
                return ov ? Object.assign({}, b, ov) : b;
            }).filter(Boolean);
            Object.keys(o).forEach(function(id) {
                if (o[id] && o[id]._custom && !o[id]._hidden && !Library.books.some(function(b) { return b.id === id; }))
                    Library.books.push(o[id]);
            });
        }
        // Author photo / data overrides
        var ao = Storage.get('authorOverrides', {});
        if (ao && Object.keys(ao).length) {
            this.authors = this.authors.map(function(a) {
                var ov = ao[a.id];
                if (ov && ov._hidden) return null;
                return ov ? Object.assign({}, a, ov) : a;
            }).filter(Boolean);
            Object.keys(ao).forEach(function(id) {
                if (ao[id] && ao[id]._custom && !ao[id]._hidden && !Library.authors.some(function(a) { return a.id === id; }))
                    Library.authors.push(ao[id]);
            });
        }
    },

    authorAvatarHtml: function(a) {
        var photo = a.photo || a.image || '';
        if (photo) {
            return '<div class="lib-avatar lib-avatar-photo" style="background-image:url(\'' + photo.replace(/'/g, "\\'") + '\');background-size:cover;background-position:center;color:transparent;">' + a.name.charAt(0) + '</div>';
        }
        return '<div class="lib-avatar">' + a.name.charAt(0) + '</div>';
    },

    render: function() {
        this.applyBookOverrides();
        var content = document.getElementById('libraryContent');
        if (!content) return;
        if (this.tab === 'mine' || this.view === 'mine') this.renderMine(content);
        else if (this.view === 'book') this.renderBook(content);
        else if (this.view === 'author') this.renderAuthor(content);
        else if (this.view === 'category') this.renderCategory(content);
        else this.renderCatalogHome(content);
    },

    renderCatalogHome: function(container) {
        var self = this;
        var popularAuthors = this.authors.slice(0, 8);
        var popularBooks = this.books.filter(function(b){ return self.hasReadableText(b.id); }).concat(this.books.filter(function(b){ return !self.hasReadableText(b.id); })).slice(0, 12);
        var html = '<div class="form-group"><input type="search" class="form-control" id="libSearch" placeholder="Поиск по названию или автору..." value="' + (this.searchQ || '') + '"></div>';
        if (this.searchQ) {
            html += this.renderSearchResults(this.searchQ);
        } else {
            html += '<h3 class="mb-12">Категории</h3><div class="lib-categories mb-24">';
            this.categories.forEach(function(c) {
                html += '<button type="button" class="lib-cat-chip" data-cat="' + c + '">' + c + '</button>';
            });
            html += '</div>';
            html += '<h3 class="mb-12">Популярные авторы</h3><div class="dashboard-grid mb-24">';
            popularAuthors.forEach(function(a) {
                var n = self.getAuthorBooks(a.id).length;
                html += '<div class="card lib-author-card" data-author="' + a.id + '">' + self.authorAvatarHtml(a) + '<h3>' + a.name + '</h3><div class="text-muted">' + a.country + ' · ' + a.years + '</div><div class="text-muted" style="font-size:0.85rem;">' + n + ' кн.</div></div>';
            });
            html += '</div>';
            var readableBooks = self.books.filter(function(b) { return self.hasReadableText(b.id); });
            html += '<h3 class="mb-12">Доступны для чтения (' + readableBooks.length + ')</h3><div class="dashboard-grid mb-24">';
            readableBooks.forEach(function(b) { html += self.bookCardHtml(b); });
            html += '</div>';
            html += '<h3 class="mb-12">Популярные произведения</h3><div class="dashboard-grid">';
            popularBooks.forEach(function(b) { html += self.bookCardHtml(b); });
            html += '</div>';
        }
        container.innerHTML = html;
        this.bindCatalog(container);
        var search = document.getElementById('libSearch');
        if (search) {
            search.oninput = function() {
                self.searchQ = search.value.trim();
                self.render();
            };
        }
    },

    renderSearchResults: function(q) {
        var self = this;
        var ql = q.toLowerCase();
        var authors = this.authors.filter(function(a) { return a.name.toLowerCase().indexOf(ql) >= 0; });
        var books = this.books.filter(function(b) {
            var a = self.getAuthor(b.authorId);
            return b.title.toLowerCase().indexOf(ql) >= 0 || (a && a.name.toLowerCase().indexOf(ql) >= 0);
        });
        var html = '<div class="mb-12"><button type="button" class="btn btn-sm btn-secondary" data-lib-back="home">← Сбросить поиск</button></div>';
        html += '<h3 class="mb-12">Авторы (' + authors.length + ')</h3>';
        if (!authors.length) html += '<div class="text-muted mb-16">Не найдено</div>';
        else {
            html += '<div class="dashboard-grid mb-24">';
            authors.forEach(function(a) {
                html += '<div class="card lib-author-card" data-author="' + a.id + '">' + self.authorAvatarHtml(a) + '<h3>' + a.name + '</h3><div class="text-muted">' + a.country + '</div></div>';
            });
            html += '</div>';
        }
        html += '<h3 class="mb-12">Книги (' + books.length + ')</h3>';
        if (!books.length) html += '<div class="text-muted">Не найдено</div>';
        else {
            html += '<div class="dashboard-grid">';
            books.forEach(function(b) { html += self.bookCardHtml(b); });
            html += '</div>';
        }
        return html;
    },

    bookCardHtml: function(b) {
        var a = this.getAuthor(b.authorId);
        var authorName = a ? a.name : (b.authorName || '—');
        var readable = this.hasReadableText(b.id);
        var my = this.getMyEntry(b.id);
        var status = my ? this.statusLabel(my.status) : '';
        return '<div class="card lib-book-card">' +
            '<div class="lib-cover" data-book="' + b.id + '">' + (b.title.charAt(0) || '📖') + '</div>' +
            '<h3 data-book="' + b.id + '" style="cursor:pointer;">' + b.title + '</h3>' +
            '<div class="text-muted" style="font-size:0.9rem;">' + authorName + '</div>' +
            '<div class="text-muted" style="font-size:0.8rem;">' + (b.year || '') + ' · ' + (b.genre || '') + (b.pages ? ' · ' + b.pages + ' стр.' : '') + '</div>' +
            (status ? '<div class="mt-8"><span class="badge badge-green">' + status + '</span></div>' : '') +
            '<div class="flex gap-8 mt-12 flex-wrap">' +
            (readable
                ? '<button type="button" class="btn btn-primary btn-sm" data-read-book="' + b.id + '">📖 Читать</button>'
                : '') +
            '<button type="button" class="btn btn-secondary btn-sm" data-book="' + b.id + '">О книге</button>' +
            '<button type="button" class="btn btn-secondary btn-sm" data-add-book="' + b.id + '">В библиотеку</button>' +
            '</div></div>';
    },

    renderCategory: function(container) {
        var self = this;
        var cat = this.category;
        var authors = this.authorsInCategory(cat);
        var q = (this.searchQ || '').toLowerCase();
        if (q) authors = authors.filter(function(a) { return a.name.toLowerCase().indexOf(q) >= 0 || a.country.toLowerCase().indexOf(q) >= 0; });
        var sort = this._authorSort || 'name';
        authors = authors.slice().sort(function(a, b) {
            if (sort === 'country') return a.country.localeCompare(b.country, 'ru');
            if (sort === 'books') return self.getAuthorBooks(b.id).length - self.getAuthorBooks(a.id).length;
            return a.name.localeCompare(b.name, 'ru');
        });

        var html = '<div class="mb-16 flex-between flex-wrap gap-8">' +
            '<button type="button" class="btn btn-sm btn-secondary" data-lib-back="home">← Каталог</button>' +
            '<h2 style="margin:0;">' + cat + '</h2></div>';
        html += '<div class="flex gap-8 mb-16 flex-wrap">' +
            '<input type="search" class="form-control" id="authorSearch" placeholder="Поиск автора..." style="max-width:220px;" value="' + (this.searchQ || '') + '">' +
            '<select class="form-control" id="authorSort" style="width:auto;"><option value="name"' + (sort === 'name' ? ' selected' : '') + '>По имени</option>' +
            '<option value="country"' + (sort === 'country' ? ' selected' : '') + '>По стране</option>' +
            '<option value="books"' + (sort === 'books' ? ' selected' : '') + '>По числу книг</option></select></div>';
        html += '<div class="table-responsive"><table class="lib-table"><thead><tr><th>Автор</th><th>Страна</th><th>Годы</th><th>Книг</th></tr></thead><tbody>';
        if (!authors.length) html += '<tr><td colspan="4" class="text-muted">Авторы не найдены</td></tr>';
        authors.forEach(function(a) {
            var n = self.getAuthorBooks(a.id).length;
            html += '<tr class="lib-author-row" data-author="' + a.id + '" style="cursor:pointer;"><td><strong>' + a.name + '</strong></td><td>' + a.country + '</td><td>' + a.years + '</td><td>' + n + '</td></tr>';
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
        this.bindCatalog(container);
        var as = document.getElementById('authorSearch');
        if (as) as.oninput = function() { self.searchQ = as.value.trim(); self.render(); };
        var sortEl = document.getElementById('authorSort');
        if (sortEl) sortEl.onchange = function() { self._authorSort = sortEl.value; self.render(); };
    },

    renderAuthor: function(container) {
        var self = this;
        var a = this.getAuthor(this.authorId);
        if (!a) { this.view = 'home'; this.render(); return; }
        var books = this.getAuthorBooks(a.id);
        var html = '<div class="mb-16"><button type="button" class="btn btn-sm btn-secondary" data-lib-back="' + (this.category ? 'category' : 'home') + '">← Назад</button></div>';
        html += '<div class="card mb-16"><div class="flex gap-16 flex-wrap" style="align-items:flex-start;">' +
            '' + self.authorAvatarHtml(a).replace('lib-avatar', 'lib-avatar lib-avatar-lg') + '' +
            '<div style="flex:1;min-width:200px;"><h2 style="margin:0 0 8px;">' + a.name + '</h2>' +
            '<div class="text-muted mb-8">' + a.country + ' · ' + a.years + '</div>' +
            '<div class="mb-8"><span class="badge badge-green">' + (a.genres || '') + '</span></div>' +
            '<p style="font-size:0.95rem;line-height:1.5;">' + a.bio + '</p></div></div></div>';
        html += '<h3 class="mb-12">Произведения (' + books.length + ')</h3>';
        books.forEach(function(b) {
            html += '<div class="card mb-12"><div class="flex-between flex-wrap gap-8">' +
                '<div data-book="' + b.id + '" style="cursor:pointer;flex:1;"><strong>' + b.title + '</strong>' +
                '<div class="text-muted" style="font-size:0.85rem;">' + b.year + ' · ' + b.genre + (b.pages ? ' · ' + b.pages + ' стр.' : '') + '</div>' +
                '<p style="font-size:0.9rem;margin-top:6px;">' + (b.annotation || '') + '</p></div>' +
                '<div class="flex gap-8 flex-wrap">' +
                (self.hasReadableText(b.id) ? '<button type="button" class="btn btn-sm btn-primary" data-read-book="' + b.id + '">📖 Читать</button>' : '') +
                '<button type="button" class="btn btn-sm btn-secondary" data-add-book="' + b.id + '">В библиотеку</button></div></div></div>';
        });
        container.innerHTML = html;
        this.bindCatalog(container);
    },

    renderBook: function(container) {
        var b = this.getBook(this.bookId);
        if (!b) { this.view = 'home'; this.render(); return; }
        var a = this.getAuthor(b.authorId);
        var authorName = a ? a.name : (b.authorName || '—');
        var my = this.getMyEntry(b.id);
        var html = '<div class="mb-16"><button type="button" class="btn btn-sm btn-secondary" data-lib-back="' + (this.authorId ? 'author' : (this.category ? 'category' : 'home')) + '">← Назад</button></div>';
        html += '<div class="card mb-16"><div class="flex gap-16 flex-wrap">' +
            '<div class="lib-cover lib-cover-lg">' + (b.title.charAt(0) || '📖') + '</div>' +
            '<div style="flex:1;min-width:200px;"><h2 style="margin:0 0 8px;">' + b.title + '</h2>' +
            '<div class="mb-8"' + (a ? ' data-author="' + a.id + '" style="cursor:pointer;color:var(--green-main);"' : '') + '>' + authorName + '</div>' +
            '<div class="text-muted mb-12">' + (b.year || '—') + ' · ' + (b.genre || '') + (b.pages ? ' · ' + b.pages + ' стр.' : '') + '</div>' +
            '<p style="line-height:1.55;">' + (b.annotation || b.description || 'Описание отсутствует.') + '</p>' +
            '<div class="mt-16 flex gap-8 flex-wrap">' +
            (this.hasReadableText(b.id)
                ? '<button type="button" class="btn btn-primary" data-read-book="' + b.id + '">' + (my && (my.percent > 0 && my.percent < 100) ? 'Продолжить чтение' : 'Читать') + '</button>'
                : '') +
            '<button type="button" class="btn btn-primary" data-add-book="' + b.id + '">' + (my ? 'Изменить статус' : 'Добавить в библиотеку') + '</button>' +
            (my ? '<button type="button" class="btn btn-secondary" data-toggle-fav="' + b.id + '">' + (my.favorite ? '★ В избранном' : '☆ В избранное') + '</button>' : '') +
            
            
            '</div>' +
            (!this.hasReadableText(b.id) ? '<p class="text-muted mt-12" style="font-size:0.85rem;">Полный текст этого произведения пока недоступен для чтения внутри Life Flow (нет легального текста в каталоге приложения).</p>' : '<p class="text-muted mt-12" style="font-size:0.85rem;">✓ Доступен полный текст для чтения в приложении (общественное достояние / Project Gutenberg).</p>') +
            (my && my.percent ? '<div class="mt-12"><div class="progress-bar"><div class="progress-fill" style="width:' + my.percent + '%"></div></div><div class="text-muted" style="font-size:0.85rem;">Прочитано ' + my.percent + '%' + (my.lastRead ? ' · ' + new Date(my.lastRead).toLocaleDateString('ru-RU') : '') + '</div></div>' : '') +
            '</div></div></div>';
        if (my) {
            html += '<div class="card"><h3 class="mb-12">В вашей библиотеке</h3>' +
                '<div class="text-muted">Статус: <strong>' + this.statusLabel(my.status) + '</strong></div>';
            if (my.note) html += '<p class="mt-8">' + my.note + '</p>';
            html += '</div>';
        }
        container.innerHTML = html;
        this.bindCatalog(container);
    },

    statusLabel: function(s) {
        return { want: 'Хочу прочитать', reading: 'Читаю сейчас', read: 'Прочитано' }[s] || s;
    },

    getMyEntry: function(bookId) {
        return Storage.getMyBooks().find(function(x) { return x.bookId === bookId; });
    },

    addToLibrary: function(bookId) {
        var self = this;
        var existing = this.getMyEntry(bookId);
        App.openModal(
            '<div class="modal-header"><h2>Добавить в библиотеку</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<p class="mb-12">Выберите статус:</p>' +
            '<div class="flex gap-8 flex-wrap mb-16">' +
            '<button type="button" class="btn btn-secondary" data-set-status="want">Хочу прочитать</button>' +
            '<button type="button" class="btn btn-secondary" data-set-status="reading">Читаю сейчас</button>' +
            '<button type="button" class="btn btn-secondary" data-set-status="read">Прочитано</button></div>' +
            '<label class="checkbox-wrapper"><input type="checkbox" id="addFav"' + (existing && existing.favorite ? ' checked' : '') + '> <span>Добавить в избранное</span></label>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button></div>'
        );
        document.getElementById('mClose').onclick = function() { App.closeModal(); };
        document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.querySelectorAll('[data-set-status]').forEach(function(btn) {
            btn.onclick = function() {
                var status = btn.getAttribute('data-set-status');
                var fav = document.getElementById('addFav').checked;
                self.saveMyBook(bookId, status, fav);
                App.closeModal();
            };
        });
    },

    saveMyBook: function(bookId, status, favorite) {
        var list = Storage.getMyBooks();
        var idx = list.findIndex(function(x) { return x.bookId === bookId; });
        var book = this.getBook(bookId);
        var entry = {
            bookId: bookId,
            status: status,
            favorite: !!favorite,
            currentPage: idx >= 0 ? (list[idx].currentPage || 0) : 0,
            totalPages: book && book.pages ? book.pages : (idx >= 0 ? list[idx].totalPages : 0),
            startDate: idx >= 0 ? list[idx].startDate : (status === 'reading' || status === 'read' ? new Date().toISOString().slice(0, 10) : ''),
            endDate: status === 'read' ? (idx >= 0 && list[idx].endDate ? list[idx].endDate : new Date().toISOString().slice(0, 10)) : '',
            rating: idx >= 0 ? list[idx].rating : 0,
            review: idx >= 0 ? list[idx].review : '',
            note: idx >= 0 ? list[idx].note : '',
            addedAt: idx >= 0 ? list[idx].addedAt : new Date().toISOString()
        };
        if (idx >= 0) list[idx] = entry;
        else list.push(entry);
        Storage.saveMyBooks(list);
        App.showToast('Сохранено: ' + this.statusLabel(status));
        this.render();
    },

    toggleFav: function(bookId) {
        var list = Storage.getMyBooks();
        var e = list.find(function(x) { return x.bookId === bookId; });
        if (!e) return;
        e.favorite = !e.favorite;
        Storage.saveMyBooks(list);
        this.render();
        App.showToast(e.favorite ? 'В избранном' : 'Убрано из избранного');
    },

    removeMyBook: function(bookId) {
        if (!App.confirm('Удалить книгу из библиотеки?')) return;
        Storage.saveMyBooks(Storage.getMyBooks().filter(function(x) { return x.bookId !== bookId; }));
        App.showToast('Удалено');
        this.render();
    },

    renderMine: function(container) {
        var self = this;
        var list = Storage.getMyBooks();
        var stats = this.calcStats(list);
        var filter = this.mineFilter || 'all';

        var html = '<div class="dashboard-grid mb-16">';
        html += '<div class="dashboard-card"><div class="card-icon">📚</div><h3>Всего</h3><div class="stat">' + stats.total + '</div></div>';
        html += '<div class="dashboard-card"><div class="card-icon">✅</div><h3>Прочитано</h3><div class="stat">' + stats.read + '</div></div>';
        html += '<div class="dashboard-card"><div class="card-icon">📖</div><h3>Читаю</h3><div class="stat">' + stats.reading + '</div></div>';
        html += '<div class="dashboard-card"><div class="card-icon">Wishlist</div><h3>Хочу</h3><div class="stat">' + stats.want + '</div></div>';
        html += '<div class="dashboard-card"><div class="card-icon">📄</div><h3>Страниц</h3><div class="stat">' + stats.pages + '</div></div>';
        html += '<div class="dashboard-card"><div class="card-icon">📅</div><h3>За год</h3><div class="stat">' + stats.year + '</div></div>';
        html += '</div>';

        // simple bar of statuses
        var maxS = Math.max(stats.want, stats.reading, stats.read, 1);
        html += '<div class="card mb-16"><h4 class="mb-12">По статусам</h4><div class="bar-chart" style="height:100px;">' +
            '<div class="bar-col"><div class="bar-value">' + stats.want + '</div><div class="bar-fill" style="height:' + Math.round(stats.want / maxS * 100) + '%;background:#C4A35A;"></div><div class="bar-label">Хочу</div></div>' +
            '<div class="bar-col"><div class="bar-value">' + stats.reading + '</div><div class="bar-fill" style="height:' + Math.round(stats.reading / maxS * 100) + '%;background:#7A9B6D;"></div><div class="bar-label">Читаю</div></div>' +
            '<div class="bar-col"><div class="bar-value">' + stats.read + '</div><div class="bar-fill" style="height:' + Math.round(stats.read / maxS * 100) + '%;background:#5C7A52;"></div><div class="bar-label">Прочитано</div></div>' +
            '<div class="bar-col"><div class="bar-value">' + stats.fav + '</div><div class="bar-fill" style="height:' + Math.round(stats.fav / maxS * 100) + '%;background:#D4A574;"></div><div class="bar-label">Избранное</div></div>' +
            '</div></div>';

        html += '<div class="flex gap-8 mb-16 flex-wrap">' +
            '<button type="button" class="btn btn-sm ' + (filter === 'all' ? 'btn-primary' : 'btn-secondary') + '" data-mine-filter="all">Все</button>' +
            '<button type="button" class="btn btn-sm ' + (filter === 'want' ? 'btn-primary' : 'btn-secondary') + '" data-mine-filter="want">Хочу прочитать</button>' +
            '<button type="button" class="btn btn-sm ' + (filter === 'reading' ? 'btn-primary' : 'btn-secondary') + '" data-mine-filter="reading">Читаю</button>' +
            '<button type="button" class="btn btn-sm ' + (filter === 'read' ? 'btn-primary' : 'btn-secondary') + '" data-mine-filter="read">Прочитано</button>' +
            '<button type="button" class="btn btn-sm ' + (filter === 'favorite' ? 'btn-primary' : 'btn-secondary') + '" data-mine-filter="favorite">Избранное</button>' +
            '<button type="button" class="btn btn-sm btn-primary" id="addUserBookBtn">+ Своя книга</button></div>';

        var filtered = list.filter(function(e) {
            if (filter === 'favorite') return e.favorite;
            if (filter === 'all') return true;
            return e.status === filter;
        });

        if (!filtered.length) {
            html += '<div class="empty-state"><div class="icon">📚</div><h3>Пока пусто</h3><p>Добавьте книги из каталога или создайте свою</p></div>';
        } else {
            filtered.forEach(function(e) {
                var b = self.getBook(e.bookId);
                if (!b) return;
                var a = self.getAuthor(b.authorId);
                var name = a ? a.name : (b.authorName || '');
                var progress = e.totalPages ? Math.min(100, Math.round((e.currentPage || 0) / e.totalPages * 100)) : 0;
                html += '<div class="card mb-12"><div class="flex-between flex-wrap gap-8">' +
                    '<div style="flex:1;cursor:pointer;" data-book="' + b.id + '"><strong>' + (e.favorite ? '★ ' : '') + b.title + '</strong>' +
                    '<div class="text-muted" style="font-size:0.85rem;">' + name + ' · ' + self.statusLabel(e.status) + '</div>';
                if (e.status === 'reading' && e.totalPages) {
                    html += '<div class="progress-bar mt-8"><div class="progress-fill" style="width:' + progress + '%"></div></div>' +
                        '<div class="text-muted" style="font-size:0.8rem;">' + (e.currentPage || 0) + ' / ' + e.totalPages + ' стр. (' + progress + '%)</div>';
                }
                if (e.status === 'read' && e.rating) html += '<div class="mt-4">' + '★'.repeat(e.rating) + '☆'.repeat(5 - e.rating) + '</div>';
                html += '</div><div class="flex gap-8 flex-wrap">' +
                    (self.hasReadableText(b.id) ? '<button type="button" class="btn btn-sm btn-primary" data-read-book="' + b.id + '">📖 Читать</button>' : '') +
                    '<button type="button" class="btn btn-sm btn-secondary" data-edit-my="' + b.id + '">Изменить</button>' +
                    '<button type="button" class="btn btn-sm btn-danger" data-rm-my="' + b.id + '">🗑</button></div></div></div>';
            });
        }
        container.innerHTML = html;
        this.bindCatalog(container);
        var addBtn = document.getElementById('addUserBookBtn');
        if (addBtn) addBtn.onclick = function() { self.showUserBookForm(); };
    },

    calcStats: function(list) {
        var year = new Date().getFullYear();
        var month = new Date().toISOString().slice(0, 7);
        var pages = 0;
        list.forEach(function(e) {
            if (e.status === 'read') pages += Number(e.totalPages) || 0;
            else if (e.status === 'reading') pages += Number(e.currentPage) || 0;
        });
        return {
            total: list.length,
            read: list.filter(function(e) { return e.status === 'read'; }).length,
            reading: list.filter(function(e) { return e.status === 'reading'; }).length,
            want: list.filter(function(e) { return e.status === 'want'; }).length,
            fav: list.filter(function(e) { return e.favorite; }).length,
            pages: pages,
            year: list.filter(function(e) { return e.status === 'read' && e.endDate && e.endDate.indexOf(String(year)) === 0; }).length,
            month: list.filter(function(e) { return e.status === 'read' && e.endDate && e.endDate.indexOf(month) === 0; }).length
        };
    },

    editMyBook: function(bookId) {
        var self = this;
        var e = this.getMyEntry(bookId);
        var b = this.getBook(bookId);
        if (!e || !b) return;
        App.openModal(
            '<div class="modal-header"><h2>' + b.title + '</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Статус</label><select class="form-control" id="myStatus">' +
            '<option value="want"' + (e.status === 'want' ? ' selected' : '') + '>Хочу прочитать</option>' +
            '<option value="reading"' + (e.status === 'reading' ? ' selected' : '') + '>Читаю сейчас</option>' +
            '<option value="read"' + (e.status === 'read' ? ' selected' : '') + '>Прочитано</option></select></div>' +
            '<label class="checkbox-wrapper mb-16"><input type="checkbox" id="myFav"' + (e.favorite ? ' checked' : '') + '> <span>Избранное</span></label>' +
            '<div class="form-group"><label>Текущая страница</label><input type="number" class="form-control" id="myPage" value="' + (e.currentPage || 0) + '" min="0"></div>' +
            '<div class="form-group"><label>Всего страниц</label><input type="number" class="form-control" id="myTotal" value="' + (e.totalPages || b.pages || 0) + '" min="0"></div>' +
            '<div class="form-group"><label>Начало чтения</label><input type="date" class="form-control" id="myStart" value="' + (e.startDate || '') + '"></div>' +
            '<div class="form-group"><label>Окончание</label><input type="date" class="form-control" id="myEnd" value="' + (e.endDate || '') + '"></div>' +
            '<div class="form-group"><label>Оценка (1–5)</label><input type="number" class="form-control" id="myRating" value="' + (e.rating || 0) + '" min="0" max="5"></div>' +
            '<div class="form-group"><label>Отзыв / заметки</label><textarea class="form-control" id="myReview" rows="3">' + (e.review || e.note || '') + '</textarea></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="mSave">Сохранить</button></div>'
        );
        document.getElementById('mClose').onclick = function() { App.closeModal(); };
        document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('mSave').onclick = function() {
            var list = Storage.getMyBooks();
            var idx = list.findIndex(function(x) { return x.bookId === bookId; });
            if (idx < 0) return;
            list[idx].status = document.getElementById('myStatus').value;
            list[idx].favorite = document.getElementById('myFav').checked;
            list[idx].currentPage = Number(document.getElementById('myPage').value) || 0;
            list[idx].totalPages = Number(document.getElementById('myTotal').value) || 0;
            list[idx].startDate = document.getElementById('myStart').value;
            list[idx].endDate = document.getElementById('myEnd').value;
            list[idx].rating = Number(document.getElementById('myRating').value) || 0;
            list[idx].review = document.getElementById('myReview').value;
            list[idx].note = list[idx].review;
            Storage.saveMyBooks(list);
            App.closeModal();
            self.render();
            App.showToast('Обновлено');
        };
    },

    showUserBookForm: function() {
        var self = this;
        App.openModal(
            '<div class="modal-header"><h2>Своя книга</h2><button class="modal-close" id="mClose">×</button></div>' +
            '<div class="form-group"><label>Название</label><input class="form-control" id="ubTitle"></div>' +
            '<div class="form-group"><label>Автор</label><input class="form-control" id="ubAuthor"></div>' +
            '<div class="form-group"><label>Жанр</label><select class="form-control" id="ubGenre">' +
            this.categories.map(function(c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>' +
            '<div class="flex gap-12"><div class="form-group" style="flex:1;"><label>Год</label><input type="number" class="form-control" id="ubYear"></div>' +
            '<div class="form-group" style="flex:1;"><label>Страниц</label><input type="number" class="form-control" id="ubPages"></div></div>' +
            '<div class="form-group"><label>Описание</label><textarea class="form-control" id="ubDesc" rows="3"></textarea></div>' +
            '<div class="form-group"><label>Статус</label><select class="form-control" id="ubStatus">' +
            '<option value="want">Хочу прочитать</option><option value="reading">Читаю</option><option value="read">Прочитано</option></select></div>' +
            '<div class="modal-footer"><button class="btn btn-secondary" id="mCancel">Отмена</button><button class="btn btn-primary" id="mSave">Добавить</button></div>'
        );
        document.getElementById('mClose').onclick = function() { App.closeModal(); };
        document.getElementById('mCancel').onclick = function() { App.closeModal(); };
        document.getElementById('mSave').onclick = function() {
            var title = document.getElementById('ubTitle').value.trim();
            if (!title) { App.showToast('Введите название', 'error'); return; }
            var id = 'u_' + Storage.generateId();
            var userBooks = Storage.getUserBooks();
            userBooks.push({
                id: id, authorId: null, authorName: document.getElementById('ubAuthor').value.trim() || 'Неизвестен',
                title: title, year: Number(document.getElementById('ubYear').value) || null,
                genre: document.getElementById('ubGenre').value, pages: Number(document.getElementById('ubPages').value) || 0,
                annotation: document.getElementById('ubDesc').value, isUser: true, categories: [document.getElementById('ubGenre').value]
            });
            Storage.saveUserBooks(userBooks);
            self.saveMyBook(id, document.getElementById('ubStatus').value, false);
            App.closeModal();
            self.tab = 'mine'; self.view = 'mine';
            document.querySelectorAll('.library-tab').forEach(function(b) {
                var isMine = b.getAttribute('data-lib-tab') === 'mine';
                b.classList.toggle('active', isMine);
                b.classList.toggle('btn-primary', isMine);
                b.classList.toggle('btn-secondary', !isMine);
            });
            self.render();
            App.showToast('Книга добавлена');
        };
    },

    bindCatalog: function(container) {
        var self = this;
        container.onclick = function(e) {
            var back = e.target.closest('[data-lib-back]');
            if (back) {
                var to = back.getAttribute('data-lib-back');
                if (to === 'home') { self.view = 'home'; self.category = null; self.authorId = null; self.bookId = null; self.searchQ = ''; }
                else if (to === 'category') { self.view = 'category'; self.authorId = null; self.bookId = null; }
                else if (to === 'author') { self.view = 'author'; self.bookId = null; }
                self.render();
                return;
            }
            var cat = e.target.closest('[data-cat]');
            if (cat) { self.category = cat.getAttribute('data-cat'); self.view = 'category'; self.searchQ = ''; self.render(); return; }
            var author = e.target.closest('[data-author]');
            if (author) { self.authorId = author.getAttribute('data-author'); self.view = 'author'; self.bookId = null; self.render(); return; }
            var readEarly = e.target.closest('[data-read-book]');
            if (readEarly && window.LibraryReader) { LibraryReader.openBook(readEarly.getAttribute('data-read-book')); return; }
            var book = e.target.closest('[data-book]');
            if (book && !e.target.closest('[data-add-book]') && !e.target.closest('[data-edit-my]') && !e.target.closest('[data-rm-my]') && !e.target.closest('[data-read-book]')) {
                self.bookId = book.getAttribute('data-book');
                self.view = 'book';
                self.render();
                return;
            }
            var add = e.target.closest('[data-add-book]');
            if (add) { self.addToLibrary(add.getAttribute('data-add-book')); return; }
            var fav = e.target.closest('[data-toggle-fav]');
            if (fav) { self.toggleFav(fav.getAttribute('data-toggle-fav')); return; }
            var mf = e.target.closest('[data-mine-filter]');
            if (mf) { self.mineFilter = mf.getAttribute('data-mine-filter'); self.render(); return; }
            var edit = e.target.closest('[data-edit-my]');
            if (edit) { self.editMyBook(edit.getAttribute('data-edit-my')); return; }
            var rm = e.target.closest('[data-rm-my]');
            if (rm) { self.removeMyBook(rm.getAttribute('data-rm-my')); return; }
            var read = e.target.closest('[data-read-book]');
            if (read && window.LibraryReader) { LibraryReader.openBook(read.getAttribute('data-read-book')); return; }
            var up = e.target.closest('[data-upload-book]');
            if (up) {
                var input = document.getElementById('libFileInput');
                if (!input) {
                    input = document.createElement('input');
                    input.type = 'file';
                    input.id = 'libFileInput';
                    input.accept = '.txt,.pdf,.epub,text/plain,application/pdf';
                    input.style.display = 'none';
                    document.body.appendChild(input);
                }
                input.onchange = function() {
                    if (input.files && input.files[0] && window.LibraryReader) {
                        LibraryReader.importFileForBook(up.getAttribute('data-upload-book'), input.files[0]);
                    }
                    input.value = '';
                };
                input.click();
                return;
            }
        };
    }
};
