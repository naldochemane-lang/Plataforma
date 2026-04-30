/* Aprenda + — Service Worker v5.0 */
var CACHE_NAME = 'aprenda-plus-v5';
var CACHE_FILES = ['./', './index.html'];
var SKIP = ['firebaseio','firebase.googleapis','gstatic.com/firebase','googleapis.com'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function(c){ return c.addAll(CACHE_FILES); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  if (SKIP.some(function(d){return url.indexOf(d)>=0;})) {
    e.respondWith(fetch(e.request).catch(function(){return new Response('',{status:503});}));
    return;
  }
  e.respondWith(caches.match(e.request).then(function(cached){
    var net = fetch(e.request).then(function(r){
      if(r&&r.status===200){var c=r.clone();caches.open(CACHE_NAME).then(function(cache){cache.put(e.request,c);});}
      return r;
    }).catch(function(){return null;});
    return cached || net.then(function(r){
      if(r) return r;
      if(e.request.mode==='navigate') return caches.match('./index.html');
      return new Response('',{status:503});
    });
  }));
});

self.addEventListener('message', function(e){ if(e.data==='skipWaiting') self.skipWaiting(); });
