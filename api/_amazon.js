// Piezas comunes para leer las carpetas compartidas de Amazon Photos.
// (Los archivos que empiezan por "_" no son funciones públicas en Vercel.)

export const CARPETAS = {
  2027: "KXGh7Cy7vuudvBxrWVuoY35LBAPWx7eMIZBOdLmFBbF",
  2026: "BNF0g9ckA7PPdmq1jetkgeJ9zO8BwiJW6Gj4KPumS5",
  2025: "aMDlytCvANQmoT7QWp8ZiOqXXSb5emV0vrADnw8qT7s"
};

// Las carpetas son de Amazon España
export const DOMINIO = "https://www.amazon.es";

const CABECERAS = {
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "es-ES,es;q=0.9",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
};

export async function pedir(url, paso, intentos = 2) {
  let ultimo;
  for (let i = 0; i < intentos; i++) {
    try {
      const r = await fetch(url, { headers: CABECERAS, redirect: "follow", signal: AbortSignal.timeout(7000) });
      if (r.ok && (r.headers.get("content-type") || "").includes("json")) return r.json();
      const texto = (await r.text().catch(() => "")).slice(0, 160).replace(/\s+/g, " ");
      ultimo = new Error(`${paso}: Amazon respondió ${r.status} ${texto}`);
      // si Amazon pide calma (429/503) se espera un poco antes de reintentar
      if (r.status === 429 || r.status >= 500) await new Promise(ok => setTimeout(ok, 600 * (i + 1)));
      else break;
    } catch (e) {
      ultimo = new Error(`${paso}: ${e.message || e}`);
    }
  }
  throw ultimo;
}

export async function hijos(nodo, share, maximo = 1000) {
  const todos = [];
  for (let offset = 0; offset < maximo; offset += 200) {
    const url = `${DOMINIO}/drive/v1/nodes/${encodeURIComponent(nodo)}/children?asset=ALL&limit=200&offset=${offset}` +
      `&searchOnFamily=false&tempLink=true&shareId=${share}&resourceVersion=V2&ContentType=JSON`;
    const datos = await pedir(url, "listar fotos");
    const lista = datos.data || [];
    todos.push(...lista);
    if (lista.length < 200) break;
  }
  return todos;
}

export async function raizDe(share) {
  const info = await pedir(`${DOMINIO}/drive/v1/shares/${share}?shareId=${share}&resourceVersion=V2&ContentType=JSON`, "abrir carpeta");
  const raiz = info.nodeInfo?.id;
  if (!raiz) throw new Error("abrir carpeta: no viene el id de la carpeta");
  return raiz;
}

export function esFoto(n) {
  const tipo = n.contentProperties?.contentType || "";
  return n.kind === "FILE" && (tipo.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(n.name || ""));
}

export function barajar(lista) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}
