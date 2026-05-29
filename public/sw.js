const CACHE_NAME = 'hazin-motors-shell-v2'
const CORE_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(CORE_ASSETS.map(url => cache.add(url))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html')),
    )
    return
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (!response || response.status !== 200 || response.type !== 'basic') return response

      const copy = response.clone()
      void caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
      return response
    })),
  )
})