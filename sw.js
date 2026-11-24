// ═══ GfredMaster — service worker (ouverture hors réseau) ═══════════════
// GfredMaster vit à la RACINE du site (dépôt Gfred70.github.io) pour que ses
// applis s'ouvrent dans sa fenêtre, sans barre d'adresse.
// Cache d'abord, mise à jour en tâche de fond, MAIS uniquement pour les
// fichiers de GfredMaster lui-même (liste ci-dessous) : tout le reste
// (/GfredAnalyzer-app/, /gfreddream-app/, ...) passe sans y toucher, chaque
// appli garde son propre service worker et son propre cache.
// v0.1.2 : la PAGE est prise sur le réseau d'abord (sans cache HTTP), copie
// si hors ligne ou trop lent (4 s) ; installation sans le cache HTTP
// (cache:'reload') → une mise à jour se voit dès la 1re ouverture.
// Nouvelle version ou fichier ajouté : changer CACHE_NAME.
const CACHE_NAME = 'gfredmaster-0.1.2';
const NET_TIMEOUT_MS = 4000;
const PRECACHE_URLS = [
  './', 'index.html', 'manifest.json', 'favicon.ico',
  'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png',
  'apps/gfredanalyzer.png', 'apps/gfreddream.png', 'apps/gonflage-o2.png', 'apps/gfredo2tank.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE_URLS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((n) => Promise.all(n.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
const OWN = new Set(PRECACHE_URLS.map((u) => new URL(u, self.registration.scope).pathname));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || !OWN.has(url.pathname)) return;   // pas à nous : on ne touche à rien
  if (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    const net = fetch(e.request, { cache: 'no-store' }).then((r) => {
      if (r && r.status === 200) { const copy = r.clone(); caches.open(CACHE_NAME).then((c) => c.put('index.html', copy)); }
      return r;
    });
    const timeout = new Promise((res) => setTimeout(res, NET_TIMEOUT_MS));
    e.respondWith(Promise.race([net.catch(() => null), timeout]).then((r) => r || caches.match('index.html').then((c) => c || net)));
    return;
  }
  e.respondWith(caches.match(e.request).then((cached) => {
    const net = fetch(e.request).then((r) => {
      if (r && r.status === 200) { const copy = r.clone(); caches.open(CACHE_NAME).then((c) => c.put(e.request, copy)); }
      return r;
    }).catch(() => cached);
    return cached || net;
  }));
});
