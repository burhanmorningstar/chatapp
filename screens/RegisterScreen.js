import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { auth, firestore } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const validateForm = () => {
    if (!email || !password || !username) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return false;
    }
    if (password.length <= 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return false;
    }
    if (!acceptedTerms) {
      Alert.alert('Hata', 'Lütfen kullanım şartlarını kabul edin.');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username });

      await setDoc(doc(firestore, "users", userCredential.user.uid), {
        email: email,
        username: username,
        uid: userCredential.user.uid,
        conversations: []
      });

      Alert.alert('Başarı', 'Kullanıcı başarıyla kaydedildi.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Kayıt Ol</Text>
      <TextInput
        style={styles.input}
        placeholder="Kullanıcı Adı"
        value={username}
        onChangeText={setUsername}
        accessibilityLabel="Kullanıcı Adı Giriş Alanı"
      />
      <TextInput
        style={styles.input}
        placeholder="E-posta"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="E-posta Giriş Alanı"
      />
      <TextInput
        style={styles.input}
        placeholder="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        accessibilityLabel="Şifre Giriş Alanı"
      />
      <TouchableOpacity
        style={styles.termsContainer}
        onPress={() => setAcceptedTerms(!acceptedTerms)}
      >
        <View style={[styles.checkbox, acceptedTerms && styles.checked]} />
        <Text style={styles.termsText}>Kullanım şartlarını kabul ediyorum</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
        <Text style={styles.link}>Kullanım Şartlarını Oku</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Yükleniyor...' : 'Kaydol'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#DDF2F4',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#2B2D42',
    fontFamily: 'Montserrat-Bold',
  },
  input: {
    height: 40,
    borderColor: '#8D99AE',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Roboto-Regular',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  checked: {
    backgroundColor: '#2B2D42',
  },
  termsText: {
    flex: 1,
    color: '#2B2D42',
    fontFamily: 'Roboto-Regular',
  },
  link: {
    color: '#8D99AE',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Roboto-Regular',
  },
  button: {
    backgroundColor: '#2B2D42',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
  },
});



export default RegisterScreen;
