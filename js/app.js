import { supabase } from "./supabase.js";
import { iniciarIdioma, t } from "./i18n.js";

/* ================== AJUSTES ================== */

const PLACEHOLDER_ESCUDO = "img/club-placeholder.svg";
const ZONA_TORNEO = "Europe/Madrid";     // las horas de los partidos son horas de Plasencia
const DURACION_PARTIDO_MIN = 50;         // minutos que un partido figura "en juego" desde su hora de inicio
const INTERVALO_VIVO_MS = 30000;         // cada cuánto se refrescan los marcadores del día

document.body.classList.add("splash-activo");

const contenido = document.getElementById("contenido");

/* ================== UTILIDADES ================== */

// Iconos de línea (1,5 px), de un solo estilo, en lugar de emojis
const ICONOS = {
  play:  '<path d="M8 5.5v13l11-6.5z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  prev:  '<path d="M6 5v14M19 5.5v13L9 12z"/>',
  up:    '<path d="M12 19V5M6 11l6-6 6 6"/>',
  chev:  '<path d="M6 9l6 6 6-6"/>',
  down:  '<path d="M12 5v14M6 13l6 6 6-6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  tabla:      '<path d="M5 20V11M12 20V4M19 20v-6"/>',
  pabellon:   '<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  musica:     '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  bolsa:      '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
  campana:    '<path d="M6 16v-5a6 6 0 1112 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 004 0"/>',
  derecha:    '<path d="M9 6l6 6-6 6"/>',
  izquierda:  '<path d="M15 6l-6 6 6 6"/>',
  lupa:       '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  camara:     '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  estrella:   '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z"/>',
  mas:        '<path d="M12 5v14M5 12h14"/>',
  diana:      '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/>',
  escudo:     '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
  mano:       '<path d="M8 12V6.5a1.5 1.5 0 013 0V11m0-4.5v-1a1.5 1.5 0 013 0V11m0-4a1.5 1.5 0 013 0v7a6 6 0 01-6 6h-1a6 6 0 01-5-2.7L4 14.5a1.5 1.5 0 012.4-1.7L8 14"/>',
  rayo:       '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
  claqueta:   '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M4 9l2-4 3 1.5L11 3l3 1.5L16 3l2 3.5L20 9"/>',
  subir:      '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/>',
  bandera:    '<path d="M6 21V4M6 5h11l-2 4 2 4H6"/>',
  trofeo:     '<path d="M8 4h8v5a4 4 0 01-8 0z"/><path d="M8 6H5v1.5A3 3 0 008 10.5M16 6h3v1.5a3 3 0 01-3 3"/><path d="M12 13v4M8.5 20h7M10 17h4"/>',
  menos:      '<path d="M5 12h14"/>',
  check:      '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  regalo:     '<rect x="3.5" y="9" width="17" height="4" rx="1"/><path d="M5 13v7h14v-7M12 9v11"/><path d="M12 9c-2.5 0-4.5-1-4.5-2.8C7.5 4.8 8.6 4 9.8 4 11.3 4 12 6 12 9zM12 9c2.5 0 4.5-1 4.5-2.8C16.5 4.8 15.4 4 14.2 4 12.7 4 12 6 12 9z"/>'
};
function ico(nombre, tam = 18) {
  return `<svg class="ico" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[nombre] || ""}</svg>`;
}

// localStorage puede lanzar error (modo privado, cookies bloqueadas): nunca debe romper la app
function lsGet(clave) { try { return localStorage.getItem(clave); } catch (e) { return null; } }
function lsSet(clave, valor) { try { localStorage.setItem(clave, valor); } catch (e) { /* sin almacenamiento */ } }
function lsRemove(clave) { try { localStorage.removeItem(clave); } catch (e) { /* sin almacenamiento */ } }

/* ---- Seguridad ----
   Todo texto que llega de la base de datos se escapa UNA vez al cargarlo (sanear*),
   así que las plantillas con innerHTML no pueden ejecutar código si alguien guarda
   algo como <img onerror=...> en el nombre de un equipo. */
const ESCAPES_HTML = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function escaparHtml(valor) {
  if (valor === null || valor === undefined) return "";
  return String(valor).replace(/[&<>"']/g, c => ESCAPES_HTML[c]);
}

// Solo deja pasar direcciones http(s), rutas relativas de la propia app e imágenes data: en base64
function urlSegura(valor, permitirData = false) {
  if (!valor) return "";
  const s = String(valor).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w\-./%]+$/.test(s)) return s;
  if (permitirData && /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(s)) return s;
  return "";
}

function sanearClub(c) {
  const escudo = urlSegura(c.escudo, true);
  return {
    ...c,
    nombre: escaparHtml(c.nombre),
    escudo: escudo.startsWith("data:") ? escudo : escaparHtml(escudo)
  };
}

function sanearEquipo(e) {
  return {
    ...e,
    nombre: escaparHtml(e.nombre),
    categoria: escaparHtml(e.categoria),
    genero: escaparHtml(e.genero),
    grupo: escaparHtml(e.grupo)
  };
}

function sanearPartido(p) {
  const r = { ...p };
  ["categoria", "genero", "grupo", "fase", "pabellon", "fecha", "hora", "estado"].forEach(k => {
    if (r[k] !== null && r[k] !== undefined) r[k] = escaparHtml(r[k]);
  });
  return r;
}

function sanearPatrocinador(p) {
  return {
    ...p,
    nombre: escaparHtml(p.nombre),
    web: escaparHtml(urlSegura(p.web)),
    imagen: escaparHtml(urlSegura(p.imagen))
  };
}

// Convierte un texto ya escapado en texto normal (para confirm(), que no interpreta HTML)
function textoPlano(valor) {
  const t = document.createElement("textarea");
  t.innerHTML = valor ?? "";
  return t.value;
}

// Para construir ids de elementos sin espacios ni caracteres raros
function slug(...partes) {
  return partes
    .join("-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ---- Avisos (sustituyen a avisar(): no bloquean la pantalla) ---- */
function avisar(texto, tipo, opciones) {
  const { accion, etiqueta, duracion = 4500 } = opciones || {};
  const mensaje = String(texto);

  if (!tipo) {
    tipo = /error|incorrecto|no pueden|no se pudo|obligatorios|no hay inputs/i.test(mensaje)
      ? "error"
      : "info";
  }

  const cont = document.getElementById("avisos");
  if (!cont) {
    console.log(mensaje);
    return;
  }

  const el = document.createElement("div");
  el.className = `aviso ${tipo}`;

  const span = document.createElement("span");
  span.textContent = mensaje;
  el.appendChild(span);

  if (accion) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = etiqueta || "Aceptar";
    boton.addEventListener("click", () => {
      el.remove();
      accion();
    });
    el.appendChild(boton);
  }

  cont.appendChild(el);

  if (duracion) setTimeout(() => el.remove(), duracion);

  while (cont.children.length > 3) cont.firstChild.remove();
}

window.avisar = avisar;

// Antes cada error mostraba un avisar() con el texto técnico. Ahora se guarda en la
// consola y se avisa con un mensaje discreto (como mucho uno cada 10 s).
let ultimoAvisoError = 0;

window.addEventListener("error", (e) => {
  console.error("Error en la app:", e.message, e.error);

  if (Date.now() - ultimoAvisoError > 10000) {
    ultimoAvisoError = Date.now();
    avisar("Algo no ha ido bien. Si la pantalla no responde, vuelve a abrir la app.", "error");
  }
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("Promesa sin resolver:", e.reason);
});

/* ---- Fechas y horas ----
   Las horas de los partidos se guardan sin zona horaria y son horas de Plasencia.
   Se interpretan siempre como hora de Madrid, aunque quien mira la app esté en
   otro país (es un torneo internacional) o tenga el reloj del móvil en otra zona. */

// "2027-06-05" -> Date local a mediodía (evita saltos de día por zona horaria)
function parseFecha(fecha) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha || "");
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
}

// Fecha de hoy en Madrid con formato "YYYY-MM-DD"
function hoyISO() {
  try {
    const f = new Intl.DateTimeFormat("sv-SE", { timeZone: ZONA_TORNEO }).format(new Date());
    if (/^\d{4}-\d{2}-\d{2}$/.test(f)) return f;
  } catch (e) { /* se usa el reloj local */ }
  const d = new Date();
  const dos = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

// Instante real de inicio de un partido (fecha + hora interpretadas como hora de Madrid)
function inicioPartido(p) {
  if (!p || !p.fecha || !p.hora) return null;

  const f = /^(\d{4})-(\d{2})-(\d{2})/.exec(p.fecha);
  const h = /^(\d{1,2}):(\d{2})/.exec(p.hora);
  if (!f || !h) return null;

  const supuesto = Date.UTC(Number(f[1]), Number(f[2]) - 1, Number(f[3]), Number(h[1]), Number(h[2]));

  try {
    const partes = new Intl.DateTimeFormat("en-GB", {
      timeZone: ZONA_TORNEO,
      hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    }).formatToParts(new Date(supuesto));

    const g = tipo => Number(partes.find(x => x.type === tipo).value);
    const enMadrid = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"));

    return new Date(supuesto - (enMadrid - supuesto));
  } catch (e) {
    return new Date(`${p.fecha}T${p.hora}`);
  }
}

// Número para ordenar partidos por fecha y hora (los que no tienen fecha, al final)
function marcaTiempo(p) {
  const inicio = inicioPartido({ fecha: p.fecha, hora: p.hora || "00:00" });
  return inicio ? inicio.getTime() : Infinity;
}

/* ================== ESTADO GLOBAL ================== */

let actualizacionesExpandido = false;

let rolUsuario = lsGet("rol") || null;

let adminActivo = rolUsuario === "admin";
let mesaActiva = rolUsuario === "mesa";

// El PIN de administrador solo vive en memoria: la tienda lo envía al servidor para validar cada cambio
let pinAdmin = null;

let progresoSplash = 0;
let intervaloSplash = null;

// navegación (botón "atrás" del móvil) y estado de la vista
let vistaActual = "inicio";
let paramsVistaActual = {};
let navegandoPorHistorial = false;
let sinScroll = false;

// instalación como app
let promptInstalacion = null;

// refresco de marcadores en vivo
let refrescandoVivo = false;

// barra de la canción
let arrastrandoBarra = false;

let clubes = [];
let cacheClubes = null;
let cacheEquipos = null;
let cachePartidos = null;
let cachePatrocinadores = null;

let clasificacionFiltro = {
  categoria: "Infantil",
  genero: "Masculino",
  grupo: ""
};

window.clasificacionFiltro = clasificacionFiltro;

let partidos = [];

let partidoActual = null;

let equipos = [];

let equipoActual = null;

let patrocinadores = [];

/* ================== AUDIO GLOBAL ================== */

// preload "none": el mp3 (4 MB) solo se descarga cuando alguien pulsa play,
// no al abrir la app como ocurría antes.
const audioTorneo = new Audio();
audioTorneo.preload = "none";
audioTorneo.src = "audio/cancion-torneo.mp3";
audioTorneo.loop = true;

/* ================== NAVEGACIÓN ================== */

// Cada pantalla principal se anota en el historial del navegador, así el botón "atrás"
// del móvil vuelve a la pantalla anterior en vez de salirse de la app.
function registrarNavegacion(vista, params = {}) {
  vistaActual = vista;
  paramsVistaActual = params;

  if (navegandoPorHistorial) return;

  const actual = history.state;

  if (
    actual &&
    actual.vista === vista &&
    JSON.stringify(actual.params || {}) === JSON.stringify(params)
  ) return;

  const estado = { vista, params };

  if (!actual) history.replaceState(estado, "");
  else history.pushState(estado, "");
}

function restaurarVista(estado) {
  const params = estado.params || {};

  switch (estado.vista) {
    case "partidos":    mostrarPartidos(); break;
    case "categorias":  mostrarCategorias(); break;
    case "clubs":       mostrarEquipos(); break;
    case "tabla":       mostrarClasificacion(); break;
    case "pabellones":  mostrarPabellones(); break;
    case "tienda":      mostrarTienda(); break;
    case "highlights":  mostrarHighlights(); break;
    case "porra":       mostrarPorra(); break;
    case "sorteos":     mostrarSorteos(); break;
    case "radar":       mostrarRadar(); break;
    case "zona":        mostrarZona(); break;
    case "avisos":      mostrarAvisos(); break;
    case "partido":     if (params.id) abrirPartido(params.id); else mostrarPartidos(); break;
    case "club":        if (params.id) verClub(params.id); else mostrarEquipos(); break;
    case "pabellon":    if (params.nombre) window.mostrarPartidosPorPabellon(params.nombre); else mostrarPabellones(); break;
    default:            mostrarHome();
  }
}

window.addEventListener("popstate", (e) => {
  if (!e.state || !e.state.vista) return;

  navegandoPorHistorial = true;
  try {
    restaurarVista(e.state);
  } catch (err) {
    console.error("Error al volver atrás:", err);
  } finally {
    navegandoPorHistorial = false;
  }
});

// Vuelve a pintar la pantalla actual (por ejemplo, tras entrar o salir del modo admin)
function refrescarVistaActual() {
  navegandoPorHistorial = true;
  try {
    restaurarVista({ vista: vistaActual, params: paramsVistaActual });
  } finally {
    navegandoPorHistorial = false;
  }
}

// Al cambiar de pantalla se vuelve arriba (antes se quedaba a media altura de la lista anterior)
function sinSaltoDeScroll(fn) {
  sinScroll = true;
  try {
    fn();
  } finally {
    setTimeout(() => { sinScroll = false; }, 0);
  }
}

if (contenido) {
  new MutationObserver(() => {
    if (!sinScroll) window.scrollTo(0, 0);
  }).observe(contenido, { childList: true });
}

// Teclado: los elementos clicables (role="button") responden a Enter y Espacio
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;

  const el = e.target;
  if (!el || !el.matches || !el.matches('[role="button"]')) return;

  e.preventDefault();
  el.click();
});

// Si un escudo no carga, se enseña el escudo genérico en lugar de una imagen rota
document.addEventListener("error", (e) => {
  const img = e.target;

  if (
    img &&
    img.tagName === "IMG" &&
    !img.dataset.fallback &&
    img.matches(".escudo-partido, .escudo-ios, .escudo-equipo-mini, .escudo-tabla, .club-escudo, .avisos-escudo, .equipo-actualizacion img")
  ) {
    img.dataset.fallback = "1";
    img.src = PLACEHOLDER_ESCUDO;
  }
}, true);

function formatearHora(hora24) {
  if (!hora24) return "-";

  // formato de 24 horas, como se usa en España (20:30 en vez de 8:30 p. m.)
  const [h, m] = hora24.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hora24;

  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// 🔹 enlaces Google Maps por pabellón
const UBICACIONES_PABELLONES = {
  "Municipal": "https://maps.app.goo.gl/gJ6VNo8LdWAxaFQY6?g_st=ic",
  "Escuela": "https://maps.app.goo.gl/3M4jN1N14ffH8pKN7?g_st=ic",
  "Universitario": "https://maps.app.goo.gl/bG1utwiJEu78Efxm7?g_st=ic",
  "Miralvalle": "https://maps.app.goo.gl/JxhyUgo4sH8FadMEA?g_st=ic",
  "San Calixto": "https://maps.app.goo.gl/yjwJzYRLtLHZ9xxh7?g_st=ic",
  "Multipista": "https://maps.app.goo.gl/NbHNQyXEhrVL379m9?g_st=ic",
  "San Miguel": "https://maps.app.goo.gl/Z3c3yBWxjLXsSE3M6?g_st=ic"
};

const LISTA_PABELLONES = [
  "Municipal",
  "Escuela",
  "Universitario",
  "Miralvalle",
  "San Calixto",
  "Multipista",
  "San Miguel"
];

const IMAGENES_PABELLONES = {
  "Municipal": "img/pabellones/municipal.webp",
  "Escuela": "img/pabellones/escuela.webp",
  "Universitario": "img/pabellones/universitario.webp",
  "Miralvalle": "img/pabellones/miralvalle.webp",
  "San Calixto": "img/pabellones/san-calixto.webp",
  "Multipista": "img/pabellones/la-data.webp",
  "San Miguel": "img/pabellones/san-miguel.webp"
};

// 🔴 DIRECTOS POR PABELLÓN
const DIRECTOS_PABELLONES = {
  "Municipal": "https://www.twitch.tv/swl_tv",
  "Escuela": "https://www.twitch.tv/zonetv_es",
};

function normalizarPartidos(lista) {
  return (lista || []).map(original => {
    const p = sanearPartido(original);

    return {
      ...p,

      categoria: p.categoria
        ? p.categoria.trim()
        : "Sin categoría",

      genero: p.genero
        ? p.genero.trim()
        : "Sin género",

      grupo: p.grupo
        ? p.grupo.trim().replace(/\s+/g, " ")
        : "Sin grupo",

      fase: p.fase?.trim() || "grupos"
    };
  });
}

// Recarga los partidos desde la base de datos SIN borrar los que ya hay si falla la red
async function recargarPartidos() {
  const { data, error } = await supabase
    .from("partidos")
    .select("*");

  if (error || !data) {
    console.error("Error recargando partidos:", error);
    return false;
  }

  partidos = normalizarPartidos(data);
  return true;
}

/* ================== splash ================== */
function iniciarBarraSplash() {
  const barra = document.getElementById("splash-progreso");
  if (!barra) return;

  progresoSplash = 0;

  intervaloSplash = setInterval(() => {
    if (progresoSplash < 90) {
      progresoSplash += Math.random() * 6;
      barra.style.width = `${Math.min(progresoSplash, 90)}%`;
    }
  }, 400);
}

function completarBarraSplash() {
  const barra = document.getElementById("splash-progreso");
  if (!barra) return;

  clearInterval(intervaloSplash);
  barra.style.width = "100%";
}

/* ================== HOME ================== */
function mostrarHome() {
  setNavActivoPorVista("inicio");
  registrarNavegacion("inicio");

  let html = `
    <h2 class="sr-only">Inicio</h2>

    <div id="bloque-instalar"></div>

    <h3 class="titulo-seccion">Fotos del torneo</h3>
    <div class="fotos-grid">
      <section class="galeria2027">
        <div id="galeria2027-scroll" class="galeria2026-scroll">
          <div class="galeria2026-loading">Cargando imágenes…</div>
        </div>
      </section>

      <section class="galeria2026">
        <div id="galeria2026-scroll" class="galeria2026-scroll">
          <div class="galeria2026-loading">Cargando imágenes…</div>
        </div>
      </section>

      <section class="galeria">
        <div id="galeria-scroll" class="galeria-scroll">
          <div class="galeria-loading">Cargando imágenes…</div>
        </div>
      </section>
    </div>

    <!-- 🔴 ACTUALIZACIONES EN VIVO -->
    <section class="actualizaciones-home" id="bloque-actualizaciones"></section>

    <h3>Patrocinadores</h3>
    <div class="patrocinadores-scroll">
  `;

  patrocinadores.forEach(p => {
  html += `
    <div class="patrocinador-card" role="button" tabindex="0"
         data-web="${p.web}" onclick="abrirWeb(this.dataset.web)"
         aria-label="Patrocinador: ${p.nombre}">

      ${adminActivo ? `
        <div class="acciones-admin">

          <button onclick="event.stopPropagation(); moverPatrocinador(${p.id}, -1)" aria-label="Subir patrocinador">
            ${ico("up")}
          </button>

          <button onclick="event.stopPropagation(); moverPatrocinador(${p.id}, 1)" aria-label="Bajar patrocinador">
            ${ico("down")}
          </button>

          <button class="btn-borrar-patrocinador"
            onclick="event.stopPropagation(); borrarPatrocinador(${p.id})" aria-label="Borrar patrocinador">
            ${ico("close")}
          </button>

        </div>
      ` : ""}

      <img src="${p.imagen}" alt="" loading="lazy" decoding="async">
      <div class="patrocinador-nombre">${p.nombre}</div>

    </div>
  `;
});

  html += `</div>`;

  if (adminActivo) {
    html += `<button onclick="formNuevoPatrocinador()">Añadir patrocinador</button>`;
  }

  // HISTORIA AL FINAL
  html += `
    <section class="historia">
      <h3>Historia del Torneo</h3>
      <div class="historia-card">
        <div id="texto-historia">
          <p>
  Nuestra historia comienza gracias a un grupo de amigos y grandes aficionados al balonmano que compartíamos una misma ilusión: crear algo especial para este deporte que tanto nos une.
</p>

<p>
  De esa pasión nació el <strong>Torneo Internacional Plasencia Handball</strong>, cuya primera edición se celebró en el año <strong>2023</strong>. Aquella primera experiencia estuvo marcada por la ilusión, el esfuerzo y las ganas de demostrar que Plasencia podía acoger un torneo de balonmano base con identidad propia.
</p>

<p>
  Desde entonces, nuestro objetivo ha sido claro: ofrecer a jugadores y jugadoras una experiencia deportiva única, combinando competición, convivencia y valores como el respeto, el compañerismo y el trabajo en equipo.
</p>

<p>
  A lo largo de los años, el torneo ha ido creciendo tanto en participación como en nivel deportivo, reuniendo en Plasencia a equipos nacionales e internacionales y llenando nuestros pabellones de balonmano, ambiente y emoción durante varios días.
</p>

<p>
  Cada edición es un nuevo reto y una nueva oportunidad para seguir mejorando, pero siempre manteniendo la esencia con la que empezamos en 2023: la pasión por el balonmano y las ganas de crear recuerdos inolvidables para todos los que forman parte de este torneo.
</p>

<p>
  Esta historia sigue escribiéndose gracias a los clubes, jugadores, entrenadores, familias, patrocinadores y a todas las personas que confían en nosotros y hacen posible que este proyecto siga creciendo año tras año.
</p>
        </div>
      </div>
    </section>
  `;

  contenido.innerHTML = html;

  renderTarjetaInstalar();

  // cargar galería
setTimeout(renderActualizacionesHome, 0);

  requestAnimationFrame(() => {
    cargarGaleria2025();
    cargarGaleria2026();
    cargarGaleria2027();
  });
}

async function moverPatrocinador(id, direccion) {

  const index = patrocinadores.findIndex(p => p.id === id);

  if (index === -1) return;

  const nuevoIndex = index + direccion;

  if (nuevoIndex < 0 || nuevoIndex >= patrocinadores.length) return;

  const actual = patrocinadores[index];
  const destino = patrocinadores[nuevoIndex];

  // intercambiar orden
  const ordenActual = actual.orden;
  const ordenDestino = destino.orden;

  await supabase
    .from("patrocinadores")
    .update({ orden: ordenDestino })
    .eq("id", actual.id);

  await supabase
    .from("patrocinadores")
    .update({ orden: ordenActual })
    .eq("id", destino.id);

  patrocinadores = await obtenerPatrocinadoresSupabase();

  mostrarHome();
}

function formNuevoPatrocinador() {
  contenido.innerHTML = `
    <h2>Nuevo patrocinador</h2>

    <label>Nombre</label>
    <input id="nombre">

    <label>Web</label>
    <input id="web" placeholder="https://">

    <label>Logo</label>
    <input type="file" id="imagen" accept="image/*">

    <button onclick="guardarNuevoPatrocinador()">Guardar</button>
    <button class="volver" onclick="mostrarHome()">Volver</button>
  `;
}

function obtenerActualizacionesPartidos() {
  // SOLO se muestran los partidos que están en juego ahora mismo
  return partidos.filter(p => calcularEstadoPartido(p) === "en_juego");
}

function renderActualizacionesHome() {
  if (!partidos.length || !equipos.length || !clubes.length) return;
  
  const contenedor = document.getElementById("bloque-actualizaciones");
  if (!contenedor) return;

  const destacados = obtenerActualizacionesPartidos();
  
  const MAX_VISIBLES = 2;
const hayMasDeDos = destacados.length > MAX_VISIBLES;

const partidosAMostrar = actualizacionesExpandido
  ? destacados
  : destacados.slice(0, MAX_VISIBLES);

  if (destacados.length === 0) {
    contenedor.innerHTML = "";
    return;
  }

  let html = `
    <section class="actualizaciones-home">
      <h3 class="en-vivo-titulo">
        <span class="punto-vivo" aria-hidden="true"></span>
        Partidos en juego
        <span class="pt-cuenta">${destacados.length}</span>
      </h3>

      <div id="lista-actualizaciones">
  `;

  partidosAMostrar.forEach((p) => {
    const local = equipos.find(e => e.id === p.local_id);
    const visitante = equipos.find(e => e.id === p.visitante_id);

    const clubLocal = clubes.find(c => c.id === local?.club_id);
    const clubVisitante = clubes.find(c => c.id === visitante?.club_id);

    const inicio = inicioPartido(p);
    const minutos = inicio ? Math.max(0, Math.floor((Date.now() - inicio.getTime()) / 60000)) : null;
    const gl = Number(p.goles_local) || 0, gv = Number(p.goles_visitante) || 0;

    html += `
      <article class="actualizacion-card vivo" role="button" tabindex="0" onclick="abrirPartido(${p.id})">

        <div class="vivo-cab">
          <span class="vivo-chip"><span class="punto-vivo" aria-hidden="true"></span>En vivo</span>
          <span class="vivo-cat">${p.categoria} · ${p.genero}</span>
          <span class="vivo-fase">${textoGrupoOFase(p)}</span>
        </div>

        <div class="vivo-duelo">
          <div class="vivo-equipo">
            <img src="${clubLocal?.escudo || PLACEHOLDER_ESCUDO}" alt="" loading="lazy" decoding="async">
            <span>${local?.nombre || "-"}</span>
          </div>

          <div class="vivo-marcador" aria-label="Marcador ${gl} a ${gv}">
            <b class="${gl > gv ? "lidera" : ""}">${gl}</b><i>–</i><b class="${gv > gl ? "lidera" : ""}">${gv}</b>
          </div>

          <div class="vivo-equipo">
            <img src="${clubVisitante?.escudo || PLACEHOLDER_ESCUDO}" alt="" loading="lazy" decoding="async">
            <span>${visitante?.nombre || "-"}</span>
          </div>
        </div>

        <div class="vivo-pie">
          <span>${ico("pabellon", 14)} ${p.pabellon || "-"}</span>
          <span>${minutos !== null ? `Empezó hace ${minutos} min` : formatearHora(p.hora)}</span>
          <span class="vivo-ver">Ver partido ${ico("derecha", 14)}</span>
        </div>

      </article>
    `;
  });

  html += `
      </div>
  `;

  // 🔽 BOTÓN SOLO SI HAY MÁS DE 2

if (hayMasDeDos) {
  html += `
    <button class="btn-ver-mas-partidos" onclick="toggleActualizacionesHome()">
      ${actualizacionesExpandido ? "Ver menos partidos" : "Ver todos los partidos"}
    </button>
  `;
}

  html += `</section>`;

  contenedor.innerHTML = html;
}

function toggleActualizacionesHome() {
  actualizacionesExpandido = !actualizacionesExpandido;
  renderActualizacionesHome();
}

window.toggleActualizacionesHome = toggleActualizacionesHome;

function abrirWeb(url) {
  // solo se abren enlaces http(s)
  if (!url || !/^https?:\/\//i.test(url)) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function toggleReproductor(forzarCerrar) {
  const fab = document.getElementById("music-fab");
  if (!fab) return;

  const abrir = forzarCerrar === true ? false : !fab.classList.contains("open");
  fab.classList.toggle("open", abrir);
  fab.querySelector(".music-main")?.setAttribute("aria-expanded", abrir ? "true" : "false");

  // si se abre, se cierra el menú de redes para que no se pisen
  if (abrir && typeof toggleSocial === "function") toggleSocial(true);
}
window.toggleReproductor = toggleReproductor;

document.addEventListener("click", (e) => {
  const fab = document.getElementById("music-fab");
  if (fab && fab.classList.contains("open") && !fab.contains(e.target)) toggleReproductor(true);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") toggleReproductor(true);
});

function formatearTiempo(seg) {
  if (!isFinite(seg) || seg < 0) return "0:00";
  const m = Math.floor(seg / 60);
  const r = Math.floor(seg % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

function pintarProgresoCancion(porcentaje) {
  const barra = document.getElementById("barra-cancion");
  if (!barra) return;
  barra.value = porcentaje;
  barra.style.setProperty("--p", `${porcentaje}%`);

  const actual = document.getElementById("tiempo-actual");
  if (actual) actual.textContent = formatearTiempo(audioTorneo.currentTime);

  const total = document.getElementById("tiempo-total");
  if (total && isFinite(audioTorneo.duration)) total.textContent = formatearTiempo(audioTorneo.duration);
}

function toggleCancionTorneo() {

  if (audioTorneo.paused) {

    const intento = audioTorneo.play();

    if (intento && intento.catch) {
      intento.catch(err => {
        console.warn("No se pudo reproducir la canción:", err);
        avisar("No se pudo reproducir la canción.", "error");
      });
    }

  } else {

    audioTorneo.pause();

  }

}

window.toggleCancionTorneo = toggleCancionTorneo;

function reiniciarCancion() {

  const barra =
    document.getElementById("barra-cancion");

  audioTorneo.currentTime = 0;

  if (barra) pintarProgresoCancion(0);

}

function moverBarraCancion() {

  const barra =
    document.getElementById("barra-cancion");

  if (!barra) return;

  // sin metadatos todavía (no se ha pulsado play) no hay duración a la que saltar
  if (!isFinite(audioTorneo.duration) || audioTorneo.duration <= 0) {
    barra.value = 0;
    return;
  }

  arrastrandoBarra = true;

  audioTorneo.currentTime =
    (barra.value / 100) * audioTorneo.duration;

  pintarProgresoCancion(Number(barra.value));

  clearTimeout(moverBarraCancion.t);
  moverBarraCancion.t = setTimeout(() => { arrastrandoBarra = false; }, 300);

}

// Antes estos eventos buscaban un elemento <audio id="audio-torneo"> que no existe,
// así que la barra de la canción nunca avanzaba. Ahora escuchan al audio real.
function sincronizarBotonCancion() {
  const boton = document.getElementById("btn-play");
  if (!boton) return;

  boton.innerHTML = audioTorneo.paused ? ico("play", 24) : ico("pause", 24);
  document.getElementById("music-fab")?.classList.toggle("sonando", !audioTorneo.paused);
  boton.setAttribute("aria-label", audioTorneo.paused ? "Reproducir canción" : "Pausar canción");
}

audioTorneo.addEventListener("play", sincronizarBotonCancion);
audioTorneo.addEventListener("pause", sincronizarBotonCancion);
audioTorneo.addEventListener("ended", sincronizarBotonCancion);

audioTorneo.addEventListener("timeupdate", () => {

  if (arrastrandoBarra) return;

  const barra = document.getElementById("barra-cancion");

  if (!barra || !isFinite(audioTorneo.duration) || audioTorneo.duration <= 0) return;

  pintarProgresoCancion((audioTorneo.currentTime / audioTorneo.duration) * 100);

});

audioTorneo.addEventListener("loadedmetadata", () => {
  const total = document.getElementById("tiempo-total");
  if (total) total.textContent = formatearTiempo(audioTorneo.duration);
});

const VISTAS_INICIALES = {
  inicio: () => mostrarHome(),
  partidos: () => mostrarPartidos(),
  categorias: () => mostrarCategorias(),
  clubs: () => mostrarEquipos(),
  tabla: () => mostrarClasificacion(),
  pabellones: () => mostrarPabellones(),
  tienda: () => mostrarTienda(),
  highlights: () => mostrarHighlights(),
  porra: () => mostrarPorra(),
  sorteos: () => mostrarSorteos(),
  radar: () => mostrarRadar(),
  zona: () => mostrarZona(),
  avisos: () => mostrarAvisos()
};

// Los accesos directos de la app instalada abren con ?vista=partidos, ?vista=tabla…
function vistaInicial() {
  let vista = "inicio";
  let idPartido = 0;

  try {
    const params = new URLSearchParams(location.search);
    vista = params.get("vista") || "inicio";
    idPartido = Number(params.get("partido")) || 0;
  } catch (e) { /* se queda en inicio */ }

  (VISTAS_INICIALES[vista] || VISTAS_INICIALES.inicio)();

  // los avisos de partido abren la app con ?partido=ID
  if (idPartido && partidos.some(p => p.id === idPartido)) abrirPartido(idPartido);
}

function mostrarErrorCarga() {
  setNavActivoPorVista("inicio");

  contenido.innerHTML = `
    <div class="estado-error">
      <h2>No se han podido cargar los datos</h2>
      <p>Comprueba tu conexión a internet e inténtalo de nuevo.</p>
      <button type="button" onclick="reintentarCarga()">Reintentar</button>
    </div>
  `;
}

async function cargarDatosIniciales() {
  // las cuatro consultas a la vez (antes iban una detrás de otra)
  const [c, e, p, s] = await Promise.all([
    obtenerClubesSupabase(),
    obtenerEquiposSupabase(),
    obtenerPartidosSupabase(),
    obtenerPatrocinadoresSupabase()
  ]);

  clubes = c;
  equipos = e;
  partidos = normalizarPartidos(p);
  patrocinadores = s;

  return clubes.length > 0 || equipos.length > 0 || partidos.length > 0;
}

async function reintentarCarga() {
  contenido.innerHTML = `<p class="estado-vacio">Cargando…</p>`;

  try {
    const hayDatos = await cargarDatosIniciales();
    if (hayDatos) vistaInicial();
    else mostrarErrorCarga();
  } catch (e) {
    console.error("Error al reintentar:", e);
    mostrarErrorCarga();
  }
}

window.reintentarCarga = reintentarCarga;

async function iniciarApp() {
  iniciarIdioma();
  document.body.classList.add("splash-activo");
  iniciarBarraSplash();

  // primera entrada del historial: pulsar "atrás" desde cualquier pantalla vuelve a Inicio
  try { history.replaceState({ vista: "inicio", params: {} }, ""); } catch (e) { /* sin historial */ }

  let splashOculto = false;
  const inicioSplash = Date.now();
  const SPLASH_MIN_MS = 2800; // el vídeo se ve al menos este tiempo

  const ocultarSplash = () => {
    if (splashOculto) return;
    splashOculto = true;

    completarBarraSplash();
    const espera = Math.max(0, SPLASH_MIN_MS - (Date.now() - inicioSplash));

    setTimeout(() => {
      document.body.classList.remove("splash-activo");

      const splash = document.getElementById("splash");
      if (splash) {
        splash.classList.add("splash-hide");
        setTimeout(() => splash.remove(), 600);
      }
    }, 200 + espera);
  };

  // Si la red va muy lenta, se enseña la app igualmente en vez de dejar el splash eternamente
  const seguridad = setTimeout(() => {
    if (splashOculto) return;
    contenido.innerHTML = `<p class="estado-vacio">Cargando datos…</p>`;
    ocultarSplash();
  }, 12000);

  let hayDatos = false;

  try {
    hayDatos = await cargarDatosIniciales();
  } catch (e) {
    console.error("Error iniciando app:", e);
  }

  clearTimeout(seguridad);

  if (hayDatos) vistaInicial();
  else mostrarErrorCarga();

  ocultarSplash();
}

/* ================== GALERÍA ================== */
function cargarGaleria2027() {
  const contenedor = document.getElementById("galeria2027-scroll");
  if (!contenedor) return;

  const urlCarpeta = "https://www.amazon.es/photos/share/KXGh7Cy7vuudvBxrWVuoY35LBAPWx7eMIZBOdLmFBbF";

  contenedor.innerHTML = `
  <a href="${urlCarpeta}" target="_blank" rel="noopener noreferrer" class="galeria-badge">
    <div class="badge-icon">${ico("camara", 24)}</div>
    <div class="badge-texto">
      <strong>Torneo 2027</strong>
      <span>Ver carpeta de fotos</span>
    </div>
  </a>
`;
}

function cargarGaleria2026() {
  const contenedor = document.getElementById("galeria2026-scroll");
  if (!contenedor) return;

  const urlCarpeta = "https://www.amazon.es/photos/share/BNF0g9ckA7PPdmq1jetkgeJ9zO8BwiJW6Gj4KPumS5";

  contenedor.innerHTML = `
  <a href="${urlCarpeta}" target="_blank" rel="noopener noreferrer" class="galeria-badge">
    <div class="badge-icon">${ico("camara", 24)}</div>
    <div class="badge-texto">
      <strong>Torneo 2026</strong>
      <span>Ver carpeta de fotos</span>
    </div>
  </a>
`;
}

function cargarGaleria2025() {
  const contenedor = document.getElementById("galeria-scroll");
  if (!contenedor) return;

  const urlCarpeta2025 = "https://www.amazon.es/photos/share/aMDlytCvANQmoT7QWp8ZiOqXXSb5emV0vrADnw8qT7s";

  contenedor.innerHTML = `
  <a href="${urlCarpeta2025}" target="_blank" rel="noopener noreferrer" class="galeria-badge">
    <div class="badge-icon">${ico("camara", 24)}</div>
    <div class="badge-texto">
      <strong>Torneo 2025</strong>
      <span>Ver carpeta de fotos</span>
    </div>
  </a>
`;
}

/* ================== GALERÍA (SUPABASE) ================== */
function setNavActivoPorVista(vista) {
  document
    .querySelectorAll('.nav-principal button')
    .forEach(b => b.classList.remove('activo'));

  if (["tienda", "highlights", "porra", "sorteos"].includes(vista)) vista = "zona";
  if (vista === "radar") vista = "pabellones";
  const btn = document.querySelector(`.nav-principal button[data-view="${vista}"]`);
  if (btn) btn.classList.add('activo');
}

/* ================== PATROCINADORES (SUPABASE) ================== */

async function obtenerPatrocinadoresSupabase() {
  const { data, error } = await supabase
    .from("patrocinadores")
    .select("id,nombre,web,imagen,orden")
    .order("orden", { ascending: true })

  if (error) {
    console.error("Error cargando patrocinadores:", error);
    return [];
  }

  return (data || []).map(sanearPatrocinador);
}

/* ================== PARTIDOS ================== */
function agruparPorFecha(lista) {
  return lista.reduce((acc, p) => {
    if (!acc[p.fecha]) acc[p.fecha] = [];
    acc[p.fecha].push(p);
    return acc;
  }, {});
}

function renderBloquesPorFecha(lista, tipo) {
  if (lista.length === 0) return `<p>No hay partidos</p>`;

  const grupos = agruparPorFecha(lista);
  let html = "";

  // 📅 fecha de hoy (en hora de Madrid) en formato YYYY-MM-DD
  // (antes se usaba la fecha UTC y entre las 0:00 y las 2:00 contaba como "ayer")
  const hoy = hoyISO();

  Object.entries(grupos).forEach(([fecha, partidosDia]) => {
    const fechaBonita = textoFecha(fecha) || "Fecha por confirmar";

    // 🔥 abrir solo si es hoy
    const esHoy = fecha === hoy;
    const abierta = esHoy ? "abierta" : "";

    html += `
      <div class="fecha-bloque ${abierta}">
        <div class="fecha-header" role="button" tabindex="0" aria-expanded="${esHoy}" onclick="toggleFecha(this)">
          <span class="fecha-texto">${fechaBonita}${esHoy ? ` <em class="chip-hoy">Hoy</em>` : ""}</span>
          <span class="fecha-cuenta">${partidosDia.length} ${partidosDia.length === 1 ? "partido" : "partidos"}</span>
          <span class="flecha" aria-hidden="true">⌄</span>
        </div>

        <div class="fecha-partidos">
  ${renderBloquesCategoriaGenero(partidosDia, fecha, tipo)}
</div>
      </div>
    `;
  });

  return html;
}

function agruparPorCategoriaGenero(lista) {
  return lista.reduce((acc, p) => {

    const grupoTexto = p.grupo ? ` · ${p.grupo}` : "";

    const clave = `${p.categoria} · ${p.genero}${grupoTexto}`;

    if (!acc[clave]) acc[clave] = [];
    acc[clave].push(p);

    return acc;

  }, {});
}

function agruparPorCategoria(lista) {
  return lista.reduce((acc, p) => {
    const categoria = p.categoria || "Sin categoría";

    if (!acc[categoria]) acc[categoria] = [];
    acc[categoria].push(p);

    return acc;
  }, {});
}

function obtenerClaseCategoria(categoria) {

  if (!categoria) return "";

  const cat = categoria.toLowerCase();

  if (cat.includes("infantil")) return "badge-infantil";

  if (cat.includes("cadete")) return "badge-cadete";

  if (cat.includes("juvenil")) return "badge-juvenil";

  return "";
}

function obtenerClaseGenero(genero) {

  if (!genero) return "";

  const gen = genero.toLowerCase();

  if (gen.includes("masculino")) return "badge-masculino";

  if (gen.includes("femenino")) return "badge-femenino";

  return "";
}

function obtenerIconoGenero(genero) {

  if (!genero) return "";

  const gen = genero.toLowerCase();

  return "";
}

function textoNumPartidos(n) {
  return `${n} ${n === 1 ? "partido" : "partidos"}`;
}

function renderBloquesCategoriaGenero(partidosDia, fecha, tipo) {
  const categorias = agruparPorCategoria(partidosDia);
  let html = "";

  Object.entries(categorias).forEach(([categoria, listaCategoria]) => {
    const idCategoria = slug("categoria", tipo, fecha, categoria);

    html += `
      <section class="pj-cat ${obtenerClaseCategoria(categoria).replace("badge-", "pj-")}">
        <div class="pj-cab pj-cab-cat" role="button" tabindex="0"
             aria-expanded="false" aria-controls="${idCategoria}"
             onclick="toggleCategoriaDia('${idCategoria}', this)">
          <span class="pj-barra" aria-hidden="true"></span>
          <span class="pj-nombre">${categoria}</span>
          <span class="pj-num">${textoNumPartidos(listaCategoria.length)}</span>
          <span class="pj-flecha" aria-hidden="true">${ico("chev", 18)}</span>
        </div>
        <div id="${idCategoria}" class="categoria-partidos oculto">
          <div class="pj-interior">
            ${renderSubBloquesCategoria(listaCategoria, fecha, tipo)}
          </div>
        </div>
      </section>
    `;
  });

  return html;
}

function renderSubBloquesCategoria(listaCategoria, fecha, tipo) {
  const generos = listaCategoria.reduce((acc, p) => {
    const genero = p.genero || "Sin género";
    if (!acc[genero]) acc[genero] = [];
    acc[genero].push(p);
    return acc;
  }, {});

  let html = "";

  Object.entries(generos).forEach(([genero, listaGenero]) => {
    const idGenero = slug("genero", tipo, fecha, listaGenero[0].categoria, genero);

    html += `
      <div class="pj-gen ${obtenerClaseGenero(genero).replace("badge-", "pj-")}">
        <div class="pj-cab pj-cab-gen" role="button" tabindex="0"
             aria-expanded="false" aria-controls="${idGenero}"
             onclick="toggleCategoriaDia('${idGenero}', this)">
          <span class="pj-punto" aria-hidden="true"></span>
          <span class="pj-nombre">${genero}</span>
          <span class="pj-num">${textoNumPartidos(listaGenero.length)}</span>
          <span class="pj-flecha" aria-hidden="true">${ico("chev", 16)}</span>
        </div>
        <div id="${idGenero}" class="categoria-partidos oculto">
          <div class="pj-interior">
            ${renderGruposDentroGenero(listaGenero, fecha, tipo)}
          </div>
        </div>
      </div>
    `;
  });

  return html;
}

function renderGruposDentroGenero(listaGenero, fecha, tipo) {
  const grupos = listaGenero.reduce((acc, p) => {
    const grupo = p.grupo || "Sin grupo";
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(p);
    return acc;
  }, {});

  let html = "";

  Object.entries(grupos).forEach(([grupo, lista]) => {
    const id = slug("grupo", tipo, fecha, lista[0].categoria, lista[0].genero, grupo);

    html += `
      <div class="pj-grupo">
        <div class="pj-cab pj-cab-grupo" role="button" tabindex="0"
             aria-expanded="false" aria-controls="${id}"
             onclick="toggleCategoriaDia('${id}', this)">
          <span class="pj-nombre">${grupo}</span>
          <span class="pj-num">${textoNumPartidos(lista.length)}</span>
          <span class="pj-flecha" aria-hidden="true">${ico("chev", 14)}</span>
        </div>
        <div id="${id}" class="categoria-partidos oculto">
          <div class="pj-interior pj-partidos">
            ${lista.map(p => renderPartidoCard(p)).join("")}
          </div>
        </div>
      </div>
    `;
  });

  return html;
}

function toggleCategoriaDia(id, header) {
  const contenedor = document.getElementById(id);
  if (!contenedor) return;

  const abrir = contenedor.classList.contains("oculto");

  if (abrir) {
    contenedor.classList.remove("oculto");
    contenedor.classList.add("abierto");

    // Se anima de 0 a la altura real y después se deja sin límite, para que los bloques
    // anidados (categoría > género > grupo) nunca queden cortados.
    contenedor.style.maxHeight = contenedor.scrollHeight + "px";

    const liberar = () => {
      if (contenedor.classList.contains("abierto")) contenedor.style.maxHeight = "none";
    };

    contenedor.addEventListener("transitionend", e => {
      if (e.target === contenedor && e.propertyName === "max-height") liberar();
    }, { once: true });

    setTimeout(liberar, 600); // por si no hay transición (animaciones reducidas)
  } else {
    // se fija la altura actual para poder animar el plegado hasta 0
    contenedor.style.maxHeight = contenedor.scrollHeight + "px";
    void contenedor.offsetHeight;

    contenedor.classList.remove("abierto");
    contenedor.classList.add("oculto");
    contenedor.style.maxHeight = "";
  }

  if (header) {
    header.classList.toggle("abierto", abrir);
    header.setAttribute("aria-expanded", abrir ? "true" : "false");
  }
}

function toggleFecha(header) {
  const bloque = header.parentElement;
  const abierta = bloque.classList.toggle("abierta");
  header.setAttribute("aria-expanded", abierta ? "true" : "false");
}

window.toggleFecha = toggleFecha;

function mostrarPartidos() {
  setNavActivoPorVista("partidos");
  registrarNavegacion("partidos");

  let html = `<h2>Partidos</h2>`;
  
  if (adminActivo) {
  html += `<button onclick="formCrearFaseFinal()">Crear partido de fase final</button>`;
}

  if (adminActivo) {
    html += `<button onclick="formNuevoPartido()">Crear partido</button>`;
  }

  const ordenados = [...partidos].sort((a, b) => marcaTiempo(a) - marcaTiempo(b));

  const proximos = ordenados.filter(
  p => calcularEstadoPartido(p) !== "finalizado"
);

const finalizados = ordenados
  .filter(p => calcularEstadoPartido(p) === "finalizado")
  .reverse();

  const enJuego = proximos.filter(p => calcularEstadoPartido(p) === "en_juego").length;
  html += `
    <div class="pt-resumen">
      <div class="pt-dato ${enJuego ? "vivo" : ""}"><strong>${enJuego}</strong><span>En juego</span></div>
      <div class="pt-dato"><strong>${proximos.length - enJuego}</strong><span>Próximos</span></div>
      <div class="pt-dato"><strong>${finalizados.length}</strong><span>Finalizados</span></div>
    </div>`;

  /* ===== PRÓXIMOS ===== */
html += `<h3 class="bloque-titulo pt-titulo">Próximos partidos <span class="pt-cuenta">${proximos.length}</span></h3>`;
html += proximos.length
  ? renderBloquesPorFecha(proximos, "proximos")
  : `<p class="estado-vacio">No hay próximos partidos</p>`;

/* ===== FINALIZADOS ===== */
html += `<h3 class="bloque-titulo pt-titulo">Partidos finalizados <span class="pt-cuenta">${finalizados.length}</span></h3>`;
html += finalizados.length
  ? renderBloquesPorFecha(finalizados, "finalizados")
  : `<p class="estado-vacio">No hay partidos finalizados</p>`;

  contenido.innerHTML = html;
}

function mostrarCuadroEliminatorioDesdeFiltro() {
  mostrarCuadroEliminatorio(
    clasificacionFiltro.categoria.toLowerCase().trim(),
    clasificacionFiltro.genero.toLowerCase().trim()
  );
}

window.mostrarCuadroEliminatorioDesdeFiltro = mostrarCuadroEliminatorioDesdeFiltro;

async function mostrarCuadroEliminatorio(categoria, genero) {
  equipos = await obtenerEquiposSupabase();   // 🔥 OBLIGATORIO
  await recargarPartidos();

  setNavActivoPorVista("partidos");

  contenido.innerHTML = `
    <h2>Cuadro eliminatorio</h2>
    <h3>${categoria} · ${genero}</h3>
    ${renderBracket(categoria, genero)}
    <button class="volver" onclick="mostrarPartidos()">Volver</button>
  `;
}

function renderBracket(categoria, genero) {
  categoria = categoria.toLowerCase().trim();
  genero = genero.toLowerCase().trim();

  // Antes se comparaba p.genero (con mayúscula inicial, "Masculino") con genero ya en
  // minúsculas, así que el cuadro salía siempre vacío ("Por definir").
  const semis = partidos.filter(p =>
  p.categoria?.toLowerCase() === categoria &&
  p.genero?.toLowerCase() === genero &&
  p.fase === "semifinal"
);

  const final = partidos.find(p =>
  p.categoria?.toLowerCase() === categoria &&
  p.genero?.toLowerCase() === genero &&
  p.fase === "final"
);

  const tercer = partidos.find(p =>
  p.categoria?.toLowerCase() === categoria &&
  p.genero?.toLowerCase() === genero &&
  p.fase === "tercer_puesto"
);

  return `
    <div class="bracket-vertical">

      <!-- SEMIFINALES -->
      <div class="semifinales">
        ${renderMatchBracket(semis[0])}
        ${renderMatchBracket(semis[1])}
      </div>

      <!-- LÍNEAS -->
      <div class="lineas-final">
        <span></span>
      </div>

      <!-- FINAL -->
      <div class="final">
        ${renderMatchBracket(final, true)}
      </div>

      ${
        tercer
          ? `
          <div class="bracket-tercer">
            <h4>3.º / 4.º puesto</h4>
            ${renderMatchBracket(tercer)}
          </div>
          `
          : ""
      }

    </div>
  `;
}

function renderMatchBracket(partido, esFinal = false) {
  if (!partido) {
    return `<div class="match empty">Por definir</div>`;
  }

  const local = equipos.find(e => e.id === partido.local_id);
  const visitante = equipos.find(e => e.id === partido.visitante_id);

  let claseLocal = "team";
  let claseVisitante = "team";

  if (partido.estado === "finalizado") {
    if (partido.goles_local > partido.goles_visitante) {
      claseVisitante += " perdedor";
    } else if (partido.goles_visitante > partido.goles_local) {
      claseLocal += " perdedor";
    }
  }

  const resultado =
    partido.estado === "finalizado"
      ? `<div class="score">${partido.goles_local} - ${partido.goles_visitante}</div>`
      : `<div class="vs">vs</div>`;

  return `
    <div class="match ${esFinal ? "match-final" : ""}" role="button" tabindex="0"
         onclick="abrirPartido(${partido.id})">
      <div class="${claseLocal}">${local?.nombre || "—"}</div>
      ${resultado}
      <div class="${claseVisitante}">${visitante?.nombre || "—"}</div>
    </div>
  `;
}

/* ---- piezas comunes de los formularios de partido (modo admin) ---- */
const POSICIONES_FASE_FINAL = [
  "1º / 2º", "3º / 4º", "5º / 6º", "7º / 8º", "9º / 10º", "11º / 12º", "13º / 14º",
  "7º / 9º", "9º / 12º", "1º / 8º", "5º / 8º", "1º / 4º"
];

function seccionFormulario(numero, titulo, contenidoHtml) {
  return `
    <section class="fa-seccion">
      <h3 class="fa-titulo"><span class="fa-num">${numero}</span>${titulo}</h3>
      ${contenidoHtml}
    </section>`;
}

function campoFormulario(id, etiqueta, controlHtml, extra = "") {
  return `<div class="fa-campo ${extra}"><label for="${id}">${etiqueta}</label>${controlHtml}</div>`;
}

function bloqueEquiposFormulario() {
  return `
    <div class="fa-equipos">
      ${campoFormulario("equipoLocal", "Equipo local", `<select id="equipoLocal"></select>`)}
      <span class="fa-vs" aria-hidden="true">VS</span>
      ${campoFormulario("equipoVisitante", "Equipo visitante", `<select id="equipoVisitante"></select>`)}
    </div>`;
}

function bloqueFechaFormulario() {
  return `
    <div class="fa-grid">
      ${campoFormulario("fecha", "Fecha", `<input type="date" id="fecha">`)}
      ${campoFormulario("hora", "Hora", `<input type="time" id="hora">`)}
      ${campoFormulario("pabellon", "Pabellón", `
        <select id="pabellon">${LISTA_PABELLONES.map(p => `<option value="${p}">${p}</option>`).join("")}</select>`, "fa-ancho")}
    </div>`;
}

// Resumen en vivo para comprobar el partido antes de guardarlo
function actualizarResumenPartido() {
  const caja = document.getElementById("fa-resumen");
  if (!caja) return;

  const texto = id => {
    const el = document.getElementById(id);
    return el && el.selectedIndex >= 0 ? el.options[el.selectedIndex].textContent.trim() : "";
  };
  const local = texto("equipoLocal"), visitante = texto("equipoVisitante");
  const fecha = document.getElementById("fecha")?.value;
  const hora = document.getElementById("hora")?.value;
  const cat = document.getElementById("categoria")?.value || "";
  const gen = document.getElementById("genero")?.value || "";
  const fase = document.getElementById("fase");
  const etiquetaFase = fase ? fase.options[fase.selectedIndex].textContent.trim() : (document.getElementById("grupo")?.value || "");

  const duelo = local && visitante ? `${escaparHtml(local)} <b>vs</b> ${escaparHtml(visitante)}` : "Elige los dos equipos";
  const cuando = fecha ? `${escaparHtml(textoFecha(fecha) || fecha)}${hora ? " · " + escaparHtml(hora) : ""}` : "Falta la fecha";

  caja.innerHTML = `
    <span class="fa-resumen-etiqueta">Resumen</span>
    <strong>${duelo}</strong>
    <span>${escaparHtml(cat)} ${escaparHtml(gen)} · ${escaparHtml(etiquetaFase)}</span>
    <span>${cuando} · ${escaparHtml(document.getElementById("pabellon")?.value || "")}</span>`;
}

// Devuelve un texto de error o "" si el partido es válido
function validarPartidoFormulario() {
  const local = document.getElementById("equipoLocal")?.value;
  const visitante = document.getElementById("equipoVisitante")?.value;
  if (!local || !visitante) return "No hay equipos para esa selección: cambia la categoría, el género o el grupo.";
  if (local === visitante) return "El equipo local y el visitante no pueden ser el mismo.";
  if (!document.getElementById("fecha")?.value) return "Elige la fecha del partido.";
  if (!document.getElementById("hora")?.value) return "Elige la hora del partido.";
  return "";
}

function activarResumenFormulario() {
  const caja = document.getElementById("form-partido");
  if (!caja) return;
  caja.addEventListener("input", actualizarResumenPartido);
  caja.addEventListener("change", actualizarResumenPartido);
  actualizarResumenPartido();
}

function formCrearFaseFinal() {
  contenido.innerHTML = `
    <button class="volver volver-arriba" onclick="mostrarPartidos()">${ico("izquierda", 16)} Volver a partidos</button>
    <h2>Partido de fase final</h2>
    <p class="pab-intro">Elige la categoría y la fase, después los equipos y por último cuándo y dónde se juega.</p>

    <div id="form-partido" class="fa-form">
      ${seccionFormulario(1, "Categoría y fase", `
        <div class="fa-grid">
          ${campoFormulario("categoria", "Categoría", `<select id="categoria"><option>Infantil</option><option>Cadete</option><option>Juvenil</option></select>`)}
          ${campoFormulario("genero", "Género", `<select id="genero"><option>Masculino</option><option>Femenino</option></select>`)}
          ${campoFormulario("fase", "Fase", `
            <select id="fase">
              <option value="playoff">Playoff</option>
              <option value="grupo_unico">Grupo único</option>
              <option value="cuartos">Cuartos de final</option>
              <option value="semifinal">Semifinal</option>
              <option value="final">Final</option>
              <option value="serie1">Serie 1</option>
              <option value="serie2">Serie 2</option>
            </select>`)}
          ${campoFormulario("posicion", "Posición en juego (opcional)", `
            <select id="posicion">
              <option value="">Sin posición concreta</option>
              ${POSICIONES_FASE_FINAL.map(x => `<option>${x}</option>`).join("")}
            </select>`)}
        </div>`)}

      ${seccionFormulario(2, "Equipos", bloqueEquiposFormulario())}
      ${seccionFormulario(3, "Fecha y pabellón", bloqueFechaFormulario())}

      <div id="fa-resumen" class="fa-resumen" aria-live="polite"></div>

      <div class="fa-botones">
        <button type="button" class="fa-guardar" onclick="guardarFaseFinal()">Crear partido</button>
        <button type="button" class="volver" onclick="mostrarPartidos()">Cancelar</button>
      </div>
    </div>
  `;

  // la posición solo tiene sentido si la fase no es una serie
  const alternarPosicion = () => {
    const serie = /^serie/.test(document.getElementById("fase").value);
    const campo = document.getElementById("posicion").closest(".fa-campo");
    campo.hidden = serie;
    if (serie) document.getElementById("posicion").value = "";
  };
  document.getElementById("fase").addEventListener("change", alternarPosicion);
  alternarPosicion();

  // los equipos se filtran por la categoría y el género elegidos
  document.getElementById("categoria").addEventListener("change", cargarTodosEquipos);
  document.getElementById("genero").addEventListener("change", cargarTodosEquipos);

  activarResumenFormulario();
  cargarTodosEquipos();
}

let equiposFaseFinalCache = null;

async function cargarTodosEquipos() {
  if (!equiposFaseFinalCache) equiposFaseFinalCache = await obtenerEquiposSupabase();
  const lista = equiposFaseFinalCache;

  const local = document.getElementById("equipoLocal");
  const visitante = document.getElementById("equipoVisitante");
  if (!local || !visitante) return;

  const cat = document.getElementById("categoria")?.value;
  const gen = document.getElementById("genero")?.value;
  const filtrados = lista.filter(e => (!cat || e.categoria === cat) && (!gen || e.genero === gen));

  local.innerHTML = "";
  visitante.innerHTML = "";

  filtrados.forEach(e => {
    const opt1 = document.createElement("option");
    opt1.value = e.id;
    opt1.textContent = e.grupo ? `${e.nombre} (${e.grupo})` : e.nombre;

    local.appendChild(opt1);
    visitante.appendChild(opt1.cloneNode(true));
  });

  // por defecto, visitante = segundo equipo para que no coincidan
  if (filtrados.length > 1) visitante.selectedIndex = 1;
  actualizarResumenPartido();
}

async function guardarFaseFinal() {
  const errorForm = validarPartidoFormulario();
  if (errorForm) { avisar(errorForm, "error"); return; }

  const fase = document.getElementById("fase").value;

const posicion = document.getElementById("posicion").value;

let grupoTexto = "Playoff";

if (fase === "cuartos") grupoTexto = "Cuartos de final";
if (fase === "semifinal") grupoTexto = "Semifinal";
if (fase === "final") grupoTexto = "Final";
if (fase === "grupo_unico") grupoTexto = "Grupo Único";
if (fase === "serie1") grupoTexto = "Serie 1";
if (fase === "serie2") grupoTexto = "Serie 2";

if (posicion && fase !== "serie1" && fase !== "serie2") {
  grupoTexto = posicion;
}

const nuevoPartido = {
  local_id: Number(document.getElementById("equipoLocal").value),
  visitante_id: Number(document.getElementById("equipoVisitante").value),
  categoria: document.getElementById("categoria").value,
  genero: document.getElementById("genero").value,
  grupo: grupoTexto,
  fase,
  fecha: document.getElementById("fecha").value,
  hora: document.getElementById("hora").value,
  pabellon: document.getElementById("pabellon").value,
  goles_local: 0,
  goles_visitante: 0,
  estado: "pendiente"
};

  const { error } = await supabase
    .from("partidos")
    .insert([nuevoPartido]);

  if (error) {
    console.error(error);
    avisar("Error creando partido");
    return;
  }

  await recargarPartidos();
  mostrarPartidos();
}

async function mostrarCuadrosEliminatorios() {
  equipos = await obtenerEquiposSupabase();
  await recargarPartidos();

  setNavActivoPorVista("partidos");

  // 1️⃣ detectar combinaciones con fases finales
  const combinaciones = [
    ...new Set(
      partidos
        .filter(p => p.fase !== "grupos")
        .map(p => `${p.categoria}||${p.genero}`)
    )
  ].map(c => {
    const [categoria, genero] = c.split("||");
    return { categoria, genero };
  });

  if (combinaciones.length === 0) {
    contenido.innerHTML = `
      <h2>Cuadros eliminatorios</h2>
      <p>No hay fases finales creadas aún.</p>
      <button class="volver" onclick="mostrarPartidos()">Volver</button>
    `;
    return;
  }

  // 2️⃣ pintar todos los cuadros
  let html = `<h2>Cuadros eliminatorios</h2>`;

  combinaciones.forEach(({ categoria, genero }) => {
    html += `
      <section class="cuadro-categoria">
        <h3>${categoria} · ${genero}</h3>
        ${renderBracket(categoria, genero)}
      </section>
    `;
  });

  html += `<button class="volver" onclick="mostrarClasificacion()">Volver</button>`;

  contenido.innerHTML = html;
}

// "sábado, 05 de junio" (o null si no hay fecha válida)
function textoFecha(fecha) {
  const d = parseFecha(fecha);
  if (!d) return null;

  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  });
}

function formatearFecha(fecha) {
  return textoFecha(fecha) || "Fecha por confirmar";
}

function renderPartidoCard(p) {
  
  if (!p.categoria || !p.genero || !p.grupo) {
  console.warn("PARTIDO MAL FORMADO:", p);
}

  const estadoReal = calcularEstadoPartido(p);
  const equipoLocal = equipos.find(e => e.id === p.local_id);
  const equipoVisitante = equipos.find(e => e.id === p.visitante_id);

  const clubLocal = clubes.find(c => c.id === equipoLocal?.club_id);
  const clubVisitante = clubes.find(c => c.id === equipoVisitante?.club_id);
  
  const fin = p.estado === "finalizado";
  const gl = Number(p.goles_local), gv = Number(p.goles_visitante);
  const escudo = c => c?.escudo
    ? `<img src="${escaparHtml(c.escudo)}" class="pc-escudo" alt="" loading="lazy" decoding="async">`
    : `<span class="pc-escudo pc-escudo-vacio"></span>`;
  const textoEstado = estadoReal === "finalizado" ? "Finalizado"
    : estadoReal === "en_juego" ? "En juego" : "Pendiente";

  return `
    <article class="card partido-card pc ${estadoReal}">

      <div class="pc-cab">
        <span class="pc-hora">${formatearHora(p.hora)}</span>
        <span class="badge-estado ${estadoReal}">${textoEstado}</span>
      </div>

      ${p.fase !== "grupos" ? `<div class="badge-fase">${textoFase(p.fase)}</div>` : ""}

      <div class="pc-duelo">
        <div class="pc-equipo">
          ${escudo(clubLocal)}
          <span class="pc-nombre">${equipoLocal?.nombre || "-"}</span>
        </div>

        <div class="pc-centro">
          ${fin
            ? `<span class="pc-marcador"><b class="${gl > gv ? "gana" : ""}">${p.goles_local}</b><i>–</i><b class="${gv > gl ? "gana" : ""}">${p.goles_visitante}</b></span>`
            : `<span class="pc-vs">VS</span>`}
        </div>

        <div class="pc-equipo">
          ${escudo(clubVisitante)}
          <span class="pc-nombre">${equipoVisitante?.nombre || "-"}</span>
        </div>
      </div>

      <div class="pc-pie">
        <span class="pc-dato">${ico("pabellon", 14)} ${p.pabellon || "-"}</span>
        <span class="pc-dato pc-cat">${p.categoria} · ${p.genero}${p.grupo ? " · " + p.grupo : ""}</span>
      </div>

      <div class="pc-acciones">
        <button type="button" class="pc-abrir" onclick="abrirPartido(${p.id})">Ver partido ${ico("derecha", 16)}</button>
        ${adminActivo ? `
          <button type="button" onclick="editarPartido(${p.id})">Editar</button>
          <button type="button" onclick="borrarPartido(${p.id})">Borrar</button>` : ""}
      </div>
    </article>
  `;
}

function formNuevoPartido() {
  contenido.innerHTML = `
    <button class="volver volver-arriba" onclick="mostrarPartidos()">${ico("izquierda", 16)} Volver a partidos</button>
    <h2>Nuevo partido</h2>
    <p class="pab-intro">Elige la categoría y el grupo, después los equipos y por último cuándo y dónde se juega.</p>

    <div id="form-partido" class="fa-form">
      ${seccionFormulario(1, "Categoría y grupo", `
        <div class="fa-grid">
          ${campoFormulario("categoria", "Categoría", `<select id="categoria"><option>Infantil</option><option>Cadete</option><option>Juvenil</option></select>`)}
          ${campoFormulario("genero", "Género", `<select id="genero"><option>Masculino</option><option>Femenino</option></select>`)}
          ${campoFormulario("grupo", "Grupo", `
            <select id="grupo">
              <option>Grupo A</option><option>Grupo B</option><option>Grupo C</option>
              <option>Grupo D</option><option>Grupo Único</option>
            </select>`, "fa-ancho")}
        </div>`)}

      ${seccionFormulario(2, "Equipos", bloqueEquiposFormulario())}
      ${seccionFormulario(3, "Fecha y pabellón", bloqueFechaFormulario())}

      <div id="fa-resumen" class="fa-resumen" aria-live="polite"></div>

      <div class="fa-botones">
        <button type="button" class="fa-guardar" onclick="guardarNuevoPartido()">Guardar partido</button>
        <button type="button" class="volver" onclick="mostrarPartidos()">Cancelar</button>
      </div>
    </div>
  `;

  // 🔥 LISTENERS (FUERA del HTML)
  document.getElementById("categoria").addEventListener("change", cargarEquiposParaPartido);
  document.getElementById("genero").addEventListener("change", cargarEquiposParaPartido);
  document.getElementById("grupo").addEventListener("change", cargarEquiposParaPartido);

  activarResumenFormulario();

  // 🔥 Primera carga
  cargarEquiposParaPartido();
}

function editarPartido(id) {
  partidoActual = partidos.find(p => p.id === id);
  
  const esFaseFinal = partidoActual.fase !== "grupos";
  
  const equipoLocal = equipos.find(e => e.id === partidoActual.local_id);
const equipoVisitante = equipos.find(e => e.id === partidoActual.visitante_id);

// equipos válidos SOLO de esa categoría / género / grupo
const equiposDisponibles = equipos.filter(e =>
  e.categoria === partidoActual.categoria &&
  e.genero === partidoActual.genero &&
  e.grupo === partidoActual.grupo
);

  contenido.innerHTML = `
    <h2>Editar partido</h2>

    <label>Equipo local</label>
${
  esFaseFinal
    ? `<input value="${equipoLocal?.nombre || '—'}" disabled>`
    : `
      <select id="equipoLocal">
        ${equiposDisponibles.map(e => `
          <option value="${e.id}" ${e.id === partidoActual.local_id ? "selected" : ""}>
            ${e.nombre}
          </option>
        `).join("")}
      </select>
    `
}

<label>Equipo visitante</label>
${
  esFaseFinal
    ? `<input value="${equipoVisitante?.nombre || '—'}" disabled>`
    : `
      <select id="equipoVisitante">
        ${equiposDisponibles.map(e => `
          <option value="${e.id}" ${e.id === partidoActual.visitante_id ? "selected" : ""}>
            ${e.nombre}
          </option>
        `).join("")}
      </select>
    `
}

    <label>Categoría</label>
<select id="categoria" ${esFaseFinal ? "disabled" : ""}>
  <option ${partidoActual.categoria==="Infantil"?"selected":""}>Infantil</option>
  <option ${partidoActual.categoria==="Cadete"?"selected":""}>Cadete</option>
  <option ${partidoActual.categoria==="Juvenil"?"selected":""}>Juvenil</option>
</select>

<label>Género</label>
<select id="genero" ${esFaseFinal ? "disabled" : ""}>
  <option ${partidoActual.genero==="Masculino"?"selected":""}>Masculino</option>
  <option ${partidoActual.genero==="Femenino"?"selected":""}>Femenino</option>
</select>
    
    <label>Grupo</label>
<select id="grupo" ${esFaseFinal ? "disabled" : ""}>
  <option ${partidoActual.grupo==="Grupo A"?"selected":""}>Grupo A</option>
  <option ${partidoActual.grupo==="Grupo B"?"selected":""}>Grupo B</option>
  <option ${partidoActual.grupo==="Grupo C"?"selected":""}>Grupo C</option>
  <option ${partidoActual.grupo==="Grupo D"?"selected":""}>Grupo D</option>
  <option ${partidoActual.grupo==="Grupo Único"?"selected":""}>Grupo Único</option>
</select>

    <label>Fecha</label>
    <input type="date" id="fecha" value="${partidoActual.fecha || ""}">
    
    <label>Hora</label>
    <input type="time" id="hora" value="${partidoActual.hora || ""}">

    <label>Pabellón</label>
<select id="pabellon">
  ${LISTA_PABELLONES.map(p => `
    <option value="${p}" ${p === partidoActual.pabellon ? "selected" : ""}>
      ${p}
    </option>
  `).join("")}
</select>

    <button onclick="guardarEdicionPartido()">Guardar cambios</button>
    <button class="volver" onclick="mostrarPartidos()">Volver</button>
  `;
}

async function guardarEdicionPartido() {

  const cambios = {
    fecha: document.getElementById("fecha").value || null,
    hora: document.getElementById("hora").value || null,
    pabellon: document.getElementById("pabellon").value
  };

  // 🟢 SOLO permitir cambiar categoría y género en fase de grupos
  if (partidoActual.fase === "grupos") {
    cambios.categoria = document.getElementById("categoria").value;
    cambios.genero = document.getElementById("genero").value;
    cambios.grupo = document.getElementById("grupo").value;
  }

  // 🔐 BLINDAJE TOTAL DE FASE FINAL
  if (partidoActual.fase !== "grupos") {
    cambios.categoria = partidoActual.categoria;
    cambios.genero = partidoActual.genero;
    cambios.fase = partidoActual.fase;

    if (partidoActual.fase === "final") cambios.grupo = "Final";
    if (partidoActual.fase === "semifinal") cambios.grupo = "Semifinal";
    if (partidoActual.fase === "tercer_puesto") cambios.grupo = "3º/4º Puesto";
  }
  
  // 🟢 permitir cambiar equipos SOLO en fase de grupos
if (partidoActual.fase === "grupos") {
  const localId = Number(document.getElementById("equipoLocal")?.value);
  const visitanteId = Number(document.getElementById("equipoVisitante")?.value);

  if (localId === visitanteId) {
    avisar("El equipo local y visitante no pueden ser el mismo");
    return;
  }

  cambios.local_id = localId;
  cambios.visitante_id = visitanteId;
}

  const { error } = await supabase
    .from("partidos")
    .update(cambios)
    .eq("id", partidoActual.id);

  if (error) {
    avisar("Error guardando cambios");
    console.error(error);
    return;
  }

  await recargarPartidos();
  mostrarPartidos();
}

function esEliminatoria(partido) {
  return partido.fase && partido.fase !== "grupos";
}

function textoFase(fase) {

  if (fase === "final")
    return "Final";

  if (fase === "semifinal")
    return "Semifinal";

  if (fase === "cuartos")
  return "Cuartos de final";
  
  if (fase === "tercer_puesto")
    return "3.º y 4.º puesto";

  if (fase === "quinto_puesto")
    return "5.º y 6.º puesto";

  if (fase === "septimo_puesto")
    return "7.º y 8.º puesto";

  if (fase === "noveno_puesto")
    return "9.º y 10.º puesto";

  if (fase === "grupo_unico")
  return "Grupo único";
  
  if (fase === "serie1")
  return "Serie 1";

if (fase === "serie2")
  return "Serie 2";
  
  if (fase === "playoff")
    return "Playoff";

  return "";

}

function textoGrupoOFase(partido) {
  if (partido.fase && partido.fase !== "grupos") {
    return textoFase(partido.fase); // 🏆 FINAL, 🥈 SEMIFINAL, etc.
  }

  if (partido.grupo) {
    return `${partido.grupo}`;
  }

  return "";
}

function abrirPartido(id) {
  partidoActual = partidos.find(p => p.id === id);
  if (!partidoActual) return;

  registrarNavegacion("partido", { id });

  const equipoLocal = equipos.find(e => e.id === partidoActual.local_id);
  const equipoVisitante = equipos.find(e => e.id === partidoActual.visitante_id);

  const clubLocal = clubes.find(c => c.id === equipoLocal?.club_id);
  const clubVisitante = clubes.find(c => c.id === equipoVisitante?.club_id);

  const fechaBonita = textoFecha(partidoActual.fecha) || "-";
  const estadoReal = calcularEstadoPartido(partidoActual);
  const textoEstado = estadoReal === "finalizado" ? "Finalizado" : estadoReal === "en_juego" ? "En juego" : "Pendiente";
  const nombreLocal = equipoLocal?.nombre || "Equipo local";
  const nombreVisitante = equipoVisitante?.nombre || "Equipo visitante";
  const gl = partidoActual.goles_local ?? 0;
  const gv = partidoActual.goles_visitante ?? 0;

  const puedeEditar = adminActivo || mesaActiva;
  const stepper = (lado, inputId, valor, nombre) => `
    <div class="ap-stepper ${lado}">
      <button type="button" class="ap-mas-menos" onclick="cambiarGol('${lado}', -1)" aria-label="Quitar un gol a ${nombre}">−</button>
      <input type="number" inputmode="numeric" min="0" id="${inputId}" value="${valor}" aria-label="Goles de ${nombre}">
      <button type="button" class="ap-mas-menos mas" onclick="cambiarGol('${lado}', 1)" aria-label="Añadir un gol a ${nombre}">+</button>
    </div>`;

  const bloqueDatos = adminActivo ? `
    <section class="ap-panel">
      <h3 class="ap-titulo">Datos del partido</h3>
      <div class="fa-grid">
        ${campoFormulario("hora", "Hora", `<input type="time" id="hora" value="${partidoActual.hora || ""}">`)}
        ${campoFormulario("pabellon", "Lugar", `<input type="text" id="pabellon" value="${partidoActual.pabellon || ""}">`)}
      </div>
      <button type="button" class="ap-secundario" onclick="guardarDatosPartido()">Guardar datos</button>
    </section>` : "";

  const bloqueResultado = puedeEditar ? `
    <section class="ap-panel ap-resultado">
      <h3 class="ap-titulo">Resultado</h3>
      <div class="ap-steppers">
        <div class="ap-lado"><span>${nombreLocal}</span>${stepper("local", "inputLocal", partidoActual.goles_local, nombreLocal)}</div>
        <div class="ap-lado"><span>${nombreVisitante}</span>${stepper("visitante", "inputVisitante", partidoActual.goles_visitante, nombreVisitante)}</div>
      </div>
      <button type="button" class="fa-guardar" onclick="guardarResultado()">Guardar resultado</button>
      <button type="button" class="btn-finalizar ap-finalizar" onclick="finalizarPartido()">Finalizar partido</button>
      <p class="ap-nota">Finalizar cierra el partido y actualiza la clasificación.</p>
    </section>` : "";

  contenido.innerHTML = `
  <button class="volver volver-arriba" onclick="mostrarPartidos()">${ico("izquierda", 16)} Volver a partidos</button>
  <h2 class="sr-only">${nombreLocal} contra ${nombreVisitante}</h2>

  <section class="ap-cabecera">
    <div class="ap-chips">
      <span class="ap-chip">${partidoActual.categoria} · ${partidoActual.genero}</span>
      ${partidoActual.fase !== "grupos" ? `<span class="ap-chip fase">${textoFase(partidoActual.fase)}</span>` : ""}
      <span class="badge-estado ${estadoReal}">${textoEstado}</span>
    </div>
    <div class="ap-cuando"><strong>${fechaBonita}</strong> · ${formatearHora(partidoActual.hora)}</div>
    <div class="ap-donde">${ico("pabellon", 15)} ${partidoActual.pabellon || "-"}</div>
  </section>

  <div class="marcador-ios ap-marcador">
    <div class="equipo-ios local">
      <img src="${clubLocal?.escudo || PLACEHOLDER_ESCUDO}" class="escudo-ios" alt="Escudo de ${nombreLocal}">
      <div class="nombre-ios">${nombreLocal}</div>
      <div class="goles-ios local" id="golesLocal">${gl}</div>
    </div>

    <div class="vs-ios"><span>–</span></div>

    <div class="equipo-ios visitante">
      <img src="${clubVisitante?.escudo || PLACEHOLDER_ESCUDO}" class="escudo-ios" alt="Escudo de ${nombreVisitante}">
      <div class="nombre-ios">${nombreVisitante}</div>
      <div class="goles-ios visitante" id="golesVisitante">${gv}</div>
    </div>
  </div>

  ${bloqueResultado}
  ${bloqueDatos}
`;
}

// Recalcula y guarda la clasificación de un grupo con los partidos MÁS RECIENTES de la
// base de datos. Antes se usaban los partidos cargados al abrir la app: si otro móvil
// había cerrado un partido entretanto, la clasificación se guardaba sin ese resultado.
async function recalcularClasificacionGrupo(categoria, genero, grupo) {
  const frescos = await recargarPartidos();

  if (!frescos) {
    avisar("No se pudo actualizar la clasificación (sin conexión). Vuelve a intentarlo.", "error");
    return false;
  }

  return guardarClasificacionSupabase(categoria, genero, grupo);
}

async function finalizarPartido() {
  if (!confirm("¿Finalizar este partido?")) return;

  // Se guarda el resultado que se ve en los campos. Antes, si se escribían los goles a mano
  // y no se pulsaba "Guardar resultado", el partido se cerraba con el marcador anterior.
  const inputLocal = document.getElementById("inputLocal");
  const inputVisitante = document.getElementById("inputVisitante");

  const golesLocal = inputLocal ? Number(inputLocal.value) : partidoActual.goles_local;
  const golesVisitante = inputVisitante ? Number(inputVisitante.value) : partidoActual.goles_visitante;

  if (
    !Number.isInteger(golesLocal) || !Number.isInteger(golesVisitante) ||
    golesLocal < 0 || golesVisitante < 0
  ) {
    avisar("Los goles deben ser números enteros de 0 o más", "error");
    return;
  }

  const { error } = await supabase
    .from("partidos")
    .update({
      estado: "finalizado",
      goles_local: golesLocal,
      goles_visitante: golesVisitante
    })
    .eq("id", partidoActual.id);

  if (error) {
    console.error(error);
    avisar("Error finalizando partido");
    return;
  }

  partidoActual.estado = "finalizado";
  partidoActual.goles_local = golesLocal;
  partidoActual.goles_visitante = golesVisitante;

  avisar("Partido finalizado", "ok");

  if (partidoActual.fase === "grupos") {
    await recalcularClasificacionGrupo(
      partidoActual.categoria,
      partidoActual.genero,
      partidoActual.grupo
    );
  }

  document.dispatchEvent(new Event("partido-finalizado"));
  renderActualizacionesHome();

  mostrarPartidos();
}

async function asegurarEquipoEnClasificacion(equipo) {
  const { data } = await supabase
    .from("clasificacion")
    .select("id")
    .eq("equipo_id", equipo.id)
    .eq("categoria", equipo.categoria)
    .eq("genero", equipo.genero)
    .eq("grupo", equipo.grupo)
    .single();

  // Ya existe → no hacer nada
  if (data) return;

  // No existe → crear fila vacía
  await supabase.from("clasificacion").insert({
    categoria: equipo.categoria,
    genero: equipo.genero,
    grupo: equipo.grupo,
    equipo_id: equipo.id,
    pj: 0,
    pg: 0,
    pe: 0,
    pp: 0,
    gf: 0,
    gc: 0,
    puntos: 0
  });
}

function cambiarGol(equipo, cambio) {
  if (equipo === "local") {
    partidoActual.goles_local = Math.max(0, partidoActual.goles_local + cambio);
  } else {
    partidoActual.goles_visitante = Math.max(0, partidoActual.goles_visitante + cambio);
  }

  // sincronizar inputs
  const inputLocal = document.getElementById("inputLocal");
  const inputVisitante = document.getElementById("inputVisitante");

  if (inputLocal) inputLocal.value = partidoActual.goles_local;
  if (inputVisitante) inputVisitante.value = partidoActual.goles_visitante;

  animarMarcador(equipo === "local" ? "golesLocal" : "golesVisitante");
}

function animarMarcador(id) {
  const el = document.getElementById(id);
  if (!el) return;

  if (id === "golesLocal") {
    el.textContent = partidoActual.goles_local;
  } else {
    el.textContent = partidoActual.goles_visitante;
  }

  el.classList.remove("animar");
  void el.offsetWidth; // fuerza reflow
  el.classList.add("animar");
}

// Antes este botón llamaba a guardarPartidos(), una función que ya no existe, así que
// la hora y el lugar no se guardaban nunca y solo salía un error. Ahora se guardan en Supabase.
async function guardarDatosPartido() {
  const hora = document.getElementById("hora").value || null;
  const pabellon = document.getElementById("pabellon").value;

  const { error } = await supabase
    .from("partidos")
    .update({ hora, pabellon })
    .eq("id", partidoActual.id);

  if (error) {
    console.error(error);
    avisar("Error guardando los datos del partido");
    return;
  }

  partidoActual.hora = hora;
  partidoActual.pabellon = escaparHtml(pabellon);

  avisar("Datos guardados", "ok");
  sinSaltoDeScroll(() => abrirPartido(partidoActual.id));
}

async function borrarPartido(id) {
  if (!confirm("¿Eliminar este partido definitivamente?")) return;

  const partido = partidos.find(p => p.id === id);

  await borrarPartidoSupabase(id);

  // 🔥 recalcular clasificación SI estaba finalizado
  if (partido?.estado === "finalizado" && partido.fase === "grupos") {
    await recalcularClasificacionGrupo(
      partido.categoria,
      partido.genero,
      partido.grupo
    );
  } else {
    await recargarPartidos();
  }

  mostrarPartidos();
  actualizarClasificacion();
}

// Un partido figura "en juego" desde su hora de inicio (hora de Madrid) durante
// DURACION_PARTIDO_MIN minutos, salvo que ya esté marcado como finalizado.
function calcularEstadoPartido(partido) {
  if (partido.estado === "finalizado") return "finalizado";

  const inicio = inicioPartido(partido);
  if (!inicio) return "pendiente";

  const ahora = Date.now();
  const fin = inicio.getTime() + DURACION_PARTIDO_MIN * 60000;

  return ahora >= inicio.getTime() && ahora <= fin ? "en_juego" : "pendiente";
}

async function guardarResultado() {
  const inputLocal = document.getElementById("inputLocal");
  const inputVisitante = document.getElementById("inputVisitante");

  if (!inputLocal || !inputVisitante) {
    avisar("No hay inputs de resultado disponibles");
    return;
  }

  const golesLocal = Number(inputLocal.value);
  const golesVisitante = Number(inputVisitante.value);

  if (!Number.isInteger(golesLocal) || !Number.isInteger(golesVisitante)) {
    avisar("Los goles deben ser números enteros", "error");
    return;
  }

  if (golesLocal < 0 || golesVisitante < 0) {
    avisar("Los goles no pueden ser negativos", "error");
    return;
  }

  const { error } = await supabase
    .from("partidos")
    .update({
      goles_local: golesLocal,
      goles_visitante: golesVisitante
    })
    .eq("id", partidoActual.id);

  if (error) {
    console.error(error);
    avisar("Error guardando resultado");
    return;
  }

  // el marcador local solo cambia cuando se ha guardado de verdad
  partidoActual.goles_local = golesLocal;
  partidoActual.goles_visitante = golesVisitante;

  // Si el partido ya estaba cerrado (corrección de un resultado), la clasificación
  // debe recalcularse: antes solo se arreglaba sola 5 minutos después, desde el móvil de cualquiera.
  if (partidoActual.estado === "finalizado" && partidoActual.fase === "grupos") {
    await recalcularClasificacionGrupo(
      partidoActual.categoria,
      partidoActual.genero,
      partidoActual.grupo
    );
  }

  avisar("Resultado guardado", "ok");
  sinSaltoDeScroll(() => abrirPartido(partidoActual.id));
}

/* ================== ADMIN ================== */
async function validarPinSupabase(pin) {
  const { data, error } = await supabase
    .from("roles_acceso")
    .select("rol")
    .eq("pin", pin)
    .eq("activo", true)
    .single();

  if (error || !data) return null;

  return data.rol; // "admin" o "mesa"
}

async function toggleAdmin() {
  // 🔓 Cerrar sesión
  if (rolUsuario) {
    rolUsuario = null;
    adminActivo = false;
    mesaActiva = false;
    pinAdmin = null;
    lsRemove("rol");
    document.getElementById("admin-fab")?.classList.remove("admin-activo");
    avisar("Sesión cerrada");
    refrescarVistaActual();
    return;
  }

  const pin = prompt("Introduce PIN:");
  if (!pin) return;

  const rol = await validarPinSupabase(pin);

  if (!rol) {
    avisar("PIN incorrecto");
    return;
  }

  rolUsuario = rol;
  adminActivo = rol === "admin";
  mesaActiva = rol === "mesa";
  pinAdmin = rol === "admin" ? pin : null;

  lsSet("rol", rol);
  document.getElementById("admin-fab")?.classList.add("admin-activo");

  avisar(`Modo ${rol.toUpperCase()} activado`);
  refrescarVistaActual();
}

/* ================== INICIO ================== */
async function guardarNuevoPatrocinador() {
  const nombre = document.getElementById("nombre").value;
  const web = document.getElementById("web").value;
  const file = document.getElementById("imagen").files[0];

  if (!nombre || !file) {
    avisar("Nombre y logo son obligatorios");
    return;
  }

  // nombre único
  const fileName = `${Date.now()}-${file.name}`;

  // 1️⃣ SUBIR AL STORAGE
  const { error: uploadError } = await supabase
    .storage
    .from("patrocinadores")
    .upload(fileName, file);

  if (uploadError) {
    console.error(uploadError);
    avisar("Error subiendo imagen");
    return;
  }

  // 2️⃣ OBTENER URL PÚBLICA
  const { data } = supabase
    .storage
    .from("patrocinadores")
    .getPublicUrl(fileName);

  const urlImagen = data.publicUrl;

  // 3️⃣ GUARDAR EN TABLA
  const orden = patrocinadores.length + 1;

const { error } = await supabase
  .from("patrocinadores")
  .insert({
    nombre,
    web,
    imagen: urlImagen,
    orden
  });

  if (error) {
    console.error(error);
    avisar("Error guardando patrocinador");
    return;
  }

  patrocinadores = await obtenerPatrocinadoresSupabase();
  mostrarHome();
}

async function borrarPatrocinador(id) {
  if (!confirm("¿Eliminar este patrocinador?")) return;

  // 1️⃣ obtener patrocinador
  const { data: patrocinador, error: fetchError } = await supabase
    .from("patrocinadores")
    .select("imagen")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error(fetchError);
    avisar("Error obteniendo patrocinador");
    return;
  }

  // 2️⃣ sacar nombre del archivo desde la URL
  let nombreArchivo = null;

  if (patrocinador?.imagen) {
    nombreArchivo = patrocinador.imagen.split("/").pop();
  }

  // 3️⃣ borrar imagen del storage
  if (nombreArchivo) {
    const { error: deleteStorageError } = await supabase
      .storage
      .from("patrocinadores")
      .remove([nombreArchivo]);

    if (deleteStorageError) {
      console.warn("No se pudo borrar imagen:", deleteStorageError);
    }
  }

  // 4️⃣ borrar registro tabla
  const { error } = await supabase
    .from("patrocinadores")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    avisar("Error borrando patrocinador");
    return;
  }

  // 5️⃣ refrescar
  patrocinadores = await obtenerPatrocinadoresSupabase();
  mostrarHome();
}

/* ================== CLASIFICACION SUPABASE ================== */
/* ================== CLUBES SUPABASE ================== */
async function obtenerClubesSupabase(intentos = 3) {

  try {

    const { data, error } = await supabase
      .from("clubes")
      .select("*")
      .order("id");

    if (error) throw error;

    return (data || []).map(sanearClub);

  } catch (error) {

    console.warn("Error cargando clubes:", error);

    if (intentos > 0) {

      console.log("Reintentando clubes...");

      await new Promise(r =>
        setTimeout(r, 1000)
      );

      return obtenerClubesSupabase(
        intentos - 1
      );

    }

    return [];

  }

}

/* ================== EQUIPOS (SUPABASE) ================== */

async function obtenerEquiposSupabase() {
  const { data, error } = await supabase
    .from("equipos")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error cargando equipos:", error);
    return [];
  }

  return (data || []).map(sanearEquipo);
}

async function obtenerEquiposPorFiltro(categoria, genero, grupo) {
  const { data, error } = await supabase
    .from("equipos")
    .select("*")
    .eq("categoria", categoria)
    .eq("genero", genero)
    .eq("grupo", grupo);

  if (error) {
    console.error("Error cargando equipos:", error);
    return [];
  }

  return data;
}

async function cargarEquiposParaPartido() {
  const categoria = document.getElementById("categoria").value;
  const genero = document.getElementById("genero").value;
  const grupo = document.getElementById("grupo").value;

  const equipos = await obtenerEquiposPorFiltro(categoria, genero, grupo);

  const local = document.getElementById("equipoLocal");
  const visitante = document.getElementById("equipoVisitante");

  local.innerHTML = "";
  visitante.innerHTML = "";

  equipos.forEach(equipo => {
    const opt1 = document.createElement("option");
    opt1.value = equipo.id;
    opt1.textContent = equipo.nombre;

    const opt2 = opt1.cloneNode(true);

    local.appendChild(opt1);
    visitante.appendChild(opt2);
  });

  if (equipos.length > 1) visitante.selectedIndex = 1;
  actualizarResumenPartido();
}

async function crearEquipoSupabase(equipo) {
  const { error } = await supabase
    .from("equipos")
    .insert([equipo]);

  if (error) {
    avisar("Error creando equipo");
    console.error(error);
  }
}

async function editarEquipoSupabase(id, cambios) {
  const { error } = await supabase
    .from("equipos")
    .update(cambios)
    .eq("id", id);

  if (error) {
    avisar("Error editando equipo");
    console.error(error);
  }
}

async function borrarEquipoSupabase(id) {
  const { error } = await supabase
    .from("equipos")
    .delete()
    .eq("id", id);

  if (error) {
    avisar("Error borrando equipo");
    console.error(error);
  }
}

async function obtenerEquiposPorClub(clubId) {
  const { data, error } = await supabase
    .from("equipos")
    .select("*")
    .eq("club_id", clubId)
    .order("categoria");

  if (error) {
    console.error("Error cargando equipos del club:", error);
    return [];
  }

  return (data || []).map(sanearEquipo);
}

/* ================== PARTIDOS (SUPABASE) ================== */
async function obtenerPartidosSupabase() {
  const { data, error } = await supabase
    .from("partidos")
    .select("*");

  if (error) {
    console.error("Error cargando partidos:", error);
    return [];
  }

  return data;
}

async function borrarPartidoSupabase(id) {
  const { error } = await supabase
    .from("partidos")
    .delete()
    .eq("id", id);

  if (error) {
    avisar("Error borrando partido");
    console.error(error);
  }
}

async function guardarNuevoPartido() {
  const errorForm = validarPartidoFormulario();
  if (errorForm) { avisar(errorForm, "error"); return; }

  const nuevoPartido = {
    local_id: Number(document.getElementById("equipoLocal").value),
    visitante_id: Number(document.getElementById("equipoVisitante").value),
    categoria: document.getElementById("categoria").value,
    genero: document.getElementById("genero").value,
    grupo: document.getElementById("grupo").value,
    fecha: document.getElementById("fecha").value,
    hora: document.getElementById("hora").value,
    pabellon: document.getElementById("pabellon").value,
    goles_local: 0,
    goles_visitante: 0,
    estado: "pendiente",
    fase: "grupos"
  };

  const { error } = await supabase
    .from("partidos")
    .insert([nuevoPartido]);

  if (error) {
    console.error(error);
    avisar("Error guardando partido");
    return;
  }

  await recargarPartidos();
  mostrarPartidos();
}

/* ================== CATEGORIAS ================== */
function mostrarCategorias() {
  setNavActivoPorVista("categorias");
  registrarNavegacion("categorias");

  contenido.innerHTML = `
    <h2>Categorías</h2>

    <!-- TABS DE CATEGORÍA -->
    <div class="tabs">
      <button class="tab active" onclick="seleccionarCategoria('Infantil', this)">Infantil</button>
      <button class="tab" onclick="seleccionarCategoria('Cadete', this)">Cadete</button>
      <button class="tab" onclick="seleccionarCategoria('Juvenil', this)">Juvenil</button>
    </div>

    <!-- SUBFILTROS -->
    <div class="subfiltros">
      <select id="gen" onchange="filtrarCategorias()">
        <option>Masculino</option>
        <option>Femenino</option>
      </select>

      <select id="grp" onchange="filtrarCategorias()">
        <option value="">Todos los grupos</option>
        <option>Grupo A</option>
        <option>Grupo B</option>
        <option>Grupo C</option>
        <option>Grupo D</option>
        <option>Grupo Único</option>
      </select>
    </div>

    <div id="listaCategorias"></div>
  `;

  // categoría por defecto
  window.categoriaSeleccionada = "Infantil";
  filtrarCategorias();
}

function seleccionarCategoria(cat, boton) {
  window.categoriaSeleccionada = cat;

  clasificacionFiltro.categoria = cat.toLowerCase(); // 🔑
  
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.remove("active");
  });

  boton.classList.add("active");
  filtrarCategorias();
}

function filtrarCategorias() {
  const categoria = window.categoriaSeleccionada;
  const genero = document.getElementById("gen").value;
  const grupo = document.getElementById("grp").value;

  clasificacionFiltro.categoria = categoria.toLowerCase(); // 🔑
  clasificacionFiltro.genero = genero.toLowerCase();       // 🔑

  let html = "";

  /* ====== EQUIPOS ====== */

  const equiposFiltrados = equipos.filter(e =>
    e.categoria === categoria &&
    e.genero === genero &&
    (!grupo || e.grupo === grupo)
  );

  html += `<h3 class="bloque-titulo pt-titulo">Equipos <span class="pt-cuenta">${equiposFiltrados.length}</span></h3>`;

  if (equiposFiltrados.length === 0) {
    html += `<p class="estado-vacio">No hay equipos en esta categoría</p>`;
  }

  html += `<div class="cat-equipos">`;
  equiposFiltrados.forEach(e => {
  const club = clubes.find(c => c.id === e.club_id);
  const nPartidos = partidos.filter(p => p.local_id === e.id || p.visitante_id === e.id).length;

  html += `
  <div class="card equipo-card cat-equipo">
    <div class="cat-cab" role="button" tabindex="0" aria-expanded="false" aria-controls="partidos-equipo-${e.id}"
         onclick="togglePartidosEquipo(${e.id})">
      <span class="cat-escudo"><img src="${escaparHtml(club?.escudo || PLACEHOLDER_ESCUDO)}" alt="" loading="lazy" decoding="async"></span>
      <div class="cat-info">
        <strong>${escaparHtml(e.nombre)}</strong>
        <div class="cat-meta">
          <span class="cat-grupo">${escaparHtml(e.grupo || "Sin grupo")}</span>
          <span class="cat-n">${nPartidos} ${nPartidos === 1 ? "partido" : "partidos"}</span>
        </div>
      </div>
      <span class="cat-flecha" aria-hidden="true">${ico("derecha", 18)}</span>
    </div>

    <div id="partidos-equipo-${e.id}" class="partidos-equipo oculto"></div>
  </div>
  `;
});
  html += `</div>`;

  document.getElementById("listaCategorias").innerHTML = html;
}

function togglePartidosEquipo(idEquipo) {
  // 🔒 cerrar todos los demás
  document.querySelectorAll(".partidos-equipo").forEach(el => {
    if (el.id !== `partidos-equipo-${idEquipo}`) {
      el.classList.add("oculto");
      el.innerHTML = "";
      marcarEquipoAbierto(el, false);
    }
  });

  const contenedor = document.getElementById(`partidos-equipo-${idEquipo}`);
  if (!contenedor) return;

  // toggle del actual
  if (!contenedor.classList.contains("oculto")) {
    contenedor.classList.add("oculto");
    contenedor.innerHTML = "";
    marcarEquipoAbierto(contenedor, false);
    return;
  }

  const categoria = window.categoriaSeleccionada.toLowerCase();
  const genero = document.getElementById("gen").value.toLowerCase();

 const partidosEquipo = partidos.filter(p => {
  const esEquipo =
    p.local_id === idEquipo || p.visitante_id === idEquipo;

  const mismaCategoria =
    p.categoria?.toLowerCase() === categoria;

  const mismoGenero =
    p.genero?.toLowerCase() === genero;

  // 🔥 CLAVE: en eliminatorias NO filtramos por grupo
  const grupoValido =
    esEliminatoria(p) ||
    !p.grupo ||
    p.grupo === document.getElementById("grp")?.value ||
    document.getElementById("grp")?.value === "";

  return esEquipo && mismaCategoria && mismoGenero && grupoValido;
});

  const proximos = partidosEquipo.filter(p =>
    calcularEstadoPartido(p) !== "finalizado"
  );

  const finalizados = partidosEquipo.filter(p =>
    calcularEstadoPartido(p) === "finalizado"
  );

  let html = "";

  html += `<div class="bloque-partidos"><strong>Próximos partidos</strong></div>`;
  html += proximos.length
    ? proximos.map(p => renderMiniPartido(p)).join("")
    : `<p class="partido-vacio">No hay próximos partidos</p>`;

  html += `<div class="bloque-partidos"><strong>Partidos finalizados</strong></div>`;
  html += finalizados.length
    ? finalizados.map(p => renderMiniPartido(p, true)).join("")
    : `<p class="partido-vacio">No hay partidos finalizados</p>`;

  contenedor.innerHTML = html;
  contenedor.classList.remove("oculto");
  marcarEquipoAbierto(contenedor, true);
}

function marcarEquipoAbierto(contenedor, abierto) {
  const tarjeta = contenedor.closest(".cat-equipo");
  if (!tarjeta) return;
  tarjeta.classList.toggle("abierto", abierto);
  tarjeta.querySelector(".cat-cab")?.setAttribute("aria-expanded", abierto ? "true" : "false");
}

function renderMiniPartido(p, finalizado = false) {
  const local = equipos.find(e => e.id === p.local_id);
  const visitante = equipos.find(e => e.id === p.visitante_id);
  const gl = Number(p.goles_local), gv = Number(p.goles_visitante);

  return `
    <div class="card partido-card-mini pm ${finalizado ? "finalizado" : ""}" role="button" tabindex="0"
         onclick="event.stopPropagation(); abrirPartido(${p.id})">
      <div class="pm-fecha">
        <strong>${formatearFecha(p.fecha)}</strong>
        ${!finalizado ? `<span>${formatearHora(p.hora)} · ${p.pabellon || "-"}</span>` : ""}
      </div>
      <div class="pm-duelo">
        <span class="pm-eq ${finalizado && gl > gv ? "gana" : ""}">${local?.nombre || "-"}</span>
        <span class="pm-res">${finalizado ? `${p.goles_local} – ${p.goles_visitante}` : "vs"}</span>
        <span class="pm-eq ${finalizado && gv > gl ? "gana" : ""}">${visitante?.nombre || "-"}</span>
      </div>
    </div>
  `;
}

function formNuevoEquipo() {
  if (clubes.length === 0) {
    avisar("Primero debes crear un club");
    return;
  }

  contenido.innerHTML = `
    <h2>Nuevo equipo</h2>

    <label>Club</label>
    <select id="club">
      ${clubes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join("")}
    </select>

    <label>Nombre del equipo (opcional)</label>
    <input id="nombre" placeholder="Ej: BM Plasencia Infantil">

    <label>Categoría</label>
    <select id="categoria">
      <option>Infantil</option>
      <option>Cadete</option>
      <option>Juvenil</option>
    </select>

    <label>Género</label>
    <select id="genero">
      <option>Masculino</option>
      <option>Femenino</option>
    </select>

    <label>Grupo</label>
    <select id="grupo">
      <option>Grupo A</option>
      <option>Grupo B</option>
      <option>Grupo C</option>
      <option>Grupo D</option>
      <option>Grupo Único</option>
    </select>

    <button onclick="guardarNuevoEquipo()">Guardar equipo</button>
    <button class="volver" onclick="mostrarEquipos()">Volver</button>
  `;
}

async function guardarNuevoEquipo() {
  const equipo = {
    nombre: document.getElementById("nombre").value,
    categoria: document.getElementById("categoria").value,
    genero: document.getElementById("genero").value,
    grupo: document.getElementById("grupo").value,
    club_id: Number(document.getElementById("club").value)
  };

  await crearEquipoSupabase(equipo);

  // 🔄 Recargar equipos
  equipos = await obtenerEquiposSupabase();

  // 🟢 Asegurar fila en clasificación
  const equipoCreado = equipos.at(-1);
  await asegurarEquipoEnClasificacion(equipoCreado);

  mostrarCategorias();
}

function editarEquipo(id) {
  equipoActual = equipos.find(e => e.id === id);

  contenido.innerHTML = `
    <h2>Editar equipo</h2>

    <input id="nombre" value="${equipoActual.nombre}">

    <select id="categoria">
      <option ${equipoActual.categoria==="Infantil"?"selected":""}>Infantil</option>
      <option ${equipoActual.categoria==="Cadete"?"selected":""}>Cadete</option>
      <option ${equipoActual.categoria==="Juvenil"?"selected":""}>Juvenil</option>
    </select>

    <select id="genero">
      <option ${equipoActual.genero==="Masculino"?"selected":""}>Masculino</option>
      <option ${equipoActual.genero==="Femenino"?"selected":""}>Femenino</option>
    </select>

    <select id="grupo">
      <option ${equipoActual.grupo==="Grupo A"?"selected":""}>Grupo A</option>
      <option ${equipoActual.grupo==="Grupo B"?"selected":""}>Grupo B</option>
      <option ${equipoActual.grupo==="Grupo C"?"selected":""}>Grupo C</option>
      <option ${equipoActual.grupo==="Grupo D"?"selected":""}>Grupo D</option>
      <option ${equipoActual.grupo==="Grupo Único"?"selected":""}>Grupo Único</option>
    </select>

    <button onclick="guardarEdicionEquipo()">Guardar cambios</button>
    <button class="volver" onclick="mostrarEquipos()">Volver</button>
  `;
}

async function guardarEdicionEquipo() {
  // 🔴 estado anterior
  const equipoAntes = { ...equipoActual };

  // 🟢 nuevos valores
  const cambios = {
    nombre: document.getElementById("nombre").value,
    categoria: document.getElementById("categoria").value,
    genero: document.getElementById("genero").value,
    grupo: document.getElementById("grupo").value
  };

  // 1️⃣ actualizar equipo
  await editarEquipoSupabase(equipoActual.id, cambios);

  // 2️⃣ eliminar CUALQUIER clasificación previa del equipo
  await supabase
    .from("clasificacion")
    .delete()
    .eq("equipo_id", equipoActual.id)
    .eq("categoria", equipoAntes.categoria)
    .eq("genero", equipoAntes.genero);

  // 3️⃣ crear clasificación SOLO en su grupo actual
  await asegurarEquipoEnClasificacion({
    id: equipoActual.id,
    ...cambios
  });

  // 4️⃣ recargar equipos
  equipos = await obtenerEquiposSupabase();

  // 5️⃣ refrescar vistas
  mostrarCategorias();
  actualizarClasificacion();
}

async function borrarEquipo(id) {
  if (!confirm("¿Eliminar este equipo?")) return;

  await borrarEquipoSupabase(id);
  equipos = await obtenerEquiposSupabase();
  mostrarCategorias();
}

/* ================== CLASIFICACION ================== */
function mostrarClasificacion() {
  setNavActivoPorVista("tabla");
  registrarNavegacion("tabla");

  contenido.innerHTML = `
  <h2>Clasificación</h2>

  <div class="subfiltros">
      <select id="clas-cat" onchange="actualizarClasificacion()">
        <option>Infantil</option>
        <option>Cadete</option>
        <option>Juvenil</option>
      </select>

      <select id="clas-gen" onchange="actualizarClasificacion()">
        <option>Masculino</option>
        <option>Femenino</option>
      </select>

      <select id="clas-grp" onchange="actualizarClasificacion()">
        <option value="">Todos</option>
        <option>Grupo A</option>
        <option>Grupo B</option>
        <option>Grupo C</option>
        <option>Grupo D</option>
        <option>Grupo Único</option>
      </select>
    </div>

    <div id="tablaClasificacion"></div>
  `;

  actualizarClasificacion();
}

document.addEventListener("partido-finalizado", () => {
  actualizarClasificacion();
});

function renderTablaClasificacion(data, titulo) {
  let html = `
    <section class="clas-card">
      ${titulo ? `<header class="clas-cab"><h3>${titulo}</h3><span>${data.length} equipos</span></header>` : ""}
      <div class="clas-scroll">
      <table class="clas-tabla">
        <thead>
          <tr>
            <th class="c-pos" scope="col">#</th>
            <th class="c-eq" scope="col">Equipo</th>
            <th scope="col" title="Partidos jugados">PJ</th>
            <th scope="col" title="Partidos ganados">PG</th>
            <th scope="col" title="Partidos empatados">PE</th>
            <th scope="col" title="Partidos perdidos">PP</th>
            <th class="c-ext" scope="col" title="Goles a favor">GF</th>
            <th class="c-ext" scope="col" title="Goles en contra">GC</th>
            <th scope="col" title="Diferencia de goles">DG</th>
            <th class="c-pts" scope="col">Pts</th>
          </tr>
        </thead>
        <tbody>
  `;

  data.forEach((fila, index) => {
    const equipo = equipos.find(e => e.id === fila.equipo_id);
    const club = clubes.find(c => c.id === equipo?.club_id);
    const pos = index + 1;
    const dg = fila.gf - fila.gc;
    const claseDg = dg > 0 ? "dg-pos" : dg < 0 ? "dg-neg" : "";
    const textoDg = dg > 0 ? `+${dg}` : `${dg}`;
    const escudo = club?.escudo
      ? `<img src="${escaparHtml(club.escudo)}" class="clas-escudo" alt="" loading="lazy" decoding="async">`
      : `<span class="clas-escudo clas-escudo-vacio"></span>`;

    html += `
      <tr class="${pos === 1 ? "es-lider" : ""}">
        <td class="c-pos"><span class="pos-badge pos-${pos <= 3 ? pos : "n"}">${pos}</span></td>
        <td class="c-eq">
          <div class="clas-equipo">${escudo}<span>${escaparHtml(equipo?.nombre || "-")}</span></div>
        </td>
        <td>${fila.pj}</td>
        <td>${fila.pg}</td>
        <td>${fila.pe}</td>
        <td>${fila.pp}</td>
        <td class="c-ext">${fila.gf}</td>
        <td class="c-ext">${fila.gc}</td>
        <td class="${claseDg}">${textoDg}</td>
        <td class="c-pts"><span class="pts-pill">${fila.puntos}</span></td>
      </tr>
    `;
  });

  html += `</tbody></table></div></section>`;
  return html;
}

let ticketClasificacion = 0;

async function actualizarClasificacion() {
  const catEl = document.getElementById("clas-cat");
  const genEl = document.getElementById("clas-gen");
  const grpEl = document.getElementById("clas-grp");

  if (!catEl || !genEl || !grpEl) return;

  // si cambias de filtro rápido, solo cuenta la última consulta
  const ticket = ++ticketClasificacion;

  const zona = document.getElementById("tablaClasificacion");
  if (zona && !zona.firstChild) {
    zona.innerHTML = `<p class="estado-vacio">Cargando clasificación…</p>`;
  }

  const categoria = catEl.value;
  const genero = genEl.value;
  const grupoSeleccionado = grpEl.value;

  let query = supabase
    .from("clasificacion")
    .select("*")
    .eq("categoria", categoria)
    .eq("genero", genero)
    .order("puntos", { ascending: false });

  if (grupoSeleccionado) {
    query = query.eq("grupo", grupoSeleccionado);
  }

  const { data: filasBD, error } = await query;

  if (ticket !== ticketClasificacion) return;

  // Antes, si la consulta fallaba (sin cobertura), data era null y data.sort() rompía la pantalla
  if (error || !filasBD) {
    console.error(error);
    if (zona) {
      zona.innerHTML = `<p class="estado-vacio">No se pudo cargar la clasificación. Comprueba tu conexión.</p>`;
    }
    return;
  }

  const data = filasBD.map(f => ({ ...f, grupo: escaparHtml(f.grupo) }));

  data.sort((a, b) => {

  if (b.puntos !== a.puntos) {
    return b.puntos - a.puntos;
  }

  return compararEquipos(
    {
      id: a.equipo_id,
      gf: a.gf,
      gc: a.gc,
      puntos: a.puntos
    },
    {
      id: b.equipo_id,
      gf: b.gf,
      gc: b.gc,
      puntos: b.puntos
    },
    categoria,
    genero,
    grupoSeleccionado,
    partidos
  );

});
  
  let htmlFinal = "";

  // 🔥 CASO: TODOS LOS GRUPOS
  if (!grupoSeleccionado) {
    const grupos = [...new Set(data.map(d => d.grupo))].sort();

    grupos.forEach(nombreGrupo => {
      const datosGrupo = data.filter(d => d.grupo === nombreGrupo);

      datosGrupo.sort((a, b) => {

  if (b.puntos !== a.puntos) {
    return b.puntos - a.puntos;
  }

  return compararEquipos(
    {
      id: a.equipo_id,
      gf: a.gf,
      gc: a.gc,
      puntos: a.puntos
    },
    {
      id: b.equipo_id,
      gf: b.gf,
      gc: b.gc,
      puntos: b.puntos
    },
    categoria,
    genero,
    nombreGrupo,
    partidos
  );

});
      
      htmlFinal += renderTablaClasificacion(datosGrupo, nombreGrupo);
    });
  }
  // 🔵 CASO: UN SOLO GRUPO
  else {
    htmlFinal = renderTablaClasificacion(data, grupoSeleccionado);
  }

  if (!data.length) {
    htmlFinal = `<p class="estado-vacio">Todavía no hay clasificación para esta selección.</p>`;
  }

  if (zona) {
    zona.innerHTML = `
    <div class="clas-lista">
      ${htmlFinal}
    </div>
    ${data.length ? `<p class="clas-leyenda">PJ jugados · PG ganados · PE empatados · PP perdidos · DG diferencia de goles · Pts puntos</p>` : ""}
  `;
  }
}

async function guardarClasificacionSupabase(categoria, genero, grupo) {
  const clasificacion = calcularClasificacion(
    categoria,
    genero,
    grupo,
    equipos,
    partidos
  );

  // grupo sin equipos: no hay nada que guardar (y no se borra lo que hubiera)
  if (clasificacion.length === 0) return true;

  // Antes cada equipo se buscaba por NOMBRE; si dos categorías tenían un equipo con el
  // mismo nombre se podía guardar el id del equipo equivocado. Ahora se usa el id.
  const filas = clasificacion.map(e => ({
    categoria,
    genero,
    grupo,
    equipo_id: e.id,
    pj: e.pj,
    pg: e.pg,
    pe: e.pe,
    pp: e.pp,
    gf: e.gf,
    gc: e.gc,
    puntos: e.puntos
  }));

  // 1️⃣ borrar clasificación anterior de ese grupo
  const { error: errorBorrar } = await supabase
    .from("clasificacion")
    .delete()
    .eq("categoria", categoria)
    .eq("genero", genero)
    .eq("grupo", grupo);

  if (errorBorrar) {
    console.error("Error borrando clasificación:", errorBorrar);
    avisar("Error actualizando la clasificación");
    return false;
  }

  // 2️⃣ insertar la nueva
  const { error } = await supabase
    .from("clasificacion")
    .insert(filas);

  if (error) {
    console.error("Error guardando clasificación:", error);
    avisar("Error guardando la clasificación");
    return false;
  }

  return true;
}

function compararEquipos(a, b, categoria, genero, grupo, partidos) {

  // 1️⃣ PUNTOS
  if (b.puntos !== a.puntos) {
    return b.puntos - a.puntos;
  }

  // PARTIDOS ENTRE ELLOS
  const partidosEntreEllos = partidos.filter(p =>
    p.estado === "finalizado" &&
    p.categoria === categoria &&
    p.genero === genero &&
    p.grupo === grupo &&
    (
      (p.local_id === a.id && p.visitante_id === b.id) ||
      (p.local_id === b.id && p.visitante_id === a.id)
    )
  );

  let puntosA = 0;
  let puntosB = 0;

  let golesA = 0;
  let golesB = 0;

  let golesContraA = 0;
  let golesContraB = 0;

  partidosEntreEllos.forEach(p => {

    const esALocal = p.local_id === a.id;

    const golesAF = esALocal ? p.goles_local : p.goles_visitante;
    const golesAC = esALocal ? p.goles_visitante : p.goles_local;

    const esBLocal = p.local_id === b.id;

    const golesBF = esBLocal ? p.goles_local : p.goles_visitante;
    const golesBC = esBLocal ? p.goles_visitante : p.goles_local;

    golesA += golesAF;
    golesB += golesBF;

    golesContraA += golesAC;
    golesContraB += golesBC;

    if (golesAF > golesAC) puntosA += 2;
    else if (golesAF === golesAC) puntosA += 1;

    if (golesBF > golesBC) puntosB += 2;
    else if (golesBF === golesBC) puntosB += 1;

  });

  // 2️⃣ PUNTOS ENTRE ELLOS
  if (puntosB !== puntosA) {
    return puntosB - puntosA;
  }

  // 3️⃣ DIFERENCIA ENTRE ELLOS
  const diffA = golesA - golesContraA;
  const diffB = golesB - golesContraB;

  if (diffB !== diffA) {
    return diffB - diffA;
  }

  // 4️⃣ GOLES ENTRE ELLOS
  if (golesB !== golesA) {
    return golesB - golesA;
  }

  // 5️⃣ DIFERENCIA TOTAL
  const diffTotalA = a.gf - a.gc;
  const diffTotalB = b.gf - b.gc;

  if (diffTotalB !== diffTotalA) {
    return diffTotalB - diffTotalA;
  }

  // 6️⃣ GOLES TOTALES
  if (b.gf !== a.gf) {
    return b.gf - a.gf;
  }

  // 7️⃣ SI TODO IGUAL → NO CAMBIA
  return 0;
}

function calcularClasificacion(categoria, genero, grupo, equipos, partidos) {

  const equiposGrupo = equipos.filter(e =>
    e.categoria === categoria &&
    e.genero === genero &&
    e.grupo === grupo
  );

  // 1️⃣ calcular estadísticas base
  let tabla = equiposGrupo.map(eq => {

    const partidosEq = partidos.filter(p =>
      p.estado === "finalizado" &&
      p.categoria === categoria &&
      p.genero === genero &&
      p.grupo === grupo &&
      (p.local_id === eq.id || p.visitante_id === eq.id)
    );

    let pj = 0, pg = 0, pe = 0, pp = 0, gf = 0, gc = 0, puntos = 0;

    partidosEq.forEach(p => {

      pj++;

      const esLocal = p.local_id === eq.id;

      const golesF = esLocal ? p.goles_local : p.goles_visitante;
      const golesC = esLocal ? p.goles_visitante : p.goles_local;

      gf += golesF;
      gc += golesC;

      if (golesF > golesC) {
        pg++;
        puntos += 2;
      }

      else if (golesF === golesC) {
        pe++;
        puntos += 1;
      }

      else {
        pp++;
      }

    });

    return {
      id: eq.id,
      nombre: eq.nombre,
      pj,
      pg,
      pe,
      pp,
      gf,
      gc,
      puntos
    };

  });

  // 2️⃣ ordenar por puntos
  tabla.sort((a, b) => b.puntos - a.puntos);

  // 3️⃣ resolver empates por bloques
  let resultadoFinal = [];

  let i = 0;

  while (i < tabla.length) {

    let empatados = [tabla[i]];

    let j = i + 1;

    while (
      j < tabla.length &&
      tabla[j].puntos === tabla[i].puntos
    ) {
      empatados.push(tabla[j]);
      j++;
    }

    if (empatados.length === 1) {

      resultadoFinal.push(empatados[0]);

    } else {

      const resueltos =
        resolverEmpateMultiple(
          empatados,
          categoria,
          genero,
          grupo,
          partidos
        );

      resultadoFinal.push(...resueltos);

    }

    i = j;

  }

  return resultadoFinal;

}

function resolverEmpateMultiple(
  equiposEmpatados,
  categoria,
  genero,
  grupo,
  partidos
) {

  const ids = equiposEmpatados.map(e => e.id);

  const partidosEntreEllos = partidos.filter(p =>
    p.estado === "finalizado" &&
    p.categoria === categoria &&
    p.genero === genero &&
    p.grupo === grupo &&
    ids.includes(p.local_id) &&
    ids.includes(p.visitante_id)
  );

  let miniTabla = equiposEmpatados.map(eq => {

    let puntos = 0;
    let gf = 0;
    let gc = 0;

    partidosEntreEllos.forEach(p => {

      const esLocal = p.local_id === eq.id;

      const golesF =
        esLocal
          ? p.goles_local
          : p.goles_visitante;

      const golesC =
        esLocal
          ? p.goles_visitante
          : p.goles_local;

      if (
        p.local_id === eq.id ||
        p.visitante_id === eq.id
      ) {

        gf += golesF;
        gc += golesC;

        if (golesF > golesC)
          puntos += 2;

        else if (golesF === golesC)
          puntos += 1;

      }

    });

    return {
      ...eq,
      puntosEnfrentamientos: puntos,
      diffEnfrentamientos: gf - gc,
      golesEnfrentamientos: gf
    };

  });

  // ORDENAR POR CRITERIOS DEL REGLAMENTO
  miniTabla.sort((a, b) => {

    // 1️⃣ puntos entre ellos
    if (
      b.puntosEnfrentamientos !==
      a.puntosEnfrentamientos
    )
      return (
        b.puntosEnfrentamientos -
        a.puntosEnfrentamientos
      );

    // 2️⃣ diferencia entre ellos
    if (
      b.diffEnfrentamientos !==
      a.diffEnfrentamientos
    )
      return (
        b.diffEnfrentamientos -
        a.diffEnfrentamientos
      );

    // 3️⃣ goles entre ellos
    if (
      b.golesEnfrentamientos !==
      a.golesEnfrentamientos
    )
      return (
        b.golesEnfrentamientos -
        a.golesEnfrentamientos
      );

    // 4️⃣ diferencia total
    const diffTotalA =
      a.gf - a.gc;

    const diffTotalB =
      b.gf - b.gc;

    if (
      diffTotalB !== diffTotalA
    )
      return (
        diffTotalB -
        diffTotalA
      );

    // 5️⃣ goles totales
    if (b.gf !== a.gf)
      return b.gf - a.gf;

    return 0;

  });

  return miniTabla;

}

/* ================== EQUIPOS GRUPO ================== */
function mostrarEquipos() {
  setNavActivoPorVista("clubs");
  registrarNavegacion("clubs");

  let html = `<h2>Clubs Participantes</h2>`;

  if (adminActivo) {
    html += `
      <div class="clubs-admin">
        <button onclick="formNuevoClub()">Añadir club</button>
        <button onclick="formNuevoEquipo()">Añadir equipo</button>
      </div>
    `;
  }

  if (clubes.length === 0) {
    html += `<p class="estado-vacio">No hay clubes creados</p>`;
  } else {
    html += `
      <p class="pab-intro">${clubes.length} clubs · ${equipos.length} equipos. Toca un club para ver sus equipos.</p>
      <label class="clubs-buscar">
        ${ico("lupa", 18)}
        <input type="search" id="buscar-club" placeholder="Buscar club" autocomplete="off"
               aria-label="Buscar club" oninput="filtrarClubes()">
      </label>
      <div class="clubs-grid" id="clubs-grid">
        ${clubes.map(c => {
          const n = equipos.filter(e => e.club_id === c.id).length;
          return `
          <div class="club-card club-tile" role="button" tabindex="0" data-nombre="${escaparHtml(String(c.nombre || "").toLowerCase())}" onclick="verClub(${c.id})">
            <div class="club-tile-fila">
              <span class="club-tile-escudo"><img src="${escaparHtml(c.escudo || PLACEHOLDER_ESCUDO)}" alt="" loading="lazy" decoding="async"></span>
              <div class="club-tile-texto">
                <strong>${c.nombre}</strong>
                <span>${n} ${n === 1 ? "equipo" : "equipos"}</span>
              </div>
              <span class="cat-flecha" aria-hidden="true">${ico("derecha", 18)}</span>
            </div>
            ${adminActivo ? `
              <div class="club-acciones">
                <button onclick="event.stopPropagation(); editarClub(${c.id})">Editar</button>
                <button onclick="event.stopPropagation(); borrarClub(${c.id})">Borrar</button>
              </div>
            ` : ""}
          </div>`;
        }).join("")}
      </div>
      <p class="estado-vacio" id="clubs-sin-resultados" hidden>No hay clubs que coincidan.</p>
    `;
  }

  contenido.innerHTML = html;
}

function filtrarClubes() {
  const texto = (document.getElementById("buscar-club")?.value || "").trim().toLowerCase();
  let visibles = 0;
  document.querySelectorAll("#clubs-grid .club-tile").forEach(t => {
    const coincide = !texto || (t.dataset.nombre || "").includes(texto);
    t.hidden = !coincide;
    if (coincide) visibles++;
  });
  const vacio = document.getElementById("clubs-sin-resultados");
  if (vacio) vacio.hidden = visibles > 0;
}
window.filtrarClubes = filtrarClubes;

async function verClub(id) {
  const club = clubes.find(c => c.id === id);

  // el club puede haberse borrado desde otro dispositivo
  if (!club) {
    mostrarEquipos();
    return;
  }

  registrarNavegacion("club", { id });

  const equiposClub = await obtenerEquiposPorClub(id);

  let html = `
    <button class="volver volver-arriba" onclick="mostrarEquipos()">${ico("izquierda", 16)} Todos los clubs</button>
    <div class="club-hero">
      <span class="club-hero-escudo"><img src="${escaparHtml(club.escudo || PLACEHOLDER_ESCUDO)}" alt=""></span>
      <div>
        <h2>${club.nombre}</h2>
        <span class="pt-cuenta">${equiposClub.length} ${equiposClub.length === 1 ? "equipo" : "equipos"}</span>
      </div>
    </div>
    <h3 class="bloque-titulo">Equipos</h3>
  `;

  if (equiposClub.length === 0) {
    html += `<p class="estado-vacio">No hay equipos en este club</p>`;
  }

  equiposClub.forEach(e => {
  html += `
    <div class="team-ios-card team-clicable" data-cat="${e.categoria}" role="button" tabindex="0"
         aria-expanded="false" aria-controls="partidos-club-${e.id}"
         onclick="togglePartidosEquipoClub(${Number(e.id)}, this)">
      <div class="team-ios-header">
        <span class="team-cat">${e.categoria}</span>
        <span class="team-gen">${e.genero}</span>
      </div>

      <div class="team-name">
        ${e.nombre}
      </div>

      <div class="team-group">
        ${e.grupo}
      </div>

      <div class="team-ver-partidos">
        <span>Ver partidos</span>${ico("chev", 16)}
      </div>

      ${
        adminActivo ? `
          <div class="team-actions">
            <button onclick="event.stopPropagation(); editarEquipo(${e.id})">Editar</button>
            <button onclick="event.stopPropagation(); borrarEquipo(${e.id})">Borrar</button>
          </div>
        ` : ""
      }

      <div id="partidos-club-${e.id}" class="partidos-club oculto" onclick="event.stopPropagation()"></div>
    </div>
  `;
});

  contenido.innerHTML = html;
}

// Despliega, dentro del club, los partidos de un equipo: primero los que quedan y luego los jugados
function togglePartidosEquipoClub(idEquipo, tarjeta) {
  const panel = document.getElementById(`partidos-club-${idEquipo}`);
  if (!panel || !tarjeta) return;

  const abrir = panel.classList.contains("oculto");

  panel.classList.toggle("oculto", !abrir);
  tarjeta.setAttribute("aria-expanded", abrir ? "true" : "false");
  tarjeta.classList.toggle("abierto", abrir);

  if (!abrir) {
    panel.innerHTML = "";
    return;
  }

  const delEquipo = partidos.filter(p => p.local_id === idEquipo || p.visitante_id === idEquipo);

  const proximos = delEquipo
    .filter(p => calcularEstadoPartido(p) !== "finalizado")
    .sort((a, b) => marcaTiempo(a) - marcaTiempo(b));

  const finalizados = delEquipo
    .filter(p => calcularEstadoPartido(p) === "finalizado")
    .sort((a, b) => marcaTiempo(b) - marcaTiempo(a));

  panel.innerHTML = `
    <div class="bloque-partidos"><strong>Próximos partidos</strong></div>
    ${proximos.length
      ? proximos.map(p => renderMiniPartido(p)).join("")
      : `<p class="partido-vacio">No hay próximos partidos</p>`}

    <div class="bloque-partidos"><strong>Partidos finalizados</strong></div>
    ${finalizados.length
      ? finalizados.map(p => renderMiniPartido(p, true)).join("")
      : `<p class="partido-vacio">No hay partidos finalizados</p>`}
  `;
}
window.togglePartidosEquipoClub = togglePartidosEquipoClub;

function formNuevoClub() {
  contenido.innerHTML = `
    <h2>Nuevo club</h2>

    <label>Nombre del club</label>
    <input id="nombre">

    <label>Escudo</label>
    <input type="file" id="escudo" accept="image/*">

    <button onclick="guardarNuevoClub()">Guardar</button>
    <button class="volver" onclick="mostrarEquipos()">Volver</button>
  `;
}

// Lee la imagen del escudo y la reduce (máx. 192 px). Los escudos se guardan dentro de la
// tabla "clubes" y se descargan todos juntos al abrir la app: cuanto más ligeros, más rápido carga.
function leerEscudo(file, max = 192) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();

    lector.onerror = () => reject(lector.error);

    lector.onload = () => {
      const original = lector.result;
      const img = new Image();

      img.onerror = () => resolve(original); // no se puede decodificar: se guarda tal cual

      img.onload = () => {
        if (!img.width || !img.height) return resolve(original);

        const escala = Math.min(1, max / Math.max(img.width, img.height));

        if (escala === 1 && file.size < 60000) return resolve(original); // ya es pequeño

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * escala));
        canvas.height = Math.max(1, Math.round(img.height * escala));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

        let salida = canvas.toDataURL("image/webp", 0.85);
        if (!salida.startsWith("data:image/webp")) salida = canvas.toDataURL("image/png");

        resolve(salida.length < original.length ? salida : original);
      };

      img.src = original;
    };

    lector.readAsDataURL(file);
  });
}

async function guardarNuevoClub() {
  const nombre = document.getElementById("nombre").value.trim();
  const file = document.getElementById("escudo").files[0];

  if (!nombre || !file) {
    avisar("Nombre y escudo son obligatorios");
    return;
  }

  let escudo;

  try {
    escudo = await leerEscudo(file);
  } catch (e) {
    console.error(e);
    avisar("Error leyendo la imagen del escudo");
    return;
  }

  const { error } = await supabase
    .from("clubes")
    .insert({ nombre, escudo });

  if (error) {
    avisar("Error guardando club");
    console.error(error);
    return;
  }

  // 🔥 RECARGAR CLUBES CORRECTAMENTE
  clubes = await obtenerClubesSupabase();

  mostrarEquipos();
}

function editarClub(id) {
  const club = clubes.find(c => c.id === id);
  if (!club) return;

  contenido.innerHTML = `
    <h2>Editar club</h2>

    <label>Nombre</label>
    <input id="nombre" value="${club.nombre}">

    <label>Escudo</label>
    <input type="file" id="escudo" accept="image/*">

    <button onclick="guardarEdicionClub(${id})">Guardar cambios</button>
    <button class="volver" onclick="mostrarEquipos()">Volver</button>
  `;
}

async function guardarEdicionClub(id) {
  const club = clubes.find(c => c.id === id);
  if (!club) return;

  const cambios = {
    nombre: document.getElementById("nombre").value.trim()
  };

  const file = document.getElementById("escudo").files[0];

  if (file) {
    try {
      cambios.escudo = await leerEscudo(file);
    } catch (e) {
      console.error(e);
      avisar("Error leyendo la imagen del escudo");
      return;
    }
  }

  const { error } = await supabase
    .from("clubes")
    .update(cambios)
    .eq("id", id);

  if (error) {
    avisar("Error al editar club");
    console.error(error);
    return;
  }

  clubes = await obtenerClubesSupabase();
  mostrarEquipos();
}

async function borrarClub(id) {
  const club = clubes.find(c => c.id === id);
  if (!club) return;

  if (!confirm(`¿Eliminar el club "${textoPlano(club.nombre)}"?`)) return;

  const { error } = await supabase
    .from("clubes")
    .delete()
    .eq("id", id);

  clubes = await obtenerClubesSupabase();
  mostrarEquipos();
}

/* ================== PABELLONES ================== */
function mostrarPabellones() {
  setNavActivoPorVista("pabellones");
  registrarNavegacion("pabellones");

  const pabellones = [
  "Municipal",
  "Escuela",
  "Universitario",
  "Miralvalle",
  "San Calixto",
  "Multipista",
  "San Miguel"
];

  const contarPartidos = pabellon =>
    partidos.filter(p => p.pabellon === pabellon).length;

  const total = partidos.length;

  document.getElementById("contenido").innerHTML = `
    ${barraPabellones("pabellones")}
    <h2>Pabellones</h2>
    <p class="pab-intro">${pabellones.length} pabellones · ${total} partidos. Toca uno para ver su programación.</p>
    <div class="pab-grid">
      ${pabellones.map(p => {
        const n = contarPartidos(p);
        return `
        <div class="pab-card" role="button" tabindex="0"
             aria-label="Pabellón ${p}: ${n} partidos"
             onclick="mostrarPartidosPorPabellon('${p}')">
          <div class="pab-foto">
            <img src="${IMAGENES_PABELLONES[p]}" alt="" loading="lazy" decoding="async">
            <span class="pab-flecha" aria-hidden="true">${ico("derecha", 18)}</span>
          </div>
          <div class="pab-info">
            <div class="pab-texto">
              <strong class="pab-nombre">${p}</strong>
              <span class="pab-contador">${n} ${n === 1 ? "partido" : "partidos"}</span>
            </div>
          </div>
        </div>`;
      }).join("")}
    </div>
  `;
}



/* ================== PH RADAR (PABELLONES EN TIEMPO REAL) ================== */

// Posiciones sobre la foto aérea de Plasencia (en % de la imagen)
const POSICIONES_RADAR = {
  "Municipal":     [47.5, 15.5],
  "San Calixto":   [59.2, 31.2],
  "Multipista":    [87.0, 28.8],
  "Escuela":       [69.5, 37.5],
  "Miralvalle":    [68.0, 59.7],
  "Universitario": [56.4, 64.8],
  "San Miguel":    [9.6, 81.2]
};

const ESTADOS_RADAR = {
  en_juego:   { texto: "En juego",        color: "#5bd16a" },
  descanso:   { texto: "Descanso",        color: "#f0a53a" },
  proximo:    { texto: "Próximo",         color: "#5bb8f0" },
  finalizado: { texto: "Finalizado",      color: "#98a2b8" },
  sin:        { texto: "Sin partidos hoy", color: "#5d6a82" }
};

let radarSeleccion = "Municipal";
let radarCategoria = "todas";
let radarGenero = "todos";
let radarTimer = null;
let radarScroll = null;
let radarCentrar = false;

function barraPabellones(actual) {
  const items = [["pabellones", "Pabellones", "pabellon", "mostrarPabellones()"], ["radar", "PH Radar", "diana", "mostrarRadar()"]];
  return `
    <div class="zona-barra" role="tablist" aria-label="Pabellones">
      ${items.map(([id, nombre, icono, fn]) => `
        <button type="button" role="tab" class="${id === actual ? "activo" : ""}" aria-selected="${id === actual}" onclick="${fn}">${ico(icono, 18)}<span>${nombre}</span></button>`).join("")}
    </div>`;
}

function partidosRadarDe(pabellon) {
  const hoy = hoyISO();
  return partidos
    .filter(p => p.pabellon === pabellon && p.fecha === hoy)
    .filter(p => radarCategoria === "todas" || p.categoria === radarCategoria)
    .filter(p => radarGenero === "todos" || p.genero === radarGenero)
    .sort((a, b) => marcaTiempo(a) - marcaTiempo(b));
}

function estadoRadar(lista) {
  if (!lista.length) return "sin";
  const estados = lista.map(calcularEstadoPartido);
  if (estados.includes("en_juego")) return "en_juego";
  const hayPend = estados.includes("pendiente");
  const hayFin = estados.includes("finalizado");
  if (hayPend) return hayFin ? "descanso" : "proximo";
  return "finalizado";
}

function nombreEquipoRadar(id) {
  return equipos.find(e => e.id === id)?.nombre || "-";
}

function lineaPartidoRadar(p, conMarcador) {
  const marcador = conMarcador
    ? `<b class="rd-marc">${p.goles_local ?? 0} – ${p.goles_visitante ?? 0}</b>`
    : `<b class="rd-marc rd-hora">${formatearHora(p.hora)}</b>`;
  return `
    <div class="rd-partido">
      <span class="rd-eq">${nombreEquipoRadar(p.local_id)}</span>${marcador}<span class="rd-eq der">${nombreEquipoRadar(p.visitante_id)}</span>
      <small>${p.categoria} · ${p.genero}</small>
    </div>`;
}

function fichaRadar(pabellon) {
  const lista = partidosRadarDe(pabellon);
  const clave = estadoRadar(lista);
  const est = ESTADOS_RADAR[clave];
  const enJuego = lista.filter(p => calcularEstadoPartido(p) === "en_juego");
  const proximos = lista.filter(p => calcularEstadoPartido(p) === "pendiente");
  const ultimos = lista.filter(p => calcularEstadoPartido(p) === "finalizado");

  let cuerpo = "";
  if (enJuego.length) cuerpo += `<h4>Ahora</h4>${enJuego.map(p => lineaPartidoRadar(p, true)).join("")}`;
  if (proximos.length) cuerpo += `<h4>Próximo encuentro</h4>${lineaPartidoRadar(proximos[0], false)}`;
  if (!enJuego.length && ultimos.length) cuerpo += `<h4>Último resultado</h4>${lineaPartidoRadar(ultimos[ultimos.length - 1], true)}`;
  if (!cuerpo) cuerpo = `<p class="rd-nada">No hay partidos hoy con estos filtros.</p>`;

  const directo = DIRECTOS_PABELLONES[pabellon] && enJuego.length
    ? `<a class="rd-enlace" href="${DIRECTOS_PABELLONES[pabellon]}" target="_blank" rel="noopener noreferrer">Ver directo</a>` : "";

  return `
    <section class="rd-ficha">
      <div class="rd-ficha-cab"><h3>${pabellon}</h3><span class="rd-pill" style="--c:${est.color}">${est.texto}</span></div>
      ${cuerpo}
      <div class="rd-acciones">
        <a class="rd-enlace" href="${UBICACIONES_PABELLONES[pabellon] || "#"}" target="_blank" rel="noopener noreferrer">Cómo llegar</a>
        <button type="button" class="rd-enlace" onclick="mostrarPartidosPorPabellon('${pabellon}')">Ver programación</button>
        ${directo}
      </div>
    </section>`;
}

function pintarRadar() {
  if (vistaActual !== "radar") return;
  const viejo = document.getElementById("rd-scroll");
  if (viejo) radarScroll = viejo.scrollLeft;

  const estados = Object.fromEntries(LISTA_PABELLONES.map(p => [p, estadoRadar(partidosRadarDe(p))]));
  const cats = [["todas", "Todas"], ["Infantil", "Infantil"], ["Cadete", "Cadete"], ["Juvenil", "Juvenil"]];
  const gens = [["todos", "Todos"], ["Masculino", "Masculino"], ["Femenino", "Femenino"]];
  const chips = (lista, actual, fn) => lista.map(([id, nombre]) =>
    `<button type="button" class="hl-chip ${actual === id ? "activo" : ""}" aria-pressed="${actual === id}" onclick="${fn}('${id}')">${nombre}</button>`).join("");

  contenido.innerHTML = `
    ${barraPabellones("radar")}
    <div class="rd-panel">
      <div class="rd-cab">
        <div><h2>PH RADAR</h2><p>El torneo en tiempo real</p></div>
        <span class="rd-live"><i></i>LIVE</span>
      </div>
      <div class="rd-mapa-scroll" id="rd-scroll"><div class="rd-mapa" role="group" aria-label="Mapa de pabellones">
        ${LISTA_PABELLONES.map(p => {
          const [x, y] = POSICIONES_RADAR[p] || [50, 50];
          const e = ESTADOS_RADAR[estados[p]];
          return `<button type="button" class="rd-punto ${radarSeleccion === p ? "sel" : ""} ${estados[p]}" style="left:${x}%;top:${y}%;--c:${e.color}"
            aria-label="${p}: ${e.texto}" aria-pressed="${radarSeleccion === p}" onclick="radarElegir('${p}')"><i></i><span>${p}</span></button>`;
        }).join("")}
      </div></div>
      <p class="rd-nota">Desliza el mapa para ver toda la ciudad. Pulsa "Cómo llegar" para la ruta.</p>
      <div class="rd-leyenda">${["en_juego", "descanso", "proximo", "finalizado"].map(k => `<span><i style="background:${ESTADOS_RADAR[k].color}"></i>${ESTADOS_RADAR[k].texto}</span>`).join("")}</div>
      <div class="rd-filtros"><div class="hl-filtros" role="group" aria-label="Categoría">${chips(cats, radarCategoria, "radarCategoriaElegir")}</div>
      <div class="hl-filtros" role="group" aria-label="Género">${chips(gens, radarGenero, "radarGeneroElegir")}</div></div>
      <h3 class="rd-sub">Seleccionar pabellón</h3>
      <div class="rd-lista">
        ${LISTA_PABELLONES.map(p => `
          <button type="button" class="rd-item ${radarSeleccion === p ? "sel" : ""}" onclick="radarElegir('${p}')">
            <strong><i style="background:${ESTADOS_RADAR[estados[p]].color}"></i>${p}</strong><small>${ESTADOS_RADAR[estados[p]].texto}</small>
          </button>`).join("")}
      </div>
      ${fichaRadar(radarSeleccion)}
    </div>`;

  // conserva el desplazamiento del mapa al refrescar; la primera vez lo centra
  const sc = document.getElementById("rd-scroll");
  if (sc) sc.scrollLeft = radarScroll !== null ? radarScroll : (sc.scrollWidth - sc.clientWidth) * 0.45;
  if (sc) sc.addEventListener("scroll", () => { radarScroll = sc.scrollLeft; }, { passive: true });

  // al elegir un pabellón el mapa se desliza hasta él
  if (sc && radarCentrar) {
    radarCentrar = false;
    const x = (POSICIONES_RADAR[radarSeleccion] || [50])[0] / 100 * sc.firstElementChild.offsetWidth;
    const destino = Math.max(0, Math.min(sc.scrollWidth - sc.clientWidth, x - sc.clientWidth / 2));
    sc.scrollTo({ left: destino, behavior: "smooth" });
  }
}

function mostrarRadar() {
  setNavActivoPorVista("radar");
  registrarNavegacion("radar");
  if (!LISTA_PABELLONES.includes(radarSeleccion)) radarSeleccion = LISTA_PABELLONES[0];
  pintarRadar();

  // se refresca solo mientras se ve el radar
  clearInterval(radarTimer);
  radarTimer = setInterval(() => {
    if (vistaActual !== "radar") { clearInterval(radarTimer); return; }
    pintarRadar();
  }, 30000);
}

function radarElegir(p) { radarSeleccion = p; radarCentrar = true; pintarRadar(); }
function radarCategoriaElegir(c) { radarCategoria = c; pintarRadar(); }
function radarGeneroElegir(g) { radarGenero = g; pintarRadar(); }

window.mostrarRadar = mostrarRadar;
window.radarElegir = radarElegir;
window.radarCategoriaElegir = radarCategoriaElegir;
window.radarGeneroElegir = radarGeneroElegir;

/* ================== TIENDA (SUPABASE) ================== */

let productos = [];
let tiendaCargada = false;

const FORMATO_EUROS = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

async function cargarProductos() {
  const { data, error } = await supabase
    .from("productos")
    .select("id,nombre,descripcion,precio,imagen,disponible")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando productos:", error);
    return false;
  }

  productos = data || [];
  tiendaCargada = true;
  return true;
}

function tarjetaProducto(p) {
  const nombre = escaparHtml(p.nombre);
  const imagen = escaparHtml(urlSegura(p.imagen));
  const agotado = p.disponible === false;

  return `
    <article class="producto-card ${agotado ? "agotado" : ""}">
      <div class="producto-foto">
        ${imagen
          ? `<img src="${imagen}" alt="${nombre}" width="400" height="400" loading="lazy" decoding="async">`
          : `<span class="producto-sin-foto">${ico("bolsa", 40)}</span>`}
        ${agotado ? `<span class="producto-agotado">Agotado</span>` : ""}
      </div>

      <div class="producto-info">
        <div class="producto-nombre">${nombre}</div>
        ${p.descripcion ? `<p class="producto-desc">${escaparHtml(p.descripcion)}</p>` : ""}
        <div class="producto-precio">${FORMATO_EUROS.format(Number(p.precio) || 0)}</div>
      </div>

      ${adminActivo ? `
        <div class="producto-admin">
          <button type="button" class="secundario" onclick="editarProducto(${Number(p.id)})">Editar</button>
          <button type="button" class="peligro" onclick="borrarProducto(${Number(p.id)})">Eliminar</button>
        </div>` : ""}
    </article>
  `;
}

async function mostrarTienda() {
  setNavActivoPorVista("tienda");
  registrarNavegacion("tienda");

  const pintar = (cuerpo) => {
    if (vistaActual !== "tienda") return;
    contenido.innerHTML = `
      ${barraZona("tienda")}
      <h2>Tienda del torneo</h2>
      <p class="tienda-intro">Productos oficiales a la venta en el <strong>Pabellón Municipal</strong> durante el torneo.</p>
      ${adminActivo ? `<button type="button" class="tienda-nuevo" onclick="formNuevoProducto()">Añadir producto</button>` : ""}
      ${cuerpo}
    `;
  };

  if (!tiendaCargada) {
    pintar(`<div class="tienda-vacia">Cargando productos…</div>`);
    const ok = await cargarProductos();
    if (!ok) {
      pintar(`<div class="tienda-vacia">No se han podido cargar los productos. Comprueba tu conexión e inténtalo de nuevo.</div>`);
      return;
    }
  }

  if (!productos.length) {
    pintar(`<div class="tienda-vacia">${ico("bolsa", 36)}<strong>Muy pronto</strong><span>Aquí verás los productos del torneo.</span></div>`);
    return;
  }

  pintar(`<div class="productos-grid">${productos.map(tarjetaProducto).join("")}</div>`);
}

// El PIN solo está en memoria: si la sesión de administrador venía guardada, se vuelve a pedir una vez
function obtenerPinAdmin() {
  if (pinAdmin) return pinAdmin;
  const pin = prompt("Introduce el PIN de administrador para guardar los cambios:");
  if (pin) pinAdmin = pin.trim();
  return pinAdmin;
}

function mensajeErrorProducto(error) {
  if (error && (error.code === "42501" || /PIN/i.test(error.message || ""))) {
    pinAdmin = null;
    return "PIN de administrador no válido";
  }
  return "No se ha podido guardar el cambio";
}

// Reduce la foto antes de subirla: un móvil genera 4-8 MB y en la tienda basta con 900 px
function reducirImagen(file, max = 900, calidad = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const escala = Math.min(1, max / Math.max(img.width, img.height));
      const lienzo = document.createElement("canvas");
      lienzo.width = Math.round(img.width * escala);
      lienzo.height = Math.round(img.height * escala);
      lienzo.getContext("2d").drawImage(img, 0, 0, lienzo.width, lienzo.height);
      lienzo.toBlob(b => b ? resolve(b) : reject(new Error("No se pudo procesar la imagen")), "image/jpeg", calidad);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Imagen no válida")); };
    img.src = url;
  });
}

function formularioProducto(p) {
  const editando = !!p;
  return `
    <div class="form-producto">
    <h2>${editando ? "Editar producto" : "Nuevo producto"}</h2>

    <label for="prod-nombre">Nombre</label>
    <input id="prod-nombre" maxlength="80" value="${editando ? escaparHtml(p.nombre) : ""}">

    <label for="prod-desc">Descripción (opcional)</label>
    <textarea id="prod-desc" rows="3" maxlength="400">${editando ? escaparHtml(p.descripcion || "") : ""}</textarea>

    <label for="prod-precio">Precio (€)</label>
    <input id="prod-precio" type="number" inputmode="decimal" min="0" step="0.01" value="${editando ? Number(p.precio) : ""}">

    ${editando ? `
      <label class="check-linea"><input id="prod-disponible" type="checkbox" ${p.disponible === false ? "" : "checked"}> Disponible (desmarca si se agota)</label>
    ` : `
      <label for="prod-foto">Foto</label>
      <input id="prod-foto" type="file" accept="image/*">
    `}

    <button type="button" id="prod-guardar" onclick="${editando ? `guardarEdicionProducto(${Number(p.id)})` : "guardarNuevoProducto()"}">Guardar</button>
    <button type="button" class="volver" onclick="mostrarTienda()">Cancelar</button>
    </div>
  `;
}

function formNuevoProducto() {
  if (!adminActivo) return;
  contenido.innerHTML = formularioProducto(null);
}

function editarProducto(id) {
  if (!adminActivo) return;
  const p = productos.find(x => Number(x.id) === Number(id));
  if (!p) return;
  contenido.innerHTML = formularioProducto(p);
}

function leerFormularioProducto() {
  const nombre = document.getElementById("prod-nombre").value.trim();
  const descripcion = document.getElementById("prod-desc").value.trim();
  const precio = parseFloat(String(document.getElementById("prod-precio").value).replace(",", "."));

  if (!nombre) { avisar("Escribe el nombre del producto", "error"); return null; }
  if (!isFinite(precio) || precio < 0) { avisar("Escribe un precio válido", "error"); return null; }

  return { nombre, descripcion, precio: Math.round(precio * 100) / 100 };
}

async function guardarNuevoProducto() {
  if (!adminActivo) return;

  const datos = leerFormularioProducto();
  if (!datos) return;

  const archivo = document.getElementById("prod-foto").files[0];
  if (!archivo) { avisar("Elige una foto del producto", "error"); return; }

  const pin = obtenerPinAdmin();
  if (!pin) return;

  const boton = document.getElementById("prod-guardar");
  boton.disabled = true;
  boton.textContent = "Guardando…";

  let nombreArchivo = null;

  try {
    const foto = await reducirImagen(archivo);
    nombreArchivo = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

    const { error: errorSubida } = await supabase.storage
      .from("productos")
      .upload(nombreArchivo, foto, { contentType: "image/jpeg", cacheControl: "31536000" });

    if (errorSubida) throw errorSubida;

    const { data } = supabase.storage.from("productos").getPublicUrl(nombreArchivo);

    const { error } = await supabase.rpc("producto_crear", {
      p_pin: pin,
      p_nombre: datos.nombre,
      p_descripcion: datos.descripcion,
      p_precio: datos.precio,
      p_imagen: data.publicUrl
    });

    if (error) throw error;
  } catch (error) {
    console.error("Error guardando producto:", error);

    // si falló el alta no se deja la foto huérfana en el almacenamiento
    if (nombreArchivo) supabase.storage.from("productos").remove([nombreArchivo]).catch(() => {});

    avisar(mensajeErrorProducto(error), "error");
    boton.disabled = false;
    boton.textContent = "Guardar";
    return;
  }

  avisar("Producto añadido");
  tiendaCargada = false;
  mostrarTienda();
}

async function guardarEdicionProducto(id) {
  if (!adminActivo) return;

  const datos = leerFormularioProducto();
  if (!datos) return;

  const pin = obtenerPinAdmin();
  if (!pin) return;

  const { error } = await supabase.rpc("producto_actualizar", {
    p_pin: pin,
    p_id: id,
    p_nombre: datos.nombre,
    p_descripcion: datos.descripcion,
    p_precio: datos.precio,
    p_disponible: document.getElementById("prod-disponible").checked
  });

  if (error) {
    console.error("Error actualizando producto:", error);
    avisar(mensajeErrorProducto(error), "error");
    return;
  }

  avisar("Producto actualizado");
  tiendaCargada = false;
  mostrarTienda();
}

async function borrarProducto(id) {
  if (!adminActivo) return;

  const p = productos.find(x => Number(x.id) === Number(id));
  if (!confirm(`¿Eliminar "${p ? p.nombre : "este producto"}"?`)) return;

  const pin = obtenerPinAdmin();
  if (!pin) return;

  const { data: imagen, error } = await supabase.rpc("producto_borrar", { p_pin: pin, p_id: id });

  if (error) {
    console.error("Error borrando producto:", error);
    avisar(mensajeErrorProducto(error), "error");
    return;
  }

  if (imagen) {
    const archivo = String(imagen).split("/").pop();
    supabase.storage.from("productos").remove([archivo]).catch(() => {});
  }

  avisar("Producto eliminado");
  tiendaCargada = false;
  mostrarTienda();
}


/* ================== PH HIGHLIGHTS (LOS MEJORES MOMENTOS) ================== */

const TIPOS_HIGHLIGHT = [
  { id: "gol",     plural: "Goles",    singular: "Gol",     icono: "diana" },
  { id: "defensa", plural: "Defensas", singular: "Defensa", icono: "escudo" },
  { id: "parada",  plural: "Paradas",  singular: "Parada",  icono: "mano" },
  { id: "penalti", plural: "Penaltis", singular: "Penalti", icono: "diana" },
  { id: "jugada",  plural: "Jugadas",  singular: "Jugada",  icono: "rayo" },
  { id: "momento", plural: "Momentos", singular: "Momento", icono: "claqueta" }
];

const HL_MAX_MB = 50;
const HL_MAX_SEGUNDOS = 60;
const HL_POR_PAGINA = 8;
const HL_MIN_VOTOS_DESTACADO = 3;

let highlights = [];
let highlightsPendientes = [];
let highlightsCargados = false;
let hlFiltro = "todos";
let hlOrden = "mejores";
let hlLimite = HL_POR_PAGINA;

// Identificador anónimo de este móvil: sirve para limitar a un voto por vídeo
function idDispositivo() {
  let id = lsGet("ph_device");
  if (!id || id.length < 8) {
    id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `d${Date.now()}${Math.random().toString(36).slice(2, 12)}`;
    lsSet("ph_device", id);
  }
  return id;
}

function misVotosHighlights() {
  try { return JSON.parse(lsGet("ph_votos") || "{}") || {}; } catch (e) { return {}; }
}

function guardarVotoLocal(id, n) {
  const v = misVotosHighlights();
  v[id] = n;
  lsSet("ph_votos", JSON.stringify(v));
}

function tipoHighlight(id) {
  return TIPOS_HIGHLIGHT.find(t => t.id === id) || TIPOS_HIGHLIGHT[5];
}

function mediaHighlight(h) {
  return h.votos > 0 ? h.suma / h.votos : 0;
}

function textoMedia(h) {
  if (!h.votos) return "";
  const lang = document.documentElement.lang || "es";
  return new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(mediaHighlight(h));
}

function textoValoraciones(n) {
  return n ? `${n} ${n === 1 ? "valoración" : "valoraciones"}` : "Sin valoraciones";
}

async function cargarHighlights() {
  const { data, error } = await supabase
    .from("highlights")
    .select("id,tipo,categoria,club,descripcion,video_url,votos,suma,creado,autor_device")
    .order("creado", { ascending: false })
    .limit(300);

  if (error) {
    console.error("Error cargando highlights:", error);
    return false;
  }

  highlights = data || [];
  highlightsCargados = true;
  return true;
}

async function cargarPendientesHighlights() {
  highlightsPendientes = [];
  if (!adminActivo) return;

  const pin = obtenerPinAdmin();
  if (!pin) return;

  const { data, error } = await supabase.rpc("highlight_pendientes", { p_pin: pin });
  if (error) {
    console.error("Error cargando pendientes:", error);
    if (error.code === "42501") pinAdmin = null;
    return;
  }
  highlightsPendientes = data || [];
}

function estrellasHighlight(h) {
  const mio = Number(misVotosHighlights()[h.id]) || 0;
  const propio = h.autor_device && h.autor_device === idDispositivo();
  return Array.from({ length: 5 }, (_, i) => {
    const n = i + 1;
    return `<button type="button" class="hl-estrella ${n <= mio ? "llena" : ""} ${propio ? "propio" : ""}" ${propio ? 'aria-disabled="true"' : ""}
      aria-label="Valorar con ${n} ${n === 1 ? "estrella" : "estrellas"}" onclick="hlValorar(${Number(h.id)}, ${n})">${ico("estrella", 26)}</button>`;
  }).join("");
}

function cabeceraMediaHighlight(h) {
  const media = textoMedia(h);
  return `
    <span class="hl-nota">${ico("estrella", 16)}<strong>${media || "–"}</strong></span>
    <span class="hl-votos">${textoValoraciones(h.votos)}</span>`;
}

function tarjetaHighlight(h, opciones = {}) {
  const tipo = tipoHighlight(h.tipo);
  const url = escaparHtml(urlSegura(h.video_url));
  const pendiente = !!opciones.pendiente;

  return `
    <article class="hl-card ${opciones.destacado ? "destacado" : ""}" data-hl-id="${Number(h.id)}">
      <div class="hl-video">
        <video controls playsinline preload="metadata" src="${url}#t=0.1" aria-label="${escaparHtml(h.descripcion)}"></video>
        ${opciones.destacado ? `<span class="hl-insignia">${ico("estrella", 14)}Destacado</span>` : ""}
      </div>

      <div class="hl-cuerpo">
        <div class="hl-meta">
          <span class="hl-tipo">${ico(tipo.icono, 15)}${tipo.singular}</span>
          <span class="hl-quien">${escaparHtml(h.categoria)}${h.club ? ` · ${escaparHtml(h.club)}` : ""}</span>
        </div>

        <p class="hl-desc">${escaparHtml(h.descripcion)}</p>

        ${pendiente ? `
          <div class="hl-admin">
            <button type="button" class="hl-btn primario" onclick="hlModerar(${Number(h.id)}, 'aprobado')">Aprobar</button>
            <button type="button" class="hl-btn peligro" onclick="hlModerar(${Number(h.id)}, 'eliminado')">Eliminar</button>
          </div>
        ` : `
          <div class="hl-valoracion">
            <div class="hl-resumen">${cabeceraMediaHighlight(h)}</div>
            <div class="hl-estrellas" role="group" aria-label="Valora este momento">${estrellasHighlight(h)}</div>
          </div>
          <div class="hl-pie">
            <button type="button" class="hl-enlace" onclick="hlReportar(${Number(h.id)})">${ico("bandera", 14)}Reportar vídeo</button>
            ${adminActivo ? `<button type="button" class="hl-enlace peligro" onclick="hlModerar(${Number(h.id)}, 'eliminado')">Eliminar</button>` : ""}
          </div>
        `}
      </div>
    </article>`;
}

function listaFiltradaHighlights() {
  let lista = highlights.filter(h => hlFiltro === "todos" || h.tipo === hlFiltro);

  if (hlOrden === "mejores") {
    lista = [...lista].sort((a, b) =>
      (mediaHighlight(b) - mediaHighlight(a)) || (b.votos - a.votos) || (new Date(b.creado) - new Date(a.creado)));
  } else {
    lista = [...lista].sort((a, b) => new Date(b.creado) - new Date(a.creado));
  }

  return lista;
}

function pintarHighlights() {
  if (vistaActual !== "highlights") return;

  const filtros = [{ id: "todos", plural: "Todos", icono: "" }, ...TIPOS_HIGHLIGHT]
    .map(t => `<button type="button" class="hl-chip ${hlFiltro === t.id ? "activo" : ""}" aria-pressed="${hlFiltro === t.id}"
      onclick="hlFiltrar('${t.id}')">${t.icono ? ico(t.icono, 15) : ""}${t.plural}</button>`).join("");

  const lista = listaFiltradaHighlights();
  let destacado = null;
  let resto = lista;

  if (hlOrden === "mejores" && hlFiltro === "todos") {
    const candidato = lista[0];
    if (candidato && candidato.votos >= HL_MIN_VOTOS_DESTACADO) {
      destacado = candidato;
      resto = lista.slice(1);
    }
  }

  const visibles = resto.slice(0, hlLimite);

  let cuerpo = "";
  if (!highlights.length) {
    cuerpo = `<div class="estado-vacio">${ico("claqueta", 36)}<strong>Todavía no hay vídeos</strong><span>Sé el primero en subir un momento del torneo.</span></div>`;
  } else if (!lista.length) {
    cuerpo = `<div class="estado-vacio">${ico("claqueta", 36)}<strong>No hay vídeos de este tipo todavía</strong></div>`;
  } else {
    cuerpo = `
      ${destacado ? tarjetaHighlight(destacado, { destacado: true }) : ""}
      <div class="hl-lista">${visibles.map(h => tarjetaHighlight(h)).join("")}</div>
      ${resto.length > visibles.length ? `<button type="button" class="hl-mas" onclick="hlMas()">Ver más vídeos</button>` : ""}`;
  }

  const pendientes = highlightsPendientes.length ? `
    <section class="hl-pendientes">
      <h3>Pendientes de revisión <span class="pt-cuenta">${highlightsPendientes.length}</span></h3>
      <div class="hl-lista">${highlightsPendientes.map(h => tarjetaHighlight(h, { pendiente: true })).join("")}</div>
    </section>` : "";

  contenido.innerHTML = `
    ${barraZona("highlights")}
    <div class="hl-cab">
      <h2>PH Highlights</h2>
      <p class="pab-intro">Goles, paradas y jugadas subidos por jugadores y entrenadores. ¡Valora tus favoritos con estrellas!</p>
      <button type="button" class="hl-subir" onclick="formSubirHighlight()">${ico("subir", 20)}Subir mi momento</button>
    </div>

    ${pendientes}

    <div class="hl-filtros" role="group" aria-label="Tipo de momento">${filtros}</div>

    <div class="hl-orden" role="group" aria-label="Orden">
      <button type="button" class="${hlOrden === "mejores" ? "activo" : ""}" onclick="hlOrdenar('mejores')">Mejor valorados</button>
      <button type="button" class="${hlOrden === "recientes" ? "activo" : ""}" onclick="hlOrdenar('recientes')">Más recientes</button>
    </div>

    ${cuerpo}
  `;

  // solo suena un vídeo a la vez
  contenido.querySelectorAll("video").forEach(v => {
    v.addEventListener("play", () => {
      contenido.querySelectorAll("video").forEach(o => { if (o !== v) o.pause(); });
    });
  });
}

async function mostrarHighlights() {
  setNavActivoPorVista("highlights");
  registrarNavegacion("highlights");

  hlLimite = HL_POR_PAGINA;

  if (!highlightsCargados) {
    contenido.innerHTML = `
      ${barraZona("highlights")}<div class="hl-cab"><h2>PH Highlights</h2></div>
      <div class="estado-vacio">Cargando vídeos…</div>`;

    const ok = await cargarHighlights();
    if (vistaActual !== "highlights") return;
    if (!ok) {
      contenido.innerHTML = `
        ${barraZona("highlights")}<div class="hl-cab"><h2>PH Highlights</h2></div>
        <div class="estado-vacio"><strong>No se han podido cargar los vídeos. Comprueba tu conexión e inténtalo de nuevo.</strong>
        <button type="button" class="hl-subir" onclick="mostrarHighlights()">Reintentar</button></div>`;
      return;
    }
  }

  pintarHighlights();

  // los vídeos se refrescan en segundo plano para ver valoraciones nuevas
  if (adminActivo) {
    await cargarPendientesHighlights();
    pintarHighlights();
  }
}

function hlFiltrar(id) { hlFiltro = id; hlLimite = HL_POR_PAGINA; pintarHighlights(); }
function hlOrdenar(o) { hlOrden = o; hlLimite = HL_POR_PAGINA; pintarHighlights(); }
function hlMas() { hlLimite += HL_POR_PAGINA; pintarHighlights(); }

async function hlValorar(id, n) {
  const h = highlights.find(x => Number(x.id) === Number(id));
  if (!h) return;

  if (h.autor_device && h.autor_device === idDispositivo()) {
    avisar("No puedes valorar tu propio vídeo", "error");
    return;
  }

  const anterior = Number(misVotosHighlights()[id]) || 0;
  if (anterior === n) return;

  // las estrellas se pintan al instante; si falla, se restauran
  const grupo = contenido.querySelector(`.hl-card[data-hl-id="${Number(id)}"] .hl-estrellas`);
  const pintarEstrellas = v => grupo && grupo.querySelectorAll(".hl-estrella").forEach((b, i) => b.classList.toggle("llena", i < v));
  pintarEstrellas(n);

  const { data, error } = await supabase.rpc("highlight_valorar", {
    p_id: id, p_device: idDispositivo(), p_estrellas: n
  });

  if (error) {
    console.error("Error valorando:", error);
    pintarEstrellas(anterior);
    avisar(/propio/i.test(error.message || "") ? "No puedes valorar tu propio vídeo" : "No se ha podido guardar la valoración", "error");
    return;
  }

  const fila = Array.isArray(data) ? data[0] : data;
  if (fila) { h.votos = Number(fila.votos); h.suma = Number(fila.suma); }
  guardarVotoLocal(id, n);

  // se actualiza solo esa tarjeta para no cortar el vídeo que se está viendo
  const tarjeta = contenido.querySelector(`.hl-card[data-hl-id="${Number(id)}"]`);
  if (tarjeta) {
    tarjeta.querySelector(".hl-resumen").innerHTML = cabeceraMediaHighlight(h);
    tarjeta.querySelector(".hl-estrellas").innerHTML = estrellasHighlight(h);
  }
  avisar("Valoración guardada");
}

async function hlReportar(id) {
  if (!confirm("¿Reportar este vídeo?")) return;

  const { error } = await supabase.rpc("highlight_reportar", { p_id: id, p_device: idDispositivo() });
  if (error) {
    console.error("Error reportando:", error);
    avisar("No se ha podido enviar el aviso", "error");
    return;
  }
  avisar("Gracias por avisar. Lo revisaremos.");
}

async function hlModerar(id, estado) {
  if (!adminActivo) return;
  if (estado === "eliminado" && !confirm("¿Eliminar este vídeo?")) return;

  const pin = obtenerPinAdmin();
  if (!pin) return;

  const { error } = await supabase.rpc("highlight_moderar", { p_pin: pin, p_id: id, p_estado: estado });
  if (error) {
    console.error("Error moderando:", error);
    avisar(mensajeErrorProducto(error), "error");
    return;
  }

  avisar(estado === "aprobado" ? "Vídeo aprobado" : "Vídeo eliminado");
  highlightsCargados = false;
  mostrarHighlights();
}

/* ---- subida ---- */

async function formSubirHighlight() {
  setNavActivoPorVista("highlights");

  let nombresClub = [];
  try {
    const { data } = await supabase.from("clubes").select("nombre").order("nombre");
    nombresClub = (data || []).map(c => c.nombre).filter(Boolean);
  } catch (e) { /* el club es opcional */ }

  contenido.innerHTML = `
    <div class="hl-form fa-form">
      <h2>Subir un momento</h2>

      <label class="hl-archivo" for="hl-archivo">
        ${ico("subir", 30)}
        <strong id="hl-archivo-nombre">Seleccionar vídeo</strong>
        <span>MP4 o MOV · máximo ${HL_MAX_MB} MB · 5-30 segundos recomendados</span>
      </label>
      <input id="hl-archivo" type="file" accept="video/mp4,video/quicktime,video/webm" hidden>

      <label for="hl-tipo">Tipo de momento</label>
      <select id="hl-tipo">
        ${TIPOS_HIGHLIGHT.map(t => `<option value="${t.id}">${t.singular}</option>`).join("")}
      </select>

      <label for="hl-categoria">Categoría</label>
      <select id="hl-categoria">
        <option value="Infantil">Infantil</option>
        <option value="Cadete">Cadete</option>
        <option value="Juvenil">Juvenil</option>
      </select>

      <label for="hl-club">Club (opcional)</label>
      <select id="hl-club">
        <option value="">Sin indicar</option>
        ${nombresClub.map(n => `<option value="${escaparHtml(n)}">${escaparHtml(n)}</option>`).join("")}
      </select>

      <label for="hl-desc">Descripción corta</label>
      <textarea id="hl-desc" rows="2" maxlength="100" placeholder="Ej.: ¡Paradón a falta de cinco segundos!"></textarea>
      <div class="hl-contador" id="hl-contador">0/100 caracteres</div>

      <label class="hl-permiso">
        <input id="hl-permiso" type="checkbox">
        <span>Confirmo que tengo permiso de las personas que aparecen (o de sus familias o tutores) para compartir este vídeo.</span>
      </label>

      <p class="hl-aviso">${ico("escudo", 16)}Los vídeos se revisarán antes de publicarse.</p>

      <button type="button" id="hl-enviar" class="hl-subir" onclick="enviarHighlight()">Enviar vídeo para revisión</button>
      <button type="button" class="volver" onclick="mostrarHighlights()">Cancelar</button>
    </div>
  `;

  document.getElementById("hl-archivo").addEventListener("change", e => {
    const f = e.target.files[0];
    document.getElementById("hl-archivo-nombre").textContent = f ? f.name : "Seleccionar vídeo";
  });
  document.getElementById("hl-desc").addEventListener("input", e => {
    document.getElementById("hl-contador").textContent = `${e.target.value.length}/100 caracteres`;
  });
}

function duracionVideo(file) {
  return new Promise(resolve => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    const fin = (d) => { URL.revokeObjectURL(url); resolve(d); };
    v.preload = "metadata";
    v.onloadedmetadata = () => fin(isFinite(v.duration) ? v.duration : null);
    v.onerror = () => fin(null); // por ejemplo un MOV que este navegador no sabe leer: lo revisa la organización
    setTimeout(() => fin(null), 6000);
    v.src = url;
  });
}

async function enviarHighlight() {
  const archivo = document.getElementById("hl-archivo").files[0];
  const descripcion = document.getElementById("hl-desc").value.trim();

  if (!archivo) { avisar("Elige un vídeo", "error"); return; }
  if (!/^video\/(mp4|quicktime|webm)$/.test(archivo.type)) { avisar("Formato de vídeo no admitido", "error"); return; }
  if (archivo.size > HL_MAX_MB * 1024 * 1024) { avisar(`El vídeo pesa más de ${HL_MAX_MB} MB`, "error"); return; }
  if (!descripcion) { avisar("Escribe una descripción", "error"); return; }
  if (!document.getElementById("hl-permiso").checked) { avisar("Confirma el permiso de imagen", "error"); return; }

  const boton = document.getElementById("hl-enviar");
  boton.disabled = true;
  boton.textContent = "Enviando…";

  const segundos = await duracionVideo(archivo);
  if (segundos && segundos > HL_MAX_SEGUNDOS) {
    avisar(`El vídeo dura demasiado (máximo ${HL_MAX_SEGUNDOS} segundos)`, "error");
    boton.disabled = false;
    boton.textContent = "Enviar vídeo para revisión";
    return;
  }

  const extension = archivo.type === "video/quicktime" ? "mov" : archivo.type === "video/webm" ? "webm" : "mp4";
  const nombreArchivo = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;

  try {
    const { error: errorSubida } = await supabase.storage
      .from("highlights")
      .upload(nombreArchivo, archivo, { contentType: archivo.type, cacheControl: "31536000" });
    if (errorSubida) throw errorSubida;

    const { error } = await supabase.rpc("highlight_crear", {
      p_device: idDispositivo(),
      p_tipo: document.getElementById("hl-tipo").value,
      p_categoria: document.getElementById("hl-categoria").value,
      p_club: document.getElementById("hl-club").value,
      p_descripcion: descripcion,
      p_archivo: nombreArchivo,
      p_consentimiento: true
    });
    if (error) throw error;
  } catch (error) {
    console.error("Error subiendo highlight:", error);
    avisar(/máximo de vídeos/i.test(error.message || "") ? "Has llegado al máximo de vídeos por hoy" : "No se ha podido subir el vídeo", "error");
    boton.disabled = false;
    boton.textContent = "Enviar vídeo para revisión";
    return;
  }

  avisar("¡Gracias! Tu vídeo se publicará cuando lo revise la organización.");
  highlightsCargados = false;
  mostrarHighlights();
}

window.mostrarHighlights = mostrarHighlights;
window.hlFiltrar = hlFiltrar;
window.hlOrdenar = hlOrdenar;
window.hlMas = hlMas;
window.hlValorar = hlValorar;
window.hlReportar = hlReportar;
window.hlModerar = hlModerar;
window.formSubirHighlight = formSubirHighlight;
window.enviarHighlight = enviarHighlight;


/* ================== ZONA FAN: HIGHLIGHTS · TIENDA · PORRA ================== */

const SECCIONES_ZONA = [
  { id: "highlights", nombre: "Highlights", icono: "play", abrir: () => mostrarHighlights() },
  { id: "porra",      nombre: "Porra",      icono: "trofeo", abrir: () => mostrarPorra() },
  { id: "sorteos",    nombre: "Sorteos",    icono: "regalo", abrir: () => mostrarSorteos() },
  { id: "tienda",     nombre: "Tienda",     icono: "bolsa", abrir: () => mostrarTienda() }
];

// Barra de secciones que se ve arriba en las tres pantallas de la Zona Fan
function barraZona(actual) {
  lsSet("zona_seccion", actual);
  return `
    <div class="zona-barra" role="tablist" aria-label="Zona Fan">
      ${SECCIONES_ZONA.map(s => `
        <button type="button" role="tab" class="${s.id === actual ? "activo" : ""}" aria-selected="${s.id === actual}"
          onclick="mostrarSeccionZona('${s.id}')">${ico(s.icono, 18)}<span>${s.nombre}</span></button>`).join("")}
    </div>`;
}

function mostrarSeccionZona(id) {
  const s = SECCIONES_ZONA.find(x => x.id === id) || SECCIONES_ZONA[0];
  s.abrir();
}

// Entrada de la barra inferior: abre la última sección que se estaba viendo
function mostrarZona() {
  mostrarSeccionZona(lsGet("zona_seccion") || "highlights");
}

/* ================== PH PORRA ================== */

let porraAlias = lsGet("porra_alias") || "";
let porraFilas = [];
let porraRanking = [];
let porraSeccion = "pronosticar";
const porraBorrador = {};

const REGLAS_PORRA = [
  ["Resultado exacto (ej. 25-23)", 10],
  ["Ganador correcto y diferencia exacta de goles", 6],
  ["Empate acertado, sin marcador exacto", 6],
  ["Ganador correcto, sin acertar diferencia", 3],
  ["Pronóstico incorrecto", 0]
];

function porraAbierto(p) {
  return !!p && calcularEstadoPartido(p) === "pendiente" && !!inicioPartido(p);
}

async function cargarPorra() {
  const [lista, ranking] = await Promise.all([
    supabase.rpc("porra_lista", { p_device: idDispositivo() }),
    supabase.rpc("porra_ranking")
  ]);

  if (lista.error || ranking.error) {
    console.error("Error cargando la porra:", lista.error || ranking.error);
    return false;
  }

  porraFilas = lista.data || [];
  porraRanking = ranking.data || [];
  return true;
}

function mensajeErrorPorra(error) {
  const m = (error && error.message) || "";
  if (/Alias ocupado/i.test(m)) return "Ese alias ya está en uso";
  if (/Alias no válido/i.test(m)) return "Usa de 3 a 16 letras, números o _";
  if (/cerrados/i.test(m)) return "Los pronósticos de este partido ya están cerrados";
  if (/PIN/i.test(m) || (error && error.code === "42501")) { pinAdmin = null; return "PIN de administrador no válido"; }
  return "No se ha podido guardar el pronóstico";
}

function tarjetaPorra(fila) {
  const p = partidos.find(x => Number(x.id) === Number(fila.partido_id));
  if (!p) return "";

  const local = equipos.find(e => e.id === p.local_id);
  const visit = equipos.find(e => e.id === p.visitante_id);
  const clubL = clubes.find(c => c.id === local?.club_id);
  const clubV = clubes.find(c => c.id === visit?.club_id);
  const escudo = c => c?.escudo
    ? `<img src="${escaparHtml(c.escudo)}" class="pc-escudo" alt="" loading="lazy" decoding="async">`
    : `<span class="pc-escudo pc-escudo-vacio"></span>`;

  const abierto = porraAbierto(p);
  const fin = p.estado === "finalizado";
  const tengo = fila.mi_local !== null && fila.mi_local !== undefined;
  const b = porraBorrador[p.id] || (porraBorrador[p.id] = { l: tengo ? fila.mi_local : 20, v: tengo ? fila.mi_visit : 20 });

  const paso = (lado, valor) => `
    <div class="po-paso">
      <button type="button" aria-label="Quitar un gol" onclick="porraPaso(${Number(p.id)}, '${lado}', -1)">${ico("menos", 18)}</button>
      <output id="po-${lado}-${Number(p.id)}">${valor}</output>
      <button type="button" aria-label="Añadir un gol" onclick="porraPaso(${Number(p.id)}, '${lado}', 1)">${ico("mas", 18)}</button>
    </div>`;

  let cuerpo = "";
  if (abierto) {
    cuerpo = porraAlias ? `
      <p class="po-pregunta">¿Cuál crees que será el resultado final?</p>
      <div class="po-marcador">${paso("l", b.l)}<span class="po-guion">–</span>${paso("v", b.v)}</div>
      <button type="button" class="po-guardar" onclick="porraGuardar(${Number(p.id)})">${tengo ? "Actualizar mi pronóstico" : "Guardar mi pronóstico"}</button>
      ${tengo ? `<p class="po-hecho">${ico("check", 14)}Pronóstico guardado: ${fila.mi_local} – ${fila.mi_visit}</p>` : ""}`
      : `<p class="po-pregunta">Elige un alias para poder pronosticar.</p>`;
  } else {
    const puntos = fila.puntos;
    cuerpo = `
      ${fin ? `<div class="po-real">Resultado: <b>${p.goles_local} – ${p.goles_visitante}</b></div>` : `<div class="po-real">Pronósticos cerrados</div>`}
      <div class="po-mio ${tengo ? "" : "vacio"}">
        ${tengo ? `Tu pronóstico: <b>${fila.mi_local} – ${fila.mi_visit}</b>` : "No pronosticaste este partido"}
        ${tengo && puntos !== null && puntos !== undefined ? `<span class="po-pts p${puntos}">+${puntos} pts</span>` : ""}
      </div>`;
  }

  const total = Number(fila.n_total) || 0;
  const tendencia = (!abierto && total > 0) ? (() => {
    const pc = n => Math.round((Number(n) / total) * 100);
    return `
      <div class="po-tendencia" aria-label="Tendencia de los pronósticos">
        <div class="po-barra"><i class="l" style="width:${pc(fila.n_local)}%"></i><i class="e" style="width:${pc(fila.n_empate)}%"></i><i class="v" style="width:${pc(fila.n_visit)}%"></i></div>
        <div class="po-leyenda"><span>${pc(fila.n_local)}% local</span><span>${pc(fila.n_empate)}% empate</span><span>${pc(fila.n_visit)}% visitante</span></div>
      </div>`;
  })() : "";

  return `
    <article class="po-card ${abierto ? "abierta" : "cerrada"}">
      <div class="po-cab">
        <span>${textoFecha(p.fecha)} · ${formatearHora(p.hora)}</span>
        <span class="po-cat">${p.categoria} · ${p.genero}</span>
      </div>
      <div class="pc-duelo">
        <div class="pc-equipo">${escudo(clubL)}<span class="pc-nombre">${local?.nombre || "-"}</span></div>
        <div class="pc-centro"><span class="pc-vs">VS</span></div>
        <div class="pc-equipo">${escudo(clubV)}<span class="pc-nombre">${visit?.nombre || "-"}</span></div>
      </div>
      ${cuerpo}
      ${tendencia}
    </article>`;
}

function htmlPronosticarPorra() {
  const filas = porraFilas
    .map(f => ({ f, p: partidos.find(x => Number(x.id) === Number(f.partido_id)) }))
    .filter(x => x.p)
    .sort((a, b) => marcaTiempo(a.p) - marcaTiempo(b.p));

  const abiertos = filas.filter(x => porraAbierto(x.p));
  const cerrados = filas.filter(x => !porraAbierto(x.p)).reverse();

  if (!filas.length) {
    return `<div class="estado-vacio">${ico("trofeo", 36)}<strong>Todavía no hay partidos en la porra</strong><span>La organización irá añadiendo partidos para pronosticar.</span></div>`;
  }

  return `
    ${abiertos.length ? `<h3 class="po-titulo">Pronósticos abiertos <span class="pt-cuenta">${abiertos.length}</span></h3>${abiertos.map(x => tarjetaPorra(x.f)).join("")}` : ""}
    ${cerrados.length ? `<h3 class="po-titulo">Cerrados <span class="pt-cuenta">${cerrados.length}</span></h3>${cerrados.map(x => tarjetaPorra(x.f)).join("")}` : ""}`;
}

function htmlRankingPorra() {
  if (!porraRanking.length) {
    return `<div class="estado-vacio">${ico("trofeo", 36)}<strong>La clasificación aparecerá cuando termine el primer partido</strong></div>`;
  }

  const max = Math.max(1, ...porraRanking.map(r => Number(r.puntos)));
  const yo = porraAlias.toLowerCase();

  return `
    <div class="po-ranking">
      ${porraRanking.map(r => `
        <div class="po-fila ${String(r.alias).toLowerCase() === yo ? "yo" : ""}">
          <span class="po-pos ${Number(r.pos) <= 3 ? "top" : ""}">${Number(r.pos) === 1 ? ico("trofeo", 18) : Number(r.pos)}</span>
          <div class="po-quien">
            <strong>${escaparHtml(r.alias)}</strong>
            <div class="po-pbarra"><i style="width:${Math.round((Number(r.puntos) / max) * 100)}%"></i></div>
            <small>${r.exactos} ${Number(r.exactos) === 1 ? "exacto" : "exactos"} · ${r.jugados} ${Number(r.jugados) === 1 ? "partido" : "partidos"}</small>
          </div>
          <span class="po-total">${r.puntos} pts</span>
          ${adminActivo ? `<button type="button" class="po-ocultar" aria-label="Ocultar jugador" onclick="porraOcultar('${escaparHtml(r.alias)}')">${ico("close", 14)}</button>` : ""}
        </div>`).join("")}
    </div>`;
}

function htmlReglasPorra() {
  return `
    <div class="po-reglas">
      <h3 class="po-titulo">Sistema de puntuación</h3>
      <div class="po-tabla">
        ${REGLAS_PORRA.map(([txt, pts]) => `<div><span>${txt}</span><b class="p${pts}">${pts}</b></div>`).join("")}
      </div>
      <p>Los puntos no se acumulan por varios criterios: se aplica únicamente la puntuación más alta que corresponda.</p>
      <ul>
        <li>Participación gratuita, sin apuestas ni premios en dinero.</li>
        <li>Un pronóstico por persona y partido, que puedes cambiar hasta que empiece.</li>
        <li>Cuenta el resultado final del partido.</li>
        <li>La clasificación es pública y solo muestra alias: no uses tu nombre completo.</li>
        <li>En caso de empate a puntos gana quien tenga más resultados exactos.</li>
      </ul>
    </div>`;
}

function htmlGestionPorra() {
  const activos = new Set(porraFilas.map(f => Number(f.partido_id)));
  const lista = partidos
    .filter(p => p.estado !== "finalizado")
    .sort((a, b) => marcaTiempo(a) - marcaTiempo(b));

  if (!lista.length) return `<div class="estado-vacio">No hay partidos pendientes.</div>`;

  return `
    <p class="pab-intro">Marca los partidos que entran en la porra. Los pronósticos se cierran solos cuando empieza cada partido.</p>
    <div class="po-gestion">
      ${lista.map(p => {
        const l = equipos.find(e => e.id === p.local_id);
        const v = equipos.find(e => e.id === p.visitante_id);
        const on = activos.has(Number(p.id));
        return `
          <label class="po-gest ${on ? "on" : ""}">
            <input type="checkbox" ${on ? "checked" : ""} onchange="porraActivar(${Number(p.id)}, this.checked)">
            <span><strong>${l?.nombre || "-"} · ${v?.nombre || "-"}</strong>
            <small>${textoFecha(p.fecha)} · ${formatearHora(p.hora)} · ${p.categoria} ${p.genero}</small></span>
          </label>`;
      }).join("")}
    </div>`;
}

function pintarPorra() {
  if (vistaActual !== "porra") return;

  const secciones = [
    ["pronosticar", "Pronosticar"], ["ranking", "Clasificación"], ["reglas", "Reglas"],
    ...(adminActivo ? [["gestion", "Gestionar"]] : [])
  ];

  const aliasHtml = porraAlias ? `
    <div class="po-yo">${ico("estrella", 16)}<span>Jugando como <strong>${escaparHtml(porraAlias)}</strong></span>
      <button type="button" class="po-cambiar" onclick="porraPedirAlias()">Cambiar</button></div>` : `
    <div class="po-alias">
      <strong>Elige tu alias</strong>
      <p>Será tu nombre en la clasificación. Usa un apodo, no tu nombre completo.</p>
      <div class="po-alias-fila">
        <input id="po-alias" maxlength="16" autocomplete="off" autocapitalize="off" placeholder="Ej.: HandballFan">
        <button type="button" onclick="porraRegistrar()">Entrar</button>
      </div>
    </div>`;

  const cuerpo = porraSeccion === "ranking" ? htmlRankingPorra()
    : porraSeccion === "reglas" ? htmlReglasPorra()
    : porraSeccion === "gestion" && adminActivo ? htmlGestionPorra()
    : htmlPronosticarPorra();

  contenido.innerHTML = `
    ${barraZona("porra")}
    <h2>PH Porra</h2>
    <p class="pab-intro">¿Serás el mejor pronosticador del torneo? Adivina los resultados y sube en la clasificación.</p>
    ${aliasHtml}
    <div class="hl-filtros" role="tablist" aria-label="Porra">
      ${secciones.map(([id, nombre]) => `<button type="button" role="tab" class="hl-chip ${porraSeccion === id ? "activo" : ""}" aria-selected="${porraSeccion === id}" onclick="porraVer('${id}')">${nombre}</button>`).join("")}
    </div>
    ${cuerpo}`;
}

async function mostrarPorra() {
  setNavActivoPorVista("porra");
  registrarNavegacion("porra");

  contenido.innerHTML = `${barraZona("porra")}<h2>PH Porra</h2><div class="estado-vacio">Cargando…</div>`;

  const ok = await cargarPorra();
  if (vistaActual !== "porra") return;

  if (!ok) {
    contenido.innerHTML = `${barraZona("porra")}<h2>PH Porra</h2>
      <div class="estado-vacio"><strong>No se han podido cargar los datos</strong>
      <button type="button" class="hl-subir" onclick="mostrarPorra()">Reintentar</button></div>`;
    return;
  }

  pintarPorra();
}

function porraVer(id) { porraSeccion = id; pintarPorra(); }

function porraPaso(id, lado, delta) {
  const b = porraBorrador[id];
  if (!b) return;
  b[lado] = Math.max(0, Math.min(99, b[lado] + delta));
  const el = document.getElementById(`po-${lado}-${id}`);
  if (el) el.textContent = b[lado];
}

async function porraRegistrar() {
  const alias = (document.getElementById("po-alias")?.value || "").trim();
  const { data, error } = await supabase.rpc("porra_registrar", { p_device: idDispositivo(), p_alias: alias });
  if (error) { avisar(mensajeErrorPorra(error), "error"); return; }
  porraAlias = data || alias;
  lsSet("porra_alias", porraAlias);
  avisar("¡Listo! Ya puedes pronosticar");
  pintarPorra();
}

function porraPedirAlias() {
  const alias = prompt("Escribe tu nuevo alias:", porraAlias);
  if (!alias) return;
  supabase.rpc("porra_registrar", { p_device: idDispositivo(), p_alias: alias.trim() }).then(({ data, error }) => {
    if (error) { avisar(mensajeErrorPorra(error), "error"); return; }
    porraAlias = data || alias.trim();
    lsSet("porra_alias", porraAlias);
    cargarPorra().then(pintarPorra);
  });
}

async function porraGuardar(id) {
  const b = porraBorrador[id];
  if (!b) return;

  const { error } = await supabase.rpc("porra_pronosticar", {
    p_device: idDispositivo(), p_partido: id, p_local: b.l, p_visit: b.v
  });

  if (error) {
    console.error("Error guardando pronóstico:", error);
    avisar(mensajeErrorPorra(error), "error");
    return;
  }

  const fila = porraFilas.find(f => Number(f.partido_id) === Number(id));
  if (fila) { fila.mi_local = b.l; fila.mi_visit = b.v; }
  avisar("Pronóstico guardado");
  pintarPorra();
}

async function porraActivar(id, activo) {
  if (!adminActivo) return;
  const pin = obtenerPinAdmin();
  if (!pin) { await cargarPorra(); pintarPorra(); return; }

  const { error } = await supabase.rpc("porra_activar", { p_pin: pin, p_partido: id, p_activo: activo });
  if (error) { avisar(mensajeErrorPorra(error), "error"); }
  await cargarPorra();
  pintarPorra();
}

async function porraOcultar(alias) {
  if (!adminActivo) return;
  if (!confirm(`¿Ocultar a "${alias}" de la clasificación?`)) return;
  const pin = obtenerPinAdmin();
  if (!pin) return;

  const { error } = await supabase.rpc("porra_moderar", { p_pin: pin, p_alias: alias, p_oculto: true });
  if (error) { avisar(mensajeErrorPorra(error), "error"); return; }
  await cargarPorra();
  pintarPorra();
}

window.mostrarZona = mostrarZona;
window.mostrarSeccionZona = mostrarSeccionZona;
window.mostrarPorra = mostrarPorra;
window.porraVer = porraVer;
window.porraPaso = porraPaso;
window.porraRegistrar = porraRegistrar;
window.porraPedirAlias = porraPedirAlias;
window.porraGuardar = porraGuardar;
window.porraActivar = porraActivar;
window.porraOcultar = porraOcultar;

/* ================== PH SORTEOS ================== */

let sorteos = [];

function fechaSorteo(iso) {
  try {
    const loc = { es: "es-ES", en: "en-GB", pt: "pt-PT", fr: "fr-FR", de: "de-DE" }[document.documentElement.lang] || "es-ES";
    return new Intl.DateTimeFormat(loc, { timeZone: ZONA_TORNEO, day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch (e) { return String(iso); }
}

async function cargarSorteos() {
  const { data, error } = await supabase.rpc("sorteo_lista", { p_device: idDispositivo() });
  if (error) { console.error("Error cargando sorteos:", error); return false; }
  sorteos = data || [];
  return true;
}

function mensajeErrorSorteo(error) {
  const m = (error && error.message) || "";
  if (error && error.code === "42501") { pinAdmin = null; return "PIN de administrador no válido"; }
  if (/cerrado/i.test(m)) return "Este sorteo ya ha cerrado";
  if (/no ha cerrado/i.test(m)) return "El sorteo aún no ha cerrado";
  if (/No hay participantes/i.test(m)) return "Nadie ha participado todavía";
  if (/futura/i.test(m)) return "La fecha de cierre debe ser futura";
  return "No se ha podido completar la acción";
}

function tarjetaSorteo(s) {
  const estado = s.estado;
  const pill = estado === "activo" ? ["Sorteo activo", "ok"] : estado === "cerrado" ? ["Cerrado", "espera"] : ["Sorteado", "fin"];
  const id = Number(s.id);
  const n = Number(s.n_participantes) || 0;

  let accion = "";
  if (estado === "activo") {
    accion = s.participo
      ? `<div class="sr-dentro">${ico("check", 16)}Ya estás participando</div>`
      : `<button type="button" class="sr-participar" onclick="sorteoParticipar(${id})">${ico("regalo", 20)}Participar en el sorteo</button>`;
  } else if (estado === "cerrado") {
    accion = `<div class="sr-espera">Sorteo cerrado. Pronto se anunciará el ganador.</div>
      ${s.participo ? `<div class="sr-dentro">${ico("check", 16)}Estás participando</div>` : ""}`;
  } else {
    accion = `<div class="sr-ganador ${s.gane ? "yo" : ""}">${ico("trofeo", 20)}<span>Ganador</span><strong>${escaparHtml(s.ganador_alias || "")}</strong></div>
      ${s.gane ? `<p class="sr-premio">¡Has ganado! Enseña tu alias en el torneo para recoger tu premio.</p>` : ""}`;
  }

  const admin = adminActivo ? `
    <div class="sr-admin">
      ${estado === "cerrado" ? `<button type="button" class="sr-realizar" onclick="sorteoRealizar(${id})">Realizar sorteo</button>` : ""}
      ${estado !== "sorteado" ? `<button type="button" class="sr-cancelar" onclick="sorteoCancelar(${id})">Cancelar sorteo</button>` : ""}
    </div>` : "";

  return `
    <article class="sr-card ${estado}">
      ${s.imagen ? `<div class="sr-foto"><img src="${escaparHtml(urlSegura(s.imagen))}" alt="" loading="lazy" decoding="async"></div>` : ""}
      <div class="sr-cuerpo">
        <div class="sr-fila"><span class="sr-pill ${pill[1]}">${pill[0]}</span><span class="sr-gratis">Participación gratuita</span></div>
        <h3>${escaparHtml(s.titulo)}</h3>
        ${s.descripcion ? `<p class="sr-desc">${escaparHtml(s.descripcion)}</p>` : ""}
        <div class="sr-meta">
          <span>${estado === "activo" ? "Cierre:" : "Cerró:"} <b translate="no">${fechaSorteo(s.cierre)}</b></span>
          <span>${n} ${n === 1 ? "participante" : "participantes"}</span>
        </div>
        ${accion}
        ${admin}
      </div>
    </article>`;
}

function pintarSorteos(cuerpo) {
  if (vistaActual !== "sorteos") return;
  contenido.innerHTML = `
    ${barraZona("sorteos")}
    <h2>PH Sorteos</h2>
    <p class="pab-intro">Participa gratis para ganar premios de los patrocinadores del torneo.</p>
    ${adminActivo ? `<button type="button" class="tienda-nuevo" onclick="formNuevoSorteo()">Crear sorteo</button>` : ""}
    ${cuerpo}`;
}

async function mostrarSorteos() {
  setNavActivoPorVista("sorteos");
  registrarNavegacion("sorteos");

  pintarSorteos(`<div class="estado-vacio">Cargando…</div>`);
  const ok = await cargarSorteos();
  if (!ok) {
    pintarSorteos(`<div class="estado-vacio"><strong>No se han podido cargar los datos</strong>
      <button type="button" class="hl-subir" onclick="mostrarSorteos()">Reintentar</button></div>`);
    return;
  }

  pintarSorteos(sorteos.length
    ? sorteos.map(tarjetaSorteo).join("")
    : `<div class="estado-vacio">${ico("regalo", 36)}<strong>Todavía no hay sorteos</strong><span>Vuelve pronto: habrá premios durante el torneo.</span></div>`);
}

async function sorteoParticipar(id) {
  if (!porraAlias) {
    const alias = (prompt("Elige un alias para participar (3 a 16 caracteres, no uses tu nombre completo):") || "").trim();
    if (!alias) return;
    const { data, error } = await supabase.rpc("porra_registrar", { p_device: idDispositivo(), p_alias: alias });
    if (error) { avisar(mensajeErrorPorra(error), "error"); return; }
    porraAlias = data || alias;
    lsSet("porra_alias", porraAlias);
  }

  const { error } = await supabase.rpc("sorteo_participar", { p_device: idDispositivo(), p_id: id });
  if (error) { console.error("Error participando:", error); avisar(mensajeErrorSorteo(error), "error"); return; }
  avisar("¡Ya participas en el sorteo!");
  await cargarSorteos();
  pintarSorteos(sorteos.map(tarjetaSorteo).join(""));
}

function formNuevoSorteo() {
  if (!adminActivo) return;
  contenido.innerHTML = `
    <div class="form-producto">
      <h2>Nuevo sorteo</h2>
      <label for="sr-titulo">Título del sorteo</label>
      <input id="sr-titulo" maxlength="80" placeholder="Ej.: ¡Gana un pack PH!">
      <label for="sr-desc">Descripción (opcional)</label>
      <textarea id="sr-desc" rows="3" maxlength="300"></textarea>
      <label for="sr-cierre">Fecha y hora de cierre</label>
      <input id="sr-cierre" type="datetime-local">
      <label for="sr-foto">Foto del premio (opcional)</label>
      <input id="sr-foto" type="file" accept="image/*">
      <button type="button" id="sr-guardar" onclick="guardarNuevoSorteo()">Crear sorteo</button>
      <button type="button" class="volver" onclick="mostrarSorteos()">Cancelar</button>
    </div>`;
}

async function guardarNuevoSorteo() {
  if (!adminActivo) return;
  const titulo = document.getElementById("sr-titulo").value.trim();
  const descripcion = document.getElementById("sr-desc").value.trim();
  const cierreTxt = document.getElementById("sr-cierre").value;
  const archivo = document.getElementById("sr-foto").files[0];

  if (titulo.length < 3) { avisar("Escribe el título del sorteo", "error"); return; }
  if (!cierreTxt) { avisar("Elige la fecha de cierre", "error"); return; }
  const cierre = new Date(cierreTxt);
  if (!(cierre.getTime() > Date.now())) { avisar("La fecha de cierre debe ser futura", "error"); return; }

  const pin = obtenerPinAdmin();
  if (!pin) return;

  const boton = document.getElementById("sr-guardar");
  boton.disabled = true;
  boton.textContent = "Guardando…";

  let nombreArchivo = null;
  try {
    let urlImagen = "";
    if (archivo) {
      const foto = await reducirImagen(archivo);
      nombreArchivo = `sorteo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const { error: errorSubida } = await supabase.storage
        .from("productos")
        .upload(nombreArchivo, foto, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (errorSubida) throw errorSubida;
      urlImagen = supabase.storage.from("productos").getPublicUrl(nombreArchivo).data.publicUrl;
    }

    const { error } = await supabase.rpc("sorteo_crear", {
      p_pin: pin, p_titulo: titulo, p_descripcion: descripcion, p_imagen: urlImagen, p_cierre: cierre.toISOString()
    });
    if (error) throw error;

    avisar("Sorteo creado");
    mostrarSorteos();
  } catch (error) {
    console.error("Error creando sorteo:", error);
    if (nombreArchivo) supabase.storage.from("productos").remove([nombreArchivo]).catch(() => {});
    avisar(mensajeErrorSorteo(error), "error");
    boton.disabled = false;
    boton.textContent = "Crear sorteo";
  }
}

async function sorteoRealizar(id) {
  if (!adminActivo) return;
  if (!confirm("¿Realizar el sorteo ahora? El ganador se elige al azar y no se puede repetir.")) return;
  const pin = obtenerPinAdmin();
  if (!pin) return;

  const { data, error } = await supabase.rpc("sorteo_realizar", { p_pin: pin, p_id: id });
  if (error) { console.error("Error en el sorteo:", error); avisar(mensajeErrorSorteo(error), "error"); return; }

  avisar(`¡Sorteo realizado! Ganador: ${data}`, "info", { duracion: 9000 });
  await cargarSorteos();
  pintarSorteos(sorteos.map(tarjetaSorteo).join(""));
}

async function sorteoCancelar(id) {
  if (!adminActivo) return;
  if (!confirm("¿Cancelar este sorteo? Dejará de verse en la app.")) return;
  const pin = obtenerPinAdmin();
  if (!pin) return;

  const { error } = await supabase.rpc("sorteo_cancelar", { p_pin: pin, p_id: id });
  if (error) { avisar(mensajeErrorSorteo(error), "error"); return; }
  avisar("Sorteo cancelado");
  mostrarSorteos();
}

window.mostrarSorteos = mostrarSorteos;
window.sorteoParticipar = sorteoParticipar;
window.formNuevoSorteo = formNuevoSorteo;
window.guardarNuevoSorteo = guardarNuevoSorteo;
window.sorteoRealizar = sorteoRealizar;
window.sorteoCancelar = sorteoCancelar;

/* ================== AVISOS DE PARTIDOS (NOTIFICACIONES PUSH) ================== */

// Clave pública de las notificaciones (la privada vive solo en el servidor)
const VAPID_PUBLICA = "BEt8LQ-9nULs55gA0G2zG4tWvgRG8L2C_ZTq2oa4u6itS0kJZ8xdVWOpR5SVpwq_Fe_lYqvePjQlOBviOZL3m0s";

function avisosSoportados() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function leerPrefsAvisos() {
  try {
    const p = JSON.parse(lsGet("avisos") || "null");
    if (p && typeof p === "object") {
      return {
        activo: !!p.activo,
        equipos: (Array.isArray(p.equipos) ? p.equipos : []).map(Number).filter(Number.isFinite),
        categorias: (Array.isArray(p.categorias) ? p.categorias : []).filter(c => typeof c === "string")
      };
    }
  } catch (e) { /* preferencias estropeadas: se empieza de cero */ }
  return { activo: false, equipos: [], categorias: [] };
}

function guardarPrefsAvisos(prefs) {
  lsSet("avisos", JSON.stringify(prefs));
}

function textoEstadoAvisos() {
  const p = leerPrefsAvisos();
  const activos = p.activo && avisosSoportados() && Notification.permission === "granted";
  if (!activos) return "Te avisamos antes de que empiece tu equipo";

  const n = p.equipos.length;
  const c = p.categorias.length;
  const partes = [];
  if (n) partes.push(`${n} ${n === 1 ? "equipo" : "equipos"}`);
  if (c) partes.push(`${c} ${c === 1 ? "categoría" : "categorías"}`);
  return partes.length ? `Activados · ${partes.join(" y ")}` : "Activados · elige equipos o categorías";
}

function claveAUint8(base64url) {
  const relleno = "=".repeat((4 - (base64url.length % 4)) % 4);
  const bin = atob((base64url + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function obtenerSuscripcionPush(crear) {
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();

  if (!sub && crear) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: claveAUint8(VAPID_PUBLICA)
    });
  }

  return sub;
}

async function enviarPrefsAvisos(sub, prefs) {
  const datos = sub.toJSON();

  const { error } = await supabase.rpc("push_guardar", {
    p_endpoint: sub.endpoint,
    p_p256dh: datos.keys?.p256dh,
    p_auth: datos.keys?.auth,
    p_equipos: prefs.equipos,
    p_categorias: prefs.categorias
  });

  if (error) console.warn("No se pudieron guardar los avisos:", error);
  return !error;
}

// Al abrir la app se vuelve a registrar la suscripción por si el navegador la renovó
async function resincronizarAvisos() {
  if (!avisosSoportados() || Notification.permission !== "granted") return;

  const prefs = leerPrefsAvisos();
  if (!prefs.activo) return;

  try {
    const sub = await obtenerSuscripcionPush(true);
    if (sub) await enviarPrefsAvisos(sub, prefs);
  } catch (e) {
    console.warn("No se pudo renovar la suscripción de avisos:", e);
  }
}

async function activarAvisos() {
  if (!avisosSoportados()) return;

  if (Notification.permission === "denied") {
    avisar("Las notificaciones están bloqueadas. Actívalas en los ajustes del navegador para esta web.", "error");
    return mostrarAvisos();
  }

  try {
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") {
      avisar("Sin permiso no podemos enviarte avisos.", "error");
      return mostrarAvisos();
    }

    const prefs = leerPrefsAvisos();
    const sub = await obtenerSuscripcionPush(true);
    const ok = await enviarPrefsAvisos(sub, prefs);

    if (!ok) throw new Error("No se pudo registrar en el servidor");

    prefs.activo = true;
    guardarPrefsAvisos(prefs);
    avisar("Avisos activados");
  } catch (e) {
    console.error("Error activando avisos:", e);
    avisar("No se han podido activar los avisos. Inténtalo de nuevo.", "error");
  }

  mostrarAvisos();
}

async function desactivarAvisos() {
  const prefs = leerPrefsAvisos();
  prefs.activo = false;
  guardarPrefsAvisos(prefs);

  try {
    const sub = await obtenerSuscripcionPush(false);
    if (sub) {
      await supabase.rpc("push_borrar", { p_endpoint: sub.endpoint });
      await sub.unsubscribe();
    }
  } catch (e) {
    console.warn("No se pudo cancelar la suscripción:", e);
  }

  avisar("Avisos desactivados");
  mostrarAvisos();
}

function alternarSwitchAvisos(el) {
  if (el.checked) activarAvisos();
  else desactivarAvisos();
}

let temporizadorAvisos = null;

function alternarAviso(tipo, valor, marcado, el) {
  const prefs = leerPrefsAvisos();
  const lista = tipo === "equipo" ? prefs.equipos : prefs.categorias;
  const clave = tipo === "equipo" ? Number(valor) : String(valor);
  const i = lista.indexOf(clave);

  if (marcado && i === -1) lista.push(clave);
  if (!marcado && i !== -1) lista.splice(i, 1);

  guardarPrefsAvisos(prefs);
  actualizarResumenAvisos();

  const club = el?.closest(".avisos-club");
  if (club) {
    const n = club.querySelectorAll(".aviso-opcion input:checked").length;
    club.querySelector(".avisos-contador").textContent = textoContadorClub(n);
  }

  // se envía al servidor al dejar de tocar (no una petición por cada casilla)
  clearTimeout(temporizadorAvisos);
  temporizadorAvisos = setTimeout(async () => {
    if (!prefs.activo || Notification.permission !== "granted") return;

    try {
      const sub = await obtenerSuscripcionPush(false);
      if (sub && await enviarPrefsAvisos(sub, leerPrefsAvisos())) {
        const estado = document.getElementById("avisos-guardado");
        if (estado) estado.textContent = "Cambios guardados";
      }
    } catch (e) {
      console.warn("No se pudo guardar la selección de avisos:", e);
    }
  }, 700);
}

function actualizarResumenAvisos() {
  const r = document.getElementById("avisos-resumen");
  if (r) r.textContent = textoEstadoAvisos();
  const estado = document.getElementById("avisos-guardado");
  if (estado) estado.textContent = "";
}

async function probarAviso() {
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(t("Aviso de prueba"), {
      body: t("Así verás los avisos de los partidos que van a empezar."),
      icon: "assets/icons/icon-192.png",
      tag: "prueba"
    });
  } catch (e) {
    console.warn("No se pudo mostrar la notificación de prueba:", e);
    avisar("No se ha podido mostrar la notificación de prueba.", "error");
  }
}

const clubesAbiertosAvisos = new Set();

function textoContadorClub(n) {
  return n ? `${n} ${n === 1 ? "elegido" : "elegidos"}` : "";
}

function pintarEquiposAvisos(filtro = "") {
  const caja = document.getElementById("avisos-equipos");
  if (!caja) return;

  const prefs = leerPrefsAvisos();
  const q = filtro.trim().toLowerCase();

  const porClub = new Map();
  equipos.forEach(e => {
    const club = clubes.find(c => c.id === e.club_id);
    const nombreClub = club?.nombre || "Sin club";
    const texto = `${nombreClub} ${e.nombre} ${e.categoria} ${e.genero}`.toLowerCase();
    if (q && !texto.includes(q)) return;
    if (!porClub.has(nombreClub)) porClub.set(nombreClub, { club, lista: [] });
    porClub.get(nombreClub).lista.push(e);
  });

  if (!porClub.size) {
    caja.innerHTML = `<p class="partido-vacio">No hay equipos que coincidan.</p>`;
    return;
  }

  caja.innerHTML = [...porClub.entries()]
    .sort((a, b) => textoPlano(a[0]).localeCompare(textoPlano(b[0]), "es"))
    .map(([nombre, { club, lista }]) => {
      const elegidos = lista.filter(e => prefs.equipos.includes(e.id)).length;
      // al buscar se abren los clubs que coinciden; si no, solo los que la persona abrió
      const abierto = q || clubesAbiertosAvisos.has(nombre);

      return `
      <details class="avisos-club" data-club="${nombre}" ${abierto ? "open" : ""}>
        <summary>
          <img class="avisos-escudo" src="${club?.escudo || "img/club-placeholder.svg"}" alt="" width="26" height="26" loading="lazy" decoding="async">
          <span class="avisos-club-nombre">${nombre}</span>
          <span class="avisos-contador">${textoContadorClub(elegidos)}</span>
          ${ico("chev", 18)}
        </summary>
        <div class="avisos-club-equipos">
          ${lista.map(e => `
            <label class="aviso-opcion">
              <input type="checkbox" ${prefs.equipos.includes(e.id) ? "checked" : ""}
                     onchange="alternarAviso('equipo', ${Number(e.id)}, this.checked, this)">
              <span><strong>${e.nombre}</strong><small>${e.categoria} · ${e.genero}</small></span>
            </label>`).join("")}
        </div>
      </details>`;
    }).join("");

  caja.querySelectorAll("details.avisos-club").forEach(d => {
    d.addEventListener("toggle", () => {
      if (document.getElementById("avisos-buscar")?.value.trim()) return;
      if (d.open) clubesAbiertosAvisos.add(d.dataset.club);
      else clubesAbiertosAvisos.delete(d.dataset.club);
    });
  });
}

function mostrarAvisos() {
  setNavActivoPorVista("inicio");
  registrarNavegacion("avisos");

  const prefs = leerPrefsAvisos();
  const soportado = avisosSoportados();
  const necesitaInstalar = esIOS() && !yaInstalada();
  const permiso = soportado ? Notification.permission : "denied";
  const activos = prefs.activo && permiso === "granted";

  const categorias = [...new Set(equipos.map(e => `${e.categoria}|${e.genero}`))]
    .sort((a, b) => a.localeCompare(b, "es"));

  let aviso = "";
  if (necesitaInstalar) {
    aviso = `<div class="aviso-info">En iPhone y iPad los avisos solo funcionan con la app instalada. Pulsa <b>Compartir</b>, elige <b>«Añadir a pantalla de inicio»</b> y vuelve a abrir esta pantalla desde allí.</div>`;
  } else if (!soportado) {
    aviso = `<div class="aviso-info">Este navegador no admite notificaciones. Prueba con Chrome, Edge, Firefox o Safari actualizado.</div>`;
  } else if (permiso === "denied") {
    aviso = `<div class="aviso-info">Las notificaciones están bloqueadas para esta web. Actívalas en los ajustes del navegador y vuelve aquí.</div>`;
  }

  contenido.innerHTML = `
    <h2>Avisos de partidos</h2>
    <p class="tienda-intro">Recibe una notificación en el móvil unos 15 minutos antes de que empiece un partido de los equipos o categorías que elijas.</p>

    ${aviso}

    <label class="avisos-switch ${soportado && !necesitaInstalar ? "" : "desactivado"}">
      <span>
        <strong>Recibir avisos</strong>
        <small id="avisos-resumen">${textoEstadoAvisos()}</small>
      </span>
      <input type="checkbox" role="switch" ${activos ? "checked" : ""} ${soportado && !necesitaInstalar ? "" : "disabled"}
             onchange="alternarSwitchAvisos(this)">
      <i aria-hidden="true"></i>
    </label>
    <div id="avisos-guardado" class="avisos-guardado" role="status" aria-live="polite"></div>

    <h3>Categorías</h3>
    <div class="avisos-chips">
      ${categorias.map(c => {
        const [cat, gen] = c.split("|");
        return `<label class="aviso-chip">
          <input type="checkbox" ${prefs.categorias.includes(c) ? "checked" : ""}
                 onchange="alternarAviso('categoria', this.dataset.valor, this.checked)" data-valor="${c}">
          <span>${cat} · ${gen}</span>
        </label>`;
      }).join("") || `<p class="partido-vacio">Aún no hay categorías.</p>`}
    </div>

    <h3>Equipos</h3>
    <input type="search" id="avisos-buscar" class="avisos-buscar" placeholder="Buscar club o equipo" aria-label="Buscar club o equipo"
           oninput="pintarEquiposAvisos(this.value)">
    <div id="avisos-equipos"></div>

    ${activos ? `<button type="button" class="volver" onclick="probarAviso()">Enviarme un aviso de prueba</button>` : ""}
    <button type="button" class="volver" onclick="mostrarHome()">Volver</button>
  `;

  pintarEquiposAvisos();
}

navigator.serviceWorker?.addEventListener("message", (e) => {
  if (e.data?.tipo !== "abrir-partido") return;
  try {
    const id = Number(new URL(e.data.url).searchParams.get("partido"));
    if (id) abrirPartido(id);
  } catch (err) { /* enlace no válido: se ignora */ }
});

/* ================== EXPONER FUNCIONES A HTML ================== */

// navegación principal
window.mostrarHome = mostrarHome;
window.mostrarPartidos = mostrarPartidos;
window.mostrarCategorias = mostrarCategorias;
window.mostrarEquipos = mostrarEquipos;
window.mostrarClasificacion = mostrarClasificacion;
window.mostrarPabellones = mostrarPabellones; // aunque aún no exista, no pasa nada
window.mostrarTienda = mostrarTienda;
window.mostrarAvisos = mostrarAvisos;
window.alternarSwitchAvisos = alternarSwitchAvisos;
window.alternarAviso = alternarAviso;
window.pintarEquiposAvisos = pintarEquiposAvisos;
window.probarAviso = probarAviso;
window.formNuevoProducto = formNuevoProducto;
window.editarProducto = editarProducto;
window.guardarNuevoProducto = guardarNuevoProducto;
window.guardarEdicionProducto = guardarEdicionProducto;
window.borrarProducto = borrarProducto;

// admin
window.toggleAdmin = toggleAdmin;

// partidos
window.abrirPartido = abrirPartido;
window.editarPartido = editarPartido;
window.borrarPartido = borrarPartido;
window.formNuevoPartido = formNuevoPartido;
window.guardarNuevoPartido = guardarNuevoPartido;
window.guardarEdicionPartido = guardarEdicionPartido;
window.finalizarPartido = finalizarPartido;
window.cambiarGol = cambiarGol;
window.guardarResultado = guardarResultado;
window.guardarDatosPartido = guardarDatosPartido;
window.formCrearFaseFinal = formCrearFaseFinal;
window.guardarFaseFinal = guardarFaseFinal;

// categorías / equipos
window.guardarEdicionClub = guardarEdicionClub;
window.seleccionarCategoria = seleccionarCategoria;
window.filtrarCategorias = filtrarCategorias;
window.togglePartidosEquipo = togglePartidosEquipo;
//window.verPartidosEquipo = verPartidosEquipo;//
window.formNuevoEquipo = formNuevoEquipo;
window.guardarNuevoEquipo = guardarNuevoEquipo;
window.editarEquipo = editarEquipo;
window.borrarEquipo = borrarEquipo;
window.verClub = verClub;
window.formNuevoClub = formNuevoClub;
window.guardarNuevoClub = guardarNuevoClub;
window.editarClub = editarClub;
window.borrarClub = borrarClub;
window.mostrarCuadroEliminatorio = mostrarCuadroEliminatorio;
window.mostrarCuadrosEliminatorios = mostrarCuadrosEliminatorios;
window.toggleCategoriaDia = toggleCategoriaDia;

// patrocinadores
window.guardarNuevoPatrocinador = guardarNuevoPatrocinador;
window.borrarPatrocinador = borrarPatrocinador;
window.moverPatrocinador = moverPatrocinador;

// patrocinadores
window.formNuevoPatrocinador = formNuevoPatrocinador;

// equipos
window.guardarEdicionEquipo = guardarEdicionEquipo;

// clasificación
window.actualizarClasificacion = actualizarClasificacion;
window.setNavActivoPorVista = setNavActivoPorVista;
// utilidades usadas en HTML
window.reiniciarCancion = reiniciarCancion;
window.moverBarraCancion = moverBarraCancion;
window.abrirWeb = abrirWeb;

window.mostrarPartidosPorPabellon = function(pabellon) {
  setNavActivoPorVista("pabellones");
  registrarNavegacion("pabellon", { nombre: pabellon });

  const partidosPabellon = partidos.filter(p => p.pabellon === pabellon);

  // 🔹 ordenar por fecha + hora
  const ordenados = [...partidosPabellon].sort((a, b) => marcaTiempo(a) - marcaTiempo(b));

  const proximos = ordenados.filter(
  p => calcularEstadoPartido(p) !== "finalizado"
);

const finalizados = ordenados
  .filter(p => calcularEstadoPartido(p) === "finalizado")
  .reverse();

  // 🔹 detectar si hay partido en juego en este pabellón
const hayDirecto = partidosPabellon.some(
  p => calcularEstadoPartido(p) === "en_juego"
);


let html = `
  <h2>${pabellon}</h2>

  <div class="pabellon-badges">
    <a
      href="${UBICACIONES_PABELLONES[pabellon] || '#'}"
      target="_blank"
      rel="noopener noreferrer"
      class="badge-glass badge-ubicacion"
    >
      Ubicación
    </a>

    ${
  DIRECTOS_PABELLONES[pabellon] && hayDirecto
    ? `
      <a
        href="${DIRECTOS_PABELLONES[pabellon]}"
        target="_blank"
        rel="noopener noreferrer"
        class="badge-glass badge-directo"
      >
        Ver directo
      </a>
    `
    : ``
}
  </div>
`;

  /* ===== PRÓXIMOS ===== */
html += `<h3 class="bloque-titulo">Próximos partidos</h3>`;
html += proximos.length
  ? renderBloquesPorFecha(proximos, "proximos")
  : `<p>No hay próximos partidos.</p>`;

/* ===== FINALIZADOS ===== */
html += `<h3 class="bloque-titulo">Partidos finalizados</h3>`;
html += finalizados.length
  ? renderBloquesPorFecha(finalizados, "finalizados")
  : `<p>No hay partidos finalizados.</p>`;

  /* ===== BOTÓN ÚNICO DE VOLVER ===== */
  html += `
    <button class="volver" onclick="mostrarPabellones()">Volver a pabellones</button>
  `;

  contenido.innerHTML = html;
};

/* ================== DIRECTO: MARCADORES DEL DÍA ================== */
// Solo se consultan los partidos de HOY (consulta pequeña) y solo mientras la pestaña está visible.
// Así los marcadores se mueven sin recargar y sin gastar el cupo de datos de Supabase.
const firmaPartido = p => [p.estado, p.goles_local, p.goles_visitante, p.hora, p.pabellon, p.finalizado].join("|");

async function refrescarPartidosHoy() {
  if (refrescandoVivo || document.hidden || !navigator.onLine) return;
  if (!partidos.length) return;

  refrescandoVivo = true;

  try {
    const { data, error } = await supabase
      .from("partidos")
      .select("*")
      .eq("fecha", hoyISO());

    if (error || !data) return;

    const frescos = normalizarPartidos(data);
    let cambio = false;

    for (const f of frescos) {
      const i = partidos.findIndex(p => p.id === f.id);
      if (i === -1) {
        partidos.push(f);
        cambio = true;
      } else if (firmaPartido(partidos[i]) !== firmaPartido(f)) {
        partidos[i] = f;
        cambio = true;
      }
    }

    if (cambio) aplicarCambiosEnVivo();
  } catch (e) {
    console.error("Error refrescando partidos de hoy:", e);
  } finally {
    refrescandoVivo = false;
  }
}

function aplicarCambiosEnVivo() {
  // nunca se redibuja mientras alguien edita (admin / mesa) o escribe en un campo
  if (adminActivo || mesaActiva) return;
  const activo = document.activeElement;
  if (activo && /^(INPUT|SELECT|TEXTAREA)$/.test(activo.tagName)) return;

  if (vistaActual === "inicio") {
    renderActualizacionesHome();
  } else if (vistaActual === "partidos" || vistaActual === "pabellon") {
    const y = window.scrollY;
    sinSaltoDeScroll(() => restaurarVista({ vista: vistaActual, params: paramsVistaActual }));
    window.scrollTo(0, y);
  }
}

setInterval(refrescarPartidosHoy, INTERVALO_VIVO_MS);

// al volver a la pestaña (o recuperar la cobertura) se actualiza al momento
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    refrescarPartidosHoy();
    if (registroSW) registroSW.update().catch(() => {});
  }
});
window.addEventListener("online", refrescarPartidosHoy);

/* ================== PWA: SERVICE WORKER E INSTALACIÓN ================== */
let registroSW = null;
let eventoInstalar = null;

function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost") return;

  navigator.serviceWorker.register("sw.js").then(reg => {
    registroSW = reg;

    const avisarActualizacion = worker => {
      avisar("Hay una versión nueva de la app.", "info", {
        etiqueta: "Actualizar",
        duracion: 0,
        accion: () => {
          navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), { once: true });
          worker.postMessage("saltar-espera");
          setTimeout(() => location.reload(), 1500);
        }
      });
    };

    if (reg.waiting && navigator.serviceWorker.controller) avisarActualizacion(reg.waiting);

    reg.addEventListener("updatefound", () => {
      const nuevo = reg.installing;
      if (!nuevo) return;
      nuevo.addEventListener("statechange", () => {
        if (nuevo.state === "installed" && navigator.serviceWorker.controller) avisarActualizacion(nuevo);
      });
    });
  }).catch(e => console.warn("No se pudo registrar el service worker:", e));
}

const yaInstalada = () =>
  window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

const esIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  eventoInstalar = e;
  renderTarjetaInstalar();
});

window.addEventListener("appinstalled", () => {
  eventoInstalar = null;
  document.getElementById("tarjeta-instalar")?.remove();
});

function renderTarjetaInstalar() {
  document.getElementById("tarjeta-instalar")?.remove();

  if (yaInstalada() || lsGet("instalar-descartado")) return;
  if (vistaActual !== "inicio") return;

  const ios = esIOS();
  if (!eventoInstalar && !ios) return;

  const caja = document.createElement("div");
  caja.id = "tarjeta-instalar";
  caja.className = "tarjeta-instalar";

  caja.innerHTML = eventoInstalar
    ? `<strong>Instala la app</strong>
       <span>Ábrela desde tu pantalla de inicio y consulta los partidos aunque falle la cobertura.</span>
       <div class="acciones">
         <button type="button" class="principal" onclick="instalarApp()">Instalar</button>
         <button type="button" onclick="descartarInstalar()">Ahora no</button>
       </div>`
    : `<strong>Instala la app</strong>
       <span>Pulsa <b>Compartir</b> y luego <b>«Añadir a pantalla de inicio»</b>.</span>
       <div class="acciones">
         <button type="button" onclick="descartarInstalar()">Entendido</button>
       </div>`;

  contenido.insertBefore(caja, contenido.firstChild);
}

async function instalarApp() {
  if (!eventoInstalar) return;
  eventoInstalar.prompt();
  try { await eventoInstalar.userChoice; } catch (e) { /* cancelado */ }
  eventoInstalar = null;
  document.getElementById("tarjeta-instalar")?.remove();
}

function descartarInstalar() {
  lsSet("instalar-descartado", "1");
  document.getElementById("tarjeta-instalar")?.remove();
}

window.instalarApp = instalarApp;
window.descartarInstalar = descartarInstalar;

/* ================== ARRANQUE ================== */
// El script es un módulo: se ejecuta cuando el HTML ya está leído, no hace falta esperar a "load"
// (que esperaba a todas las imágenes y retrasaba el arranque).
if (adminActivo) {
  document.getElementById("admin-fab")?.classList.add("admin-activo");
}

iniciarApp();
registrarServiceWorker();
resincronizarAvisos();
