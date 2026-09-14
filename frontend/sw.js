const CACHE_NAME = 'santiye-net-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './numpad.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  // Sadece GET isteklerini ve API olmayanları cache'le
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
