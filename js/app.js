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

  <button class="boton-local" onclick="sumarLocal()">➕ Gol Local</button>
  <button class="boton-local" onclick="restarLocal()">➖ Gol Local</button>

  <button class="boton-visitante" onclick="sumarVisitante()">➕ Gol Visitante</button>
  <button class="boton-visitante" onclick="restarVisitante()">➖ Gol Visitante</button>

  <button class="volver" onclick="mostrarPartidos()">⬅ Volver a partidos</button>
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
