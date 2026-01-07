const contenido = document.getElementById("contenido");

const PIN_ADMIN = "1234";
let adminActivo = localStorage.getItem("admin") === "true";

let partidos = obtenerPartidos();
let partidoActual = null;

/* ---------------- HOME ---------------- */

function mostrarHome() {
  contenido.innerHTML = `
    <h2>Inicio</h2>
    <p>Selecciona una opción.</p>
  `;
}

/* ---------------- PARTIDOS ---------------- */

function mostrarPartidos() {
  let html = `<h2>Partidos</h2>`;

  let botonAdmin = adminActivo
    ? `<button class="volver" onclick="salirAdmin()">Salir de Admin</button>`
    : `<button onclick="activarAdmin()">Entrar como Admin</button>`;

  html += botonAdmin;

  partidos.forEach((p) => {
    html += `
      <div class="card">
        <div class="partido-nombre">
          ${p.local} vs ${p.visitante}
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

/* ---------------- PARTIDO ---------------- */

function abrirPartido(id) {
  partidoActual = partidos.find((p) => p.id === id);

  let botones = "";

  if (adminActivo) {
    botones = `
      <button class="boton-local" onclick="sumarLocal()">➕ Gol Local</button>
      <button class="boton-local" onclick="restarLocal()">➖ Gol Local</button>

      <button class="boton-visitante" onclick="sumarVisitante()">➕ Gol Visitante</button>
      <button class="boton-visitante" onclick="restarVisitante()">➖ Gol Visitante</button>
    `;
  } else {
    botones = `
      <p style="text-align:center;color:#777">
        Modo solo lectura. Activa Admin para editar.
      </p>
    `;
  }

  contenido.innerHTML = `
    <h2 style="text-align:center">
      ${partidoActual.local} vs ${partidoActual.visitante}
    </h2>

    <div class="marcador">
      <span>${partidoActual.golesLocal}</span>
      <span>-</span>
      <span>${partidoActual.golesVisitante}</span>
    </div>

    ${botones}

    <button class="volver" onclick="mostrarPartidos()">⬅ Volver a partidos</button>
  `;
}

/* ---------------- MARCADOR ---------------- */

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

function actualizarPartido() {
  partidos = partidos.map((p) =>
    p.id === partidoActual.id ? partidoActual : p
  );

  guardarPartidos(partidos);
  abrirPartido(partidoActual.id);
}

/* ---------------- ADMIN ---------------- */

function activarAdmin() {
  const pin = prompt("Introduce el PIN de administrador:");
  if (pin === PIN_ADMIN) {
    adminActivo = true;
    localStorage.setItem("admin", "true");
    alert("Modo administrador activado");
    mostrarPartidos();
  } else {
    alert("PIN incorrecto");
  }
}

function salirAdmin() {
  adminActivo = false;
  localStorage.removeItem("admin");
  alert("Modo administrador desactivado");
  mostrarPartidos();
}

/* ---------------- INICIO ---------------- */

mostrarHome();
  });

  contenido.innerHTML = html;
}

function abrirPartido(id) {
  partidoActual = partidos.find((p) => p.id === id);

  contenido.innerHTML = `
  <h2 style="text-align:center">
    ${partidoActual.local} vs ${partidoActual.visitante}
  </h2>

  <div class="marcador">
    <span>${partidoActual.golesLocal}</span>
    <span>-</span>
    <span>${partidoActual.golesVisitante}</span>
  </div>

  ${botones}

  <button class="volver" onclick="mostrarPartidos()">⬅ Volver a partidos</button>
`;
  
  let botones = "";

if (adminActivo) {
  botones = `
    <button class="boton-local" onclick="sumarLocal()">➕ Gol Local</button>
    <button class="boton-local" onclick="restarLocal()">➖ Gol Local</button>

    <button class="boton-visitante" onclick="sumarVisitante()">➕ Gol Visitante</button>
    <button class="boton-visitante" onclick="restarVisitante()">➖ Gol Visitante</button>
  `;
} else {
  botones = `<p style="text-align:center;color:#777">
    Modo solo lectura. Activa Admin para editar.
  </p>`;
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

function actualizarPartido() {
  partidos = partidos.map((p) =>
    p.id === partidoActual.id ? partidoActual : p
  );

  guardarPartidos(partidos);
  abrirPartido(partidoActual.id);
}

mostrarHome();

function activarAdmin() {
  const pin = prompt("Introduce el PIN de administrador:");
  if (pin === PIN_ADMIN) {
    adminActivo = true;
    localStorage.setItem("admin", "true");
    alert("Modo administrador activado");
    mostrarPartidos();
  } else {
    alert("PIN incorrecto");
  }
}

function salirAdmin() {
  adminActivo = false;
  localStorage.removeItem("admin");
  alert("Modo administrador desactivado");
  mostrarPartidos();
}
