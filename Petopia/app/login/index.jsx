import { View, Text, Image, Pressable, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import React, { useCallback, useState } from 'react'
import Colors from './../../constants/Colors'
import * as WebBrowser from 'expo-web-browser'
import { useOAuth } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    // Warm up the android browser to improve UX
    // https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync()
    return () => {
      void WebBrowser.coolDownAsync()
    }
  }, [])
}

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useWarmUpBrowser();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })
  const router = useRouter();

  const onGooglePress = useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(tabs)/home', { scheme: 'myapp' }),
      })

      if (createdSessionId) {
        // Set the user as active and then navigate
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)/home');
      } else {
        // Use signIn or signUp for next steps such as MFA
      }
    } catch (err) {
      console.error('OAuth error', err)
    }
  }, [])
  
  const handleFirebaseAuth = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setLoading(true);
    setError('');
    const auth = getAuth();
    
    try {
      if (isLogin) {
        // Login with existing account
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Create new account
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // Successfully authenticated, navigate to home
      router.replace('/(tabs)/home');
    } catch (error) {
      // Handle different Firebase auth errors
      let errorMessage = 'Authentication failed. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('./../../assets/images/login.png')}
        style={styles.headerImage}
      />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Ready to make a new friend?</Text>
        <Text style={styles.subtitle}>Let's adopt the pet which you like and make their life happy again</Text>
        
        {/* Firebase Auth Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>{isLogin ? 'Login' : 'Sign Up'}</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity
            onPress={handleFirebaseAuth}
            disabled={loading}
            style={[styles.authButton, loading && styles.authButtonDisabled]}
          >
            <Text style={styles.authButtonText}>
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={toggleAuthMode} style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.orText}>OR</Text>
        
        {/* Google OAuth Button */}
        <Pressable
          onPress={onGooglePress}
          style={styles.googleButton}
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WHITE,
    flexGrow: 1,
  },
  headerImage: {
    width: '100%',
    height: 300, // Reduced height to make space for the form
  },
  contentContainer: {
    padding: 20,
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'outfit-bold',
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'outfit',
    fontSize: 16,
    textAlign: 'center',
    color: Colors.GRAY,
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontFamily: 'outfit-bold',
    fontSize: 22,
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 10,
    fontFamily: 'outfit',
    fontSize: 16,
    marginBottom: 15,
  },
  authButton: {
    padding: 14,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 14,
    marginBottom: 15,
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  authButtonText: {
    fontFamily: 'outfit-medium',
    fontSize: 18,
    textAlign: 'center',
    color: Colors.WHITE,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  toggleText: {
    fontFamily: 'outfit',
    fontSize: 16,
    color: Colors.PRIMARY,
  },
  errorText: {
    color: 'red',
    fontFamily: 'outfit',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  orText: {
    fontFamily: 'outfit-medium',
    fontSize: 16,
    color: Colors.GRAY,
    marginVertical: 10,
  },
  googleButton: {
    padding: 14,
    backgroundColor: '#4285F4',
    width: '100%',
    borderRadius: 14,
  },
  googleButtonText: {
    fontFamily: 'outfit-medium',
    fontSize: 18,
    textAlign: 'center',
    color: Colors.WHITE,
  },
});