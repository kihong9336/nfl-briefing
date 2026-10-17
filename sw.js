const RUNTIME_CACHE = 'nfl-briefing-runtime-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(new Request(request, { cache: 'no-store' }))
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)));
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
