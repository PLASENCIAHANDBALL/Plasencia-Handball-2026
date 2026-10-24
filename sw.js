/* ============================================================
   Service worker – Plasencia Handball
   ------------------------------------------------------------
   Qué hace:
   · App (HTML, CSS, JS): sale de caché al instante y se actualiza en segundo plano.
   · Imágenes: caché primero (solo se descargan una vez).
   · Datos de Supabase (lecturas GET): red primero con límite de espera y, si la
     cobertura falla (típico en un pabellón), se muestra la última copia guardada.
   · NO toca: audio, peticiones Range, escrituras (POST/PATCH/DELETE), la tabla
     roles_acceso (lleva el PIN en la URL) ni nada de auth/rpc.

   Cuándo subir VERSION: cuando cambies algún fichero de la lista PRECARGA o quieras
   forzar que todos los móviles descarguen todo de nuevo. Aunque no la subas, la app
   se refresca sola en la siguiente visita (estrategia "stale-while-revalidate").
   ============================================================ */

const VERSION = "2026-10-24-17";

const CACHE_APP = `ph-app-${VERSION}`;
const CACHE_IMG = "ph-img-v1";
const CACHE_DATOS = "ph-datos-v1";
const CACHES_VALIDAS = [CACHE_APP, CACHE_IMG, CACHE_DATOS];

const MAX_IMAGENES = 120;      // para que la caché de imágenes no crezca sin límite
const ESPERA_DATOS_MS = 6000;  // si Supabase tarda más, se enseña la copia guardada

const PRECARGA = [
  "./",
  "index.html",
  "css/style.css",
  "js/app.js",
  "js/supabase.js",
  "manifest.json",
  "img/club-placeholder.svg",
  "img/logo-torneo.webp",
  "img/splash-poster.webp",
  "img/header.webp",
  "img/header-m.webp",
  "img/redes.webp",
  "img/instagram.webp",
  "img/facebook.webp",
  "img/twitch.webp",
  "img/iconos/fotos.webp",
  "img/iconos/musica.webp",
  "img/pabellones/municipal.webp",
  "img/pabellones/escuela.webp",
  "img/pabellones/universitario.webp",
  "img/pabellones/miralvalle.webp",
  "img/pabellones/san-calixto.webp",
  "img/pabellones/la-data.webp",
  "img/pabellones/san-miguel.webp",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-maskable-192.png",
  "assets/icons/icon-maskable-512.png",
  "assets/icons/apple-touch-icon.png"
];

/* ---------- ciclo de vida ---------- */

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_APP);
    await Promise.all(PRECARGA.map(async (ruta) => {
      const url = new URL(ruta, self.registration.scope).href;
      try {
        // "reload" salta la caché HTTP del navegador (GitHub Pages cachea ~10 min)
        const res = await fetch(new Request(url, { cache: "reload" }));
        if (res.ok) await cache.put(url, res);
      } catch (e) {
        // un fichero que falle no debe impedir instalar el resto
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(
      nombres
        .filter((n) => n.startsWith("ph-") && !CACHES_VALIDAS.includes(n))
        .map((n) => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data === "saltar-espera") self.skipWaiting();
});

/* ---------- avisos de partidos (notificaciones push) ---------- */

self.addEventListener("push", (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch (e) {
    datos = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(datos.title || "Plasencia Handball", {
      body: datos.body || "",
      icon: "assets/icons/icon-192.png",
      tag: datos.tag || undefined,
      data: { url: datos.url || "./" }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const destino = new URL((event.notification.data && event.notification.data.url) || "./", self.registration.scope).href;

  event.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });

    for (const v of ventanas) {
      if (v.url.startsWith(self.registration.scope)) {
        await v.focus();
        v.postMessage({ tipo: "abrir-partido", url: destino });
        return;
      }
    }

    await self.clients.openWindow(destino);
  })());
});

/* ---------- utilidades ---------- */

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function esCacheable(res) {
  return res && res.status === 200 && (res.type === "basic" || res.type === "cors");
}

async function recortar(nombreCache, max) {
  const cache = await caches.open(nombreCache);
  const claves = await cache.keys();
  const sobran = claves.length - max;
  for (let i = 0; i < sobran; i++) await cache.delete(claves[i]);
}

/* ---------- estrategias ---------- */

// Copia al instante + actualización en segundo plano
async function staleWhileRevalidate(event, req, nombreCache) {
  const cache = await caches.open(nombreCache);
  const guardada = (await cache.match(req)) || (await caches.match(req));

  const pedirRed = req.mode === "navigate" ? fetch(req) : fetch(req, { cache: "no-cache" });
  const red = pedirRed.then((res) => {
    if (esCacheable(res)) cache.put(req, res.clone());
    return res;
  });
  event.waitUntil(red.catch(() => {}));

  if (guardada) return guardada;

  try {
    return await red;
  } catch (e) {
    if (req.mode === "navigate") {
      const inicio =
        (await caches.match(new URL("index.html", self.registration.scope).href)) ||
        (await caches.match(self.registration.scope));
      if (inicio) return inicio;
    }
    throw e;
  }
}

// Imagen guardada si la hay; si no, red y se guarda
async function cachePrimero(event, req) {
  const guardada = await caches.match(req);
  if (guardada) return guardada;

  const res = await fetch(req);
  if (esCacheable(res)) {
    const copia = res.clone();
    event.waitUntil(
      caches.open(CACHE_IMG)
        .then((c) => c.put(req, copia))
        .then(() => recortar(CACHE_IMG, MAX_IMAGENES))
        .catch(() => {})
    );
  }
  return res;
}

// Fuentes: guardada si la hay; si no, red y se guarda (la hoja de estilos llega como respuesta opaca)
async function fuentes(event, req) {
  const cache = await caches.open(CACHE_IMG);
  const guardada = await cache.match(req);
  if (guardada) return guardada;

  const res = await fetch(req);
  if (res && (res.ok || res.type === "opaque")) event.waitUntil(cache.put(req, res.clone()).catch(() => {}));
  return res;
}

// Datos: red si responde a tiempo; si no, última copia guardada
async function redPrimero(event, req, nombreCache, ms) {
  const cache = await caches.open(nombreCache);

  const red = fetch(req).then((res) => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  });
  event.waitUntil(red.catch(() => {}));

  try {
    return await Promise.race([
      red,
      esperar(ms).then(() => { throw new Error("tiempo agotado"); })
    ]);
  } catch (e) {
    const guardada = await cache.match(req, { ignoreVary: true });
    if (guardada) return guardada;
    return red; // sin copia: esperar a la red (si falla, el error llega a la app)
  }
}

/* ---------- interceptar peticiones ---------- */

self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;
  if (req.headers.has("range")) return;

  const url = new URL(req.url);
  if (url.protocol !== "https:" && url.protocol !== "http:") return;

  // --- Supabase ---
  if (url.hostname.endsWith(".supabase.co")) {
    if (url.pathname.startsWith("/rest/v1/")) {
      // El PIN viaja en la URL de roles_acceso: jamás se guarda
      if (url.pathname.includes("roles_acceso")) return;
      event.respondWith(redPrimero(event, req, CACHE_DATOS, ESPERA_DATOS_MS));
      return;
    }
    if (url.pathname.startsWith("/storage/v1/object/public/")) {
      event.respondWith(cachePrimero(event, req));
      return;
    }
    return; // auth, rpc, subidas…
  }

  // --- Tipografía (Google Fonts): se guarda para que también salga sin cobertura ---
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(fuentes(event, req));
    return;
  }

  // --- Librería de Supabase desde el CDN ---
  if (url.hostname === "cdn.jsdelivr.net") {
    event.respondWith(staleWhileRevalidate(event, req, CACHE_APP));
    return;
  }

  // --- Solo nuestro propio sitio a partir de aquí ---
  if (url.origin !== self.location.origin) return;

  // El audio lo gestiona el navegador (necesita peticiones Range)
  if (/\.(mp3|ogg|m4a|wav|aac|mp4|webm)$/i.test(url.pathname)) return;

  // El propio sw.js nunca desde caché
  if (url.pathname.endsWith("/sw.js")) return;

  if (/\.(webp|png|jpe?g|gif|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(cachePrimero(event, req));
    return;
  }

  event.respondWith(staleWhileRevalidate(event, req, CACHE_APP));
});
