/*
  PorVerse V2 – Service Worker (safe cloning)
  - Static precache + runtime caching
  - API GET: stale-while-revalidate (fără “Response body is already used”)
  - Offline queue pentru write (lăsată simplă)
*/

const APP_VERSION = '2.0.0'
const SW_VERSION = 'v1.0.1' // ⬅⬅⬅ bump pentru reînregistrare
const PRECACHE = `porverse-precache-${APP_VERSION}-${SW_VERSION}`
const RUNTIME = `porverse-runtime-${APP_VERSION}-${SW_VERSION}`
const API_CACHE = `porverse-api-${APP_VERSION}-${SW_VERSION}`
const OFFLINE_CACHE = `porverse-offline-${APP_VERSION}-${SW_VERSION}`

const PRECACHE_URLS = [
  '/',                    // homepage (va fi suprascris de network-first navigation)
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// (opțional) fallback de pagină
const OFFLINE_FALLBACK_PAGE = '/offline.html'

// DOAR GET
const API_CACHE_ALLOWLIST = [
  '/api/portals/progress',
  '/api/user/profile',
  '/api/ai/get-user-context',
]

// ====== INSTALL ======
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  )
})

// ====== ACTIVATE ======
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(
      keys
        .filter((key) => ![PRECACHE, RUNTIME, API_CACHE, OFFLINE_CACHE].includes(key))
        .map((key) => caches.delete(key))
    )
    await self.clients.claim()
  })())
})

// ====== FETCH ======
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // SCRIERI: nu interceptăm (sau ai coadă offline dacă vrei)
  if (request.method !== 'GET') {
    return
  }

  // Navigații: network-first, fallback cache, apoi offline page
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(event, request))
    return
  }

  // Assete Next: cache-first
  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // API GET: stale-while-revalidate sigur (folosim event.waitUntil și clone corect)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidateAPI(event, request))
    return
  }

  // Default: cache falling back to network
  event.respondWith(cacheFallingBackToNetwork(request))
})

// ====== STRATEGIES ======
async function handleNavigation(event, request) {
  try {
    const res = await fetch(request)
    const resClone = res.clone()
    event.waitUntil((async () => {
      const cache = await caches.open(RUNTIME)
      await cache.put(request, resClone)
    })())
    return res
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    const offline = await caches.match(OFFLINE_FALLBACK_PAGE)
    return offline || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const res = await fetch(request)
  const resClone = res.clone()
  const cache = await caches.open(PRECACHE)
  await cache.put(request, resClone)
  return res
}

async function cacheFallingBackToNetwork(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const res = await fetch(request)
    const resClone = res.clone()
    const cache = await caches.open(RUNTIME)
    await cache.put(request, resClone)
    return res
  } catch {
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
  }
}

async function staleWhileRevalidateAPI(event, request) {
  const cache = await caches.open(API_CACHE)
  const cached = await cache.match(request)

  // Revalidare în fundal (nu consumăm răspunsul întors)
  const revalidate = (async () => {
    try {
      const net = await fetch(request)
      // doar 200-299 sau opaque (pentru CORS se poate întoarce opaque)
      if (net && (net.ok || net.type === 'opaque')) {
        const netClone = net.clone()
        await cache.put(request, netClone)
      }
    } catch {
      // ignoră erorile de rețea la revalidare
    }
  })()
  event.waitUntil(revalidate)

  if (cached) return cached

  // Dacă nu avem cache, încercăm rețeaua acum
  try {
    const net = await fetch(request)
    const netClone = net.clone()
    await cache.put(request, netClone)
    return net
  } catch {
    // fallback: dacă endpoint-ul este în allowlist, încearcă un match fără query
    const allow = await matchAllowlistFallback(request)
    if (allow) return allow
    return new Response(JSON.stringify({ offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function matchAllowlistFallback(request) {
  const { pathname } = new URL(request.url)
  if (!API_CACHE_ALLOWLIST.some((p) => pathname.startsWith(p))) return null
  const cache = await caches.open(API_CACHE)
  const keys = await cache.keys()
  for (const key of keys) {
    const k = new URL(key.url)
    if (k.pathname === pathname) {
      return cache.match(key)
    }
  }
  return null
}

// ====== (opțional) Background Sync – coada de write ======
// Lăsat simplu/nefolosit în fetch pentru a nu afecta clone-urile
