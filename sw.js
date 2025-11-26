const CACHE_NAME = 'smart-price-tag-v1';

// Assets to immediately cache on install
// Using relative paths './' ensures compatibility with GitHub Pages repositories
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy for CDNs and External Resources (Cache First, Fallback to Network)
  // This covers Tailwind, Google Fonts, and AI Studio CDN imports
  if (
    url.hostname.includes('cdn.tailwindcss.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('aistudiocdn.com')
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchedResponse) => {
          // Verify valid response before caching
          if (!fetchedResponse || fetchedResponse.status !== 200 || fetchedResponse.type !== 'basic' && fetchedResponse.type !== 'cors' && fetchedResponse.type !== 'opaque') {
            return fetchedResponse;
          }
          const responseToCache = fetchedResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return fetchedResponse;
        });
      }).catch(() => {
        // Fallback for when offline and not in cache (optional placeholder logic)
      })
    );
    return;
  }

  // Strategy for Local App Files (Stale-While-Revalidate)
  // This ensures the app shell loads fast from cache but updates in background
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return networkResponse;
      }).catch(() => {
         // Network failed, nothing to do if we have cachedResponse
      });

      return cachedResponse || fetchPromise;
    })
  );
});