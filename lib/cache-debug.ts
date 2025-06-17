// Cache debugging utilities for CivicSense
// Use these functions in the browser console to diagnose caching issues

export const cacheDebug = {
  // List all active caches
  async listCaches() {
    if (typeof window === 'undefined' || !('caches' in window)) {
      console.log('Cache API not supported')
      return
    }

    try {
      const cacheNames = await caches.keys()
      console.log('Active caches:', cacheNames)
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName)
        const requests = await cache.keys()
        console.log(`${cacheName}: ${requests.length} items`)
        
        // Show first few items as examples
        const examples = requests.slice(0, 3).map(req => req.url)
        if (examples.length > 0) {
          console.log(`  Examples: ${examples.join(', ')}`)
        }
      }
    } catch (error) {
      console.error('Error listing caches:', error)
    }
  },

  // Clear all caches
  async clearAll() {
    if (typeof window === 'undefined' || !('caches' in window)) {
      console.log('Cache API not supported')
      return
    }

    try {
      const cacheNames = await caches.keys()
      console.log('Clearing caches:', cacheNames)
      
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      console.log('All caches cleared')
    } catch (error) {
      console.error('Error clearing caches:', error)
    }
  },

  // Clear only CSS/JS from caches
  async clearDesignAssets() {
    if (typeof window === 'undefined' || !('caches' in window)) {
      console.log('Cache API not supported')
      return
    }

    try {
      const cacheNames = await caches.keys()
      let clearedCount = 0
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName)
        const requests = await cache.keys()
        
        for (const request of requests) {
          const url = new URL(request.url)
          if (url.pathname.includes('.css') || url.pathname.includes('.js')) {
            await cache.delete(request)
            clearedCount++
          }
        }
      }
      
      console.log(`Cleared ${clearedCount} CSS/JS files from cache`)
    } catch (error) {
      console.error('Error clearing design assets:', error)
    }
  },

  // Check service worker status
  checkServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service Worker not supported')
      return
    }

    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log('Service Worker registrations:', registrations.length)
      
      registrations.forEach((reg, index) => {
        console.log(`Registration ${index}:`, {
          scope: reg.scope,
          state: reg.active?.state,
          scriptURL: reg.active?.scriptURL,
        })
      })
      
      if (navigator.serviceWorker.controller) {
        console.log('Active service worker:', navigator.serviceWorker.controller.scriptURL)
      } else {
        console.log('No active service worker controlling this page')
      }
    })
  },

  // Send message to service worker
  async sendMessage(message: any) {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service Worker not supported')
      return
    }

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message)
      console.log('Message sent to service worker:', message)
    } else {
      console.log('No active service worker to send message to')
    }
  },

  // Full cache refresh with hard reload
  async fullRefresh() {
    try {
      // Clear all caches
      await this.clearAll()
      
      // Clear localStorage and sessionStorage
      localStorage.clear()
      sessionStorage.clear()
      console.log('Cleared local storage')
      
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(reg => reg.unregister()))
        console.log('Unregistered service workers')
      }
      
      // Force reload
      console.log('Forcing page reload...')
      window.location.href = window.location.href
    } catch (error) {
      console.error('Error during full refresh:', error)
    }
  }
}

// Make it available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).cacheDebug = cacheDebug
  console.log('CacheDebug utilities available as window.cacheDebug')
} 