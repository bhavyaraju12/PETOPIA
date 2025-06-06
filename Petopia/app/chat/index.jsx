import { View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { addDoc, collection, doc, getDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import { useUser } from '@clerk/clerk-expo';
import { GiftedChat } from 'react-native-gifted-chat';

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const { user } = useUser();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    GetUserDetails();

    // Create a query with orderBy to sort messages by createdAt in descending order
    const messagesRef = collection(db, 'Chat', params?.id, 'Messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData = snapshot.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(), // Ensure createdAt is a Date object
      }));

      setMessages(messageData);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Get Users Info
   */
  const GetUserDetails = async () => {
    try {
      const docRef = doc(db, 'Chat', params?.id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.warn("Chat document not found");
        return;
      }

      const result = docSnap.data();

      if (result && result.users && Array.isArray(result.users)) {
        const otherUser = result.users.find(
          (item) => item.email !== user?.primaryEmailAddress?.emailAddress
        );

        if (otherUser && otherUser.name) {
          navigation.setOptions({
            headerTitle: otherUser.name,
          });
        } else {
          navigation.setOptions({
            headerTitle: "Chat",
          });
        }
      }
    } catch (error) {
      console.error("Error in GetUserDetails:", error);
    }
  };

  const onSend = async (newMessages = []) => {
    const newMessage = newMessages[0];
    const messageToSend = {
      ...newMessage,
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, 'Chat', params.id, 'Messages'), messageToSend);
      // No need to manually update state here - the onSnapshot listener will handle it
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages)}
        user={{
          _id: user?.primaryEmailAddress?.emailAddress,
          name: user?.fullName,
          avatar: user?.imageUrl,
        }}
        inverted={true} // This ensures new messages appear at the bottom
      />
    </View>
  );
}