/* eslint-disable */
/**
 * Petri service worker — offline shell.
 *
 * Strategy:
 *   - Precache the minimal app shell on install (root page + manifest + icons)
 *   - Cache-first for hashed static assets (_next/static, font subsets)
 *   - Network-first for HTML navigations (so new deploys show up) with an
 *     offline fallback to the cached root
 *   - Always bypass /api/* — those must hit the network or fail visibly
 *   - Version-bumped cache key: old caches are deleted on activate
 *
 * Bump CACHE_VERSION on meaningful shell changes to force a refresh.
 */

const CACHE_VERSION = 'petri-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSETS_CACHE = `${CACHE_VERSION}-assets`;

// Minimal list — the root HTML caches the rest of the shell organically
// the first time it's fetched.
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-maskable-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      // Activate the new SW immediately instead of waiting for tabs to close.
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(CACHE_VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache API routes — daily store rotation must stay fresh.
  if (url.pathname.startsWith('/api/')) return;

  // Same-origin only.
  if (url.origin !== self.location.origin) return;

  // Hashed static assets → cache-first.
  if (url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE));
    return;
  }

  // HTML navigations → network-first with offline fallback.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request, SHELL_CACHE));
    return;
  }

  // Everything else (fonts, JSON, etc) → network, then cache on success.
  event.respondWith(networkThenCache(request, ASSETS_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and not cached — let the browser show its error page.
    return Response.error();
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Last-resort offline fallback: the root shell.
    const root = await caches.match('/');
    if (root) return root;
    return Response.error();
  }
}

async function networkThenCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return Response.error();
  }
}
