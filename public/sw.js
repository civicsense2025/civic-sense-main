// Check if we're in development mode and exit early
if (typeof importScripts === 'function') {
  // This runs in service worker context
  // For development, we want to avoid caching completely
  const isDevelopment = self.location.hostname === 'localhost' || 
                       self.location.hostname === '127.0.0.1' ||
                       self.location.port === '3000' ||
                       self.location.search.includes('dev=true')
  
  if (isDevelopment) {
    console.log('Service Worker: Development mode detected, disabling cache')
    
    // Clear all existing caches
    self.addEventListener('activate', (event) => {
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          console.log('Service Worker: Clearing all caches in development mode')
          return Promise.all(
            cacheNames.map((cacheName) => {
              console.log('Service Worker: Deleting cache:', cacheName)
              return caches.delete(cacheName)
            })
          )
        }).then(() => {
          return self.clients.claim()
        })
      )
    })
    
    // Pass through all requests without caching
    self.addEventListener('fetch', (event) => {
      // Just pass through to network without any caching
      event.respondWith(fetch(event.request))
    })
    
    // Exit early to prevent the rest of the service worker from running
    return
  }
}

const CACHE_NAME = 'civicsense-v1'
const STATIC_CACHE_NAME = 'civicsense-static-v1'
const DYNAMIC_CACHE_NAME = 'civicsense-dynamic-v1'

// Files to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip Chrome extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Fallback to cache for offline access
          return caches.match(request)
        })
    )
    return
  }

  // Handle static assets with cache-first strategy
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.includes('.css') ||
    url.pathname.includes('.js') ||
    url.pathname.includes('.woff') ||
    url.pathname.includes('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((response) => {
          const responseClone = response.clone()
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
      })
    )
    return
  }

  // Handle page requests with network-first strategy for better PWA performance
  event.respondWith(
    fetch(request).then((networkResponse) => {
      // Update cache in background for successful responses
      if (networkResponse.status === 200) {
        const responseClone = networkResponse.clone()
        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
          cache.put(request, responseClone)
        }).catch((error) => {
          console.warn('Failed to cache response:', error)
        })
      }
      return networkResponse
    }).catch(() => {
      // Fallback to cache only if network fails
      return caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        // Return offline page if available for document requests
        if (request.destination === 'document') {
          return caches.match('/offline.html').then((offlinePage) => {
            return offlinePage || new Response('Offline', { status: 503 })
          })
        }
        throw new Error('Network failed and no cache available')
      })
    })
  )
})

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'quiz-submission') {
    event.waitUntil(syncQuizSubmissions())
  }
})

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  
  const options = {
    body: event.data ? event.data.text() : 'New civic education content available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Start Learning',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-72x72.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('CivicSense', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    )
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Sync quiz submissions when back online
async function syncQuizSubmissions() {
  try {
    // Get pending submissions from IndexedDB
    const pendingSubmissions = await getPendingQuizSubmissions()
    
    for (const submission of pendingSubmissions) {
      try {
        const response = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submission.data)
        })
        
        if (response.ok) {
          await removePendingSubmission(submission.id)
          console.log('Quiz submission synced successfully')
        }
      } catch (error) {
        console.error('Failed to sync quiz submission:', error)
      }
    }
  } catch (error) {
    console.error('Error syncing quiz submissions:', error)
  }
}

// Helper functions for IndexedDB operations (would need implementation)
async function getPendingQuizSubmissions() {
  // TODO: Implement IndexedDB operations for offline storage
  return []
}

async function removePendingSubmission(id) {
  // TODO: Implement IndexedDB operations
  console.log('Removing pending submission:', id)
}

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
}) 