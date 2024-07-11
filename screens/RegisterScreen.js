import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
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

      // Firestore'a kullanıcıyı ekle
      await setDoc(doc(firestore, "users", userCredential.user.uid), {
        email: email,
        username: username,
        uid: userCredential.user.uid,
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
      <Button
        title={loading ? 'Yükleniyor...' : 'Kaydol'}
        onPress={handleRegister}
        disabled={loading}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
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
    backgroundColor: '#007AFF',
  },
  termsText: {
    flex: 1,
  },
});

export default RegisterScreen;
