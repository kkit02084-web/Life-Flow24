// Life Flow — offline asset precache (images work without network after first open online)
window.LF_ASSET_LIST = [
  './assets/images/exercises/joga-spina-2.jpg',
  './assets/images/exercises/kardio-kompleks.jpg',
  './assets/images/exercises/meditaciya.jpg',
  './assets/images/exercises/planka.jpg',
  './assets/images/exercises/rastyazhka-posle-2.jpg',
  './assets/images/exercises/rastyazhka-vsego-tela-2.jpg',
  './assets/images/exercises/silovaya.jpg',
  './assets/images/exercises/tancy.jpg',
  './assets/images/exercises/utrennyaya-joga.jpg',
  './assets/images/hero-dark.jpg',
  './assets/images/hero-light.jpg',
  './assets/images/interests/h10.jpg',
  './assets/images/interests/h11.jpg',
  './assets/images/interests/h13.jpg',
  './assets/images/interests/h14.jpg',
  './assets/images/interests/h16.jpg',
  './assets/images/interests/h17.jpg',
  './assets/images/interests/h3.jpg',
  './assets/images/interests/h8.jpg',
  './assets/images/interests/h9.jpg',
  './assets/images/logo.png',
  './assets/images/recipes/avokado-tost.jpg',
  './assets/images/recipes/bliny.jpg',
  './assets/images/recipes/cezar.jpg',
  './assets/images/recipes/chizkejk.jpg',
  './assets/images/recipes/energoshariki.jpg',
  './assets/images/recipes/farshirovannye-percy.jpg',
  './assets/images/recipes/grecheskij.jpg',
  './assets/images/recipes/grechka-ovoshchi.jpg',
  './assets/images/recipes/grechnevyj-salat.jpg',
  './assets/images/recipes/indejka.jpg',
  './assets/images/recipes/jogurt.jpg',
  './assets/images/recipes/kakao.jpg',
  './assets/images/recipes/kapusta.jpg',
  './assets/images/recipes/kotlety.jpg',
  './assets/images/recipes/kurica-ovoshchi.jpg',
  './assets/images/recipes/kurica-zapechennye-ovoshchi.jpg',
  './assets/images/recipes/kurinyj-bulon.jpg',
  './assets/images/recipes/kurinyj-salat.jpg',
  './assets/images/recipes/limonad.jpg',
  './assets/images/recipes/mimoza.jpg',
  './assets/images/recipes/oladi-kabachki.jpg',
  './assets/images/recipes/omlet.jpg',
  './assets/images/recipes/ovsyanka.jpg',
  './assets/images/recipes/pasta.jpg',
  './assets/images/recipes/pshyonka.jpg',
  './assets/images/recipes/ragu.jpg',
  './assets/images/recipes/ris-kurica.jpg',
  './assets/images/recipes/rizotto.jpg',
  './assets/images/recipes/ryba.jpg',
  './assets/images/recipes/salat-svyokla.jpg',
  './assets/images/recipes/skrambl.jpg',
  './assets/images/recipes/smuzi.jpg',
  './assets/images/recipes/sup-pyure.jpg',
  './assets/images/recipes/sup.jpg',
  './assets/images/recipes/syrniki.jpg',
  './assets/images/recipes/tunec.jpg',
  './assets/images/recipes/tvorog-yagody.jpg',
  './assets/images/recipes/tykvennyj-sup.jpg',
  './assets/images/recipes/yablochnyj-pirog.jpg',
  './assets/images/recipes/zapechennye-yabloki.jpg',
  './assets/images/recipes/zapekanka.jpg'
];

window.OfflineAssets = {
  CACHE: 'lifeflow-assets-v2',

  basePrefix: function() {
    // directory of index.html
    var path = location.pathname || '/';
    if (path.endsWith('.html')) path = path.replace(/[^/]+$/, '');
    if (!path.endsWith('/')) path += '/';
    return path;
  },

  resolve: function(src) {
    if (!src) return src;
    if (/^(data:|blob:|https?:|file:)/i.test(src)) return src;
    // normalize assets/... relative to app root
    var s = String(src).replace(/^\.\//, '');
    if (s.indexOf('assets/') === 0 || s.indexOf('icons/') === 0) {
      try {
        return new URL(s, location.href.replace(/[^/]*$/, '')).href;
      } catch (e) {
        return s;
      }
    }
    return src;
  },

  init: async function() {
    // Fix img src attributes that use relative assets paths
    this.rewireImages(document);
    // Observe dynamic content
    var self = this;
    if (window.MutationObserver) {
      var obs = new MutationObserver(function(muts) {
        muts.forEach(function(m) {
          m.addedNodes && m.addedNodes.forEach(function(n) {
            if (n.nodeType === 1) self.rewireImages(n);
          });
        });
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
    }
    // Precache when possible (http/https only; file:// has no SW/cache reliability)
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      this.precacheAll().catch(function(e) { console.warn('precache', e); });
    }
  },

  rewireImages: function(root) {
    var self = this;
    if (!root) return;
    var imgs = root.querySelectorAll ? root.querySelectorAll('img[src]') : [];
    if (root.tagName === 'IMG' && root.getAttribute('src')) imgs = [root];
    imgs.forEach(function(img) {
      var src = img.getAttribute('src');
      if (!src || src.indexOf('data:') === 0 || src.indexOf('blob:') === 0) return;
      var fixed = self.resolve(src);
      if (fixed && fixed !== src) img.setAttribute('src', fixed);
      // offline fallback: if error, try cache path variants
      if (!img.dataset.offlineBound) {
        img.dataset.offlineBound = '1';
        img.addEventListener('error', function() {
          var s = img.getAttribute('src') || '';
          if (s.indexOf('assets/') >= 0 && !img.dataset.triedRel) {
            img.dataset.triedRel = '1';
            var name = s.split('/assets/')[1];
            if (name) img.src = 'assets/' + name;
          }
        });
      }
    });
  },

  precacheAll: async function() {
    if (!('caches' in window)) return;
    var cache = await caches.open(this.CACHE);
    var list = window.LF_ASSET_LIST || [];
    var batch = 8;
    for (var i = 0; i < list.length; i += batch) {
      var slice = list.slice(i, i + batch);
      await Promise.all(slice.map(async function(path) {
        try {
          var req = new Request(path, { cache: 'reload' });
          var hit = await cache.match(req);
          if (hit) return;
          var res = await fetch(req);
          if (res && res.ok) await cache.put(req, res.clone());
        } catch (e) { /* ignore single file */ }
      }));
    }
    console.info('[Life Flow] Offline assets cached:', list.length);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { OfflineAssets.init(); });
} else {
  OfflineAssets.init();
}
