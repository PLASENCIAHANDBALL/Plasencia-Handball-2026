import { supabase } from "./supabase.js";

window.onerror = function (msg, url, line, col, error) {
  alert("Error en la app:\n" + msg);
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });
}

if ("caches" in window) {
  caches.keys().then(keys => {
    keys.forEach(key => caches.delete(key));
  });
}

document.body.classList.add("splash-activo");

console.log("✅ app.js cargado");

const contenido = document.getElementById("contenido");

/* ================== ESTADO GLOBAL ================== */
const PIN_ADMIN = "1234";
const PIN_MESA = "5678";

let rolUsuario = localStorage.getItem("rol") || null;

let adminActivo = rolUsuario === "admin";
let mesaActiva = rolUsuario === "mesa";

let clubes = [];

let clasificacionFiltro = {
  categoria: "Infantil",
  genero: "Masculino",
  grupo: ""
};

let partidos = [];

let partidoActual = null;

let grupos = typeof obtenerGrupos === "function"
  ? obtenerGrupos()
  : [];

let grupoActual = null;

let equipos = [];

let equipoActual = null;

let patrocinadores = [];

function refrescarVistaActual() {
  // Detecta qué vista estás usando y la vuelve a pintar
  if (document.querySelector("h2")?.textContent.includes("Partidos")) {
    mostrarPartidos();
  } else if (document.querySelector("h2")?.textContent.includes("Editar partido")) {
    editarPartido(partidoActual.id);
  } else if (document.querySelector("h2")?.textContent.includes("vs")) {
    abrirPartido(partidoActual.id);
  } else if (document.querySelector("h2")?.textContent.includes("Categorías")) {
    mostrarCategorias();
  }
}

function cambiarVistaConAnimacion(html, tipo = "slide") {
  contenido.classList.remove("fade-enter", "slide-enter");
  contenido.innerHTML = html;

  // fuerza reflow para reiniciar animación
  void contenido.offsetWidth;

  contenido.classList.add(tipo === "fade" ? "fade-enter" : "slide-enter");
}

function formatearHora(hora24) {
  if (!hora24) return "-";

  const [h, m] = hora24.split(":").map(Number);
  const ampm = h >= 12 ? "p. m." : "a. m.";
  const hora12 = h % 12 || 12;

  return `${hora12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
/* ================== supabase ================== */
async function probarSupabase() {
  const { data, error } = await supabase
    .from("clubes")
    .select("*");

  console.log("CLUBES DESDE SUPABASE:", data);
  console.log("ERROR:", error);
}

probarSupabase();

/* ================== HOME ================== */
function mostrarHome() {
  let html = `
    <h2>Inicio</h2>
<section class="galeria2026">
  <div id="galeria2026-scroll" class="galeria2026-scroll">
    <div class="galeria2026-loading">Cargando imágenes…</div>
  </div>
</section>
    
    <!-- GALERÍA -->
    <section class="galeria">
      <div id="galeria-scroll" class="galeria-scroll">
        <div class="galeria-loading">Cargando imágenes…</div>
      </div>
    </section>

    <!-- PATROCINADORES -->
    <h3>Patrocinadores</h3>
    <div class="patrocinadores-scroll">
  `;

  patrocinadores.forEach(p => {
    html += `
      <div class="patrocinador-card" onclick="abrirWeb('${p.web}')">
        ${adminActivo ? `
          <button class="btn-borrar-patrocinador"
            onclick="event.stopPropagation(); borrarPatrocinador(${p.id})">
            ✖
          </button>
        ` : ""}
        <img src="${p.imagen}">
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

  // cargar galería
  requestAnimationFrame(() => {
    cargarGaleria2025();
    cargarGaleria2026();
  });
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

function abrirWeb(url) {
  if (!url) return;
  window.open(url, "_blank");
}

async function iniciarApp() {
  try {
    document.body.classList.add("splash-activo");

    clubes = await obtenerClubesSupabase();
    equipos = await obtenerEquiposSupabase();
    partidos = await obtenerPartidosSupabase();
    patrocinadores = await obtenerPatrocinadoresSupabase();

    mostrarHome();

  } catch (e) {
    console.error("Error iniciando app:", e);
    alert("Error cargando datos");
  } finally {
    document.body.classList.remove("splash-activo");

    const splash = document.getElementById("splash");
    if (splash) {
      splash.classList.add("splash-hide");

      setTimeout(() => {
        splash.remove();
      }, 600);
    }
  }
}

/* ================== GALERÍA ================== */
function cargarGaleria2026() {
  const contenedor = document.getElementById("galeria2026-scroll");
  if (!contenedor) return;

  const urlCarpeta = "https://www.amazon.es/photos/share/TxSZwjC6rqwphi90RIM8zuamYEm31y31Z92Zm39SfHk";

  contenedor.innerHTML = `
  <a href="${urlCarpeta}" target="_blank" class="galeria-badge">
    <div class="badge-icon">
      <img src="img/iconos/fotos.png" alt="Fotos torneo 2026">
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
  <a href="${urlCarpeta2025}" target="_blank" class="galeria-badge">
    <div class="badge-icon">
      <img src="img/iconos/fotos.png" alt="Fotos torneo 2025">
    </div>
    <div class="badge-texto">
      <strong>Torneo 2025</strong>
      <span>Ver carpeta de fotos</span>
    </div>
  </a>
`;
}

/* ================== GALERÍA (SUPABASE) ================== */
function setNavActivo(boton) {
  document.querySelectorAll('.nav-principal button')
    .forEach(b => b.classList.remove('activo'));

  boton.classList.add('activo');
}

/* ================== PATROCINADORES (SUPABASE) ================== */

async function obtenerPatrocinadoresSupabase() {
  const { data, error } = await supabase
    .from("patrocinadores")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error cargando patrocinadores:", error);
    return [];
  }

  return data;
}

async function crearPatrocinadorSupabase(patrocinador) {
  const { error } = await supabase
    .from("patrocinadores")
    .insert([patrocinador]);

  if (error) {
    alert("Error guardando patrocinador");
    console.error(error);
  }
}

async function borrarPatrocinadorSupabase(id) {
  const { error } = await supabase
    .from("patrocinadores")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error borrando patrocinador");
    console.error(error);
  }
}

/* ================== PARTIDOS ================== */
function refrescarPartidos() {
  partidos = obtenerPartidos();
  mostrarPartidos();
}

function mostrarPartidos() {
  let html = `<h2>Partidos</h2>`;

  if (adminActivo) {
    html += `<button onclick="formNuevoPartido()">➕ Crear partido</button>`;
  }

  // 🔹 ordenar por fecha + hora
  const ordenados = [...partidos].sort((a, b) => {
    const fa = new Date(`${a.fecha}T${a.hora || "00:00"}`);
    const fb = new Date(`${b.fecha}T${b.hora || "00:00"}`);
    return fa - fb;
  });

  const proximos = ordenados.filter(p => p.estado !== "finalizado");
  const finalizados = ordenados.filter(p => p.estado === "finalizado").reverse();

  /* ===== PRÓXIMOS ===== */
  html += `<h3 class="bloque-titulo">⏳ Próximos partidos</h3>`;

  if (proximos.length === 0) {
    html += `<p>No hay próximos partidos</p>`;
  }

  proximos.forEach(p => {
    html += renderPartidoCard(p);
  });

  /* ===== FINALIZADOS ===== */
  html += `<h3 class="bloque-titulo">🏁 Partidos finalizados</h3>`;

  if (finalizados.length === 0) {
    html += `<p>No hay partidos finalizados</p>`;
  }

  finalizados.forEach(p => {
    html += renderPartidoCard(p);
  });

  contenido.innerHTML = html;
}

function renderPartidoCard(p) {
  const estadoReal = calcularEstadoPartido(p);
  const equipoLocal = equipos.find(e => e.id === p.local_id);
  const equipoVisitante = equipos.find(e => e.id === p.visitante_id);

  const clubLocal = clubes.find(c => c.id === equipoLocal?.club_id);
  const clubVisitante = clubes.find(c => c.id === equipoVisitante?.club_id);

  const fechaBonita = p.fecha
    ? new Date(p.fecha).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "2-digit",
        month: "long"
      })
    : "";

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

      <div class="partido-equipos">
        <div class="equipo-partido">
          ${clubLocal?.escudo ? `<img src="${clubLocal.escudo}" class="escudo-partido">` : ""}
          <span>${equipoLocal?.nombre || "-"}</span>
        </div>

        <span class="vs">vs</span>

        <div class="equipo-partido">
          ${clubVisitante?.escudo ? `<img src="${clubVisitante.escudo}" class="escudo-partido">` : ""}
          <span>${equipoVisitante?.nombre || "-"}</span>
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
        🕒 ${formatearHora(p.hora)} · 📍 ${p.lugar || "-"}
      </div>

      <div class="partido-grupo">🏷️ ${p.grupo}</div>

      ${
        p.estado === "finalizado"
          ? `<div class="resultado-final"><strong>${p.goles_local} - ${p.goles_visitante}</strong></div>`
          : ""
      }

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

    <label>Lugar</label>
    <input id="lugar" placeholder="Pabellón / pista">

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

  contenido.innerHTML = `
    <h2>Editar partido</h2>

    <label>Equipo local</label>
    <input id="local" value="${partidoActual.local}">

    <label>Equipo visitante</label>
    <input id="visitante" value="${partidoActual.visitante}">

    <label>Categoría</label>
    <select id="categoria">
      <option ${partidoActual.categoria==="Infantil"?"selected":""}>Infantil</option>
      <option ${partidoActual.categoria==="Cadete"?"selected":""}>Cadete</option>
      <option ${partidoActual.categoria==="Juvenil"?"selected":""}>Juvenil</option>
    </select>

    <label>Género</label>
    <select id="genero">
      <option ${partidoActual.genero==="Masculino"?"selected":""}>Masculino</option>
      <option ${partidoActual.genero==="Femenino"?"selected":""}>Femenino</option>
    </select>

    <label>Grupo</label>
    <select id="grupo">
      <option ${partidoActual.grupo==="Grupo A"?"selected":""}>Grupo A</option>
      <option ${partidoActual.grupo==="Grupo B"?"selected":""}>Grupo B</option>
      <option ${partidoActual.grupo==="Grupo C"?"selected":""}>Grupo C</option>
      <option ${partidoActual.grupo==="Grupo D"?"selected":""}>Grupo D</option>
      <option ${partidoActual.grupo==="Grupo Único"?"selected":""}>Grupo Único</option>
    </select>

    <label>Hora</label>
    <input type="time" id="hora" value="${partidoActual.hora || ""}">

    <label>Lugar</label>
    <input id="lugar" value="${partidoActual.lugar || ""}">

    <button onclick="guardarEdicionPartido()">💾 Guardar cambios</button>
    <button class="volver" onclick="mostrarPartidos()">⬅ Volver</button>
  `;
}

function guardarEdicionPartido() {
  partidoActual.local = document.getElementById("local").value;
  partidoActual.visitante = document.getElementById("visitante").value;
  partidoActual.categoria = document.getElementById("categoria").value;
  partidoActual.genero = document.getElementById("genero").value;
  partidoActual.grupo = document.getElementById("grupo").value;
  partidoActual.hora = document.getElementById("hora").value;
  partidoActual.lugar = document.getElementById("lugar").value;

  partidos = partidos.map(p =>
    p.id === partidoActual.id ? partidoActual : p
  );

  guardarPartidos(partidos);
  mostrarPartidos();
}

function abrirPartido(id) {
  partidoActual = partidos.find(p => p.id === id);
  if (!partidoActual) return;

  const equipoLocal = equipos.find(e => e.id === partidoActual.local_id);
  const equipoVisitante = equipos.find(e => e.id === partidoActual.visitante_id);

  const clubLocal = clubes.find(c => c.id === equipoLocal?.club_id);
  const clubVisitante = clubes.find(c => c.id === equipoVisitante?.club_id);

  let adminBloque = adminActivo ? `
    <label>Hora</label>
    <input type="time" id="hora" value="${partidoActual.hora || ""}">

    <label>Lugar</label>
    <input id="lugar" value="${partidoActual.lugar || ""}">

    <button onclick="guardarDatosPartido()">💾 Guardar datos</button>
  ` : `
  `;

const fechaBonita = partidoActual.fecha
  ? new Date(partidoActual.fecha).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "2-digit",
      month: "long"
    })
  : "-";
  
  contenido.innerHTML = `
  <div class="info-partido-detalle">

  <div class="detalle-fecha-hora">
    📅 <strong>${fechaBonita}</strong> · 🕒 ${formatearHora(partidoActual.hora)}
  </div>

  <div class="detalle-categoria">
    ${partidoActual.categoria} · ${partidoActual.genero}
  </div>

  <div class="detalle-lugar">
    📍 ${partidoActual.lugar || "-"}
  </div>

</div>

  <div class="marcador-pro">

  <div class="equipo-marcador local">
  <img 
    src="${clubLocal?.escudo || 'img/club-placeholder.png'}"
    class="escudo-marcador"
    alt="${equipoLocal?.nombre}"
  >
  <div class="nombre-equipo">${equipoLocal?.nombre || "Equipo local"}</div>
  <div class="goles" id="golesLocal">${partidoActual.goles_local ?? 0}</div>
</div>

  <div class="separador">–</div>

  <div class="equipo-marcador visitante">
  <img 
    src="${clubVisitante?.escudo || 'img/club-placeholder.png'}"
    class="escudo-marcador"
    alt="${equipoVisitante?.nombre}"
  >
  <div class="nombre-equipo">${equipoVisitante?.nombre || "Equipo visitante"}</div>
  <div class="goles" id="golesVisitante">${partidoActual.goles_visitante ?? 0}</div>
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

async function finalizarPartido() {
  if (!confirm("¿Finalizar este partido?")) return;

  partidoActual.estado = "finalizado";

  const { error } = await supabase
    .from("partidos")
    .update({
      estado: "finalizado",
      goles_local: partidoActual.goles_local,
      goles_visitante: partidoActual.goles_visitante
    })
    .eq("id", partidoActual.id);

  if (error) {
    console.error(error);
    alert("Error finalizando partido");
    return;
  }

  document.dispatchEvent(new Event("partido-finalizado"));

  alert("Partido finalizado");
  
  await guardarClasificacionSupabase(
  partidoActual.categoria,
  partidoActual.genero,
  partidoActual.grupo
);

  mostrarPartidos();
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

function refrescarVistaPartido() {
  const index = partidos.findIndex(p => p.id === partidoActual.id);
  if (index !== -1) {
    partidoActual = partidos[index];
  }
  abrirPartido(partidoActual.id);
}

function guardarDatosPartido() {
  partidoActual.hora = document.getElementById("hora").value;
  partidoActual.lugar = document.getElementById("lugar").value;
  actualizarPartido();
}

function actualizarPartido() {
  partidos = partidos.map(p =>
    p.id === partidoActual.id ? partidoActual : p
  );
  guardarPartidos(partidos);
  abrirPartido(partidoActual.id);
}

async function borrarPartido(id) {
  if (!confirm("¿Eliminar este partido definitivamente?")) return;

  const partido = partidos.find(p => p.id === id);

  await borrarPartidoSupabase(id);

  partidos = await obtenerPartidosSupabase();

  // 🔥 recalcular clasificación SI estaba finalizado
  if (partido?.estado === "finalizado") {
    await guardarClasificacionSupabase(
      partido.categoria,
      partido.genero,
      partido.grupo
    );
  }

  mostrarPartidos();
  actualizarClasificacion();
}

function calcularEstadoPartido(partido) {
  if (partido.estado === "finalizado") return "finalizado";

  if (!partido.fecha || !partido.hora) return "pendiente";

  const ahora = new Date();

  const inicio = new Date(`${partido.fecha}T${partido.hora}`);
  const DURACION_MINUTOS = 50; // AJUSTA si quieres
  const fin = new Date(inicio.getTime() + DURACION_MINUTOS * 60000);

  if (ahora >= inicio && ahora <= fin) {
    return "en_juego";
  }

  if (ahora < inicio) {
    return "pendiente";
  }

  return "pendiente";
}

async function guardarResultado() {
  const inputLocal = document.getElementById("inputLocal");
  const inputVisitante = document.getElementById("inputVisitante");

  if (!inputLocal || !inputVisitante) {
    alert("No hay inputs de resultado disponibles");
    return;
  }

  const golesLocal = Number(inputLocal.value);
  const golesVisitante = Number(inputVisitante.value);

  if (golesLocal < 0 || golesVisitante < 0) {
    alert("Los goles no pueden ser negativos");
    return;
  }

  partidoActual.goles_local = golesLocal;
  partidoActual.goles_visitante = golesVisitante;

  const { error } = await supabase
    .from("partidos")
    .update({
      goles_local: golesLocal,
      goles_visitante: golesVisitante
    })
    .eq("id", partidoActual.id);

  if (error) {
    console.error(error);
    alert("Error guardando resultado");
    return;
  }

  abrirPartido(partidoActual.id);
}

/* ================== ADMIN ================== */
function toggleAdmin() {
  if (rolUsuario) {
    // salir
    rolUsuario = null;
    adminActivo = false;
    mesaActiva = false;
    localStorage.removeItem("rol");
    document.getElementById("admin-fab")?.classList.remove("admin-activo");
    alert("Sesión cerrada");
    refrescarVistaActual();
    return;
  }

  const pin = prompt("Introduce PIN:");
  if (pin === PIN_ADMIN) {
    rolUsuario = "admin";
    adminActivo = true;
    mesaActiva = false;
    localStorage.setItem("rol", "admin");
    document.getElementById("admin-fab")?.classList.add("admin-activo");
    alert("Modo ADMIN activado");
  } 
  else if (pin === PIN_MESA) {
    rolUsuario = "mesa";
    adminActivo = false;
    mesaActiva = true;
    document.getElementById("admin-fab")?.classList.add("admin-activo");
    localStorage.setItem("rol", "mesa");
    alert("Modo MESA activado");
  } 
  else {
    alert("PIN incorrecto");
  }

  refrescarVistaActual();
}

function salirAdmin() {
  adminActivo = false;
  localStorage.removeItem("admin");
  mostrarPartidos();
}

/* ================== INICIO ================== */
async function guardarNuevoPatrocinador() {
  const nombre = document.getElementById("nombre").value;
  const web = document.getElementById("web").value;
  const file = document.getElementById("imagen").files[0];

  if (!nombre || !file) {
    alert("Nombre y logo son obligatorios");
    return;
  }

  const reader = new FileReader();

  reader.onload = async () => {
    const { error } = await supabase
      .from("patrocinadores")
      .insert({
        nombre,
        web,
        imagen: reader.result
      });

    if (error) {
      console.error(error);
      alert("Error guardando patrocinador");
      return;
    }

    patrocinadores = await obtenerPatrocinadoresSupabase();
    mostrarHome();
  };

  reader.readAsDataURL(file);
}

async function borrarPatrocinador(id) {
  if (!confirm("¿Eliminar este patrocinador?")) return;

  const { error } = await supabase
    .from("patrocinadores")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Error borrando patrocinador");
    return;
  }

  patrocinadores = await obtenerPatrocinadoresSupabase();
  mostrarHome();
}

/* ================== CLASIFICACION SUPABASE ================== */
async function actualizarClasificacionSupabase(partido) {
  const equiposPartido = [
    { id: partido.local_id, goles: partido.goles_local, rival: partido.goles_visitante },
    { id: partido.visitante_id, goles: partido.goles_visitante, rival: partido.goles_local }
  ];

  for (const e of equiposPartido) {
    const esLocal = e.id === partido.local_id;

    let pg = 0, pe = 0, pp = 0, puntos = 0;

    if (e.goles > e.rival) {
      pg = 1;
      puntos = 2;
    } else if (e.goles === e.rival) {
      pe = 1;
      puntos = 1;
    } else {
      pp = 1;
    }

    const { error } = await supabase.rpc("actualizar_clasificacion", {
      p_equipo_id: e.id,
      p_categoria: partido.categoria,
      p_genero: partido.genero,
      p_grupo: partido.grupo,
      p_pg: pg,
      p_pe: pe,
      p_pp: pp,
      p_gf: e.goles,
      p_gc: e.rival,
      p_puntos: puntos
    });

    if (error) {
      console.error("Error actualizando clasificación:", error);
    }
  }
}

/* ================== CLUBES SUPABASE ================== */
async function obtenerClubesSupabase() {
  const { data, error } = await supabase
    .from("clubes")
    .select("*")
    .order("id");

  if (error) {
    console.error("Error cargando clubes:", error);
    return [];
  }

  return data;
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

  return data;
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
    alert("Error creando equipo");
    console.error(error);
  }
}

async function editarEquipoSupabase(id, cambios) {
  const { error } = await supabase
    .from("equipos")
    .update(cambios)
    .eq("id", id);

  if (error) {
    alert("Error editando equipo");
    console.error(error);
  }
}

async function borrarEquipoSupabase(id) {
  const { error } = await supabase
    .from("equipos")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error borrando equipo");
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

  return data;
}

/* ================== PARTIDOS (SUPABASE) ================== */
async function obtenerPartidosSupabase() {
  const { data, error } = await supabase
    .from("partidos")
    .select("*")
    .order("fecha", { ascending: true });

  if (error) {
    console.error("Error cargando partidos:", error);
    return [];
  }

  return data;
}

async function cargarDatos() {
  clubes = await obtenerClubesSupabase();
  equipos = await obtenerEquiposSupabase();
  partidos = await obtenerPartidosSupabase();
  patrocinadores = await obtenerPatrocinadoresSupabase();
  mostrarHome();
}

async function crearPartidoSupabase(partido) {
  const { error } = await supabase
    .from("partidos")
    .insert([partido]);

  if (error) {
    alert("Error creando partido");
    console.error(error);
  }
}

async function editarPartidoSupabase(id, cambios) {
  const { error } = await supabase
    .from("partidos")
    .update(cambios)
    .eq("id", id);

  if (error) {
    alert("Error editando partido");
    console.error(error);
  }
}

async function borrarPartidoSupabase(id) {
  const { error } = await supabase
    .from("partidos")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error borrando partido");
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
    lugar: document.getElementById("lugar").value,
    goles_local: 0,
    goles_visitante: 0,
    estado: "pendiente"
  };

  const { error } = await supabase
    .from("partidos")
    .insert([nuevoPartido]);

  if (error) {
    console.error(error);
    alert("Error guardando partido");
    return;
  }

  partidos = await obtenerPartidosSupabase();
  mostrarPartidos();
}

/* ================== GRUPOS ================== */
function mostrarGrupos() {
  let html = `<h2>Grupos</h2>`;

  if (adminActivo) {
    html += `<button onclick="formNuevoGrupo()">➕ Crear grupo</button>`;
  }

  grupos.forEach(g => {
    html += `
      <div class="card">
        <h3>${g.categoria} ${g.genero}</h3>
        <p><strong>${g.nombre}</strong></p>
        <ul>
          ${g.equipos.map(e => `<li>${e}</li>`).join("")}
        </ul>
        ${adminActivo ? `<button onclick="editarGrupo(${g.id})">✏️ Editar</button>` : ""}
      </div>
    `;
  });

  contenido.innerHTML = html;
}

function formNuevoGrupo() {
  contenido.innerHTML = `
    <h2>Nuevo grupo</h2>

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

    <label>Nombre del grupo</label>
    <input id="nombre" placeholder="Grupo A">

    <label>Equipos (uno por línea)</label>
    <textarea id="equipos" rows="5"></textarea>

    <button onclick="guardarNuevoGrupo()">💾 Guardar grupo</button>
    <button class="volver" onclick="mostrarGrupos()">⬅ Volver</button>
  `;
}

function guardarNuevoGrupo() {
  const categoria = document.getElementById("categoria").value;
  const genero = document.getElementById("genero").value;
  const nombre = document.getElementById("nombre").value;
  const equipos = document.getElementById("equipos").value
    .split("\n")
    .filter(e => e.trim() !== "");

  const nuevoGrupo = {
    id: Date.now(),
    categoria,
    genero,
    nombre,
    equipos
  };

  grupos.push(nuevoGrupo);
  guardarGrupos(grupos);
  mostrarGrupos();
}

function editarGrupo(id) {
  grupoActual = grupos.find(g => g.id === id);

  contenido.innerHTML = `
    <h2>Editar grupo</h2>

    <label>Categoría</label>
    <select id="categoria">
      <option ${grupoActual.categoria==="Infantil"?"selected":""}>Infantil</option>
      <option ${grupoActual.categoria==="Cadete"?"selected":""}>Cadete</option>
      <option ${grupoActual.categoria==="Juvenil"?"selected":""}>Juvenil</option>
    </select>

    <label>Género</label>
    <select id="genero">
      <option ${grupoActual.genero==="Masculino"?"selected":""}>Masculino</option>
      <option ${grupoActual.genero==="Femenino"?"selected":""}>Femenino</option>
    </select>

    <label>Nombre</label>
    <input id="nombre" value="${grupoActual.nombre}">

    <label>Equipos</label>
    <textarea id="equipos" rows="5">${grupoActual.equipos.join("\n")}</textarea>

    <button onclick="guardarEdicionGrupo()">💾 Guardar cambios</button>
    <button class="volver" onclick="mostrarGrupos()">⬅ Volver</button>
  `;
}

function guardarEdicionGrupo() {
  grupoActual.categoria = document.getElementById("categoria").value;
  grupoActual.genero = document.getElementById("genero").value;
  grupoActual.nombre = document.getElementById("nombre").value;
  grupoActual.equipos = document.getElementById("equipos").value
    .split("\n")
    .filter(e => e.trim() !== "");

  grupos = grupos.map(g => g.id === grupoActual.id ? grupoActual : g);
  guardarGrupos(grupos);
  mostrarGrupos();
}

/* ================== CATEGORIAS ================== */
function mostrarCategorias() {
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
  <div class="card equipo-card" onclick="togglePartidosEquipo(${e.id})">
  <img src="${club?.escudo || 'img/club-placeholder.png'}" class="escudo-equipo-mini">
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
  const contenedor = document.getElementById(`partidos-equipo-${idEquipo}`);
  if (!contenedor) return;

  // cerrar si ya está abierto
  if (!contenedor.classList.contains("oculto")) {
    contenedor.classList.add("oculto");
    contenedor.innerHTML = "";
    return;
  }

  const partidosEquipo = partidos.filter(p =>
    p.local_id === idEquipo || p.visitante_id === idEquipo
  );

  const proximos = partidosEquipo.filter(p => p.estado !== "finalizado");
  const finalizados = partidosEquipo.filter(p => p.estado === "finalizado");

  let html = "";

  // 🔹 Próximos
  html += `<div class="bloque-partidos"><strong>⏳ Próximos partidos</strong></div>`;
  if (proximos.length === 0) {
    html += `<p class="partido-vacio">No hay próximos partidos</p>`;
  } else {
    html += proximos.map(p => {
  const local = equipos.find(e => e.id === p.local_id);
  const visitante = equipos.find(e => e.id === p.visitante_id);

  return `
    <div class="card partido-card-mini" onclick="event.stopPropagation(); abrirPartido(${p.id})">
      <strong>${new Date(p.fecha).toLocaleDateString("es-ES")}</strong>
      <div>${local?.nombre} vs ${visitante?.nombre}</div>
      <div class="mini-info">
        🕒 ${formatearHora(p.hora)} · 📍 ${p.lugar || "-"}
      </div>
    </div>
  `;
}).join("");
  }

  // 🔹 Finalizados
  html += `<div class="bloque-partidos"><strong>🏁 Partidos finalizados</strong></div>`;
  if (finalizados.length === 0) {
    html += `<p class="partido-vacio">No hay partidos finalizados</p>`;
  } else {
    html += finalizados.map(p => {
  const local = equipos.find(e => e.id === p.local_id);
  const visitante = equipos.find(e => e.id === p.visitante_id);

  return `
    <div class="card partido-card-mini finalizado" onclick="event.stopPropagation(); abrirPartido(${p.id})">
      <strong>${new Date(p.fecha).toLocaleDateString("es-ES")}</strong>
      <div>
        ${local?.nombre} ${p.goles_local} - ${p.goles_visitante} ${visitante?.nombre}
      </div>
    </div>
  `;
}).join("");
  }

  contenedor.innerHTML = html;
  contenedor.classList.remove("oculto");
}

function volverCategoriasAnimado() {
  mostrarCategorias();
  contenido.classList.remove("fade-enter", "slide-enter");
  void contenido.offsetWidth;
  contenido.classList.add("fade-enter");
}

function formNuevoEquipo() {
  if (clubes.length === 0) {
    alert("Primero debes crear un club");
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
  equipos = await obtenerEquiposSupabase();
  mostrarEquipos();
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
  await editarEquipoSupabase(equipoActual.id, {
    nombre: document.getElementById("nombre").value,
    categoria: document.getElementById("categoria").value,
    genero: document.getElementById("genero").value,
    grupo: document.getElementById("grupo").value
  });

  equipos = await obtenerEquiposSupabase();
  mostrarCategorias();
}

async function borrarEquipo(id) {
  if (!confirm("¿Eliminar este equipo?")) return;

  await borrarEquipoSupabase(id);
  equipos = await obtenerEquiposSupabase();
  mostrarCategorias();
}

/* ================== CLASIFICACION ================== */
function mostrarClasificacion() {
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
            ${club?.escudo ? `<img src="${club.escudo}" class="escudo-tabla">` : ""}
            <span class="nombre-equipo-tabla">${equipo?.nombre || "-"}</span>
          </div>
        </td>

        <td class="col-mini">${fila.pj}</td>
        <td class="col-mini">${fila.pg}</td>
        <td class="col-mini">${fila.pe}</td>
        <td class="col-mini">${fila.pp}</td>
        <td class="col-mini">${fila.gf}</td>
        <td class="col-mini">${fila.gc}</td>
        <td class="col-puntos"><strong>${fila.puntos}</strong></td>
      </tr>
    `;
  });

  html += `</table>`;
  return html;
}

async function actualizarClasificacion() {
  const catEl = document.getElementById("clas-cat");
  const genEl = document.getElementById("clas-gen");
  const grpEl = document.getElementById("clas-grp");

  if (!catEl || !genEl || !grpEl) return;

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

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return;
  }

  let htmlFinal = "";

  // 🔥 CASO: TODOS LOS GRUPOS
  if (!grupoSeleccionado) {
    const grupos = [...new Set(data.map(d => d.grupo))].sort();

    grupos.forEach(nombreGrupo => {
      const datosGrupo = data.filter(d => d.grupo === nombreGrupo);

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

  document.getElementById("tablaClasificacion").innerHTML = `
    <div class="tabla-wrapper">
      ${htmlFinal}
    </div>
  `;
}

async function guardarClasificacionSupabase(categoria, genero, grupo) {
  const clasificacion = calcularClasificacion(
    categoria,
    genero,
    grupo,
    equipos,
    partidos
  );

  // 1️⃣ borrar clasificación anterior de ese grupo
  await supabase
    .from("clasificacion")
    .delete()
    .eq("categoria", categoria)
    .eq("genero", genero)
    .eq("grupo", grupo);

  // 2️⃣ insertar nueva
  const filas = clasificacion.map(e => {
    const equipo = equipos.find(eq => eq.nombre === e.nombre);
    return {
      categoria,
      genero,
      grupo,
      equipo_id: equipo.id,
      pj: e.pj,
      pg: e.pg,
      pe: e.pe,
      pp: e.pp,
      gf: e.gf,
      gc: e.gc,
      puntos: e.puntos
    };
  });

  const { error } = await supabase
    .from("clasificacion")
    .insert(filas);

  if (error) {
    console.error("Error guardando clasificación:", error);
  }
}

function calcularClasificacion(categoria, genero, grupo, equipos, partidos) {
  const equiposGrupo = equipos.filter(e =>
    e.categoria === categoria &&
    e.genero === genero &&
    e.grupo === grupo
  );

  return equiposGrupo.map(eq => {
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
        pg++; puntos += 2;
      } else if (golesF === golesC) {
        pe++; puntos += 1;
      } else {
        pp++;
      }
    });

    return { nombre: eq.nombre, pj, pg, pe, pp, gf, gc, puntos };
  }).sort((a, b) =>
    b.puntos - a.puntos || (b.gf - b.gc) - (a.gf - a.gc)
  );
}

/* ================== EQUIPOS GRUPO ================== */
function mostrarEquipos() {
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
    <div class="club-card" onclick="verClub(${c.id})">

      <div class="club-info">
        <img src="${c.escudo}" class="club-escudo">
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
      <div class="card">
        <strong>${e.nombre}</strong>
        <div>${e.categoria} · ${e.genero} · ${e.grupo}</div>

        ${adminActivo ? `
          <button onclick="editarEquipo(${e.id})">✏️ Editar</button>
          <button onclick="borrarEquipo(${e.id})">🗑️ Borrar</button>
        ` : ""}
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

async function guardarNuevoClub() {
  const nombre = document.getElementById("nombre").value;
  const file = document.getElementById("escudo").files[0];

  if (!file) {
    alert("Selecciona un escudo");
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    const { error } = await supabase
      .from("clubes")
      .insert({
        nombre,
        escudo: reader.result
      });

    if (error) {
      alert("Error guardando club");
      console.error(error);
      return;
    }

    await cargarClubes(); // 🔥 recarga desde Supabase
    mostrarEquipos();
  };

  reader.readAsDataURL(file);
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

  const nuevoNombre = document.getElementById("nombre").value;
  const file = document.getElementById("escudo").files[0];

  let escudoFinal = club.escudo;

  if (file) {
    const reader = new FileReader();
    reader.onload = async () => {
      escudoFinal = reader.result;

      const { error } = await supabase
        .from("clubes")
        .update({
          nombre: nuevoNombre,
          escudo: escudoFinal
        })
        .eq("id", id);

      if (error) {
        alert("Error al editar club");
        console.error(error);
        return;
      }

      await cargarClubes();
      mostrarEquipos();
    };

    reader.readAsDataURL(file);
  } else {
    const { error } = await supabase
      .from("clubes")
      .update({
        nombre: nuevoNombre
      })
      .eq("id", id);

    if (error) {
      alert("Error al editar club");
      console.error(error);
      return;
    }

    await cargarClubes();
    mostrarEquipos();
  }
}

async function borrarClub(id) {
  const club = clubes.find(c => c.id === id);
  if (!club) return;

  if (!confirm(`¿Eliminar el club "${club.nombre}"?`)) return;

  const { error } = await supabase
    .from("clubes")
    .delete()
    .eq("id", id);

  await cargarClubes();
  mostrarEquipos();
}

function formNuevoEquipoClub(clubId) {
  contenido.innerHTML = `
    <h2>Nuevo equipo</h2>

    <label>Nombre del equipo</label>
    <input id="nombre">

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

    <button onclick="guardarNuevoEquipoClub(${clubId})">💾 Guardar</button>
    <button class="volver" onclick="verClub(${clubId})">⬅ Volver</button>
  `;
}

function guardarNuevoEquipoClub(clubId) {
  const nuevo = {
    id: Date.now(),
    nombre: document.getElementById("nombre").value,
    categoria: document.getElementById("categoria").value,
    genero: document.getElementById("genero").value,
    grupo: document.getElementById("grupo").value,
    clubId
  };

  equipos.push(nuevo);
  guardarEquipos(equipos);

  verClub(clubId);
}
/* ================== PABELLONES ================== */
function mostrarPabellones() {
  contenido.innerHTML = `
    <h2>Pabellones</h2>
    <p>Sección en construcción</p>
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

// categorías / equipos
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
window.formNuevoEquipoClub = formNuevoEquipoClub;
window.guardarNuevoEquipoClub = guardarNuevoEquipoClub;

// grupos
window.mostrarGrupos = mostrarGrupos;
window.formNuevoGrupo = formNuevoGrupo;
window.guardarNuevoGrupo = guardarNuevoGrupo;
window.editarGrupo = editarGrupo;
window.guardarEdicionGrupo = guardarEdicionGrupo;

// patrocinadores
window.guardarNuevoPatrocinador = guardarNuevoPatrocinador;
window.borrarPatrocinador = borrarPatrocinador;

// patrocinadores
window.formNuevoPatrocinador = formNuevoPatrocinador;

// equipos
window.guardarEdicionEquipo = guardarEdicionEquipo;

// clasificación
window.actualizarClasificacion = actualizarClasificacion;

// utilidades usadas en HTML
window.abrirWeb = abrirWeb;

window.setNavActivo = function (boton) {
  document
    .querySelectorAll('.nav-principal button')
    .forEach(b => b.classList.remove('activo'));

  boton.classList.add('activo');
};

/* ================== ARRANQUE ================== */
window.addEventListener("load", () => {
  iniciarApp();

  if (adminActivo) {
    document.getElementById("admin-fab")?.classList.add("admin-activo");
  }
});
