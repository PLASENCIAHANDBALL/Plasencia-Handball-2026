const CACHE_NAME = "plasencia-handball-v3";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./css/style.css",

  // JS principal
  "./js/app.js",
  "./supabase.js",

  // datos locales
  "./js/data/clubes.js",
  "./js/data/equipos.js",
  "./js/data/partidos.js",
  "./js/data/grupos.js",
  "./js/data/clasificacion.js",

  "./manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .catch((err) => console.error("Cache error:", err))
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(
      (response) => response || fetch(e.request)
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});