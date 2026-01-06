import { View, Text, StyleSheet, FlatList } from 'react-native';
import { partidos } from '../data/partidos';
import { calcularClasificacion } from '../utils/calcularClasificacion';

export default function ClasificacionScreen() {
  const clasificacion = calcularClasificacion(partidos);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clasificación</Text>

      <FlatList
        data={clasificacion}
        keyExtractor={(item) => item.equipo}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.pos}>{index + 1}</Text>
            <Text style={styles.equipo}>{item.equipo}</Text>
            <Text style={styles.stats}>
              {item.puntos} pts · {item.gf}-{item.gc}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8
  },
  pos: {
    width: 25,
    fontWeight: 'bold'
  },
  equipo: {
    flex: 1,
    fontWeight: '600'
  },
  stats: {
    color: '#555'
  }
});
