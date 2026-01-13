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

function calcularClasificacion(categoria, genero, grupo, equipos, partidos) {
  const tabla = {};

  // 1️⃣ Inicializar equipos del grupo (tabla vacía)
  equipos
    .filter(e =>
      e.categoria === categoria &&
      e.genero === genero &&
      (!grupo || e.grupo === grupo)
    )
    .forEach(e => {
      tabla[e.nombre] = crearEquipo(e.nombre);
    });

  // 2️⃣ Partidos FINALIZADOS del grupo
  const partidosFinalizados = partidos.filter(p =>
    p.estado === "finalizado" &&
    p.categoria === categoria &&
    p.genero === genero &&
    (!grupo || p.grupo === grupo)
  );

  // 3️⃣ Aplicar resultados
  partidosFinalizados.forEach(p => {
    const local = tabla[p.local];
    const visitante = tabla[p.visitante];

    if (!local || !visitante) return;

    local.pj++;
    visitante.pj++;

    local.gf += p.golesLocal;
    local.gc += p.golesVisitante;
    visitante.gf += p.golesVisitante;
    visitante.gc += p.golesLocal;

    if (p.golesLocal > p.golesVisitante) {
      local.pg++;
      local.puntos += 2;
      visitante.pp++;
    } else if (p.golesLocal < p.golesVisitante) {
      visitante.pg++;
      visitante.puntos += 2;
      local.pp++;
    } else {
      local.pe++;
      visitante.pe++;
      local.puntos++;
      visitante.puntos++;
    }
  });

  return Object.values(tabla).sort((a, b) =>
    b.puntos - a.puntos || (b.gf - b.gc) - (a.gf - a.gc)
  );
}