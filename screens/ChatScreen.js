import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { auth, firestore } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, setDoc, updateDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";

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

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(fetchedMessages);

      // Mesajları gördü olarak işaretleyin
      const unseenMessages = snapshot.docs.filter(doc => {
        const message = doc.data();
        return message.senderId !== currentUser.uid && !message.seen;
      });

      for (const doc of unseenMessages) {
        await updateDoc(doc.ref, { seen: true });
      }

      // Son mesajın görüldüğünü güncelleyin
      if (unseenMessages.length > 0) {
        const chatDocRef = doc(firestore, "chats", chatId);
        await updateDoc(chatDocRef, {
          "lastMessage.seen": true,
        });
      }
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
        seen: false,
      };

      try {
        setMessageInput("");
        const chatDocRef = doc(firestore, "chats", chatId);
        const chatDoc = await getDoc(chatDocRef);

        if (!chatDoc.exists()) {
          // Eğer sohbet dokümanı yoksa, oluşturun
          await setDoc(chatDocRef, {
            users: [currentUser.uid, userId],
            lastMessage: newMessage,
          });
        } else {
          // Eğer sohbet dokümanı varsa, son mesajı güncelleyin
          await updateDoc(chatDocRef, {
            lastMessage: newMessage,
          });
        }

        // Mesajı ekleyin
        await addDoc(messagesRef, newMessage);
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
        <Text style={styles.timestamp}>{new Date(item.timestamp?.toDate()).toLocaleString()}</Text>
        {isMyMessage && item.seen && <Text style={styles.seen}>Görüldü</Text>}
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
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Gönder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8EDEB",
  },
  messageContainer: {
    padding: 10,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#FFDDD2",
    padding: 10,
    margin: 10,
    borderRadius: 20,
    maxWidth: '80%',
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF1E6",
    padding: 10,
    margin: 10,
    borderRadius: 20,
    maxWidth: '80%',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#FFDDD2",
    borderTopWidth: 1,
    borderTopColor: "#B5838D",
  },
  messageInput: {
    flex: 1,
    padding: 10,
    borderColor: "#B5838D",
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#E5989B',
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
    color: '#6D597A',
    marginTop: 5,
    alignSelf: 'flex-end'
  },
  seen: {
    fontSize: 10,
    color: '#6D597A',
    marginTop: 5,
    alignSelf: 'flex-end'
  },
});

export default ChatScreen;
