import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const TermsScreen = ({ navigation }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Kullanım Şartları ve Koşulları</Text>
      <Text style={styles.text}>
        Lütfen bu kullanım şartlarını dikkatlice okuyun. Bu uygulamayı
        kullanarak, bu şartları kabul etmiş olursunuz. Eğer bu şartları kabul
        etmiyorsanız, lütfen uygulamayı kullanmayın.
      </Text>
      <Text style={styles.subHeader}>1. Kullanım Koşulları</Text>
      <Text style={styles.text}>
        Bu uygulamayı kullanarak, aşağıdaki koşulları kabul etmiş olursunuz:
        {"\n"}• Uygulamanın içeriğini kopyalamayacak veya değiştirmeyeceksiniz.
        {"\n"}• Diğer kullanıcıların deneyimini olumsuz etkilemeyeceksiniz.
        {"\n"}• Yasa dışı faaliyetlerde bulunmayacaksınız.
        {"\n"}• Made By burhanmorningstar.
      </Text>
      <Text style={styles.subHeader}>2. Hesap Güvenliği</Text>
      <Text style={styles.text}>
        Hesabınızın güvenliğini sağlamak sizin sorumluluğunuzdadır. Şifrenizi
        gizli tutmalı ve hesabınızın yetkisiz kullanımını hemen bildirmelisiniz.
      </Text>
      <Text style={styles.subHeader}>3. Gizlilik Politikası</Text>
      <Text style={styles.text}>
        Gizliliğiniz bizim için önemlidir. Kişisel bilgilerinizi nasıl
        topladığımız ve kullandığımız hakkında daha fazla bilgi edinmek için
        gizlilik politikamızı okuyun.
      </Text>
      <View style={styles.centeredView}>
        <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
          <Text style={styles.link}>Gizlilik Politikasını Oku</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subHeader}>4. Değişiklikler</Text>
      <Text style={styles.text}>
        Bu kullanım şartlarını zaman zaman güncelleyebiliriz. Güncellemeler, bu
        sayfada yayınlandıkları tarihte yürürlüğe girer. Şartları periyodik
        olarak gözden geçirmenizi öneririz.
      </Text>
      <Text style={styles.subHeader}>5. İletişim</Text>
      <Text style={styles.text}>
        Bu şartlar hakkında herhangi bir sorunuz varsa, lütfen bizimle iletişime
        geçin: burhanismaildemir@gmail.com
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
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
  link: {
    color: '#8D99AE',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Roboto-Regular',
  },
  centeredView: {
    alignItems: 'center',
    marginVertical: 10,
  },
});


export default TermsScreen;
