import { supabase } from "./supabase.js";

/* ================== AJUSTES ================== */

const PLACEHOLDER_ESCUDO = "img/club-placeholder.svg";
const ZONA_TORNEO = "Europe/Madrid";     // las horas de los partidos son horas de Plasencia
const DURACION_PARTIDO_MIN = 50;         // minutos que un partido figura "en juego" desde su hora de inicio
const INTERVALO_VIVO_MS = 30000;         // cada cuánto se refrescan los marcadores del día

document.body.classList.add("splash-activo");

const contenido = document.getElementById("contenido");

/* ================== UTILIDADES ================== */

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
    img.matches(".escudo-partido, .escudo-ios, .escudo-equipo-mini, .escudo-tabla, .club-escudo, .equipo-actualizacion img")
  ) {
    img.dataset.fallback = "1";
    img.src = PLACEHOLDER_ESCUDO;
  }
}, true);

function formatearHora(hora24) {
  if (!hora24) return "-";

  const [h, m] = hora24.split(":").map(Number);
  const ampm = h >= 12 ? "p. m." : "a. m.";
  const hora12 = h % 12 || 12;

  return `${hora12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

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

  // el botón y la barra reflejan el estado real de la canción (antes se reiniciaban a ▶️ al volver a Inicio)
  const reproduciendo = !audioTorneo.paused;
  const progresoCancion =
    isFinite(audioTorneo.duration) && audioTorneo.duration > 0
      ? (audioTorneo.currentTime / audioTorneo.duration) * 100
      : 0;

  let html = `
    <h2>Inicio</h2>

    <div id="bloque-instalar"></div>

    <section class="cancion-torneo">

  <div class="galeria-badge reproductor-cancion">

    <div class="badge-icon">
      <img src="img/iconos/musica.webp" alt="" width="44" height="44">
    </div>

    <div class="badge-texto">
      <strong>Canción del torneo</strong>
    </div>

    <div class="controles-cancion">

      <button type="button" onclick="reiniciarCancion()" class="btn-control" aria-label="Volver al principio de la canción">
        ⏮️
      </button>

      <button type="button" onclick="toggleCancionTorneo()" id="btn-play" class="btn-control"
              aria-label="${reproduciendo ? "Pausar canción" : "Reproducir canción"}">
        ${reproduciendo ? "⏸️" : "▶️"}
      </button>

    </div>

  </div>

  <input
    type="range"
    id="barra-cancion"
    value="${progresoCancion}"
    min="0"
    max="100"
    step="1"
    aria-label="Posición de la canción"
    oninput="moverBarraCancion()"
  >

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

          <button onclick="event.stopPropagation(); moverPatrocinador(${p.id}, -1)">
            ⬆️
          </button>

          <button onclick="event.stopPropagation(); moverPatrocinador(${p.id}, 1)">
            ⬇️
          </button>

          <button class="btn-borrar-patrocinador"
            onclick="event.stopPropagation(); borrarPatrocinador(${p.id})">
            ✖
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
    html += `<button onclick="formNuevoPatrocinador()">➕ Añadir patrocinador</button>`;
  }

  // HISTORIA AL FINAL
  html += `
    <section class="historia">
      <h3>Historia del Torneo</h3>
      <div class="historia-card">
        <p id="texto-historia">
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
    </section>
  `;

  contenido.innerHTML = html;

  renderTarjetaInstalar();

  // cargar galería
setTimeout(renderActualizacionesHome, 0);

  requestAnimationFrame(() => {
    cargarGaleria2025();
    cargarGaleria2026();
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

    <button onclick="guardarNuevoPatrocinador()">💾 Guardar</button>
    <button class="volver" onclick="mostrarHome()">⬅ Volver</button>
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
      <h3>📢 Partidos en juego</h3>

      <div id="lista-actualizaciones">
  `;

  partidosAMostrar.forEach((p, index) => {
    const local = equipos.find(e => e.id === p.local_id);
    const visitante = equipos.find(e => e.id === p.visitante_id);

    const clubLocal = clubes.find(c => c.id === local?.club_id);
    const clubVisitante = clubes.find(c => c.id === visitante?.club_id);

    const estadoTexto =
      p.estado === "finalizado" ? "🏁 Final" : "🟢 En juego";


    html += `
      <div class="actualizacion-card" role="button" tabindex="0" onclick="abrirPartido(${p.id})">

        <!-- CATEGORÍA -->
        <div class="actualizacion-categoria">
          ${p.categoria} · ${p.genero}
        </div>

        <!-- GRUPO / FASE -->
        <div class="actualizacion-fase">
          ${textoGrupoOFase(p)}
        </div>

        <!-- EQUIPOS -->
        <div class="actualizacion-contenido">

          <div class="equipo-actualizacion">
            <img src="${clubLocal?.escudo || PLACEHOLDER_ESCUDO}" alt="" loading="lazy" decoding="async">
            <span>${local?.nombre || "-"}</span>
          </div>

          <div class="marcador-actualizacion">
            ${p.goles_local} - ${p.goles_visitante}
          </div>

          <div class="equipo-actualizacion">
            <img src="${clubVisitante?.escudo || PLACEHOLDER_ESCUDO}" alt="" loading="lazy" decoding="async">
            <span>${visitante?.nombre || "-"}</span>
          </div>

        </div>

        <!-- ESTADO -->
        <div class="actualizacion-estado">
          ${estadoTexto}
        </div>

      </div>
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

  if (barra) barra.value = 0;

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

  clearTimeout(moverBarraCancion.t);
  moverBarraCancion.t = setTimeout(() => { arrastrandoBarra = false; }, 300);

}

// Antes estos eventos buscaban un elemento <audio id="audio-torneo"> que no existe,
// así que la barra de la canción nunca avanzaba. Ahora escuchan al audio real.
function sincronizarBotonCancion() {
  const boton = document.getElementById("btn-play");
  if (!boton) return;

  boton.textContent = audioTorneo.paused ? "▶️" : "⏸️";
  boton.setAttribute("aria-label", audioTorneo.paused ? "Reproducir canción" : "Pausar canción");
}

audioTorneo.addEventListener("play", sincronizarBotonCancion);
audioTorneo.addEventListener("pause", sincronizarBotonCancion);
audioTorneo.addEventListener("ended", sincronizarBotonCancion);

audioTorneo.addEventListener("timeupdate", () => {

  if (arrastrandoBarra) return;

  const barra = document.getElementById("barra-cancion");

  if (!barra || !isFinite(audioTorneo.duration) || audioTorneo.duration <= 0) return;

  barra.value = (audioTorneo.currentTime / audioTorneo.duration) * 100;

});

const VISTAS_INICIALES = {
  inicio: () => mostrarHome(),
  partidos: () => mostrarPartidos(),
  categorias: () => mostrarCategorias(),
  clubs: () => mostrarEquipos(),
  tabla: () => mostrarClasificacion(),
  pabellones: () => mostrarPabellones()
};

// Los accesos directos de la app instalada abren con ?vista=partidos, ?vista=tabla…
function vistaInicial() {
  let vista = "inicio";

  try {
    vista = new URLSearchParams(location.search).get("vista") || "inicio";
  } catch (e) { /* se queda en inicio */ }

  (VISTAS_INICIALES[vista] || VISTAS_INICIALES.inicio)();
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
  document.body.classList.add("splash-activo");
  iniciarBarraSplash();

  // primera entrada del historial: pulsar "atrás" desde cualquier pantalla vuelve a Inicio
  try { history.replaceState({ vista: "inicio", params: {} }, ""); } catch (e) { /* sin historial */ }

  let splashOculto = false;

  const ocultarSplash = () => {
    if (splashOculto) return;
    splashOculto = true;

    completarBarraSplash();

    setTimeout(() => {
      document.body.classList.remove("splash-activo");

      const splash = document.getElementById("splash");
      if (splash) {
        splash.classList.add("splash-hide");
        setTimeout(() => splash.remove(), 600);
      }
    }, 200);
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
function cargarGaleria2026() {
  const contenedor = document.getElementById("galeria2026-scroll");
  if (!contenedor) return;

  const urlCarpeta = "https://www.amazon.es/photos/share/BNF0g9ckA7PPdmq1jetkgeJ9zO8BwiJW6Gj4KPumS5";

  contenedor.innerHTML = `
  <a href="${urlCarpeta}" target="_blank" rel="noopener noreferrer" class="galeria-badge">
    <div class="badge-icon">
      <img src="img/iconos/fotos.webp" alt="" width="44" height="44">
    </div>
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
    <div class="badge-icon">
      <img src="img/iconos/fotos.webp" alt="" width="44" height="44">
    </div>
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
          <span>📅 ${fechaBonita}</span>
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

  if (gen.includes("masculino")) return "♂";

  if (gen.includes("femenino")) return "♀";

  return "";
}

function renderBloquesCategoriaGenero(partidosDia, fecha, tipo) {

  const categorias = agruparPorCategoria(partidosDia);

  let html = "";

  Object.entries(categorias).forEach(([categoria, listaCategoria]) => {

    const idCategoria = slug("categoria", tipo, fecha, categoria);

    html += `
  <div class="bloque-categoria-principal">

    <div class="categoria-principal-header" role="button" tabindex="0"
         aria-expanded="false" aria-controls="${idCategoria}"
         onclick="toggleCategoriaDia('${idCategoria}', this)">

      <span class="badge-categoria ${obtenerClaseCategoria(categoria)}">
        ${categoria}
      </span>

      <span class="flecha">⌄</span>

    </div>

    <div id="${idCategoria}" class="categoria-partidos oculto">
      ${renderSubBloquesCategoria(listaCategoria, fecha, tipo)}
    </div>

  </div>
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
      <div class="bloque-genero">

        <div class="genero-header" role="button" tabindex="0"
             aria-expanded="false" aria-controls="${idGenero}"
             onclick="toggleCategoriaDia('${idGenero}', this)">

          <span class="badge-genero ${obtenerClaseGenero(genero)}">
            ${obtenerIconoGenero(genero)} ${genero}
           </span>

          <span class="flecha">⌄</span>

        </div>

        <div id="${idGenero}" class="categoria-partidos oculto">

          ${renderGruposDentroGenero(listaGenero, fecha, tipo)}

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
      <div class="bloque-categoria-dia">

        <div class="categoria-header" role="button" tabindex="0"
             aria-expanded="false" aria-controls="${id}"
             onclick="toggleCategoriaDia('${id}', this)">

          <span>${grupo}</span>

          <span class="flecha">⌄</span>

        </div>

        <div id="${id}" class="categoria-partidos oculto">

          ${lista.map(p => renderPartidoCard(p)).join("")}

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
  html += `<button onclick="formCrearFaseFinal()">🏆 Crear partido de fase final</button>`;
}

  if (adminActivo) {
    html += `<button onclick="formNuevoPartido()">➕ Crear partido</button>`;
  }

  const ordenados = [...partidos].sort((a, b) => marcaTiempo(a) - marcaTiempo(b));

  const proximos = ordenados.filter(
  p => calcularEstadoPartido(p) !== "finalizado"
);

const finalizados = ordenados
  .filter(p => calcularEstadoPartido(p) === "finalizado")
  .reverse();

  /* ===== PRÓXIMOS ===== */
html += `<h3 class="bloque-titulo">⏳ Próximos partidos</h3>`;
html += proximos.length
  ? renderBloquesPorFecha(proximos, "proximos")
  : `<p>No hay próximos partidos</p>`;

/* ===== FINALIZADOS ===== */
html += `<h3 class="bloque-titulo">🏁 Partidos finalizados</h3>`;
html += finalizados.length
  ? renderBloquesPorFecha(finalizados, "finalizados")
  : `<p>No hay partidos finalizados</p>`;

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
    <h2>🏆 Cuadro eliminatorio</h2>
    <h3>${categoria} · ${genero}</h3>
    ${renderBracket(categoria, genero)}
    <button class="volver" onclick="mostrarPartidos()">⬅ Volver</button>
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
            <h4>🥉 3.º / 4.º puesto</h4>
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

function formCrearFaseFinal() {
  contenido.innerHTML = `
    <h2>🏆 Crear partido fase final</h2>

    <label>Equipo local</label>
    <select id="equipoLocal"></select>

    <label>Equipo visitante</label>
    <select id="equipoVisitante"></select>

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

    <select id="fase">

  <option value="playoff">Playoff</option>

  <option value="grupo_unico">
    Grupo único
  </option>

  <option value="cuartos">
    Cuartos de final
  </option>

  <option value="semifinal">
    Semifinal
  </option>

  <option value="final">
    Final
  </option>

  <option value="serie1">
    Serie 1
  </option>

  <option value="serie2">
    Serie 2
  </option>

</select>

    <label>Posición</label>
<select id="posicion">
  <option value="">-- Seleccionar posición --</option>

  <option>Serie 1</option>
  <option>Serie 2</option>

  <option>1º / 2º</option>
  <option>3º / 4º</option>
  <option>5º / 6º</option>
  <option>7º / 8º</option>
  <option>9º / 10º</option>
  <option>11º / 12º</option>
  <option>13º / 14º</option>

  <option>7º / 9º</option>
  <option>9º / 12º</option>
  <option>1º / 8º</option>
  <option>5º / 8º</option>
  <option>1º / 4º</option>
</select>
    
    <label>Fecha</label>
    <input type="date" id="fecha">

    <label>Hora</label>
    <input type="time" id="hora">

    <label>Pabellón</label>
    <select id="pabellon">
      ${LISTA_PABELLONES.map(p => `<option>${p}</option>`).join("")}
    </select>

    <button onclick="guardarFaseFinal()">💾 Crear partido</button>
    <button class="volver" onclick="mostrarPartidos()">⬅ Volver</button>
  `;

  cargarTodosEquipos();
}

async function cargarTodosEquipos() {
  const lista = await obtenerEquiposSupabase();

  const local = document.getElementById("equipoLocal");
  const visitante = document.getElementById("equipoVisitante");

  local.innerHTML = "";
  visitante.innerHTML = "";

  lista.forEach(e => {
    const opt1 = document.createElement("option");
    opt1.value = e.id;
    opt1.textContent = `${e.nombre} (${e.categoria} ${e.genero})`;

    const opt2 = opt1.cloneNode(true);

    local.appendChild(opt1);
    visitante.appendChild(opt2);
  });
}

async function guardarFaseFinal() {
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
      <h2>🏆 Cuadros eliminatorios</h2>
      <p>No hay fases finales creadas aún.</p>
      <button class="volver" onclick="mostrarPartidos()">⬅ Volver</button>
    `;
    return;
  }

  // 2️⃣ pintar todos los cuadros
  let html = `<h2>🏆 Cuadros eliminatorios</h2>`;

  combinaciones.forEach(({ categoria, genero }) => {
    html += `
      <section class="cuadro-categoria">
        <h3>${categoria} · ${genero}</h3>
        ${renderBracket(categoria, genero)}
      </section>
    `;
  });

  html += `<button class="volver" onclick="mostrarClasificacion()">⬅ Volver</button>`;

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
  return textoFecha(fecha) || "📅 Fecha por confirmar";
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
  
  const fechaBonita = formatearFecha(p.fecha);
  
  return `
    <div class="card partido-card">

      <!-- 📅 FECHA ARRIBA -->
<div class="partido-fecha">
  <strong>${fechaBonita}</strong>
</div>

<!-- 🏷️ CATEGORÍA -->
<div class="partido-categoria">
  ${p.categoria} · ${p.genero}
</div>

${p.fase !== "grupos" ? `
  <div class="badge-fase">
    ${textoFase(p.fase)}
  </div>
` : ""}

      <div class="partido-equipos">

  <div class="equipo-partido">
    ${clubLocal?.escudo
      ? `<img src="${clubLocal.escudo}" class="escudo-partido" alt="" loading="lazy" decoding="async">`
      : ""
    }
    <span class="nombre-equipo">
      ${equipoLocal?.nombre || "-"}
    </span>
  </div>

  <div class="resultado-centro">
    ${
      p.estado === "finalizado"
        ? `${p.goles_local} – ${p.goles_visitante}`
        : "vs"
    }
  </div>

  <div class="equipo-partido">
    ${clubVisitante?.escudo
      ? `<img src="${clubVisitante.escudo}" class="escudo-partido" alt="" loading="lazy" decoding="async">`
      : ""
    }
    <span class="nombre-equipo">
      ${equipoVisitante?.nombre || "-"}
    </span>
  </div>

</div>

      <div class="badge-estado ${estadoReal}">
  ${
    estadoReal === "finalizado"
      ? "🏁 Finalizado"
      : estadoReal === "en_juego"
      ? "🟢 En juego"
      : "🔴 Pendiente"
  }
</div>
      
      <div class="partido-info">
        🕒 ${formatearHora(p.hora)} · 📍 ${p.pabellon || "-"}
      </div>

      <div class="partido-grupo">🏷️ ${p.grupo}</div>

      <button onclick="abrirPartido(${p.id})">Abrir partido</button>

      ${
        adminActivo
          ? `
            <button onclick="editarPartido(${p.id})">✏️ Editar</button>
            <button onclick="borrarPartido(${p.id})">🗑️ Borrar</button>
          `
          : ""
      }
    </div>
  `;
}

function formNuevoPartido() {
  contenido.innerHTML = `
    <h2>Nuevo partido</h2>

    <label>Equipo local</label>
    <select id="equipoLocal"></select>

    <label>Equipo visitante</label>
    <select id="equipoVisitante"></select>

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

    <label>Fecha</label>
    <input type="date" id="fecha">

    <label>Hora</label>
    <input type="time" id="hora">

    <label>Pabellón</label>
<select id="pabellon">
  ${LISTA_PABELLONES.map(p => `
    <option value="${p}">${p}</option>
  `).join("")}
</select>

    <button onclick="guardarNuevoPartido()">💾 Guardar partido</button>
    <button class="volver" onclick="mostrarPartidos()">⬅ Volver</button>
  `;

  // 🔥 LISTENERS (FUERA del HTML)
  document.getElementById("categoria").addEventListener("change", cargarEquiposParaPartido);
  document.getElementById("genero").addEventListener("change", cargarEquiposParaPartido);
  document.getElementById("grupo").addEventListener("change", cargarEquiposParaPartido);

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

    <button onclick="guardarEdicionPartido()">💾 Guardar cambios</button>
    <button class="volver" onclick="mostrarPartidos()">⬅ Volver</button>
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
    return "🏆 FINAL";

  if (fase === "semifinal")
    return "🥈 SEMIFINAL";

  if (fase === "cuartos")
  return "🕔 CUARTOS DE FINAL";
  
  if (fase === "tercer_puesto")
    return "🥉 3.º / 4.º PUESTO";

  if (fase === "quinto_puesto")
    return "5️⃣ 5.º / 6.º PUESTO";

  if (fase === "septimo_puesto")
    return "7️⃣ 7.º / 8.º PUESTO";

  if (fase === "noveno_puesto")
    return "9️⃣ 9.º / 10.º PUESTO";

  if (fase === "grupo_unico")
  return "📋 GRUPO ÚNICO";
  
  if (fase === "serie1")
  return "🔵 SERIE 1";

if (fase === "serie2")
  return "🟣 SERIE 2";
  
  if (fase === "playoff")
    return "⚔️ PLAYOFF";

  return "";

}

function textoGrupoOFase(partido) {
  if (partido.fase && partido.fase !== "grupos") {
    return textoFase(partido.fase); // 🏆 FINAL, 🥈 SEMIFINAL, etc.
  }

  if (partido.grupo) {
    return `🏷️ ${partido.grupo}`;
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

  let adminBloque = adminActivo ? `
    <label>Hora</label>
    <input type="time" id="hora" value="${partidoActual.hora || ""}">

    <label>Lugar</label>
    <input id="pabellon" value="${partidoActual.pabellon || ""}">

    <button onclick="guardarDatosPartido()">💾 Guardar datos</button>
  ` : `
  `;

const fechaBonita = textoFecha(partidoActual.fecha) || "-";

  contenido.innerHTML = `
  <h2 class="sr-only">${equipoLocal?.nombre || "Equipo local"} contra ${equipoVisitante?.nombre || "Equipo visitante"}</h2>

  <div class="info-partido-detalle">

  <div class="detalle-fecha-hora">
    📅 <strong>${fechaBonita}</strong> · 🕒 ${formatearHora(partidoActual.hora)}
  </div>

  <div class="detalle-categoria">
    ${partidoActual.categoria} · ${partidoActual.genero}
  </div>

${partidoActual.fase !== "grupos" ? `
  <div class="badge-fase">
    ${textoFase(partidoActual.fase)}
  </div>
` : ""}

  <div class="detalle-lugar">
    📍 ${partidoActual.pabellon || "-"}
  </div>

</div>

  <div class="marcador-ios">

  <div class="equipo-ios local">
    <img 
      src="${clubLocal?.escudo || PLACEHOLDER_ESCUDO}"
      class="escudo-ios"
      alt="Escudo de ${equipoLocal?.nombre || "equipo local"}"
    >
    <div class="nombre-ios">${equipoLocal?.nombre || "Equipo local"}</div>
    <div class="goles-ios local" id="golesLocal">
      ${partidoActual.goles_local ?? 0}
    </div>
  </div>

  <div class="vs-ios">
    <span>–</span>
  </div>

  <div class="equipo-ios visitante">
    <img 
      src="${clubVisitante?.escudo || PLACEHOLDER_ESCUDO}"
      class="escudo-ios"
      alt="Escudo de ${equipoVisitante?.nombre || "equipo visitante"}"
    >
    <div class="nombre-ios">${equipoVisitante?.nombre || "Equipo visitante"}</div>
    <div class="goles-ios visitante" id="golesVisitante">
      ${partidoActual.goles_visitante ?? 0}
    </div>
  </div>

</div>

  ${adminBloque}

  ${(adminActivo || mesaActiva) ? `
  <div class="marcador-edicion">

    <div class="resultado-directo">
      <label>Resultado</label>
      <input 
        type="number" 
        min="0"
        id="inputLocal"
        value="${partidoActual.goles_local}"
      >
      <span> - </span>
      <input 
        type="number" 
        min="0"
        id="inputVisitante"
        value="${partidoActual.goles_visitante}"
      >
    </div>

    <div class="marcador-botones">
      <button class="btn-local" onclick="cambiarGol('local', 1)">+ Local</button>
      <button class="btn-visitante" onclick="cambiarGol('visitante', 1)">+ Visitante</button>
      <button class="btn-local" onclick="cambiarGol('local', -1)">− Local</button>
      <button class="btn-visitante" onclick="cambiarGol('visitante', -1)">− Visitante</button>
    </div>

    <button onclick="guardarResultado()">💾 Guardar resultado</button>
    <button class="btn-finalizar" onclick="finalizarPartido()">🏁 Finalizar partido</button>

  </div>
` : ""}

  <button class="volver" onclick="mostrarPartidos()">⬅ Volver</button>
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
  html += `<h3>Equipos</h3>`;

  const equiposFiltrados = equipos.filter(e =>
    e.categoria === categoria &&
    e.genero === genero &&
    (!grupo || e.grupo === grupo)
  );

  if (equiposFiltrados.length === 0) {
    html += `<p>No hay equipos en esta categoría</p>`;
  }

  equiposFiltrados.forEach(e => {
  const club = clubes.find(c => c.id === e.club_id);

  html += `
  <div class="card equipo-card" role="button" tabindex="0" onclick="togglePartidosEquipo(${e.id})">
  <img src="${club?.escudo || PLACEHOLDER_ESCUDO}" class="escudo-equipo-mini" alt="" loading="lazy" decoding="async">
  <div class="equipo-info">
    <strong>${e.nombre}</strong>
    <div class="equipo-grupo">${e.grupo}</div>
  </div>

  <div id="partidos-equipo-${e.id}" class="partidos-equipo oculto"></div>
</div>
  `;
});

  document.getElementById("listaCategorias").innerHTML = html;
}

function togglePartidosEquipo(idEquipo) {
  // 🔒 cerrar todos los demás
  document.querySelectorAll(".partidos-equipo").forEach(el => {
    if (el.id !== `partidos-equipo-${idEquipo}`) {
      el.classList.add("oculto");
      el.innerHTML = "";
    }
  });

  const contenedor = document.getElementById(`partidos-equipo-${idEquipo}`);
  if (!contenedor) return;

  // toggle del actual
  if (!contenedor.classList.contains("oculto")) {
    contenedor.classList.add("oculto");
    contenedor.innerHTML = "";
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

  html += `<div class="bloque-partidos"><strong>⏳ Próximos partidos</strong></div>`;
  html += proximos.length
    ? proximos.map(p => renderMiniPartido(p)).join("")
    : `<p class="partido-vacio">No hay próximos partidos</p>`;

  html += `<div class="bloque-partidos"><strong>🏁 Partidos finalizados</strong></div>`;
  html += finalizados.length
    ? finalizados.map(p => renderMiniPartido(p, true)).join("")
    : `<p class="partido-vacio">No hay partidos finalizados</p>`;

  contenedor.innerHTML = html;
  contenedor.classList.remove("oculto");
}

function renderMiniPartido(p, finalizado = false) {
  const local = equipos.find(e => e.id === p.local_id);
  const visitante = equipos.find(e => e.id === p.visitante_id);

  return `
    <div class="card partido-card-mini ${finalizado ? "finalizado" : ""}" role="button" tabindex="0"
         onclick="event.stopPropagation(); abrirPartido(${p.id})">
      <strong>${formatearFecha(p.fecha)}</strong>
      <div>
        ${
          finalizado
            ? `${local?.nombre} ${p.goles_local} - ${p.goles_visitante} ${visitante?.nombre}`
            : `${local?.nombre} vs ${visitante?.nombre}`
        }
      </div>
      ${!finalizado ? `
        <div class="mini-info">
          🕒 ${formatearHora(p.hora)} · 📍 ${p.pabellon || "-"}
        </div>` : ""
      }
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

    <button onclick="guardarNuevoEquipo()">💾 Guardar equipo</button>
    <button class="volver" onclick="mostrarEquipos()">⬅ Volver</button>
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

    <button onclick="guardarEdicionEquipo()">💾 Guardar cambios</button>
    <button class="volver" onclick="mostrarEquipos()">⬅ Volver</button>
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

function renderTablaClasificacion(data) {
  let html = `
    <table class="tabla clasificacion-pro">
      <tr>
        <th class="col-pos">#</th>
        <th class="col-equipo">Equipo</th>
        <th class="col-mini">PJ</th>
        <th class="col-mini">PG</th>
        <th class="col-mini">PE</th>
        <th class="col-mini">PP</th>
        <th class="col-mini">GF</th>
        <th class="col-mini">GC</th>
        <th class="col-mini">DG</th>
        <th class="col-puntos">Pts</th>
      </tr>
  `;

  data.forEach((fila, index) => {
    const equipo = equipos.find(e => e.id === fila.equipo_id);
    const club = clubes.find(c => c.id === equipo?.club_id);

    let posicion = index + 1;
    if (index === 0) posicion = "🥇";
    if (index === 1) posicion = "🥈";
    if (index === 2) posicion = "🥉";

    html += `
      <tr>
        <td class="posicion">${posicion}</td>

        <td>
          <div class="equipo-tabla">
            ${club?.escudo ? `<img src="${club.escudo}" class="escudo-tabla" alt="" loading="lazy" decoding="async">` : ""}
            <span class="nombre-equipo-tabla">${equipo?.nombre || "-"}</span>
          </div>
        </td>

        <td class="col-mini">${fila.pj}</td>
        <td class="col-mini">${fila.pg}</td>
        <td class="col-mini">${fila.pe}</td>
        <td class="col-mini">${fila.pp}</td>
        <td class="col-mini">${fila.gf}</td>
        <td class="col-mini">${fila.gc}</td>
        <td class="col-mini">${fila.gf - fila.gc}</td>
        <td class="col-puntos"><strong>${fila.puntos}</strong></td>
      </tr>
    `;
  });

  html += `</table>`;
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
      
      htmlFinal += `
        <h3 class="titulo-grupo">🏷️ ${nombreGrupo}</h3>
        ${renderTablaClasificacion(datosGrupo)}
      `;
    });
  }
  // 🔵 CASO: UN SOLO GRUPO
  else {
    htmlFinal = renderTablaClasificacion(data);
  }

  if (!data.length) {
    htmlFinal = `<p class="estado-vacio">Todavía no hay clasificación para esta selección.</p>`;
  }

  if (zona) {
    zona.innerHTML = `
    <div class="tabla-wrapper">
      ${htmlFinal}
    </div>
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
      <button onclick="formNuevoClub()">➕ Añadir club</button>
      <button onclick="formNuevoEquipo()">➕ Añadir equipo</button>
    `;
  }

  if (clubes.length === 0) {
    html += `<p>No hay clubes creados</p>`;
  }

  clubes.forEach(c => {
  html += `
    <div class="club-card" role="button" tabindex="0" onclick="verClub(${c.id})">

      <div class="club-info">
        <img src="${c.escudo || PLACEHOLDER_ESCUDO}" class="club-escudo" alt="" loading="lazy" decoding="async">
        <strong>${c.nombre}</strong>
      </div>

      ${adminActivo ? `
        <div class="club-acciones">
          <button onclick="event.stopPropagation(); editarClub(${c.id})">✏️ Editar</button>
          <button onclick="event.stopPropagation(); borrarClub(${c.id})">🗑️ Borrar</button>
        </div>
      ` : ""}

    </div>
  `;
});

  contenido.innerHTML = html;
}

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
    <h2>${club.nombre}</h2>
    <h3>Equipos</h3>
  `;

  if (equiposClub.length === 0) {
    html += `<p>No hay equipos en este club</p>`;
  }

  equiposClub.forEach(e => {
  html += `
    <div class="team-ios-card" data-cat="${e.categoria}">
      <div class="team-ios-header">
        <span class="team-cat">${e.categoria}</span>
        <span class="team-gen">${e.genero}</span>
      </div>

      <div class="team-name">
        ${e.nombre}
      </div>

      <div class="team-group">
        🏷️ ${e.grupo}
      </div>

      ${
        adminActivo ? `
          <div class="team-actions">
            <button onclick="editarEquipo(${e.id})">✏️</button>
            <button onclick="borrarEquipo(${e.id})">🗑️</button>
          </div>
        ` : ""
      }
    </div>
  `;
});

  html += `<button class="volver" onclick="mostrarEquipos()">⬅ Volver</button>`;

  contenido.innerHTML = html;
}

function formNuevoClub() {
  contenido.innerHTML = `
    <h2>Nuevo club</h2>

    <label>Nombre del club</label>
    <input id="nombre">

    <label>Escudo</label>
    <input type="file" id="escudo" accept="image/*">

    <button onclick="guardarNuevoClub()">💾 Guardar</button>
    <button class="volver" onclick="mostrarEquipos()">⬅ Volver</button>
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

    <button onclick="guardarEdicionClub(${id})">💾 Guardar cambios</button>
    <button class="volver" onclick="mostrarEquipos()">⬅ Volver</button>
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

  document.getElementById("contenido").innerHTML = `
    <h2>Pabellones</h2>
    <div class="pabellones-grid">
      ${pabellones.map(p => `
        <div 
  class="pabellon-card" role="button" tabindex="0"
  aria-label="Pabellón ${p}: ${contarPartidos(p)} partidos"
  style="background-image: url('${IMAGENES_PABELLONES[p]}')"
  onclick="mostrarPartidosPorPabellon('${p}')"
>
  <div class="pabellon-overlay">
    <div class="pabellon-nombre">${p}</div>
    <div class="pabellon-contador">
      ${contarPartidos(p)} partidos
    </div>
  </div>
</div>
      `).join("")}
    </div>
  `;
}

/* ================== EXPONER FUNCIONES A HTML ================== */

// navegación principal
window.mostrarHome = mostrarHome;
window.mostrarPartidos = mostrarPartidos;
window.mostrarCategorias = mostrarCategorias;
window.mostrarEquipos = mostrarEquipos;
window.mostrarClasificacion = mostrarClasificacion;
window.mostrarPabellones = mostrarPabellones; // aunque aún no exista, no pasa nada

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

let html = `
  <h2>${pabellon}</h2>

  <div class="pabellon-badges">
    <a
      href="${UBICACIONES_PABELLONES[pabellon] || '#'}"
      target="_blank"
      rel="noopener noreferrer"
      class="badge-glass badge-ubicacion"
    >
      🗺️ Ubicación
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
        🔴 Ver directo
      </a>
    `
    : ``
}
  </div>
`;

  /* ===== PRÓXIMOS ===== */
html += `<h3 class="bloque-titulo">⏳ Próximos partidos</h3>`;
html += proximos.length
  ? renderBloquesPorFecha(proximos, "proximos")
  : `<p>No hay próximos partidos.</p>`;

/* ===== FINALIZADOS ===== */
html += `<h3 class="bloque-titulo">🏁 Partidos finalizados</h3>`;
html += finalizados.length
  ? renderBloquesPorFecha(finalizados, "finalizados")
  : `<p>No hay partidos finalizados.</p>`;

  /* ===== BOTÓN ÚNICO DE VOLVER ===== */
  html += `
    <button class="volver" onclick="mostrarPabellones()">⬅ Volver a pabellones</button>
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
    ? `<strong>📲 Instala la app</strong>
       <span>Ábrela desde tu pantalla de inicio y consulta los partidos aunque falle la cobertura.</span>
       <div class="acciones">
         <button type="button" class="principal" onclick="instalarApp()">Instalar</button>
         <button type="button" onclick="descartarInstalar()">Ahora no</button>
       </div>`
    : `<strong>📲 Instala la app</strong>
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
