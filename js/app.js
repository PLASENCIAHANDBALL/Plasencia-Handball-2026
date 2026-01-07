const contenido = document.getElementById("contenido");

/* ================== DATOS ================== */
const PIN_ADMIN = "1234";
let adminActivo = localStorage.getItem("admin") === "true";

let partidos = obtenerPartidos();
let partidoActual = null;

let grupos = obtenerGrupos();
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

/* ================== PARTIDO ================== */
function abrirPartido(id) {
  partidoActual = partidos.find((p) => p.id === id);

  let botones = "";

  if (adminActivo) {
    botones = `
      <div class="admin-datos">
        <label>Hora</label>
        <input type="time" id="hora" value="${partidoActual.hora || ""}">

        <label>Lugar</label>
        <input type="text" id="lugar" value="${partidoActual.lugar || ""}">

        <button onclick="guardarDatosPartido()">💾 Guardar datos</button>

        <hr>

        <button onclick="sumarLocal()">+ Local</button>
        <button onclick="restarLocal()">- Local</button>
        <button onclick="sumarVisitante()">+ Visitante</button>
        <button onclick="restarVisitante()">- Visitante</button>
      </div>
    `;
  } else {
    botones = `
      <p>🕒 ${partidoActual.hora || "-"}</p>
      <p>📍 ${partidoActual.lugar || "-"}</p>
    `;
  }

  contenido.innerHTML = `
    <h2>${partidoActual.local} vs ${partidoActual.visitante}</h2>
    <div class="marcador">
      <span>${partidoActual.golesLocal}</span>
      <span>-</span>
      <span>${partidoActual.golesVisitante}</span>
    </div>
    ${botones}
    <button class="volver" onclick="mostrarPartidos()">⬅ Volver</button>
  `;
}

/* ================== MARCADOR ================== */
function sumarLocal() {
  partidoActual.golesLocal++;
  actualizar();
}

function restarLocal() {
  if (partidoActual.golesLocal > 0) partidoActual.golesLocal--;
  actualizar();
}

function sumarVisitante() {
  partidoActual.golesVisitante++;
  actualizar();
}

function restarVisitante() {
  if (partidoActual.golesVisitante > 0) partidoActual.golesVisitante--;
  actualizar();
}

function actualizar() {
  partidos = partidos.map((p) =>
    p.id === partidoActual.id ? partidoActual : p
  );
  guardarPartidos(partidos);
  abrirPartido(partidoActual.id);
}

function guardarDatosPartido() {
  partidoActual.hora = document.getElementById("hora").value;
  partidoActual.lugar = document.getElementById("lugar").value;

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
function mostrarClasificacion() {
  const clasificacion = calcularClasificacion();

  let html = `
    <h2>Clasificación</h2>
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

  contenido.innerHTML = html;
}

window.addEventListener("load", () => {
  const splash = document.getElementById("splash");
  setTimeout(() => {
    splash.style.display = "none";
  }, 1200);
});