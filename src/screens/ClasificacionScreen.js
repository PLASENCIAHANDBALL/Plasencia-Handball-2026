import { View, Text, StyleSheet } from 'react-native';

export default function ClasificacionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clasificación</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold' }
});