const CACHE_NAME = 'synapse-v3';
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.svg',
];

const DYNAMIC_CACHE = 'synapse-dynamic-v2';

// Install — cache only static assets, never the SPA shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network-first for navigations (avoids stale UI after deploys);
// stale-while-revalidate for static assets and fonts.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Always go to network for Supabase
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.com')) return;

  // Only handle same-origin or whitelisted CDN/font requests
  const sameOrigin = url.origin === self.location.origin;
  const allowedExternal =
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdnjs.cloudflare.com');
  if (!sameOrigin && !allowedExternal) return;

  // Network-first for HTML/document navigations
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(async () => {
          const cached = await caches.match(event.request);
          return cached || new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // Stale-while-revalidate for everything else
  event.respondWith(
    caches.open(DYNAMIC_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        tag: data.tag || 'synapse-notification',
      })
    );
  }
});
