import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useState } from 'react';
import { partidosIniciales } from '../data/partidos';

export default function PartidosScreen({ navigation }) {
  const [partidos, setPartidos] = useState(partidosIniciales);

  return (
    <View style={styles.container}>
      <FlatList
        data={partidos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.partido}
            onPress={() =>
              navigation.navigate('PartidoLive', {
                partido: item,
                actualizarPartidos: setPartidos
              })
            }
          >
            <Text style={styles.equipos}>
              {item.local} vs {item.visitante}
            </Text>
            <Text style={styles.marcador}>
              {item.golesLocal} - {item.golesVisitante}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  partido: {
    padding: 15,
    backgroundColor: '#eee',
    marginBottom: 10,
    borderRadius: 8
  },
  equipos: { fontSize: 16, fontWeight: 'bold' },
  marcador: { fontSize: 18, textAlign: 'right' }
});
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  card: {
    backgroundColor: '#f2f2f2',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },
  equipos: { fontSize: 16, fontWeight: '600' },
  marcador: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 5
  },
  estado: { textAlign: 'center', color: '#666' }
});

