/* ===============================
   EQUIPOS PARTICIPANTES
=============================== */

// Obtener equipos
function obtenerEquipos() {
  return JSON.parse(localStorage.getItem("equipos") || "[]");
}

// Guardar equipos
function guardarEquipos(lista) {
  localStorage.setItem("equipos", JSON.stringify(lista));
}

// Vista principal
function mostrarEquipos() {
  let html = `<h2>Equipos participantes</h2>`;

  if (adminActivo) {
    html += `<button onclick="formNuevoEquipo()">➕ Añadir equipo</button>`;
  }

  const equipos = obtenerEquipos();

  // Agrupar por club
  const clubes = {};

  equipos.forEach(e => {
    const club = e.club || e.nombre; // por ahora
    if (!clubes[club]) clubes[club] = [];
    clubes[club].push(e);
  });

  Object.keys(clubes).forEach(club => {
    html += `
      <div class="card" onclick="verClub('${club}')">
        <strong>${club}</strong>
        <div>${clubes[club].length} equipo(s)</div>
      </div>
    `;
  });

  contenido.innerHTML = html;
}

// Detalle del club
function verClub(club) {
  const equipos = obtenerEquipos();
  const equiposClub = equipos.filter(e => e.club === club || e.nombre === club);

  let html = `
    <h2>${club}</h2>
    <h3>Equipos del club</h3>
  `;

  equiposClub.forEach(e => {
    html += `
      <div class="card">
        <strong>${e.categoria} ${e.genero}</strong>
        <div>${e.grupo}</div>
      </div>
    `;
  });

  html += `<button class="volver" onclick="mostrarEquipos()">⬅ Volver</button>`;

  contenido.innerHTML = html;
}