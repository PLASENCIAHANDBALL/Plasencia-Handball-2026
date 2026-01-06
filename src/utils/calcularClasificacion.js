export function calcularClasificacion(partidos, equiposGrupo = null) {
  const tabla = {};

  partidos.forEach((p) => {
    if (p.estado !== 'Finalizado') return;

    if (equiposGrupo) {
      if (
        !equiposGrupo.includes(p.local) ||
        !equiposGrupo.includes(p.visitante)
      ) {
        return;
      }
    }

    if (!tabla[p.local]) {
      tabla[p.local] = {
        equipo: p.local,
        pj: 0,
        pg: 0,
        pe: 0,
        pp: 0,
        gf: 0,
        gc: 0,
        puntos: 0
      };
    }

    if (!tabla[p.visitante]) {
      tabla[p.visitante] = {
        equipo: p.visitante,
        pj: 0,
        pg: 0,
        pe: 0,
        pp: 0,
        gf: 0,
        gc: 0,
        puntos: 0
      };
    }

    const local = tabla[p.local];
    const visitante = tabla[p.visitante];

    local.pj++;
    visitante.pj++;

    local.gf += p.golesLocal;
    local.gc += p.golesVisitante;
    visitante.gf += p.golesVisitante;
    visitante.gc += p.golesLocal;

    if (p.golesLocal > p.golesVisitante) {
      local.pg++;
      visitante.pp++;
      local.puntos += 2;
    } else if (p.golesLocal < p.golesVisitante) {
      visitante.pg++;
      local.pp++;
      visitante.puntos += 2;
    } else {
      local.pe++;
      visitante.pe++;
      local.puntos += 1;
      visitante.puntos += 1;
    }
  });

  return Object.values(tabla).sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    return (b.gf - b.gc) - (a.gf - a.gc);
  });
}

