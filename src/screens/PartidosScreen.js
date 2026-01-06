import { View, Text, StyleSheet } from 'react-native';

export default function PartidosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Partidos</Text>
      <Text>Aquí se mostrarán los partidos en tiempo real</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold' }
});