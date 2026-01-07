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

  let botonAdmin = adminActivo
    ? `<button onclick="salirAdmin()">Salir de Admin</button>`
    : `<button onclick="activarAdmin()">Entrar como Admin</button>`;

  html += botonAdmin;

  partidos.forEach((p) => {
    html += `
  <div class="card">
    <div class="partido-nombre">
      ${p.local} vs ${p.visitante}
    </div>

    <div class="partido-info">
      🕒 ${p.hora || "-"} · 📍 ${p.lugar || "-"}
    </div>

    <div class="partido-marcador">
      ${p.golesLocal} - ${p.golesVisitante}
    </div>

    <button onclick="abrirPartido(${p.id})">Abrir partido</button>
  </div>
`;
  });

  contenido.innerHTML = html;
}

/* ================== PARTIDOS ================== */
function mostrarPartidos() {
  let html = `<h2>Partidos</h2>`;

  html += adminActivo
    ? `<button onclick="salirAdmin()">Salir de Admin</button>
       <button onclick="formNuevoPartido()">➕ Crear partido</button>`
    : `<button onclick="activarAdmin()">Entrar como Admin</button>`;

  partidos.forEach(p => {
    html += `
      <div class="card">
        <div class="partido-nombre">${p.local} vs ${p.visitante}</div>
        <div class="partido-info">🕒 ${p.hora || "-"} · 📍 ${p.lugar || "-"}</div>
        <div class="partido-marcador">${p.golesLocal} - ${p.golesVisitante}</div>
        <button onclick="abrirPartido(${p.id})">Abrir partido</button>
      </div>
    `;
  });

  contenido.innerHTML = html;
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

/* ================== ADMIN ================== */
function activarAdmin() {
  const pin = prompt("PIN administrador:");
  if (pin === PIN_ADMIN) {
    adminActivo = true;
    localStorage.setItem("admin", "true");
    mostrarPartidos();
  } else {
    alert("PIN incorrecto");
  }
}

function salirAdmin() {
  adminActivo = false;
  localStorage.removeItem("admin");
  mostrarPartidos();
}

/* ================== INICIO ================== */
mostrarHome();

/* ================== CATEGORÍAS ================== */
function mostrarCategorias() {
  contenido.innerHTML = `
    <h2>Categorías</h2>

    <label>Categoría</label>
    <select id="cat" onchange="filtrarCategorias()">
      <option value="">-- Seleccionar --</option>
      <option>Alevín</option>
      <option>Infantil</option>
      <option>Cadete</option>
      <option>Juvenil</option>
    </select>

    <label>Género</label>
    <select id="gen" onchange="filtrarCategorias()">
      <option value="">-- Seleccionar --</option>
      <option>Masculino</option>
      <option>Femenino</option>
    </select>

    <label>Grupo</label>
    <select id="grp" onchange="filtrarCategorias()">
      <option value="">Todos</option>
      <option>Grupo A</option>
      <option>Grupo B</option>
      <option>Grupo C</option>
      <option>Grupo D</option>
      <option>Grupo Único</option>
    </select>

    <div id="listaCategorias"></div>
  `;
}

function filtrarCategorias() {
  const gen = document.getElementById("gen").value;
  const grp = document.getElementById("grp").value;
  const cat = window.categoriaSeleccionada;

  let filtrados = partidos.filter(p =>
    p.categoria === cat &&
    p.genero === gen &&
    (!grp || p.grupo === grp)
  );

  let html = "";

  filtrados.forEach(p => {
    html += `
      <div class="card">
        <strong>${p.local} vs ${p.visitante}</strong>
        <div>🕒 ${p.hora || "-"} · 📍 ${p.lugar || "-"}</div>
        <div>${p.golesLocal} - ${p.golesVisitante}</div>
        <button onclick="abrirPartido(${p.id})">Abrir</button>
      </div>
    `;
  });

  document.getElementById("listaCategorias").innerHTML =
    html || "<p>No hay partidos en esta categoría</p>";
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

/* ================== CLASIFICACIÓN ================== */
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

/* ================== ARRANQUE ================== */
mostrarHome();

window.addEventListener("load", () => {
  const splash = document.getElementById("splash");
  if (splash) {
    setTimeout(() => splash.style.display = "none", 1200);
  }
});