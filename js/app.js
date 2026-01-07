console.log("✅ app.js cargado");

const contenido = document.getElementById("contenido");

/* ================== ESTADO GLOBAL ================== */
const PIN_ADMIN = "1234";
let adminActivo = localStorage.getItem("admin") === "true";

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

/* ================== HOME ================== */
function mostrarHome() {
  contenido.innerHTML = `
    <h2>Inicio</h2>
    <p>Selecciona una opción del menú.</p>
  `;
}

/* ================== PARTIDOS ================== */
function mostrarPartidos() {
  let html = `<h2>Partidos</h2>`;

  if (adminActivo) {
    html += `<button onclick="formNuevoPartido()">➕ Crear partido</button>`;
  }

  partidos.forEach(p => {
    html += `
      <div class="card">
        <div class="partido-nombre">${p.local} vs ${p.visitante}</div>
        <div class="partido-info">🕒 ${p.hora || "-"} · 📍 ${p.lugar || "-"}</div>
        <div class="partido-marcador">${p.golesLocal} - ${p.golesVisitante}</div>
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
    <input id="local" placeholder="Equipo local">

    <label>Equipo visitante</label>
    <input id="visitante" placeholder="Equipo visitante">

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
    golesVisitante: 0
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
    <hr>
    <button onclick="sumarLocal()">+ Local</button>
    <button onclick="restarLocal()">- Local</button>
    <button onclick="sumarVisitante()">+ Visitante</button>
    <button onclick="restarVisitante()">- Visitante</button>
  ` : `
    <p>🕒 ${partidoActual.hora || "-"}</p>
    <p>📍 ${partidoActual.lugar || "-"}</p>
  `;

  contenido.innerHTML = `
    <h2>${partidoActual.local} vs ${partidoActual.visitante}</h2>
    <div class="marcador">
      <span>${partidoActual.golesLocal}</span>
      <span>-</span>
      <span>${partidoActual.golesVisitante}</span>
    </div>
    ${adminBloque}
    <button class="volver" onclick="mostrarPartidos()">⬅ Volver</button>
  `;
}

function sumarLocal() {
  partidoActual.golesLocal++;
  actualizarPartido();
}

function restarLocal() {
  if (partidoActual.golesLocal > 0) partidoActual.golesLocal--;
  actualizarPartido();
}

function sumarVisitante() {
  partidoActual.golesVisitante++;
  actualizarPartido();
}

function restarVisitante() {
  if (partidoActual.golesVisitante > 0) partidoActual.golesVisitante--;
  actualizarPartido();
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

/* ================== ADMIN ================== */
function toggleAdmin() {
  const boton = document.getElementById("admin-fab");

  if (adminActivo) {
    adminActivo = false;
    localStorage.removeItem("admin");
    boton.classList.remove("admin-activo");
    alert("Modo administrador desactivado");
  } else {
    const pin = prompt("Introduce el PIN de administrador:");
    if (pin === PIN_ADMIN) {
      adminActivo = true;
      localStorage.setItem("admin", "true");
      boton.classList.add("admin-activo");
      alert("Modo administrador activado");
    } else {
      alert("PIN incorrecto");
    }
  }
}

function salirAdmin() {
  adminActivo = false;
  localStorage.removeItem("admin");
  mostrarPartidos();
}

/* ================== INICIO ================== */
mostrarHome();

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

  document.querySelectorAll(".tab").forEach(t =>
    t.classList.remove("active")
console.log("✅ app.js cargado");

const contenido = document.getElementById("contenido");

/* ================== ESTADO GLOBAL ================== */
const PIN_ADMIN = "1234";
let adminActivo = localStorage.getItem("admin") === "true";

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

/* ================== HOME ================== */
function mostrarHome() {
  contenido.innerHTML = `
    <h2>Inicio</h2>
    <p>Selecciona una opción del menú.</p>
  `;
}

/* ================== PARTIDOS ================== */
function mostrarPartidos() {
  let html = `<h2>Partidos</h2>`;

  if (adminActivo) {
    html += `<button onclick="formNuevoPartido()">➕ Crear partido</button>`;
  }

  partidos.forEach(p => {
    html += `
      <div class="card">
        <div class="partido-nombre">${p.local} vs ${p.visitante}</div>
        <div class="partido-info">🕒 ${p.hora || "-"} · 📍 ${p.lugar || "-"}</div>
        <div class="partido-marcador">${p.golesLocal} - ${p.golesVisitante}</div>
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
    <input id="local" placeholder="Equipo local">

    <label>Equipo visitante</label>
    <input id="visitante" placeholder="Equipo visitante">

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
    golesVisitante: 0
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
    <hr>
    <button onclick="sumarLocal()">+ Local</button>
    <button onclick="restarLocal()">- Local</button>
    <button onclick="sumarVisitante()">+ Visitante</button>
    <button onclick="restarVisitante()">- Visitante</button>
  ` : `
    <p>🕒 ${partidoActual.hora || "-"}</p>
    <p>📍 ${partidoActual.lugar || "-"}</p>
  `;

  contenido.innerHTML = `
    <h2>${partidoActual.local} vs ${partidoActual.visitante}</h2>
    <div class="marcador">
      <span>${partidoActual.golesLocal}</span>
      <span>-</span>
      <span>${partidoActual.golesVisitante}</span>
    </div>
    ${adminBloque}
    <button class="volver" onclick="mostrarPartidos()">⬅ Volver</button>
  `;
}

function sumarLocal() {
  partidoActual.golesLocal++;
  actualizarPartido();
}

function restarLocal() {
  if (partidoActual.golesLocal > 0) partidoActual.golesLocal--;
  actualizarPartido();
}

function sumarVisitante() {
  partidoActual.golesVisitante++;
  actualizarPartido();
}

function restarVisitante() {
  if (partidoActual.golesVisitante > 0) partidoActual.golesVisitante--;
  actualizarPartido();
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

/* ================== ADMIN ================== */
function toggleAdmin() {
  const boton = document.getElementById("admin-fab");

  if (adminActivo) {
    adminActivo = false;
    localStorage.removeItem("admin");
    boton.classList.remove("admin-activo");
    alert("Modo administrador desactivado");
  } else {
    const pin = prompt("Introduce el PIN de administrador:");
    if (pin === PIN_ADMIN) {
      adminActivo = true;
      localStorage.setItem("admin", "true");
      boton.classList.add("admin-activo");
      alert("Modo administrador activado");
    } else {
      alert("PIN incorrecto");
    }
  }
}

function salirAdmin() {
  adminActivo = false;
  localStorage.removeItem("admin");
  mostrarPartidos();
}

/* ================== INICIO ================== */
mostrarHome();

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

  document.querySelectorAll(".tab").forEach(t =>
    t.classList.remove("active")
  );
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
      <div class="card">
        <strong>${e.nombre}</strong>
        <div>${e.grupo}</div>

        ${adminActivo ? `
          <button onclick="editarEquipo(${e.id})">✏️ Editar</button>
          <button onclick="borrarEquipo(${e.id})">🗑️ Borrar</button>
        ` : ""}
      </div>
    `;
  });

  /* ====== PARTIDOS ====== */
  html += `<h3>Partidos</h3>`;

  const partidosFiltrados = partidos.filter(p =>
    p.categoria === categoria &&
    p.genero === genero &&
    (!grupo || p.grupo === grupo)
  );

  if (partidosFiltrados.length === 0) {
    html += `<p>No hay partidos en esta categoría</p>`;
  }

  partidosFiltrados.forEach(p => {
    html += `
      <div class="card">
        <strong>${p.local} vs ${p.visitante}</strong>
        <div>🕒 ${p.hora || "-"} · 📍 ${p.lugar || "-"}</div>
        <div>${p.golesLocal} - ${p.golesVisitante}</div>
        <button onclick="abrirPartido(${p.id})">Abrir partido</button>
      </div>
    `;
  });

  document.getElementById("listaCategorias").innerHTML = html;
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
    clasificacion.length ? html : "<p>No hay datos para esta selección</p>";
}

/* ================== ARRANQUE ================== */
mostrarHome();

window.addEventListener("load", () => {
  const splash = document.getElementById("splash");
  if (splash) {
    setTimeout(() => splash.style.display = "none", 1200);
  }
  if (adminActivo) {
  document.getElementById("admin-fab")?.classList.add("admin-activo");
}
});

  boton.classList.add("active");

  filtrarCategorias();
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
    clasificacion.length ? html : "<p>No hay datos para esta selección</p>";
}

/* ================== ARRANQUE ================== */
mostrarHome();

window.addEventListener("load", () => {
  const splash = document.getElementById("splash");
  if (splash) {
    setTimeout(() => splash.style.display = "none", 1200);
  }
  if (adminActivo) {
  document.getElementById("admin-fab")?.classList.add("admin-activo");
}
});
