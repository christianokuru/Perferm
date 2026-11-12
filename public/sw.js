/* Perferm service worker — offline shell + fast repeat visits.
 * Strategy:
 *  - navigations: network-first, fall back to cached page, then /offline
 *  - /_next/static: cache-first (immutable, hashed)
 *  - images: stale-while-revalidate, capped
 * Never caches API calls, admin/account pages, cross-origin or non-OK responses.
 */
const VERSION = "v1";
const SHELL = `perferm-shell-${VERSION}`;
const PAGES = `perferm-pages-${VERSION}`;
const ASSETS = `perferm-assets-${VERSION}`;
const IMAGES = `perferm-images-${VERSION}`;
const OFFLINE_URL = "/offline";
const MAX_PAGES = 40;
const MAX_IMAGES = 120;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png", "/manifest.webmanifest"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL, PAGES, ASSETS, IMAGES]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

function cacheable(response) {
  return response && response.ok && response.type === "basic";
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (/^\/(api|admin|account|checkout)(\/|$)/.test(url.pathname)) return;
  if (request.headers.has("rsc") || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (cacheable(response)) {
            const copy = response.clone();
            caches.open(PAGES).then((c) => c.put(request, copy).then(() => trim(PAGES, MAX_PAGES)));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE_URL))),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (cacheable(response)) {
              const copy = response.clone();
              caches.open(ASSETS).then((c) => c.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/image") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(IMAGES).then(async (cache) => {
        const hit = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (cacheable(response)) cache.put(request, response.clone()).then(() => trim(IMAGES, MAX_IMAGES));
            return response;
          })
          .catch(() => hit);
        return hit || network;
      }),
    );
  }
});
