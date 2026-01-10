/* ===============================
   CLUBES Y ESCUDOS
=============================== */

function obtenerClubes() {
  return JSON.parse(localStorage.getItem("clubes") || "[]");
}

function guardarClubes(lista) {
  localStorage.setItem("clubes", JSON.stringify(lista));
}

function obtenerEscudoClub(nombreClub) {
  const clubes = obtenerClubes();
  const club = clubes.find(c => c.nombre === nombreClub);
  return club ? club.escudo : null;
}
function formNuevoClub() {
  contenido.innerHTML = `
    <h2>Nuevo club</h2>

    <label>Nombre del club</label>
    <input id="club-nombre">

    <label>Escudo</label>
    <input type="file" id="club-escudo" accept="image/*">

    <button onclick="guardarNuevoClub()">💾 Guardar club</button>
    <button class="volver" onclick="mostrarEquipos()">⬅ Volver</button>
  `;
}

function guardarNuevoClub() {
  const nombre = document.getElementById("club-nombre").value;
  const file = document.getElementById("club-escudo").files[0];

  if (!nombre || !file) {
    alert("Completa todos los campos");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const clubes = obtenerClubes();

    clubes.push({
      id: Date.now(),
      nombre,
      escudo: reader.result // base64
    });

    guardarClubes(clubes);
    mostrarEquipos();
  };

  reader.readAsDataURL(file);
}