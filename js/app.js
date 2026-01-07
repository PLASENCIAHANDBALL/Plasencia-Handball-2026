const contenido = document.getElementById("contenido");

function mostrarHome() {
  contenido.innerHTML = `
    <h2>Bienvenida</h2>
    <p>App oficial del torneo Plasencia Handball 2026.</p>
  `;
}

function mostrarPartidos() {
  contenido.innerHTML = `
    <h2>Partidos</h2>
    <p>Aquí aparecerán los partidos.</p>
  `;
}

function mostrarGrupos() {
  contenido.innerHTML = `
    <h2>Grupos</h2>
    <p>Listado de grupos.</p>
  `;
}

function mostrarClasificacion() {
  contenido.innerHTML = `
    <h2>Clasificación</h2>
    <p>Tabla de clasificación.</p>
  `;
}

mostrarHome();
