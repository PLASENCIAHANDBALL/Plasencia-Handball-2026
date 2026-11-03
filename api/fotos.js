// Vercel Function: devuelve fotos aleatorias de una carpeta compartida de Amazon Photos.
//
//   GET /api/fotos?anio=2027  ->  { anio, fotos: ["https://…", …] }
//
// El navegador no puede pedir estas fotos directamente a Amazon (lo bloquea CORS), así que
// esta función hace de intermediaria. Solo acepta las carpetas de la lista de abajo.
// Vercel guarda la respuesta 10 minutos en su caché, así que Amazon recibe muy pocas visitas.

const CARPETAS = {
  2027: "KXGh7Cy7vuudvBxrWVuoY35LBAPWx7eMIZBOdLmFBbF",
  2026: "BNF0g9ckA7PPdmq1jetkgeJ9zO8BwiJW6Gj4KPumS5",
  2025: "aMDlytCvANQmoT7QWp8ZiOqXXSb5emV0vrADnw8qT7s"
};

const DOMINIO = "https://www.amazon.es";
const CUANTAS = 8;          // fotos que se devuelven
const ANCHO = 900;          // tamaño de las miniaturas (px)

async function pedir(url) {
  const r = await fetch(url, {
    headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0 (PlasenciaHandball)" }
  });
  if (!r.ok) throw new Error(`Amazon respondió ${r.status}`);
  return r.json();
}

async function hijos(nodo, share) {
  const todos = [];
  for (let offset = 0; offset < 1000; offset += 200) {
    const url = `${DOMINIO}/drive/v1/nodes/${nodo}/children?asset=ALL&limit=200&offset=${offset}` +
      `&searchOnFamily=false&tempLink=true&shareId=${share}&resourceVersion=V2&ContentType=JSON`;
    const datos = await pedir(url);
    const lista = datos.data || [];
    todos.push(...lista);
    if (lista.length < 200) break;
  }
  return todos;
}

function esFoto(n) {
  const tipo = n.contentProperties?.contentType || "";
  return n.kind === "FILE" && n.tempLink && (tipo.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(n.name || ""));
}

function barajar(lista) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

export default async function handler(req, res) {
  const anio = String(req.query?.anio || "");
  const share = CARPETAS[anio];
  if (!share) {
    res.status(400).json({ error: "Año no válido" });
    return;
  }

  try {
    const info = await pedir(`${DOMINIO}/drive/v1/shares/${share}?shareId=${share}&resourceVersion=V2&ContentType=JSON`);
    const raiz = info.nodeInfo?.id;
    if (!raiz) throw new Error("Carpeta no encontrada");

    // fotos de la carpeta y, si hay subcarpetas (por días), también de unas cuantas de ellas
    const nivel1 = await hijos(raiz, share);
    let fotos = nivel1.filter(esFoto);
    const subcarpetas = barajar(nivel1.filter(n => n.kind === "FOLDER")).slice(0, 4);
    for (const carpeta of subcarpetas) {
      if (fotos.length >= 300) break;
      fotos.push(...(await hijos(carpeta.id, share)).filter(esFoto));
    }

    const urls = barajar(fotos).slice(0, CUANTAS).map(n => `${n.tempLink}?viewBox=${ANCHO}`);

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
    res.status(200).json({ anio: Number(anio), fotos: urls });
  } catch (e) {
    res.setHeader("Cache-Control", "s-maxage=60");
    res.status(502).json({ anio: Number(anio), fotos: [], error: String(e.message || e) });
  }
}
