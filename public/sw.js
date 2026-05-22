// HelpMeUltra service worker — shell-offline strategy.
// Bump VERSION whenever the SW logic itself changes to force activation.
const VERSION = 'v1'
const RUNTIME = `hmu-runtime-${VERSION}`
const SHELL_URLS = ['/', '/index.html', '/logo.png', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(RUNTIME).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Don't intercept Strava API calls or third-party domains — data should always be fresh.
  if (url.origin !== self.location.origin) return

  // Navigation: network-first, fall back to cached index.html so the app
  // still opens when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html').then((r) => r || Response.error()))
    )
    return
  }

  // Static assets: cache-first with background refresh (stale-while-revalidate).
  // Covers Vite's hashed /assets/* JS+CSS, /logo.png, favicon, etc.
  event.respondWith(
    caches.open(RUNTIME).then((cache) =>
      cache.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res && res.status === 200 && res.type === 'basic') {
              cache.put(req, res.clone())
            }
            return res
          })
          .catch(() => cached)
        return cached || fetchPromise
      })
    )
  )
})
