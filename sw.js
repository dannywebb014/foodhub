// Keeps food. itself on the device so it opens with no signal. Its data comes
// from the copy page.jsx saves after each load; Supabase requests pass straight
// through. The build (web/vite.config.js) fills in the cache name and file list.
const CACHE = 'food-mv1hinrs'
const FILES = ["./","./assets/index-DEZghAP3.js","./embed.js","./assets/page-C7E0XbRv.js","./icon.svg","./manifest.webmanifest","./index.html","/lifeos/fonts.css"]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('food-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

const fromCache = (request) => caches.match(request, { ignoreSearch: true })

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== location.origin) return

  // The page: the network when it answers within 4 seconds (so updates arrive), otherwise the saved one.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const network = fetch(request).then(async (res) => {
        if (res.ok) (await caches.open(CACHE)).put('./', res.clone())
        return res
      })
      const timeout = new Promise((resolve) => setTimeout(resolve, 4000))
      try {
        const res = await Promise.race([network, timeout])
        if (res) return res
      } catch { /* offline */ }
      return (await caches.match('./')) || network
    })())
    return
  }

  // App files have the build in their names, so a saved copy is always right.
  // The shared fonts and sign-in files are refreshed in the background.
  event.respondWith((async () => {
    const cached = await fromCache(request)
    const refresh = fetch(request).then(async (res) => {
      if (res.ok) (await caches.open(CACHE)).put(request, res.clone())
      return res
    }).catch(() => cached)
    return cached || refresh
  })())
})
