const CACHE_NAME = "notebloom-v5";

const FILES = [
  "./",
  "./index.html",
  "./index.css",
  "./app.js",
  "./database.js",
  "./editor.js",
  "./manifest.json",
  "./assets/icon-192.png",
  "./assets/icon-256.png",
  "./assets/icon-384.png",
  "./assets/icon-512.png"
];

// Install Event - cache all static files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate Event - clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch Event - cache-first strategy with network fallback
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
