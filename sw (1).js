// ═══════════════════════════════════════════════════════════════
// ESESJC — Service Worker (Corrigido)
// Escola Secundária Ecuménica São João de Chidenguele
// ═══════════════════════════════════════════════════════════════

var CACHE_VERSION = '20250414_v2';
var CACHE_NAME    = 'esesjc-v' + CACHE_VERSION;

// Ficheiros a pré-cachear no install
var PRECACHE_URLS = [
  './',
  './index-modificado.html',
  './manifest.json'
];

// ── INSTALL ────────────────────────────────────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        // allSettled: não falha se um recurso não carregar
        return Promise.allSettled(
          PRECACHE_URLS.map(function(url) { return cache.add(url); })
        );
      })
      .then(function() { return self.skipWaiting(); })
  );
});

// ── ACTIVATE ───────────────────────────────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(
          keys
            .filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k)   { return caches.delete(k); })
        );
      })
      .then(function() { return self.clients.claim(); })
  );
});

// ── FETCH ──────────────────────────────────────────────────────
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // Recursos externos (Firebase, CDNs) — sempre rede primeiro
  var isExternal = url.includes('firebase')
    || url.includes('googleapis')
    || url.includes('gstatic')
    || url.includes('cloudflare')
    || url.includes('firebaseio')
    || url.includes('firebasestorage');

  if (isExternal) {
    e.respondWith(
      fetch(e.request).catch(function() {
        // Se for navegação e estiver offline, mostra a app cacheada
        if (e.request.mode === 'navigate') {
          return caches.match('./index-modificado.html').then(function(r) {
            return r || caches.match('./').then(function(r2) {
              return r2 || new Response('Sem ligação à internet.', {
                status: 503,
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
              });
            });
          });
        }
        return new Response('', { status: 503 });
      })
    );
    return;
  }

  // Recursos locais — cache first, atualiza em background
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var fetchPromise = fetch(e.request).then(function(resp) {
        if (!resp || resp.status !== 200 || resp.type === 'opaque') {
          return resp;
        }
        var clone = resp.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return resp;
      });

      // Devolve cache imediatamente se existir, e atualiza em background
      return cached || fetchPromise.catch(function() {
        if (e.request.mode === 'navigate') {
          return caches.match('./index-modificado.html').then(function(r) {
            return r || caches.match('./').then(function(r2) {
              return r2 || new Response('Sem ligação à internet.', {
                status: 503,
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
              });
            });
          });
        }
        return new Response('', { status: 503 });
      });
    })
  );
});
