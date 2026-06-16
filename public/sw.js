const CACHE_NAME = 'dejoa-cache-v1';
const ASSETS_TO_CACHE = ['/', '/index.html'];

// Proses Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Aktivasi & Pembersihan Cache Lama
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Strategi Fetching: Ambil dari internet, jika offline ambil dari cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});