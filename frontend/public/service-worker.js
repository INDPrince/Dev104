const CACHE_VERSION = 'v1.0.2';
const STATIC_CACHE = `quizmaster-static-${CACHE_VERSION}`;
const DATA_CACHE = `quizmaster-data-${CACHE_VERSION}`;
const RUNTIME_CACHE = `quizmaster-runtime-${CACHE_VERSION}`;

const urlsToCache = [
  '/',
  '/index.html',
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v1.0.2...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(urlsToCache).catch(err => {
          console.log('[SW] Cache addAll failed, continuing anyway');
        });
      })
  );
  
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v1.0.2...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('quizmaster-') && 
                           name !== STATIC_CACHE && 
                           name !== DATA_CACHE && 
                           name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  return self.clients.claim();
});

// Fetch event - Advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // NEVER cache /admin routes - always fetch fresh from network
  if (url.pathname.startsWith('/admin')) {
    event.respondWith(
      fetch(request).catch(() => {
        // For HTML navigation requests to admin routes, return index.html
        // The React Router will handle the /admin routing
        if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
        return new Response('Network error', { status: 503 });
      })
    );
    return;
  }
  
  // API calls - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone and cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              console.log('[SW] Serving cached API response for:', url.pathname);
              return cachedResponse;
            }
            return new Response(JSON.stringify({ error: 'Offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }
  
  // Firebase requests - Network only
  if (url.hostname.includes('firebase') || url.hostname.includes('firebaseio')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Static assets (JS, CSS, images) - Cache first, then network
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version and update in background
          fetch(request).then(networkResponse => {
            if (networkResponse.status === 200) {
              caches.open(RUNTIME_CACHE).then(cache => {
                cache.put(request, networkResponse);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request).then(networkResponse => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }
  
  // HTML pages and navigation - Network first, fallback to cache
  if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cached page or index.html for SPA routing
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }
  
  // Default: Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            console.log('[SW] Clearing cache:', name);
            return caches.delete(name);
          })
        );
      }).then(() => {
        console.log('[SW] All caches cleared successfully');
      })
    );
  }
});

// Background sync for updates
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'sync-updates') {
    event.waitUntil(checkForUpdates());
  }
});

async function checkForUpdates() {
  try {
    // Check Firebase for new versions
    console.log('Checking for updates...');
    // Implementation will be added when Firebase integration is complete
  } catch (error) {
    console.error('Error checking updates:', error);
  }
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/class10/icon-192x192.png',
    badge: '/icons/class10/icon-72x72.png',
    data: data
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
