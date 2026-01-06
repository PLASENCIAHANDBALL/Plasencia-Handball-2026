import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plasencia Handball 2026</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Partidos')}
      >
        <Text style={styles.cardText}>Partidos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Clasificacion')}
      >
        <Text style={styles.cardText}>Clasificación</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Grupos')}
      >
        <Text style={styles.cardText}>Grupos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c4161c',
    padding: 20,
    justifyContent: 'center'
  },
  title: {
    color: '#fff',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold'
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15
  },
  cardText: {
    color: '#c4161c',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center'
  }
});
