import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { actualizarMarcador } from '../services/partidosService';

export default function PartidoLiveScreen({ route }) {
  const { partido } = route.params;

  const [golesLocal, setGolesLocal] = useState(partido.golesLocal);
  const [golesVisitante, setGolesVisitante] = useState(partido.golesVisitante);

  const sumarLocal = () => {
    const nuevo = golesLocal + 1;
    setGolesLocal(nuevo);
    actualizarMarcador(partido.id, nuevo, golesVisitante);
  };

  const restarLocal = () => {
    const nuevo = Math.max(0, golesLocal - 1);
    setGolesLocal(nuevo);
    actualizarMarcador(partido.id, nuevo, golesVisitante);
  };

  const sumarVisitante = () => {
    const nuevo = golesVisitante + 1;
    setGolesVisitante(nuevo);
    actualizarMarcador(partido.id, golesLocal, nuevo);
  };

  const restarVisitante = () => {
    const nuevo = Math.max(0, golesVisitante - 1);
    setGolesVisitante(nuevo);
    actualizarMarcador(partido.id, golesLocal, nuevo);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.equipos}>
        {partido.local} vs {partido.visitante}
      </Text>

      <View style={styles.marcador}>
        <Text style={styles.goles}>{golesLocal}</Text>
        <Text style={styles.separador}>-</Text>
        <Text style={styles.goles}>{golesVisitante}</Text>
      </View>

      <View style={styles.botones}>
        <View style={styles.columna}>
          <TouchableOpacity style={styles.boton} onPress={sumarLocal}>
            <Text style={styles.botonTexto}>+1</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.boton} onPress={restarLocal}>
            <Text style={styles.botonTexto}>-1</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.columna}>
          <TouchableOpacity style={styles.boton} onPress={sumarVisitante}>
            <Text style={styles.botonTexto}>+1</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.boton} onPress={restarVisitante}>
            <Text style={styles.botonTexto}>-1</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  equipos: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30
  },
  marcador: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30
  },
  goles: {
    fontSize: 48,
    fontWeight: 'bold',
    marginHorizontal: 20
  },
  separador: {
    fontSize: 48,
    fontWeight: 'bold'
  },
  botones: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  columna: {
    alignItems: 'center'
  },
  boton: {
    backgroundColor: '#c4161c',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: 80
  },
  botonTexto: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center'
  }
});
