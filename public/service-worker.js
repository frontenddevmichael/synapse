const CACHE_NAME = 'synapse-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// Dynamic cache for API responses and other assets
const DYNAMIC_CACHE = 'synapse-dynamic-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Skip Supabase API calls - always go to network
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.com')) return;
  
  // Skip external resources (except for fonts/CDN)
  if (url.origin !== self.location.origin && 
      !url.hostname.includes('fonts.googleapis.com') &&
      !url.hostname.includes('fonts.gstatic.com') &&
      !url.hostname.includes('cdnjs.cloudflare.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response to cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { 
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Handle background sync for offline quiz attempts
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-quiz-attempts') {
    event.waitUntil(syncQuizAttempts());
  }
});

async function syncQuizAttempts() {
  // This would sync any locally stored quiz attempts when back online
  console.log('Background sync: syncing quiz attempts');
}

// Push notifications (future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        tag: data.tag || 'synapse-notification'
      })
    );
  }
});
