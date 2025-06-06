import { useUser } from "@clerk/clerk-expo";
import { Link, Redirect, useNavigation, useRootNavigationState, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function Index() {
  const { user: clerkUser } = useUser();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const rootNavigationState = useRootNavigationState();
  const navigation = useNavigation();

  useEffect(() => {
    CheckNavLoaded();
    navigation.setOptions({
      headerShown: false
    });

    // Listen for Firebase auth state changes
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const CheckNavLoaded = () => {
    if (!rootNavigationState?.key)
      return null;
  }

  // Show loading state while checking auth
  if (loading && !rootNavigationState?.key) {
    return null;
  }

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      {clerkUser || firebaseUser ?
        <Redirect href={'/(tabs)/home'} />
        : <Redirect href={'/login'} />}
    </View>
  );
}