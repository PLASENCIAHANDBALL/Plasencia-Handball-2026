const contenido = document.getElementById("contenido");

let partidos = obtenerPartidos();
let partidoActual = null;

function mostrarHome() {
  contenido.innerHTML = `
    <h2>Inicio</h2>
    <p>Selecciona una opción.</p>
  `;
}

function mostrarPartidos() {
  let html = `<h2>Partidos</h2>`;

  partidos.forEach((p) => {
    html += `
      <div style="margin-bottom:10px;padding:10px;border:1px solid #ddd;border-radius:6px">
        <strong>${p.local} vs ${p.visitante}</strong><br>
        ${p.golesLocal} - ${p.golesVisitante}<br>
        <button onclick="abrirPartido(${p.id})">Abrir</button>
      </div>
    `;
  });

  contenido.innerHTML = html;
}

function abrirPartido(id) {
  partidoActual = partidos.find((p) => p.id === id);

  contenido.innerHTML = `
  <h2 style="text-align:center">
    ${partidoActual.local} vs ${partidoActual.visitante}
  </h2>

  <div style="
    display:flex;
    justify-content:center;
    align-items:center;
    font-size:48px;
    margin:20px 0;
  ">
    <span style="margin:0 20px">${partidoActual.golesLocal}</span>
    <span>-</span>
    <span style="margin:0 20px">${partidoActual.golesVisitante}</span>
  </div>

  <div style="display:grid;gap:10px">
    <button onclick="sumarLocal()">➕ Gol Local</button>
    <button onclick="restarLocal()">➖ Gol Local</button>

    <button onclick="sumarVisitante()">➕ Gol Visitante</button>
    <button onclick="restarVisitante()">➖ Gol Visitante</button>
  </div>

  <button onclick="mostrarPartidos()" style="margin-top:20px">
    ⬅ Volver a partidos
  </button>
`;

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
