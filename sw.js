// Kentucky Basketball app service worker
const VERSION = 'ukmbb-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Live ESPN data: always try the network first so scores are fresh; use the last copy only when offline
  if (url.hostname === 'site.api.espn.com') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION + '-data').then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req)));
    return;
  }
  // Logos, headshots and fonts: cached after first load
  if (/espncdn\.com$|fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION + '-media').then(c => c.put(req, copy)); return r; })));
    return;
  }
  // The app itself: network first so updates show up, cache when offline
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html'))));
  }
});
