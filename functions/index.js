const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

exports.sendPushNotification = functions.firestore
    .document("chats/{chatId}/messages/{messageId}")
    .onCreate(async (snapshot, context) => {
      const messageData = snapshot.data();
      const recipientId = messageData.recipientId;

      // Kullanıcının Expo push token'ını Firestore'dan al
      const userRef = admin.firestore().collection("users").doc(recipientId);
      const userDoc = await userRef.get();
      const expoPushToken = userDoc.data().expoPushToken;

      if (expoPushToken) {
        const message = {
          to: expoPushToken,
          sound: "default",
          title: "Yeni Mesaj",
          body: messageData.text,
          data: {chatId: context.params.chatId},
        };

        try {
          const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
          });

          if (!response.ok) {
            throw new Error(`Error sending notif: ${response.statusText}`);
          }

          console.log("Notification sent successfully");
        } catch (error) {
          console.error("Error sending notification:", error);
        }
      } else {
        console.log(`No Expo push token for user: ${recipientId}`);
      }

      return null;
    });
