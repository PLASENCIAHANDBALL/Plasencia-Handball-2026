function obtenerGrupos() {
  return JSON.parse(localStorage.getItem("grupos")) || [
    {
      id: 1,
      categoria: "Infantil",
      genero: "Masculino",
      nombre: "Grupo A",
      equipos: ["Plasencia BM", "Cáceres BM"]
    }
  ];
}

function guardarGrupos(grupos) {
  localStorage.setItem("grupos", JSON.stringify(grupos));
}