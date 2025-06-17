// CivicSense Service Worker - Production Ready
// Update version when design changes to force cache refresh  
const CACHE_VERSION = '1.0.2' // Incremented for lazy loading performance improvements
const CACHE_NAME = `civicsense-v${CACHE_VERSION}`
const STATIC_CACHE_NAME = `civicsense-static-v${CACHE_VERSION}`
const DYNAMIC_CACHE_NAME = `civicsense-dynamic-v${CACHE_VERSION}`

// Files to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Development mode detection
const isDevelopment = () => {
  return self.location.hostname === 'localhost' || 
         self.location.hostname === '127.0.0.1' ||
         self.location.port === '3000' ||
         self.location.search.includes('dev=true')
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  if (isDevelopment()) {
    console.log('Service Worker: Development mode - skipping cache')
    self.skipWaiting()
    return
  }
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Error during install:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  if (isDevelopment()) {
    console.log('Service Worker: Development mode - clearing all caches')
    event.waitUntil(
      caches.keys().then((cacheNames) => {
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
    return
  }
  
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

  // Development mode - pass through without caching
  if (isDevelopment()) {
    event.respondWith(fetch(event.request))
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
            }).catch((error) => {
              console.warn('Failed to cache API response:', error)
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

  // Handle static assets with network-first strategy for CSS/JS (to prevent stale designs)
  // and cache-first for icons/fonts (which change less frequently)
  if (url.pathname.startsWith('/icons/') || url.pathname.startsWith('/images/') ||
      url.pathname.includes('.woff') || url.pathname.includes('.woff2')) {
    // Cache-first for icons and fonts (they change rarely)
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((response) => {
          const responseClone = response.clone()
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          }).catch((error) => {
            console.warn('Failed to cache static asset:', error)
          })
          return response
        })
      }).catch((error) => {
        console.warn('Failed to serve static asset:', error)
        throw error
      })
    )
    return
  }
  
  // Network-first for CSS/JS to ensure fresh design files
  if (url.pathname.includes('.css') || url.pathname.includes('.js')) {
    event.respondWith(
      fetch(request).then((response) => {
        // Only cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          }).catch((error) => {
            console.warn('Failed to cache CSS/JS:', error)
          })
        }
        return response
      }).catch(() => {
        // Fallback to cache only if network fails completely
        return caches.match(request)
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
function syncQuizSubmissions() {
  return new Promise((resolve, reject) => {
    try {
      // Get pending submissions from IndexedDB
      getPendingQuizSubmissions().then((pendingSubmissions) => {
        const syncPromises = pendingSubmissions.map((submission) => {
          return fetch('/api/quiz/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(submission.data)
          }).then((response) => {
            if (response.ok) {
              return removePendingSubmission(submission.id)
            }
            throw new Error('Sync failed')
          })
        })
        
        return Promise.all(syncPromises)
      }).then(() => {
        console.log('All quiz submissions synced successfully')
        resolve()
      }).catch((error) => {
        console.error('Error syncing quiz submissions:', error)
        reject(error)
      })
    } catch (error) {
      console.error('Error in syncQuizSubmissions:', error)
      reject(error)
    }
  })
}

// Helper functions for IndexedDB operations
function getPendingQuizSubmissions() {
  return Promise.resolve([]) // TODO: Implement IndexedDB operations for offline storage
}

function removePendingSubmission(id) {
  return Promise.resolve() // TODO: Implement IndexedDB operations
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  // Add cache clearing functionality
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        console.log('Service Worker: Clearing all caches:', cacheNames)
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName)
          })
        )
      }).then(() => {
        console.log('Service Worker: All caches cleared')
        // Notify the main thread that caches are cleared
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'CACHE_CLEARED' })
          })
        })
      })
    )
  }
  
  // Add cache refresh functionality for design updates
  if (event.data && event.data.type === 'REFRESH_DESIGN_CACHE') {
    event.waitUntil(
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        // Clear CSS and JS from cache to force fresh downloads
        return cache.keys().then((requests) => {
          const cssJsRequests = requests.filter((req) => {
            const url = new URL(req.url)
            return url.pathname.includes('.css') || url.pathname.includes('.js')
          })
          
          return Promise.all(cssJsRequests.map((req) => cache.delete(req)))
        })
      }).then(() => {
        console.log('Service Worker: Design cache refreshed')
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'DESIGN_CACHE_REFRESHED' })
          })
        })
      })
    )
  }
}) 