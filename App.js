import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ title: 'Giriş' }} // Title for Login Screen in Turkish
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ title: 'Kayıt' }} // Title for Register Screen in Turkish
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Ana Sayfa' }} // Title for Home Screen in Turkish
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={{ title: 'Sohbet' }} // Title for Chat Screen in Turkish
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
registerRootComponent(App);