const partidosIniciales = [
  {
    id: 1,
    local: "Plasencia BM",
    visitante: "Cáceres BM",
    golesLocal: 0,
    golesVisitante: 0
  }
];

function obtenerPartidos() {
  const guardados = localStorage.getItem("partidos");
  return guardados ? JSON.parse(guardados) : partidosIniciales;
}

function guardarPartidos(partidos) {
  localStorage.setItem("partidos", JSON.stringify(partidos));
}
