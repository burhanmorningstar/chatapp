import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { auth, firestore } from "../firebase";
import { collection, query, where, onSnapshot, orderBy, getDoc, getDocs, doc } from "firebase/firestore";

const HomeScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Daha önce mesajlaştığınız kişileri çekmek için Firestore'da sorgu oluşturun
    const chatsRef = collection(firestore, "chats");
    const q = query(chatsRef, where("users", "array-contains", currentUser.uid), orderBy("lastMessage.timestamp", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedConversations = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          const otherUserId = data.users.find((uid) => uid !== currentUser.uid);
          const otherUserDoc = await getDoc(doc(firestore, "users", otherUserId));
          const otherUserData = otherUserDoc.exists() ? otherUserDoc.data() : {};

          // Görülmemiş mesajları hesapla
          const unseenMessages = await getUnseenMessagesCount(docSnapshot.id);

          return {
            id: docSnapshot.id,
            ...data,
            otherUser: {
              uid: otherUserId,
              username: otherUserData?.username || "Unknown",
            },
            unseenMessages,
          };
        })
      );
      setConversations(fetchedConversations);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getUnseenMessagesCount = async (chatId) => {
    const messagesRef = collection(firestore, "chats", chatId, "messages");
    const q = query(messagesRef, where("recipientId", "==", currentUser.uid), where("seen", "==", false));
    const snapshot = await getDocs(q);
    return snapshot.size;
  };

  const handleLogout = () => {
    auth.signOut();
    navigation.navigate("Login");
  };

  const handleSearch = (queryText) => {
    setSearchQuery(queryText);
    if (queryText) {
      const usersRef = collection(firestore, "users");
      const q = query(
        usersRef,
        where("username", ">=", queryText),
        where("username", "<=", queryText + "\uf8ff")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedUsers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFilteredUsers(fetchedUsers);
      });

      return () => unsubscribe();
    } else {
      setFilteredUsers([]);
    }
  };

  const renderItem = ({ item }) => {
    if (searchQuery) {
      return (
        <TouchableOpacity style={styles.userItem} onPress={() => navigation.navigate("Chat", { userId: item.uid })}>
          <Text>{item.username}</Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity style={styles.userItem} onPress={() => navigation.navigate("Chat", { userId: item.otherUser.uid })}>
          <View style={styles.userInfo}>
            <Text>{item.otherUser.username}</Text>
            <Text style={styles.lastMessage}>{item.lastMessage.text}</Text>
          </View>
          {item.unseenMessages >= 0 && (
            <View style={styles.unseenMessagesContainer}>
              <Text style={styles.unseenMessagesText}>{item.unseenMessages}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Kullanıcı Ara"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={searchQuery.length < 0 ? filteredUsers : conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8EDEB",
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
    borderBottomColor: "#B5838D",
  },
  userInfo: {
    flex: 1,
  },
  lastMessage: {
    fontStyle: 'italic',
    color: '#6D597A',
  },
  unseenMessagesContainer: {
    backgroundColor: '#E5989B',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unseenMessagesText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  seen: {
    color: '#6D597A',
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#FFDDD2",
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderColor: "#B5838D",
    borderWidth: 1,
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#E5989B',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default HomeScreen;
