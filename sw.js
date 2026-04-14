// ESESJC — Service Worker (Versão Simples e Robusta)
var CACHE_VERSION = '20250414_v4';
var CACHE_NAME = 'esesjc-v' + CACHE_VERSION;

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll([
        './',
        './index.html',
        './index-modificado.html',
        './manifest.json'
      ]).catch(function() {
        // Ignora erros se algum ficheiro não existir
      });
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
          if (k !== CACHE_NAME) {
            return caches.delete(k);
          }
        })
      );
    }).then(function() {
      self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(resp) {
      if (resp) {
        return resp;
      }
      return fetch(e.request).then(function(resp) {
        if (!resp || resp.status !== 200) {
          return resp;
        }
        var respClone = resp.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, respClone);
        });
        return resp;
      }).catch(function() {
        if (e.request.mode === 'navigate') {
          return caches.match('./index-modificado.html');
        }
      });
    })
  );
});
