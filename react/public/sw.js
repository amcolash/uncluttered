const CACHE_NAME = 'uncluttered-v1';

const APP_SHELL = ['/', '/index.html', '/manifest.json', '/icon.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never cache API or OAuth calls — always use server version directly
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/oauth2callback')) {
    return;
  }

  // Network-first strategy with cache fallback for the React application
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets and HTML
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        // Server or network unreachable: fall back to cached React app
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // If it's a page navigation, return the cached index.html shell
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
        }

        return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});
