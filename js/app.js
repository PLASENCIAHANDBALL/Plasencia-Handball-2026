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
    <h2>${partidoActual.local} vs ${partidoActual.visitante}</h2>

    <h1 style="text-align:center">
      ${partidoActual.golesLocal} - ${partidoActual.golesVisitante}
    </h1>

    <button onclick="sumarLocal()">+ Gol Local</button>
    <button onclick="restarLocal()">- Gol Local</button>

    <button onclick="sumarVisitante()">+ Gol Visitante</button>
    <button onclick="restarVisitante()">- Gol Visitante</button>

    <button onclick="mostrarPartidos()">⬅ Volver</button>
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

function actualizarPartido() {
  partidos = partidos.map((p) =>
    p.id === partidoActual.id ? partidoActual : p
  );

  guardarPartidos(partidos);
  abrirPartido(partidoActual.id);
}

mostrarHome();
