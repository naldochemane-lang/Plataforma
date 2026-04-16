/* ══════════════════════════════════════════════════════════════
   Aprenda + — Service Worker  (v2.0)
   Escola Secundária Ecuménica São João de Chidenguele — ESESJC
   Cache-first para assets, Network-first para Firebase/APIs
   Funciona tanto como ficheiro único (index.html) como com
   estrutura multi-ficheiro (index.html + manifest.json + sw.js)
══════════════════════════════════════════════════════════════ */

var CACHE_VERSION = '20260416';
var CACHE_NAME    = 'aprendamais-v' + CACHE_VERSION;

var PRECACHE = [
  './',
  './index.html'
];

var NETWORK_ONLY = [
  'firebase',
  'googleapis',
  'gstatic.com',
  'cloudflare',
  'firebaseio.com',
  'firebaseapp.com'
];

/* ── Instalar ───────────────────────────────────────────────── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.allSettled(
        PRECACHE.map(function(url) { return cache.add(url); })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── Activar ────────────────────────────────────────────────── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch ──────────────────────────────────────────────────── */
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  var isExternal = NETWORK_ONLY.some(function(domain) {
    return url.indexOf(domain) >= 0;
  });

  if (isExternal) {
    event.respondWith(
      fetch(event.request).catch(function() {
        if (event.request.mode === 'navigate') {
          return caches.match('./').then(function(r) {
            return r || new Response('Sem ligação', { status: 503, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
          });
        }
        return new Response('', { status: 503 });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
        return response;
      }).catch(function() {
        if (event.request.mode === 'navigate') {
          return caches.match('./').then(function(r) {
            return r || new Response('Sem ligação', { status: 503, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
          });
        }
        return new Response('', { status: 503 });
      });
    })
  );
});
