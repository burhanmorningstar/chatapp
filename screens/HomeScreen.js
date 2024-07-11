import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Button,
} from "react-native";
import { auth, firestore } from "../firebase"; // firestore'u doğru şekilde import edin
import { collection, onSnapshot, query, where } from "firebase/firestore"; // Firestore fonksiyonlarını import edin

const HomeScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Fetch users from Firebase on mount
    const q = query(
      collection(firestore, "users"),
      where("uid", "!=", currentUser.uid) // id yerine uid kullanın
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedUsers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers); // Initially set filteredUsers to all users
      },
      (error) => {
        console.error("Error fetching users:", error); // Handle errors
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleLogout = () => {
    auth.signOut();
    navigation.navigate("Login");
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = users.filter((user) => {
      const lowercaseName = user.username.toLowerCase();
      return lowercaseName.includes(query.toLowerCase());
    });
    setFilteredUsers(filtered);
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.userItem}>
        <Text>{item.username}</Text>
        <Button
          title="Mesaj Gönder"
          onPress={() => navigation.navigate("Chat", { userId: item.id })}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Ara"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <Button title="Ara" onPress={() => handleSearch(searchQuery)} />
      </View>

      <FlatList
        data={searchQuery.length > 0 ? filteredUsers : users}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />

      <Button title="Çıkış Yap" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#eee",
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
  },
});

export default HomeScreen;
