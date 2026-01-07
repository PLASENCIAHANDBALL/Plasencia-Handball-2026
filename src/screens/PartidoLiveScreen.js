import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';

export default function PartidoLiveScreen({ route, navigation }) {
  const { partido, actualizarPartidos } = route.params;

  const [golesLocal, setGolesLocal] = useState(partido.golesLocal);
  const [golesVisitante, setGolesVisitante] = useState(partido.golesVisitante);

  const guardarCambios = () => {
    actualizarPartidos((prev) =>
      prev.map((p) =>
        p.id === partido.id
          ? { ...p, golesLocal, golesVisitante }
          : p
      )
    );
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.equipos}>
        {partido.local} vs {partido.visitante}
      </Text>

      <View style={styles.marcador}>
        <Text style={styles.goles}>{golesLocal}</Text>
        <Text style={styles.goles}>-</Text>
        <Text style={styles.goles}>{golesVisitante}</Text>
      </View>

      <View style={styles.botones}>
        <TouchableOpacity onPress={() => setGolesLocal(golesLocal + 1)}>
          <Text style={styles.boton}>+ Local</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setGolesVisitante(golesVisitante + 1)}>
          <Text style={styles.boton}>+ Visitante</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.guardar} onPress={guardarCambios}>
        <Text style={styles.guardarTexto}>Guardar marcador</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  equipos: { fontSize: 20, textAlign: 'center', marginBottom: 30 },
  marcador: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  goles: { fontSize: 40, marginHorizontal: 10 },
  botones: { flexDirection: 'row', justifyContent: 'space-around' },
  boton: { fontSize: 18, color: '#c4161c' },
  guardar: {
    marginTop: 30,
    backgroundColor: '#c4161c',
    padding: 15,
    borderRadius: 10
  },
  guardarTexto: { color: '#fff', textAlign: 'center', fontSize: 16 }
});
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
