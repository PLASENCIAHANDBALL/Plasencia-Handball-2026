// Vercel Function: devuelve fotos aleatorias de una carpeta compartida de Amazon Photos.
//
//   GET /api/fotos?anio=2027  ->  { anio, fotos: ["https://…", …] }
//
// El navegador no puede pedir estas fotos directamente a Amazon (lo bloquea CORS), así que
// esta función hace de intermediaria. Solo acepta las carpetas de la lista de abajo.
// Vercel guarda la respuesta 5 minutos en su caché, así que Amazon recibe muy pocas visitas.
// Se devuelven muchas fotos y la app las baraja, así cada visita enseña otras distintas.

const CARPETAS = {
  2027: "KXGh7Cy7vuudvBxrWVuoY35LBAPWx7eMIZBOdLmFBbF",
  2026: "BNF0g9ckA7PPdmq1jetkgeJ9zO8BwiJW6Gj4KPumS5",
  2025: "aMDlytCvANQmoT7QWp8ZiOqXXSb5emV0vrADnw8qT7s"
};

// Se prueba primero Amazon España y, si falla, Amazon.com (las carpetas compartidas valen en ambos)
const DOMINIOS = ["https://www.amazon.es", "https://www.amazon.com"];
const CUANTAS = 60;         // fotos que se devuelven (la app las baraja en cada visita)
const ANCHO = 900;          // tamaño de las miniaturas (px)

const CABECERAS = {
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "es-ES,es;q=0.9",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "x-amzn-sessionid": ""
};

async function pedir(url, paso) {
  const r = await fetch(url, { headers: CABECERAS, redirect: "follow" });
  if (!r.ok) {
    const texto = (await r.text().catch(() => "")).slice(0, 200).replace(/\s+/g, " ");
    throw new Error(`${paso}: Amazon respondió ${r.status} ${texto}`);
  }
  const tipo = r.headers.get("content-type") || "";
  if (!tipo.includes("json")) {
    const texto = (await r.text().catch(() => "")).slice(0, 120).replace(/\s+/g, " ");
    throw new Error(`${paso}: Amazon no devolvió datos (${tipo}) ${texto}`);
  }
  return r.json();
}

async function hijos(dominio, nodo, share) {
  const todos = [];
  for (let offset = 0; offset < 1000; offset += 200) {
    const url = `${dominio}/drive/v1/nodes/${nodo}/children?asset=ALL&limit=200&offset=${offset}` +
      `&searchOnFamily=false&tempLink=true&shareId=${share}&resourceVersion=V2&ContentType=JSON`;
    const datos = await pedir(url, "listar fotos");
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

  const errores = [];
  for (const dominio of DOMINIOS) {
    try {
      const info = await pedir(`${dominio}/drive/v1/shares/${share}?shareId=${share}&resourceVersion=V2&ContentType=JSON`, "abrir carpeta");
      const raiz = info.nodeInfo?.id;
      if (!raiz) throw new Error("abrir carpeta: no viene el id de la carpeta");

      // Recorre la carpeta compartida y lo que tenga dentro (carpetas, álbumes...) hasta 3 niveles
      const fotos = [];
      const vistos = [];
      let pendientes = [raiz];
      for (let nivel = 0; nivel < 3 && pendientes.length && fotos.length < 600; nivel++) {
        const siguientes = [];
        for (const nodo of pendientes.slice(0, 12)) {
          const lista = await hijos(dominio, nodo, share);
          for (const n of lista) {
            vistos.push(`${n.kind}${n.tempLink ? "+link" : ""}${n.contentProperties?.contentType ? ":" + n.contentProperties.contentType : ""}`);
            if (esFoto(n)) fotos.push(n);
            else if (n.kind !== "FILE") siguientes.push(n.id);
          }
        }
        pendientes = barajar(siguientes);
      }
      if (!fotos.length) throw new Error(`la carpeta no tiene fotos (vistos: ${vistos.slice(0, 10).join(", ") || "nada"}; raíz: ${info.nodeInfo?.kind || "?"})`);

      const urls = barajar(fotos).slice(0, CUANTAS).map(n => `${n.tempLink}?viewBox=${ANCHO}`);
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=900");
      res.status(200).json({ anio: Number(anio), fotos: urls });
      return;
    } catch (e) {
      errores.push(`${dominio}: ${e.message || e}`);
    }
  }

  res.setHeader("Cache-Control", "no-store");
  res.status(502).json({ anio: Number(anio), fotos: [], error: errores });
}
