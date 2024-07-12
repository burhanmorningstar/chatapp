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
import { formatDistanceToNow } from 'date-fns';

const HomeScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const chatsRef = collection(firestore, "chats");
    const q = query(chatsRef, where("users", "array-contains", currentUser.uid), orderBy("lastMessage.timestamp", "desc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedConversations = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          const otherUserId = data.users.find((uid) => uid !== currentUser.uid);
          const otherUserDoc = await getDoc(doc(firestore, "users", otherUserId));
          const otherUserData = otherUserDoc.exists() ? otherUserDoc.data() : {};

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
        <TouchableOpacity style={styles.userItem} onPress={() => navigation.navigate("Chat", { userId: item.id })}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>{item.username.charAt(0)}</Text>
          </View>
          <Text style={styles.username}>{item.username}</Text>
        </TouchableOpacity>
      );
    } else {
      const lastMessageText = item.lastMessage && item.lastMessage.text ? item.lastMessage.text : 'No messages yet';
      const lastMessageSender = item.lastMessage && item.lastMessage.senderId === currentUser.uid ? 'You: ' : '';
      const lastMessageTimestamp = item.lastMessage && item.lastMessage.timestamp ? formatDistanceToNow(item.lastMessage.timestamp.toDate(), { addSuffix: true }) : '';

      return (
        <TouchableOpacity style={styles.userItem} onPress={() => navigation.navigate("Chat", { userId: item.otherUser.uid })}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>{item.otherUser.username.charAt(0)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.otherUser.username}</Text>
            <Text style={styles.lastMessage}>{lastMessageSender}{lastMessageText}</Text>
            <Text style={styles.timestamp}>{lastMessageTimestamp}</Text>
            {item.lastMessage && item.lastMessage.senderId === currentUser.uid && (
              <Text style={item.lastMessage.seen ? styles.seen : styles.unseen}>
                {item.lastMessage.seen ? 'Seen' : 'Unseen'}
              </Text>
            )}
          </View>
          {item.unseenMessages > 0 && (
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
        data={searchQuery ? filteredUsers : conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyMessage}>Henüz mesajınız yok.</Text>}
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
    marginBottom: 5,
    backgroundColor: "#FFF",
    borderRadius: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5989B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
  lastMessage: {
    fontStyle: "italic",
    color: "#6D597A",
  },
  timestamp: {
    fontSize: 12,
    color: "#6D597A",
  },
  seen: {
    fontSize: 12,
    color: "green",
  },
  unseen: {
    fontSize: 12,
    color: "red",
  },
  unseenMessagesContainer: {
    backgroundColor: "#E5989B",
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  unseenMessagesText: {
    color: "#FFFFFF",
    fontSize: 14,
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
  emptyMessage: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#6D597A",
  },
  button: {
    backgroundColor: "#E5989B",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});

export default HomeScreen;
