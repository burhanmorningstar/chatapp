import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { auth, firestore } from "../firebase";
import { collection, query, where, onSnapshot, orderBy, getDoc, getDocs, doc } from "firebase/firestore";
import { formatDistanceToNow } from 'date-fns';

const HomeScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
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
      setLoadingConversations(false);
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
      setLoadingSearch(true);
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
        setLoadingSearch(false);
      });

      return () => unsubscribe();
    } else {
      setFilteredUsers([]);
      setLoadingSearch(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredUsers([]);
  };

  const renderItem = ({ item }) => {
    if (searchQuery) {
      return (
        <TouchableOpacity style={styles.userItem} onPress={() => navigation.navigate("Chat", { userId: item.id, otherUser: item })}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>{item.username.charAt(0)}</Text>
          </View>
          <Text style={styles.username}>{item.username}</Text>
        </TouchableOpacity>
      );
    } else {
      const lastMessageText = item.lastMessage && item.lastMessage.text ? item.lastMessage.text : 'Henüz mesaj yok';
      const lastMessageSender = item.lastMessage && item.lastMessage.senderId === currentUser.uid ? 'Siz: ' : '';
      const lastMessageTimestamp = item.lastMessage && item.lastMessage.timestamp ? formatDistanceToNow(item.lastMessage.timestamp.toDate(), { addSuffix: true }) : '';

      return ( 
        <TouchableOpacity style={styles.userItem} onPress={() => navigation.navigate("Chat", { userId: item.otherUser.uid, otherUser: item.otherUser })}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>{item.otherUser.username.charAt(0)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.otherUser.username}</Text>
            <Text style={styles.lastMessage}>{lastMessageSender}{lastMessageText}</Text>
            <Text style={styles.timestamp}>{lastMessageTimestamp}</Text>
            {item.lastMessage && item.lastMessage.senderId === currentUser.uid && (
              <Text style={item.lastMessage.seen ? styles.seen : styles.unseen}>
                {item.lastMessage.seen ? 'Görüldü' : 'Görülmedi'}
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

  const getListEmptyComponent = () => {
    if (loadingSearch) {
      return <ActivityIndicator size="small" color="#0000ff" />;
    } else if (searchQuery && filteredUsers.length === 0) {
      return <Text style={styles.emptyMessage}>Aradığınız kullanıcı bulunamadı.</Text>;
    } else if (!searchQuery && conversations.length === 0) {
      return <Text style={styles.emptyMessage}>Henüz mesajınız yok.{"\n"} Arama çubuğunu kullanarak {"\n"} Yeni mesaj gönderebilirsiniz.</Text>;
    } else {
      return null;
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
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loadingConversations ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={searchQuery ? filteredUsers : conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={getListEmptyComponent}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DDF2F4",
    padding: 20,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#8D99AE",
    marginBottom: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2B2D42",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2B2D42",
  },
  lastMessage: {
    fontStyle: "italic",
    color: "#8D99AE",
  },
  timestamp: {
    fontSize: 12,
    color: "#8D99AE",
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
    backgroundColor: "#2B2D42",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderColor: "#8D99AE",
    borderWidth: 1,
    borderRadius: 10,
  },
  clearButton: {
    marginLeft: 10,
    backgroundColor: "#2B2D42",
    borderRadius: 15,
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  emptyMessage: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#8D99AE",
  },
  button: {
    backgroundColor: "#2B2D42",
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
