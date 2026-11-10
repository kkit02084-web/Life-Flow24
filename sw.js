/* Life Flow Service Worker — shell + images offline */
var CACHE_SHELL = 'lifeflow-shell-v4';
var CACHE_ASSETS = 'lifeflow-assets-v4';
var PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/variables.css',
  './css/style.css',
  './css/botanical.css',
  './js/core/idb.js',
  './js/core/storage.js',
  './js/core/supabase-config.js',
  './js/core/cloud.js',
  './js/core/auth-gate.js',
  './js/core/offline-assets.js',
  './js/core/loader.js',
  './js/core/app.js',
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

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_ASSETS).then(function (cache) {
      // addAll fails entirely if one 404 — add one by one
      return Promise.all(PRECACHE.map(function (u) {
        return cache.add(u).catch(function () { return null; });
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== CACHE_SHELL && k !== CACHE_ASSETS;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.hostname.indexOf('supabase') >= 0) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_ASSETS).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match('./index.html').then(function (r) {
          return r || caches.match('index.html');
        });
      })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE_ASSETS).then(function (c) { c.put(req, copy); });
          }
          return res;
        }).catch(function () {
          // try path without leading ./
          return caches.match(url.pathname).then(function (h2) {
            return h2 || Response.error();
          });
        });
      })
    );
  }
});
