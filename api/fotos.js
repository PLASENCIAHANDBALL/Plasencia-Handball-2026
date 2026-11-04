// Vercel Function: lista de fotos aleatorias de una carpeta compartida de Amazon Photos.
//
//   GET /api/fotos?anio=2026  ->  { anio, fotos: ["/api/foto?anio=2026&p=…&id=…", …] }
//
// Los enlaces directos de Amazon caducan al rato, así que la lista NO los incluye: cada foto
// apunta a /api/foto, que busca en ese momento un enlace fresco y redirige a él. Así la
// lista se puede guardar mucho tiempo (carga al instante) y las fotos nunca salen rotas.

import { CARPETAS, raizDe, hijos, esFoto, barajar } from "./_amazon.js";

const CUANTAS = 80;       // fotos que se devuelven (la app las baraja en cada visita)
const memoria = {};       // última lista buena por año (mientras la función siga "despierta")

async function buscarFotos(anio, share) {
  const raiz = await raizDe(share);
  const limite = Date.now() + 7000;
  const fotos = [];
  let pendientes = [raiz];

  // recorre carpetas y álbumes hasta 3 niveles, de 4 en 4 para no saturar a Amazon
  for (let nivel = 0; nivel < 3 && pendientes.length && fotos.length < 500 && Date.now() < limite; nivel++) {
    const siguientes = [];
    const tanda = pendientes.slice(0, 8);
    for (let i = 0; i < tanda.length && Date.now() < limite; i += 4) {
      const listas = await Promise.all(tanda.slice(i, i + 4).map(nodo =>
        hijos(nodo, share, nivel === 0 ? 1000 : 400).then(l => ({ nodo, l })).catch(() => ({ nodo, l: [] }))));
      for (const { nodo, l } of listas) {
        for (const n of l) {
          if (esFoto(n)) fotos.push({ id: n.id, p: nodo });
          else if (n.kind !== "FILE") siguientes.push(n.id);
        }
      }
    }
    pendientes = barajar(siguientes);
  }

  if (!fotos.length) throw new Error("la carpeta no tiene fotos");
  return barajar(fotos).slice(0, CUANTAS)
    .map(f => `/api/foto?anio=${anio}&p=${encodeURIComponent(f.p)}&id=${encodeURIComponent(f.id)}`);
}

export default async function handler(req, res) {
  const anio = String(req.query?.anio || "");
  const share = CARPETAS[anio];
  if (!share) {
    res.status(400).json({ error: "Año no válido" });
    return;
  }

  try {
    const fotos = await buscarFotos(anio, share);
    memoria[anio] = fotos;
    // 1 h de caché y, después, Vercel sigue sirviendo la anterior al instante mientras renueva
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=604800");
    res.status(200).json({ anio: Number(anio), fotos });
  } catch (e) {
    if (memoria[anio]?.length) {
      // Amazon no responde ahora: se da la última lista buena en vez de un error
      res.setHeader("Cache-Control", "s-maxage=60");
      res.status(200).json({ anio: Number(anio), fotos: memoria[anio], aviso: String(e.message || e) });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(502).json({ anio: Number(anio), fotos: [], error: String(e.message || e) });
  }
}
