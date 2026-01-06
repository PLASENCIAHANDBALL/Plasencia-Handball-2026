import { View, Text, StyleSheet } from 'react-native';

export default function GruposScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grupos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold' }
});