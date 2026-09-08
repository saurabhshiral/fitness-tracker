// Cache the app shell so the tracker opens in gym basements with no signal.
// Data lives in localStorage and syncs to Supabase when back online.
const CACHE = 'fitness-v1'

self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  // Never cache Supabase — auth and data must always hit the network
  if (url.origin !== self.location.origin) return

  // Network-first, falling back to cache when offline
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone()
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {})
        return res
      })
      .catch(() =>
        caches.match(req).then(hit => hit || caches.match('./index.html'))
      )
  )
})
