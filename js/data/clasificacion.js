function crearEquipo(nombre) {
  return {
    nombre,
    pj: 0,
    pg: 0,
    pe: 0,
    pp: 0,
    gf: 0,
    gc: 0,
    puntos: 0
  };
}

function calcularClasificacionFiltrada(categoria, genero, grupo) {
  const tabla = {};

  // 1️⃣ Inicializar equipos del grupo
  equipos
    .filter(e =>
      e.categoria === categoria &&
      e.genero === genero &&
      (!grupo || e.grupo === grupo)
    )
    .forEach(e => {
      tabla[e.nombre] = crearEquipo(e.nombre);
    });

  // 2️⃣ Partidos finalizados
  const partidosValidos = partidos.filter(p =>
    p.estado === "finalizado" &&
    p.categoria === categoria &&
    p.genero === genero &&
    (!grupo || p.grupo === grupo)
  );

  partidosValidos.forEach(p => {
    tabla[p.local].pj++;
    tabla[p.visitante].pj++;

    tabla[p.local].gf += p.golesLocal;
    tabla[p.local].gc += p.golesVisitante;
    tabla[p.visitante].gf += p.golesVisitante;
    tabla[p.visitante].gc += p.golesLocal;

    if (p.golesLocal > p.golesVisitante) {
      tabla[p.local].pg++;
      tabla[p.local].puntos += 2;
      tabla[p.visitante].pp++;
    } else if (p.golesLocal < p.golesVisitante) {
      tabla[p.visitante].pg++;
      tabla[p.visitante].puntos += 2;
      tabla[p.local].pp++;
    } else {
      tabla[p.local].pe++;
      tabla[p.visitante].pe++;
      tabla[p.local].puntos++;
      tabla[p.visitante].puntos++;
    }
  });

  return Object.values(tabla).sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    return (b.gf - b.gc) - (a.gf - a.gc);
  });
}