// Life Flow - Lazy script loader (works with file:// and http://)
window.LFLoader = {
    loaded: {},
    loading: {},

    loadScript: function(src) {
        var self = this;
        if (self.loaded[src]) return Promise.resolve();
        if (self.loading[src]) return self.loading[src];
        self.loading[src] = new Promise(function(resolve, reject) {
            var s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = function() {
                self.loaded[src] = true;
                delete self.loading[src];
                resolve();
            };
            s.onerror = function() {
                delete self.loading[src];
                reject(new Error('Failed to load ' + src));
            };
            document.head.appendChild(s);
        });
        return self.loading[src];
    },

    loadMany: function(srcs) {
        var self = this;
        return srcs.reduce(function(chain, src) {
            return chain.then(function() { return self.loadScript(src); });
        }, Promise.resolve());
    },

    // Section -> scripts (order matters)
    sectionScripts: {
        dashboard: [],
        calendar: ['js/modules/calendar.js'],
        habits: ['js/modules/habits.js'],
        skills: ['js/modules/skills.js'],
        nutrition: ['js/modules/nutrition.js'],
        finance: ['js/modules/finance.js'],
        fitness: ['js/modules/fitness.js'],
        interests: ['js/modules/interests.js'],
        planner: ['js/modules/planner.js'],
        notes: ['js/modules/notes.js'],
        library: ['js/features/library.js', 'js/features/library-reader.js'],
        emotions: ['js/features/emotions.js'],
        settings: ['js/features/settings.js']
    },

    ensureSection: function(section) {
        var list = this.sectionScripts[section] || [];
        return this.loadMany(list);
    },

    ensureBooksText: function() {
        if (window.__LF_BOOKS && Object.keys(window.__LF_BOOKS).length) {
            return Promise.resolve();
        }
        return this.loadScript('assets/books/all-ru-books.js');
    }
};
