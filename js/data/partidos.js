const partidosIniciales = [
  {
    id: 1,
    local: "Plasencia BM",
    visitante: "Cáceres BM",
    golesLocal: 0,
    golesVisitante: 0,
    lugar: "Pabellón Municipal",
    hora: "18:00",
    categoria: "Infantil",
    genero: "Masculino",
    grupo: "Grupo A"
  }, // ✅ COMA AQUÍ

  {
    id: 2,
    local: "Navalmoral",
    visitante: "Badajoz",
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