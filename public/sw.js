// TurfPro ERP — Service Worker v1.0
const CACHE_NAME = 'turfpro-v1'
const STATIC_ASSETS = [
  '/',
  '/calendar',
  '/bookings',
  '/pricing',
  '/reports',
  '/turfs',
  '/manifest.json',
]

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Non-fatal if some assets fail to cache
      })
    })
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // API requests: network only (no cache)
  if (url.pathname.startsWith('/api/')) {
    return // fall through to network
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => cached)

      return cached || networkFetch
    })
  )
})

// Background sync for offline booking creation
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncPendingBookings())
  }
})

async function syncPendingBookings() {
  // Placeholder for offline-first booking sync
  console.log('[SW] Syncing pending bookings…')
}
