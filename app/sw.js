// Service Worker per MPA Gestionale Produzione v6.0 (PDF Engine & Context Menu)
const CACHE_NAME = 'mpa-gestionale-v6.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/components.css',
  './js/app.js',
  './js/auth.js',
  './js/storage.js',
  './js/mock-data.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network first per avere sempre le modifiche immediate
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
