import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { crearPartido } from '../services/adminService';

export default function AdminScreen() {
  const [local, setLocal] = useState('');
  const [visitante, setVisitante] = useState('');
  const [grupo, setGrupo] = useState('');

  const crear = async () => {
    if (!local || !visitante || !grupo) return;

    await crearPartido({ local, visitante, grupo });

    setLocal('');
    setVisitante('');
    setGrupo('');
    alert('Partido creado');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel Admin</Text>

      <TextInput
        style={styles.input}
        placeholder="Equipo local"
        value={local}
        onChangeText={setLocal}
      />

      <TextInput
        style={styles.input}
        placeholder="Equipo visitante"
        value={visitante}
        onChangeText={setVisitante}
      />

      <TextInput
        style={styles.input}
        placeholder="Grupo (A, B...)"
        value={grupo}
        onChangeText={setGrupo}
      />

      <TouchableOpacity style={styles.boton} onPress={crear}>
        <Text style={styles.botonTexto}>Crear partido</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15
  },
  boton: {
    backgroundColor: '#c4161c',
    padding: 15,
    borderRadius: 10
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600'
  }
});
