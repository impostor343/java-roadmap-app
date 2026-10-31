// Service worker: offline-first. Bump CACHE when you upload new files so phones fetch the new versions.
var CACHE = 'bytewise-v14';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'css/styles.css?v=8', 'css/theme.css?v=3', 'css/cur.css?v=12', 'css/home.css?v=4', 'css/progress.css?v=3', 'css/resources.css?v=3', 'js/theme.js?v=3', 'js/native.js?v=3', 'js/util.js?v=10', 'js/icons.js?v=3', 'js/app.js?v=11', 'js/data.js?v=11', 'js/store.js?v=9', 'js/state.js?v=10', 'js/sessionview.js?v=9', 'js/history.js?v=8', 'js/gestures.js?v=2', 'js/home.js?v=11', 'js/navigator.js?v=9', 'js/progress.js?v=11', 'js/projects.js?v=10', 'js/questions.js?v=12', 'js/resources.js?v=3', 'js/settings.js?v=11', 'js/widgets.js?v=2', 'data/curriculum.json', 'data/topic-module-icons.json', 'data/question-bank.json', 'data/topic-projects.json', 'data/free-resources.json', 'fonts/inter-400.woff', 'fonts/inter-600.woff', 'fonts/inter-700.woff', 'fonts/poppins-400.woff', 'fonts/poppins-500.woff', 'fonts/poppins-700.woff', 'fonts/lora-var.woff', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); })); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) { return; }
  e.respondWith(caches.match(r, { ignoreSearch: false }).then(function (hit) {
    if (hit) { return hit; }
    return fetch(r).then(function (res) { if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, copy); }); } return res; })
      .catch(function () { return r.mode === 'navigate' ? caches.match('index.html') : Response.error(); });
  }));
});
