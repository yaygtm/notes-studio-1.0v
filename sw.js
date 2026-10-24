/* =====================================================================
   Notes Studio 1.0 — service worker
   - App shell: cache-first (instant + works offline)
   - CDN libraries: stale-while-revalidate (fast, self-updating)
   - New version: waiting worker + "Reload" handshake from the page
   - Offline fallback for navigations
   ===================================================================== */
const VERSION = '1.0.1';
const SHELL_CACHE = 'ns-shell-' + VERSION;
const LIB_CACHE = 'ns-libs-' + VERSION;

/* Files that must be available offline. Missing ones are skipped silently,
   so the same sw.js works with any file name you give the HTML. */
const SHELL_FILES = [
  './',
  './index.html',
  './notes-studio-1.0v.html',
  './Notes Studio 1.0v.html',
  './manifest.json',
  './offline.html',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png'
];

const LIB_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.all(SHELL_FILES.map(async (url) => {
      try {
        const res = await fetch(new Request(url, { cache: 'reload' }));
        if (res && (res.ok || res.type === 'opaque')) await cache.put(url, res.clone());
      } catch (e) { /* file not present in this deployment — ignore */ }
    }));
    /* No skipWaiting() here: a new version WAITS, the page offers
       "New version ready → Reload", and only then does it activate.
       (First install still activates immediately — nothing to wait for.) */
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => {
      if (k !== SHELL_CACHE && k !== LIB_CACHE) return caches.delete(k);
      return null;
    }));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.disable(); } catch (e) {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || (event.data && event.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});

function isLib(url) {
  return LIB_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith('.' + h));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  /* --- CDN libraries: stale-while-revalidate --- */
  if (isLib(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(LIB_CACHE);
      const cached = await cache.match(req);
      const network = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return cached || (await network) || Response.error();
    })());
    return;
  }

  /* --- page navigations: network first, cache fallback, offline page last --- */
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const hit = await cache.match(req) ||
                    await cache.match(new URL(req.url).pathname) ||
                    await cache.match('./notes-studio-1.0v.html') ||
                    await cache.match('./index.html');
        if (hit) return hit;
        return (await cache.match('./offline.html')) || new Response(
          '<!doctype html><meta charset="utf-8"><title>Offline</title>' +
          '<body style="font-family:system-ui;padding:32px;background:#FBF6E2">' +
          '<h2>Notes Studio</h2><p>This page is not cached yet. Connect once to the internet, then it works offline.</p></body>',
          { headers: { 'Content-Type': 'text/html;charset=utf-8' }, status: 200 }
        );
      }
    })());
    return;
  }

  /* --- other same-origin assets: cache first --- */
  if (url.origin === location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch (e) {
        return Response.error();
      }
    })());
  }
});
