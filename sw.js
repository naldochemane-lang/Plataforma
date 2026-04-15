// ESESJC — Service Worker (Network-First para HTML)
var CACHE_VERSION = '20260415_v1';
var CACHE_NAME = 'esesjc-v' + CACHE_VERSION;

var STATIC_FILES = [
  './manifest.json'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_FILES).catch(function() {});
    }).then(function() {
      self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(k) {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    }).then(function() {
      self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  var isHTML = url.endsWith('.html') || url.endsWith('/');

  if (isHTML) {
    // Network-first para HTML — garante conteúdo actualizado
    e.respondWith(
      fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return resp;
      }).catch(function() {
        // Offline fallback
        return caches.match(e.request);
      })
    );
  } else {
    // Cache-first para assets (ícones, manifest, etc.)
    e.respondWith(
      caches.match(e.request).then(function(resp) {
        return resp || fetch(e.request).then(function(r) {
          var clone = r.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
          return r;
        });
      })
    );
  }
});
