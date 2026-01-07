function obtenerEquipos() {
  return JSON.parse(localStorage.getItem("equipos")) || [];
}

function guardarEquipos(equipos) {
  localStorage.setItem("equipos", JSON.stringify(equipos));
}
