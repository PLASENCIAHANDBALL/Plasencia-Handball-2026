function obtenerPartidos() {
  const guardados = localStorage.getItem("partidos");
  return guardados ? JSON.parse(guardados) : partidosIniciales;
}

function guardarPartidos(partidos) {
  localStorage.setItem("partidos", JSON.stringify(partidos));
}