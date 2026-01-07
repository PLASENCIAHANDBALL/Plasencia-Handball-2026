const contenido = document.getElementById("contenido");

/* ================== DATOS ================== */
const PIN_ADMIN = "1234";
let adminActivo = localStorage.getItem("admin") === "true";

let partidos = obtenerPartidos();
let partidoActual = null;

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
        <div><strong>${p.local} vs ${p.visitante}</strong></div>
        <div>${p.golesLocal} - ${p.golesVisitante}</div>
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
      <button onclick="sumarLocal()">+ Local</button>
      <button onclick="restarLocal()">- Local</button>
      <button onclick="sumarVisitante()">+ Visitante</button>
      <button onclick="restarVisitante()">- Visitante</button>
    `;
  } else {
    botones = `<p>Modo solo lectura</p>`;
  }

  contenido.innerHTML = `
    <h2>${partidoActual.local} vs ${partidoActual.visitante}</h2>
    <h1>${partidoActual.golesLocal} - ${partidoActual.golesVisitante}</h1>
    ${botones}
    <button onclick="mostrarPartidos()">⬅ Volver</button>
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