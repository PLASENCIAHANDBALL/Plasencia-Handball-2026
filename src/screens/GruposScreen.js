import { View, Text, StyleSheet, FlatList } from 'react-native';
import { partidos } from '../data/partidos';
import { grupos } from '../data/grupos';
import { calcularClasificacion } from '../utils/calcularClasificacion';

export default function GruposScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grupos</Text>

      {Object.keys(grupos).map((grupo) => {
        const clasificacion = calcularClasificacion(
          partidos,
          grupos[grupo]
        );

        return (
          <View key={grupo} style={styles.groupCard}>
            <Text style={styles.groupTitle}>Grupo {grupo}</Text>

            <FlatList
              data={clasificacion}
              keyExtractor={(item) => item.equipo}
              renderItem={({ item, index }) => (
                <View style={styles.row}>
                  <Text style={styles.pos}>{index + 1}</Text>
                  <Text style={styles.equipo}>{item.equipo}</Text>
                  <Text style={styles.stats}>
                    {item.puntos} pts
                  </Text>
                </View>
              )}
            />
          </View>
        );
      })}
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
  groupCard: {
    marginBottom: 20
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 5
  },
  pos: { width: 25, fontWeight: 'bold' },
  equipo: { flex: 1 },
  stats: { fontWeight: '600' }
});
