var CACHE_NAME = 'aprendamais-v20260417';
var PRECACHE = [
  '/Plataforma/',
  '/Plataforma/index-modificado.html',
  '/Plataforma/css/style.css', // Ajuste para os seus arquivos CSS
  '/Plataforma/js/script.js',   // Ajuste para os seus arquivos JS
  '/Plataforma/icons/icon-192x192.png', // Certifique-se de que estes ícones existem
  '/Plataforma/icons/icon-512x512.png'
  // Adicione todos os outros recursos estáticos importantes aqui (imagens, fontes, etc.)
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c) {
      return Promise.allSettled(PRECACHE.map(function(u) { return c.add(u); }));
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  if (url.includes('firebase') || url.includes('googleapis') || url.includes('gstatic') || url.includes('cloudflare')) {
    e.respondWith(fetch(e.request).catch(function() {
      if (e.request.mode === 'navigate') {
        return caches.match('/Plataforma/').then(function(r) {
          return r || new Response('Sem ligação', { status: 503, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        });
      }
      return new Response('', { status: 503 });
    }));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(resp) {
        if (!resp || resp.status !== 200) return resp;
        var clone = resp.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
        return resp;
      }).catch(function() {
        if (e.request.mode === 'navigate') {
          return caches.match('/Plataforma/').then(function(r) {
            return r || new Response('Sem ligação', { status: 503, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
          });
        }
        return new Response('', { status: 503 });
      });
    })
  );
});
