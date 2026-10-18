// ═══ GfredMaster — service worker (ouverture hors réseau) ═══════════════
// GfredMaster vit à la RACINE du site (dépôt Gfred70.github.io) pour que ses
// applis s'ouvrent dans sa fenêtre, sans barre d'adresse.
// Cache d'abord, mise à jour en tâche de fond, MAIS uniquement pour les
// fichiers de GfredMaster lui-même (liste ci-dessous) : tout le reste
// (/GfredAnalyzer-app/, /gfreddream-app/, ...) passe sans y toucher, chaque
// appli garde son propre service worker et son propre cache.
// Nouvelle version ou fichier ajouté : changer CACHE_NAME.
const CACHE_NAME = 'gfredmaster-0.1.1';
const PRECACHE_URLS = [
  './', 'index.html', 'manifest.json', 'favicon.ico',
  'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png',
  'apps/gfredanalyzer.png', 'apps/gfreddream.png', 'apps/gonflage-o2.png', 'apps/gfredo2tank.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()));
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
  e.respondWith(caches.match(e.request).then((cached) => {
    const net = fetch(e.request).then((r) => {
      if (r && r.status === 200) { const copy = r.clone(); caches.open(CACHE_NAME).then((c) => c.put(e.request, copy)); }
      return r;
    }).catch(() => cached);
    return cached || net;
  }));
});
