import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Clipboard,
  Alert,
  Modal,
  TouchableWithoutFeedback
} from "react-native";
import { auth, firestore } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  limit,
  startAfter,
  getDocs
} from "firebase/firestore";

const ChatScreen = ({ route, navigation }) => {
  const { userId, otherUser } = route.params;
  const currentUser = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const scrollRef = useRef(null);

  const getChatId = (uid1, uid2) =>
    uid1 < uid2 ? `${uid1}-${uid2}` : `${uid2}-${uid1}`;

  useEffect(() => {
    const chatId = getChatId(currentUser.uid, userId);
    const messagesRef = collection(firestore, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(25));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMessages(fetchedMessages.reverse());
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);

        const unseenMessages = snapshot.docs.filter((doc) => {
          const message = doc.data();
          return message.senderId !== currentUser.uid && !message.seen;
        });

        for (const doc of unseenMessages) {
          await updateDoc(doc.ref, { seen: true });
        }

        if (unseenMessages.length > 0) {
          const chatDocRef = doc(firestore, "chats", chatId);
          await updateDoc(chatDocRef, {
            "lastMessage.seen": true,
          });
        }
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const loadMoreMessages = async () => {
    if (lastVisible && !loadingMore) {
      setLoadingMore(true);
      const chatId = getChatId(currentUser.uid, userId);
      const messagesRef = collection(firestore, "chats", chatId, "messages");
      const q = query(
        messagesRef,
        orderBy("timestamp", "desc"),
        startAfter(lastVisible),
        limit(25)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMessages((prevMessages) => [
          ...fetchedMessages.reverse(),
          ...prevMessages,
        ]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (otherUser) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{otherUser.username.charAt(0)}</Text>
            </View>
            <Text style={styles.username}>{otherUser.username}</Text>
          </View>
        ),
      });
    }
  }, [navigation, otherUser]);

  const sendMessage = async () => {
    if (messageInput.trim()) {
      const chatId = getChatId(currentUser.uid, userId);
      const messagesRef = collection(firestore, "chats", chatId, "messages");
      const newMessage = {
        senderId: currentUser.uid,
        recipientId: userId,
        text: messageInput,
        timestamp: new Date(),  // Geçici timestamp
        seen: false,
      };

      try {
        setMessageInput("");
        const chatDocRef = doc(firestore, "chats", chatId);
        const chatDoc = await getDoc(chatDocRef);

        if (!chatDoc.exists()) {
          await setDoc(chatDocRef, {
            users: [currentUser.uid, userId],
            lastMessage: newMessage,
          });
        } else {
          await updateDoc(chatDocRef, {
            lastMessage: newMessage,
          });
        }

        await addDoc(messagesRef, { ...newMessage, timestamp: serverTimestamp() });
        scrollRef.current?.scrollToEnd({ animated: true });
      } catch (error) {
        console.error("Error sending message: ", error);
      }
    }
  };

  const openOptions = (message) => {
    setSelectedMessage(message);
    setModalVisible(true);
  };

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    Alert.alert("Mesaj kopyalandı");
  };

  const renderMessage = useCallback(({ item, index }) => {
    const isMyMessage = item.senderId === currentUser.uid;
    const messageStyle = isMyMessage ? styles.myMessage : styles.otherMessage;

    const formatDate = (timestamp) => {
      if (timestamp) {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return '';
    };

    const renderDateHeader = (currentMessage, previousMessage) => {
      const currentDate = new Date(currentMessage.timestamp?.toDate()).toDateString();
      const previousDate = previousMessage ? new Date(previousMessage.timestamp?.toDate()).toDateString() : null;

      if (currentDate !== previousDate) {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 864e5).toDateString();
        let displayDate;

        if (currentDate === today) {
          displayDate = 'Bugün';
        } else if (currentDate === yesterday) {
          displayDate = 'Dün';
        } else {
          displayDate = currentDate;
        }

        return <Text style={styles.dateHeader}>{displayDate}</Text>;
      }
      return null;
    };

    return (
      <View>
        {renderDateHeader(item, index > 0 ? messages[index - 1] : null)}
        <TouchableOpacity
          style={messageStyle}
          onLongPress={() => openOptions(item)}
        >
          <Text>{item.text}</Text>
          <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
          {isMyMessage && item.seen && <Text style={styles.seen}>Görüldü</Text>}
        </TouchableOpacity>
      </View>
    );
  }, [messages]);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={styles.container}>
      <FlatList
        ref={scrollRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingBottom: 50 }}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.1}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        initialNumToRender={25}
        maxToRenderPerBatch={25}
      />
      <TouchableOpacity
        style={styles.scrollButton}
        onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        <Text style={styles.scrollButtonText}>↓</Text>
      </TouchableOpacity>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          value={messageInput}
          onChangeText={setMessageInput}
          placeholder="Mesaj Yaz..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Gönder</Text>
        </TouchableOpacity>
      </View>
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={() => {
                copyToClipboard(selectedMessage.text);
                setModalVisible(false);
              }}>
                <Text style={styles.modalButtonText}>Kopyala</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDF2F4",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  avatar: {
    backgroundColor: "#2B2D42",
    borderRadius: 25,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: "#2B2D42",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#FFFFFF",
    padding: 10,
    margin: 10,
    borderRadius: 20,
    maxWidth: '80%',
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#DDF2F4",
    padding: 10,
    margin: 10,
    borderRadius: 20,
    maxWidth: '80%',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#8D99AE",
  },
  messageInput: {
    flex: 1,
    padding: 10,
    borderColor: "#8D99AE",
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#2B2D42',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    color: '#8D99AE',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  seen: {
    fontSize: 10,
    color: '#8D99AE',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  scrollButton: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    backgroundColor: '#2B2D42',
    borderRadius: 25,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  dateHeader: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 14,
    color: '#8D99AE',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalButton: {
    padding: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#2B2D42',
  },
});

export default ChatScreen;
