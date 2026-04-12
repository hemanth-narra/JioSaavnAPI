const CACHE_NAME = 'jiomelody-cache-v1';
const ASSETS_TO_CACHE = [
  '/ui/',
  '/ui/index.html',
  '/ui/css/style.css',
  '/ui/js/app.js',
  '/ui/js/api.js',
  '/ui/js/player.js',
  '/ui/icon-512.png',
  '/ui/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(console.error)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests originating from our domain (prevent caching API calls or media)
  if (event.request.method !== 'GET' || event.request.url.includes('/api/') || event.request.url.includes('/song/')) {
    return;
  }

  // Stale-while-revalidate strategy for UI assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
