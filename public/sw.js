const CACHE_NAME = 'ai-qualifier-v1'
const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
]

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache')
            return caches.delete(cache)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch Strategy: Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone the response since it's a stream
          const responseToCache = response.clone()

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache)
            })

          return response
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request)
            .then(response => {
              if (response) {
                return response
              }
              
              // If no cache match, return offline page for navigation requests
              if (event.request.mode === 'navigate') {
                return caches.match('/')
              }
              
              return new Response('Offline - Resource not available', {
                status: 503,
                statusText: 'Service Unavailable'
              })
            })
        })
    )
  }
})

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered')
    event.waitUntil(
      // Add your background sync logic here
      syncOfflineActions()
    )
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/'
      },
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/icon-96x96.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icon-96x96.png'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'AI Qualifier', options)
    )
  }
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    )
  }
})

async function syncOfflineActions() {
  // Implement offline action sync logic
  // For example: sync assessment progress, user data, etc.
  console.log('Syncing offline actions...')
  
  try {
    // Example: Sync cached assessment data
    const cache = await caches.open(CACHE_NAME)
    const cachedRequests = await cache.keys()
    
    // Process any cached POST requests or offline data
    // This would integrate with your API endpoints
    
    console.log('Offline sync completed')
  } catch (error) {
    console.error('Offline sync failed:', error)
  }
}