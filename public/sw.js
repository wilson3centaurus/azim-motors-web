const CACHE_NAME = 'hazim-motors-shell-v1'
const CORE_ASSETS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/pwa-192x192.svg',
  '/pwa-512x512.svg',
  '/maskable-icon.svg',
  '/apple-touch-icon.svg',
  '/login',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()),
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