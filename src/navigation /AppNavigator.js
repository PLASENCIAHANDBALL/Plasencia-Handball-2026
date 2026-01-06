import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import PartidosScreen from '../screens/PartidosScreen';
import PartidoLiveScreen from '../screens/PartidoLiveScreen';
import ClasificacionScreen from '../screens/ClasificacionScreen';
import GruposScreen from '../screens/GruposScreen';
import AdminScreen from '../screens/AdminScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Plasencia Handball 2026' }}
        />

        <Stack.Screen
          name="Partidos"
          component={PartidosScreen}
        />

        <Stack.Screen
          name="Clasificacion"
          component={ClasificacionScreen}
        />

        <Stack.Screen
          name="Grupos"
          component={GruposScreen}
        />

        <Stack.Screen
          name="PartidoLive"
          component={PartidoLiveScreen}
          options={{ title: 'Partido en directo' }}
        />

        {/* 👑 PANEL ADMIN */}
        <Stack.Screen
          name="Admin"
          component={AdminScreen}
          options={{ title: 'Panel Admin' }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
