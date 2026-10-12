var CACHE = 'my-calendar-v12';
var ASSETS = [
  './',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/lunar.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS).catch(function () { }); })
      .then(function () { return self.skipWaiting(); })
  );
});
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
/* 网络优先：在线时总能拿到最新版（否则老缓存会把 bug 一直留在用户手机上），
   断网时回退到缓存，保证离线还能用。 */
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;
  var p = url.pathname;
  var isDoc = e.request.mode === 'navigate' || p.slice(-5) === '.html' || p.slice(-1) === '/';
  var isAsset = /\.(css|js|webmanifest|json|png|svg)$/.test(p);

  if (isDoc || isAsset) {
    e.respondWith(
      fetch(e.request).then(function (resp) {
        if (resp && resp.ok) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return resp;
      }).catch(function () {
        return caches.match(e.request).then(function (hit) {
          return hit || (isDoc ? caches.match('index.html') : null) || Response.error();
        });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (hit) { return hit || fetch(e.request); })
  );
});
