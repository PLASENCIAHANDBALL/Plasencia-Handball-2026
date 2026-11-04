// Vercel Function: una foto concreta de Amazon Photos, siempre con enlace fresco.
//
//   GET /api/foto?anio=2026&p=<carpeta>&id=<foto>  ->  302 a la imagen (900 px)
//
// Mira la carpeta en Amazon, coge el enlace temporal de esa foto y redirige a él.
// Vercel guarda la redirección 20 minutos (el enlace dura más), así casi nunca hay que
// preguntar a Amazon. Solo vale para las carpetas compartidas del torneo.

import { CARPETAS, hijos, esFoto } from "./_amazon.js";

const ANCHO = 900;
const carpetas = new Map(); // carpeta -> { t, enlaces: Map(id -> tempLink) }
const VIDA = 15 * 60 * 1000;

async function enlacesDe(p, share) {
  const guardado = carpetas.get(p);
  if (guardado && Date.now() - guardado.t < VIDA) return guardado.enlaces;
  const lista = await hijos(p, share, 1000);
  const enlaces = new Map(lista.filter(n => esFoto(n) && n.tempLink).map(n => [n.id, n.tempLink]));
  if (carpetas.size > 50) carpetas.clear();
  carpetas.set(p, { t: Date.now(), enlaces });
  return enlaces;
}

export default async function handler(req, res) {
  const share = CARPETAS[String(req.query?.anio || "")];
  const p = String(req.query?.p || "");
  const id = String(req.query?.id || "");
  if (!share || !/^[\w-]{6,80}$/.test(p) || !/^[\w-]{6,80}$/.test(id)) {
    res.status(400).send("Foto no válida");
    return;
  }

  try {
    let enlace = (await enlacesDe(p, share)).get(id);
    if (!enlace) {
      carpetas.delete(p); // por si la carpeta cambió: se mira otra vez
      enlace = (await enlacesDe(p, share)).get(id);
    }
    if (!enlace) {
      res.setHeader("Cache-Control", "s-maxage=300");
      res.status(404).send("Foto no encontrada");
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=1200");
    res.redirect(302, `${enlace}?viewBox=${ANCHO}`);
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(502).send("Amazon no responde");
  }
}
