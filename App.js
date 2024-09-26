import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Font from 'expo-font';
import Constants from 'expo-constants';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import TermsScreen from './screens/TermsScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import { auth, firestore } from './firebase';
import 'react-native-gesture-handler';

const Stack = createStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    Alert.alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

const loadFonts = async () => {
  await Font.loadAsync({
    'Montserrat-Bold': require('./assets/fonts/Montserrat-Bold.ttf'),
    'Montserrat-Medium': require('./assets/fonts/Montserrat-Medium.ttf'),
    'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
  });
};

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();

  const onAuthStateChanged = (user) => {
    setUser(user);
    if (user) {
      saveTokenToDatabase(user);
    }
    if (initializing) setInitializing(false);
  };

  const saveTokenToDatabase = async (user) => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      const userRef = firestore.collection('users').doc(user.uid);
      await userRef.set({
        expoPushToken: token,
      }, { merge: true });
      setExpoPushToken(token);
    }
  };

  useEffect(() => {
    const subscriber = auth.onAuthStateChanged(onAuthStateChanged);
    return subscriber;
  }, []);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      Alert.alert('Yeni Mesaj', JSON.stringify(notification));
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  useEffect(() => {
    loadFonts().then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded || initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Ana Sayfa', headerLeft: null }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ title: 'Sohbet' }}
            />
            <Stack.Screen
              name="Terms"
              component={TermsScreen}
              options={{ title: 'Kullanım Şartları', headerLeft: null }}
            />
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
              options={{ title: 'Gizlilik Politikası', headerLeft: null }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: 'Giriş' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: 'Giriş' }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Kayıt' }}
            />
            <Stack.Screen
              name="Terms"
              component={TermsScreen}
              options={{ title: 'Kullanım Şartları', headerLeft: null }}
            />
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
              options={{ title: 'Gizlilik Politikası', headerLeft: null }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
