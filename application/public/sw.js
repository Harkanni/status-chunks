// Cache-first for the FFmpeg core engine files. The cache name is tied to
// the core version, so bumping CORE_VERSION in the app automatically
// invalidates the old cached bytes on next deploy.
const CORE_CACHE = 'ffmpeg-core-v0.12.10'
const CORE_HOSTS = ['cdn.jsdelivr.net']

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('ffmpeg-core-') && k !== CORE_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  const isCoreFile = CORE_HOSTS.includes(url.hostname) && url.pathname.includes('/ffmpeg-core')
  if (!isCoreFile) return // let everything else pass through untouched

  event.respondWith(
    caches.open(CORE_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request)
      if (cached) return cached
      const response = await fetch(event.request)
      if (response.ok) cache.put(event.request, response.clone())
      return response
    })
  )
})