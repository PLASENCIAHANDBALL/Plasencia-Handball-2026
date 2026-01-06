import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { login } from '../services/authService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const entrar = async () => {
    try {
      const { rol } = await login(email, password);

      if (rol === 'admin') {
        navigation.replace('Admin');
      } else {
        alert('No tienes permisos de administrador');
      }
    } catch (e) {
      alert('Login incorrecto');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acceso Admin</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.boton} onPress={entrar}>
        <Text style={styles.botonTexto}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
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
    textAlign: 'center',
    fontWeight: '600'
  }
});
