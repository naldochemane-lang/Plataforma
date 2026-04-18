/* ══════════════════════════════════════════════════════════════
   Aprenda + — Service Worker  (v3.0 — 2026-04-18)
   Escola Secundária Ecuménica São João de Chidenguele
   Cache-first para assets locais
   Network-first para Firebase / Google APIs
══════════════════════════════════════════════════════════════ */

var CACHE_VERSION = '20260418';
var CACHE_NAME    = 'aprendamais-v' + CACHE_VERSION;

/* Ficheiros a pré-cachear na instalação */
var PRECACHE = [
  './index.html',
  './manifest.json',
  './icon-72.png',
  './icon-96.png',
  './icon-144.png',
  './icon-152.png',
  './icon-192.png',
  './icon-384.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

/* Domínios externos — sempre via rede, nunca cachear */
var NETWORK_ONLY = [
  'firebase',
  'firebaseio.com',
  'firebaseapp.com',
  'googleapis.com',
  'gstatic.com',
  'cloudflare'
];

/* ── Instalar ───────────────────────────────────────────────── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      /* allSettled: não falha se algum ficheiro não existir */
      return Promise.allSettled(
        PRECACHE.map(function(url) { return cache.add(url); })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── Activar — limpar caches antigas ───────────────────────── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(k) { return k !== CACHE_NAME; })
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

  /* Requisições externas → sempre rede */
  var isExternal = NETWORK_ONLY.some(function(domain) {
    return url.indexOf(domain) >= 0;
  });

  if (isExternal) {
    event.respondWith(
      fetch(event.request).catch(function() {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html').then(function(r) {
            return r || new Response('Sem ligação', {
              status: 503,
              headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
          });
        }
        return new Response('', { status: 503 });
      })
    );
    return;
  }

  /* Assets locais → Cache-first, depois rede */
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;

      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;

      }).catch(function() {
        /* Offline e sem cache → página principal */
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html').then(function(r) {
            return r || new Response('Sem ligação à Internet', {
              status: 503,
              headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
          });
        }
        return new Response('', { status: 503 });
      });
    })
  );
});
