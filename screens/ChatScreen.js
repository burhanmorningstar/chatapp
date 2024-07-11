import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  FlatList,
} from "react-native";
import { auth, firestore } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

const ChatScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const currentUser = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const scrollRef = useRef(null);

  // Chat ID'sini oluşturan yardımcı fonksiyon
  const getChatId = (uid1, uid2) => {
    return uid1 < uid2 ? `${uid1}-${uid2}` : `${uid2}-${uid1}`;
  };

  useEffect(() => {
    const chatId = getChatId(currentUser.uid, userId);
    const messagesRef = collection(firestore, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [userId]);

  const sendMessage = async () => {
    if (messageInput.trim()) {
      const chatId = getChatId(currentUser.uid, userId);
      const messagesRef = collection(firestore, "chats", chatId, "messages");
      const newMessage = {
        senderId: currentUser.uid,
        recipientId: userId,
        text: messageInput,
        timestamp: serverTimestamp(),
      };

      try {
        await addDoc(messagesRef, newMessage);
        setMessageInput("");
        scrollRef.current?.scrollToEnd({ animated: true });
      } catch (error) {
        console.error("Error sending message: ", error);
      }
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.senderId === currentUser.uid;
    const messageStyle = isMyMessage ? styles.myMessage : styles.otherMessage;
    return (
      <View style={messageStyle}>
        <Text>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={scrollRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          value={messageInput}
          onChangeText={setMessageInput}
          placeholder="Mesaj Yaz..."
        />
        <Button title="Gönder" onPress={sendMessage} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messageContainer: {
    padding: 10,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#ccc",
    padding: 10,
    margin: 10,
    borderRadius: 10,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#eee",
    padding: 10,
    margin: 10,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  messageInput: {
    flex: 1,
    padding: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
  },
});

export default ChatScreen;
