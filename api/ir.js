// Vercel Function: abre un enlace de mapas "pasando" por la app.
//
//   GET /api/ir?u=https://maps.app.goo.gl/xxxx  ->  302 al enlace
//
// En el iPhone, con la app instalada en la pantalla de inicio, abrir un enlace de
// Google Maps lanza la app de Google Maps y deja una ventana en blanco al volver.
// Si el enlace se abre a través de una redirección, iOS no salta a la otra app:
// el mapa se ve dentro de la ventana y al cerrarla se vuelve a la app del torneo.
// Solo se aceptan enlaces de mapas, para que nadie pueda usarlo como redirección.

const PERMITIDOS = [
  /^maps\.app\.goo\.gl$/i,
  /^goo\.gl$/i,
  /^(www\.)?google\.[a-z.]+$/i,
  /^maps\.google\.[a-z.]+$/i,
  /^maps\.apple\.com$/i
];

export default function handler(req, res) {
  let destino;
  try {
    destino = new URL(String(req.query?.u || ""));
  } catch (e) {
    res.status(400).send("Enlace no válido");
    return;
  }

  const esMapa = /^https?:$/.test(destino.protocol) &&
    PERMITIDOS.some(r => r.test(destino.hostname)) &&
    (destino.hostname !== "goo.gl" || destino.pathname.startsWith("/maps")) &&
    (!/google\./i.test(destino.hostname) || destino.hostname.startsWith("maps.") || destino.pathname.startsWith("/maps"));

  if (!esMapa) {
    res.status(400).send("Enlace no permitido");
    return;
  }

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.redirect(302, destino.toString());
}
