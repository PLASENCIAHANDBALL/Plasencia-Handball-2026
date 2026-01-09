console.log("✅ app.js cargado");

const contenido = document.getElementById("contenido");

/* ================== ESTADO GLOBAL ================== */
const PIN_ADMIN = "1234";
const PIN_MESA = "5678";

let rolUsuario = localStorage.getItem("rol") || null;

let adminActivo = rolUsuario === "admin";
let mesaActiva = rolUsuario === "mesa";

let partidos = typeof obtenerPartidos === "function"
  ? obtenerPartidos()
  : [];

let partidoActual = null;

let grupos = typeof obtenerGrupos === "function"
  ? obtenerGrupos()
  : [];

let grupoActual = null;

let equipos = typeof obtenerEquipos === "function"
  ? obtenerEquipos()
  : [];

let equipoActual = null;

let patrocinadores = typeof obtenerPatrocinadores === "function"
  ? obtenerPatrocinadores()
  : [];

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

/* ================== HOME ================== */
function mostrarHome() {
  let html = `
    <h2>Inicio</h2>
    <p>App en Proceso</p>

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

  contenido.innerHTML = html;
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

function guardarNuevoPatrocinador() {
  const nombre = document.getElementById("nombre").value;
  const web = document.getElementById("web").value;
  const file = document.getElementById("imagen").files[0];

  if (!file) {
    alert("Selecciona una imagen");
    return;
  }

  const reader = new FileReader();

  reader.onload = function () {
    const nuevo = {
      id: Date.now(),
      nombre,
      web,
      imagen: reader.result // base64
    };

    patrocinadores.push(nuevo);
    guardarPatrocinadores(patrocinadores);
    mostrarHome();
  };

  reader.readAsDataURL(file);
}

function abrirWeb(url) {
  if (!url) return;
  window.open(url, "_blank");
}

function borrarPatrocinador(id) {
  if (!confirm("¿Eliminar este patrocinador?")) return;

  patrocinadores = patrocinadores.filter(p => p.id !== id);

  guardarPatrocinadores(patrocinadores);
  mostrarHome();
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

  partidos.forEach(p => {
    html += `
      <div class="card">
        <div class="partido-nombre">${p.local} vs ${p.visitante}</div>
        <div class="partido-info">
           🕒 ${formatearHora(p.hora)} · 📍 ${p.lugar || "-"}
        </div>

        <div class="partido-grupo">
           🏷️ ${p.grupo}
        </div>
        <button onclick="abrirPartido(${p.id})">Abrir partido</button>

        ${adminActivo ? `
          <button onclick="editarPartido(${p.id})">✏️ Editar</button>
          <button onclick="borrarPartido(${p.id})">🗑️ Borrar</button>
        ` : ""}
      </div>
    `;
  });

  contenido.innerHTML = html;
}

function formNuevoPartido() {
  contenido.innerHTML = `
    <h2>Nuevo partido</h2>

    <label>Equipo local</label>
    <select id="local"></select>

    <label>Equipo visitante</label>
    <select id="visitante"></select>

    <label>Categoría</label>
    <select id="categoria">
      <option>Alevín</option>
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

    <label>Hora</label>
    <input type="time" id="hora">

    <label>Lugar</label>
    <input id="lugar" placeholder="Pabellón / pista">

    <button onclick="guardarNuevoPartido()">💾 Guardar partido</button>
    <button class="volver" onclick="mostrarPartidos()">⬅ Volver</button>
  `;
  // cargar equipos según categoría / género / grupo
const categoria = document.getElementById("categoria");
const genero = document.getElementById("genero");
const grupo = document.getElementById("grupo");

function cargarEquiposPartido() {
  const lista = equipos.filter(e =>
    e.categoria === categoria.value &&
    e.genero === genero.value &&
    e.grupo === grupo.value
  );

  const localSel = document.getElementById("local");
  const visitanteSel = document.getElementById("visitante");

  localSel.innerHTML = "";
  visitanteSel.innerHTML = "";

  lista.forEach(e => {
    localSel.innerHTML += `<option>${e.nombre}</option>`;
    visitanteSel.innerHTML += `<option>${e.nombre}</option>`;
  });
}

categoria.onchange = cargarEquiposPartido;
genero.onchange = cargarEquiposPartido;
grupo.onchange = cargarEquiposPartido;

cargarEquiposPartido();
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
      <option ${partidoActual.categoria==="Alevín"?"selected":""}>Alevín</option>
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

function guardarNuevoPartido() {
  const nuevoPartido = {
    id: Date.now(),
    local: document.getElementById("local").value,
    visitante: document.getElementById("visitante").value,
    categoria: document.getElementById("categoria").value,
    genero: document.getElementById("genero").value,
    grupo: document.getElementById("grupo").value,
    hora: document.getElementById("hora").value,
    lugar: document.getElementById("lugar").value,
    golesLocal: 0,
    golesVisitante: 0,
    estado: "pendiente"
  };

  partidos.push(nuevoPartido);
  guardarPartidos(partidos);
  mostrarPartidos();
}

function abrirPartido(id) {
  partidoActual = partidos.find(p => p.id === id);

  let adminBloque = adminActivo ? `
    <label>Hora</label>
    <input type="time" id="hora" value="${partidoActual.hora || ""}">

    <label>Lugar</label>
    <input id="lugar" value="${partidoActual.lugar || ""}">

    <button onclick="guardarDatosPartido()">💾 Guardar datos</button>
  ` : `
    <p>🕒 ${formatearHora(partidoActual.hora)}</p>
    <p>📍 ${partidoActual.lugar || "-"}</p>
  `;

  contenido.innerHTML = `
  <h2>${partidoActual.local} vs ${partidoActual.visitante}</h2>

  <div class="marcador-pro">
  <div class="equipo-marcador local">
    <span id="golesLocal">${partidoActual.golesLocal}</span>
  </div>

  <div class="separador">-</div>

  <div class="equipo-marcador visitante">
    <span id="golesVisitante">${partidoActual.golesVisitante}</span>
  </div>
</div>

  ${adminBloque}

  ${(adminActivo || mesaActiva) ? `
  <div class="marcador-botones">
    <button class="btn-local" onclick="cambiarGol('local', 1)">+ Local</button>
    <button class="btn-visitante" onclick="cambiarGol('visitante', 1)">+ Visitante</button>
    <button class="btn-local" onclick="cambiarGol('local', -1)">− Local</button>
    <button class="btn-visitante" onclick="cambiarGol('visitante', -1)">− Visitante</button>
    <button onclick="guardarMarcadorMesa()">💾 Guardar marcador</button>
    <button class="btn-finalizar" onclick="finalizarPartido()">🏁 Finalizar partido</button>
  </div>
` : ""}

  <button class="volver" onclick="mostrarPartidos()">⬅ Volver</button>
`;
}

function finalizarPartido() {
  if (!confirm("¿Finalizar este partido?")) return;

  partidoActual.estado = "finalizado";

  partidos = partidos.map(p =>
    p.id === partidoActual.id ? partidoActual : p
  );

  guardarPartidos(partidos);

  // 🔹 SI ESTÁS EN CLASIFICACIÓN, ACTUALIZA
  if (document.querySelector("h2")?.textContent.includes("Clasificación")) {
    actualizarClasificacion();
  }

  alert("Partido finalizado y clasificación actualizada");
  mostrarPartidos();
}

function cambiarGol(equipo, cambio) {
  if (equipo === "local") {
    partidoActual.golesLocal = Math.max(0, partidoActual.golesLocal + cambio);
    animarMarcador("golesLocal");
  } else {
    partidoActual.golesVisitante = Math.max(0, partidoActual.golesVisitante + cambio);
    animarMarcador("golesVisitante");
  }

  guardarPartidos(partidos);
}

function animarMarcador(id) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = id === "golesLocal"
    ? partidoActual.golesLocal
    : partidoActual.golesVisitante;

  el.classList.add("animar");

  setTimeout(() => {
    el.classList.remove("animar");
  }, 200);
}

function refrescarVistaPartido() {
  const index = partidos.findIndex(p => p.id === partidoActual.id);
  if (index !== -1) {
    partidoActual = partidos[index];
  }
  abrirPartido(partidoActual.id);
}

function sumarLocal() {
  partidoActual.golesLocal++;
  guardarPartidos(partidos);
  abrirPartido(partidoActual.id);
}

function restarLocal() {
  if (partidoActual.golesLocal > 0) {
    partidoActual.golesLocal--;
    guardarPartidos(partidos);
    abrirPartido(partidoActual.id);
  }
}

function sumarVisitante() {
  partidoActual.golesVisitante++;
  guardarPartidos(partidos);
  abrirPartido(partidoActual.id);
}

function restarVisitante() {
  if (partidoActual.golesVisitante > 0) {
    partidoActual.golesVisitante--;
    guardarPartidos(partidos);
    abrirPartido(partidoActual.id);
  }
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

function borrarPartido(id) {
  if (!confirm("¿Eliminar este partido?")) return;
  partidos = partidos.filter(p => p.id !== id);
  guardarPartidos(partidos);
  mostrarPartidos();
}

function guardarMarcadorMesa() {
  partidos = partidos.map(p =>
    p.id === partidoActual.id ? partidoActual : p
  );
  guardarPartidos(partidos);
  alert("Marcador guardado");
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
      <option>Alevín</option>
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
      <option ${grupoActual.categoria==="Alevín"?"selected":""}>Alevín</option>
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
      <button class="tab active" onclick="seleccionarCategoria('Alevín', this)">Alevín</button>
      <button class="tab" onclick="seleccionarCategoria('Infantil', this)">Infantil</button>
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
  window.categoriaSeleccionada = "Alevín";
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

  if (adminActivo) {
    html += `<button onclick="formNuevoEquipo()">➕ Crear equipo</button>`;
  }

  const equiposFiltrados = equipos.filter(e =>
    e.categoria === categoria &&
    e.genero === genero &&
    (!grupo || e.grupo === grupo)
  );

  if (equiposFiltrados.length === 0) {
    html += `<p>No hay equipos en esta categoría</p>`;
  }

  equiposFiltrados.forEach(e => {
  html += `
    <div class="card" onclick="verPartidosEquipo(${e.id})" style="cursor:pointer">
      <strong>${e.nombre}</strong>
      <div>${e.grupo}</div>

      ${adminActivo ? `
        <button onclick="event.stopPropagation(); editarEquipo(${e.id})">✏️ Editar</button>
        <button onclick="event.stopPropagation(); borrarEquipo(${e.id})">🗑️ Borrar</button>
      ` : ""}
    </div>
  `;
});

  document.getElementById("listaCategorias").innerHTML = html;
}

function volverCategoriasAnimado() {
  mostrarCategorias();
  contenido.classList.remove("fade-enter", "slide-enter");
  void contenido.offsetWidth;
  contenido.classList.add("fade-enter");
}

function verPartidosEquipo(idEquipo) {
  const equipo = equipos.find(e => e.id === idEquipo);
  if (!equipo) return;

  const partidosEquipo = partidos.filter(p =>
    p.local === equipo.nombre || p.visitante === equipo.nombre
  );

  let html = `
    <h2>${equipo.nombre}</h2>
    <p>${equipo.categoria} · ${equipo.genero} · ${equipo.grupo}</p>

    <h3>Partidos</h3>
  `;

  if (partidosEquipo.length === 0) {
    html += `<p>No hay partidos para este equipo</p>`;
  }

  partidosEquipo.forEach(p => {
    html += `
      <div class="card">
        <strong>${p.local} vs ${p.visitante}</strong>
        <div>🕒 ${formatearHora(p.hora)} · 📍 ${p.lugar || "-"}</div>
        <div>${p.golesLocal} - ${p.golesVisitante}</div>
        <button onclick="abrirPartido(${p.id})">Abrir partido</button>
      </div>
    `;
  });

  html += `
    <button class="volver" onclick="volverCategoriasAnimado()">⬅ Volver a categorías</button>
  `;

  cambiarVistaConAnimacion(html, "slide");
}

function formNuevoEquipo() {
  contenido.innerHTML = `
    <h2>Nuevo equipo</h2>

    <label>Nombre del equipo</label>
    <input id="nombre">

    <label>Categoría</label>
    <select id="categoria">
      <option>Alevín</option>
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
    <button class="volver" onclick="mostrarCategorias()">⬅ Volver</button>
  `;
}

function guardarNuevoEquipo() {
  const nuevo = {
    id: Date.now(),
    nombre: document.getElementById("nombre").value,
    categoria: document.getElementById("categoria").value,
    genero: document.getElementById("genero").value,
    grupo: document.getElementById("grupo").value
  };

  equipos.push(nuevo);
  guardarEquipos(equipos);
  mostrarCategorias();
}

function editarEquipo(id) {
  equipoActual = equipos.find(e => e.id === id);

  contenido.innerHTML = `
    <h2>Editar equipo</h2>

    <input id="nombre" value="${equipoActual.nombre}">

    <select id="categoria">
      <option ${equipoActual.categoria==="Alevín"?"selected":""}>Alevín</option>
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
    <button class="volver" onclick="mostrarCategorias()">⬅ Volver</button>
  `;
}

function guardarEdicionEquipo() {
  equipoActual.nombre = document.getElementById("nombre").value;
  equipoActual.categoria = document.getElementById("categoria").value;
  equipoActual.genero = document.getElementById("genero").value;
  equipoActual.grupo = document.getElementById("grupo").value;

  equipos = equipos.map(e =>
    e.id === equipoActual.id ? equipoActual : e
  );

  guardarEquipos(equipos);
  mostrarCategorias();
}

function borrarEquipo(id) {
  if (!confirm("¿Eliminar este equipo?")) return;
  equipos = equipos.filter(e => e.id !== id);
  guardarEquipos(equipos);
  mostrarCategorias();
}

/* ================== CLASIFICACION ================== */
function mostrarClasificacion() {
  contenido.innerHTML = `
    <h2>Clasificación</h2>

    <div class="subfiltros">
      <select id="clas-cat" onchange="actualizarClasificacion()">
        <option>Alevín</option>
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

function actualizarClasificacion() {
  const categoria = document.getElementById("clas-cat").value;
  const genero = document.getElementById("clas-gen").value;
  const grupo = document.getElementById("clas-grp").value;
    // ====== EQUIPOS DEL GRUPO ======
  const equiposGrupo = equipos.filter(e =>
    e.categoria === categoria &&
    e.genero === genero &&
    (!grupo || e.grupo === grupo)
  );

  let htmlEquipos = `
    <div class="equipos-grupo">
      <h3>Equipos del grupo</h3>
      <ul>
        ${equiposGrupo.map(e => `<li>${e.nombre}</li>`).join("")}
      </ul>
    </div>
  `;

  if (typeof calcularClasificacionFiltrada !== "function") {
    document.getElementById("tablaClasificacion").innerHTML =
      "<p>No hay clasificación disponible</p>";
    return;
  }

  const clasificacion = calcularClasificacionFiltrada(
    categoria,
    genero,
    grupo
  );

  let html = `
    <table class="tabla">
      <tr>
        <th>Equipo</th>
        <th>PJ</th>
        <th>PG</th>
        <th>PE</th>
        <th>PP</th>
        <th>GF</th>
        <th>GC</th>
        <th>Pts</th>
      </tr>
  `;

  clasificacion.forEach(e => {
    html += `
      <tr>
        <td>${e.nombre}</td>
        <td>${e.pj}</td>
        <td>${e.pg}</td>
        <td>${e.pe}</td>
        <td>${e.pp}</td>
        <td>${e.gf}</td>
        <td>${e.gc}</td>
        <td><strong>${e.puntos}</strong></td>
      </tr>
    `;
  });

  html += "</table>";

  document.getElementById("tablaClasificacion").innerHTML =
  htmlEquipos + (clasificacion.length ? html : "<p>No hay partidos finalizados</p>");
}

/* ================== ARRANQUE ================== */
mostrarHome();

window.addEventListener("load", () => {
  const splash = document.getElementById("splash");

  setTimeout(() => {
    if (splash) splash.style.display = "none";
    document.body.classList.remove("splash-activo");
  }, 1100);

  if (adminActivo) {
    document.getElementById("admin-fab")?.classList.add("admin-activo");
  }
});

