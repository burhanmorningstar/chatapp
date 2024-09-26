import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Gizlilik Politikası</Text>
      <Text style={styles.text}>
        Bu gizlilik politikası, uygulamamızın kullanıcılarından topladığı bilgileri ve bu bilgileri nasıl kullandığını açıklar.
      </Text>
      <Text style={styles.subHeader}>1. Bilgi Toplama ve Kullanımı</Text>
      <Text style={styles.text}>
        {"\n"}• Kişisel Bilgiler: Uygulama kayıt ve kullanım sürecinde adınız, e-posta adresiniz, şifreniz gibi kişisel bilgilerinizi toplayabiliriz.
        {"\n"}• Kullanım Verileri: Uygulamanın nasıl kullanıldığını analiz etmek ve iyileştirmek için kullanım verilerini toplayabiliriz.
      </Text>
      <Text style={styles.subHeader}>2. Bilgi Paylaşımı</Text>
      <Text style={styles.text}>
        {"\n"}• Üçüncü Taraflarla Paylaşım: Kişisel bilgilerinizi izniniz olmadan üçüncü taraflarla paylaşmayız.
        {"\n"}• Yasal Zorunluluklar: Yasal gerekliliklere uymak için bilgilerinizi ifşa edebiliriz.
      </Text>
      <Text style={styles.subHeader}>3. Bilgi Güvenliği</Text>
      <Text style={styles.text}>
        {"\n"}• Güvenlik Önlemleri: Kişisel bilgilerinizin güvenliğini sağlamak için çeşitli güvenlik önlemleri uygularız.
      </Text>
      <Text style={styles.subHeader}>4. Çerezler</Text>
      <Text style={styles.text}>
        {"\n"}• Çerezler: Kullanıcı deneyimini geliştirmek için çerezler kullanabiliriz.
      </Text>
      <Text style={styles.subHeader}>5. Değişiklikler</Text>
      <Text style={styles.text}>
        {"\n"}• Bu gizlilik politikası zaman zaman güncellenebilir. Güncellemeler bu sayfada yayınlanacaktır.
      </Text>
      <Text style={styles.subHeader}>6. İletişim</Text>
      <Text style={styles.text}>
        {"\n"}• Bu gizlilik politikası hakkında sorularınız varsa, lütfen bizimle iletişime geçin: burhanismaildemir@gmail.com
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Geri Dön</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#DDF2F4',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2B2D42',
    fontFamily: 'Montserrat-Bold',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#2B2D42',
    fontFamily: 'Montserrat-Bold',
  },
  text: {
    fontSize: 14,
    color: '#2B2D42',
    lineHeight: 20,
    fontFamily: 'Roboto-Regular',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#2B2D42',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
  },
});



export default PrivacyPolicyScreen;
