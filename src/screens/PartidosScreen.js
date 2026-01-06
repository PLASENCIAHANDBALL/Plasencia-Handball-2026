import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { partidos } from '../data/partidos';

export default function PartidosScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Partidos</Text>

      <FlatList
        data={partidos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('PartidoLive', { partido: item })
            }
          >
            <Text style={styles.equipos}>
              {item.local} vs {item.visitante}
            </Text>

            <Text style={styles.marcador}>
              {item.golesLocal} - {item.golesVisitante}
            </Text>

            <Text style={styles.estado}>
              Grupo {item.grupo} · {item.estado}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10
  },
  card: {
    backgroundColor: '#f2f2f2',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },
  equipos: {
    fontSize: 16,
    fontWeight: '600'
  },
  marcador: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 5
  },
  estado: {
    textAlign: 'center',
    color: '#666'
  }
});

