function obtenerPatrocinadores() {
  return JSON.parse(localStorage.getItem("patrocinadores")) || [];
}

function guardarPatrocinadores(lista) {
  localStorage.setItem("patrocinadores", JSON.stringify(lista));
}
