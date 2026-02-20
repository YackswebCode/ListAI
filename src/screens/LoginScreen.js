// src/screens/LoginScreen.js
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import { COLORS, SIZES } from '../utils/theme';

// Required for iOS standalone: closes the auth session automatically
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  // Determine the correct client ID and redirect URI based on platform
  const getClientId = () => {
    switch (Platform.OS) {
      case 'android':
        return '468785841880-q69oefrm664rtbc4m173hdc3q5fmnkfr.apps.googleusercontent.com';
      case 'ios':
        return '468785841880-g8807i0podnk87t87b8cmd37vgo4os94.apps.googleusercontent.com';
      case 'web':
        return '468785841880-21p3qp4ikjb3hbgidglqc2lsq0176eiv.apps.googleusercontent.com';
      default:
        // Expo Go (uses the proxy)
        return '468785841880-21p3qp4ikjb3hbgidglqc2lsq0176eiv.apps.googleusercontent.com';
    }
  };

  const redirectUri = makeRedirectUri({
    // Use proxy for Expo Go (development), otherwise use custom scheme (standalone)
    useProxy: Platform.OS !== 'web' && !__DEV__ ? false : true,
    // For standalone apps, the scheme must match the one in app.json (e.g., "listai")
    scheme: 'listai', // Replace with your app scheme
    // For web, the redirect URI will be the current page URL (handled automatically)
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: getClientId(),
    iosClientId: Platform.OS === 'ios' ? getClientId() : undefined,
    androidClientId: Platform.OS === 'android' ? getClientId() : undefined,
    expoClientId: Platform.OS !== 'android' && Platform.OS !== 'ios' ? getClientId() : undefined,
    scopes: ['profile', 'email'],
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      setLoading(true);
      const { authentication } = response;

      fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${authentication.accessToken}` },
      })
        .then(res => res.json())
        .then(user => {
          setLoading(false);
          navigation.replace('Dashboard', { user });
        })
        .catch(err => {
          setLoading(false);
          Alert.alert('Login Failed', 'Unable to fetch user data.');
          console.error(err);
        });
    } else if (response?.type === 'error') {
      Alert.alert('Login Error', response.error?.message || 'Authentication failed.');
    }
  }, [response]);

  // On web, we need to handle the redirect via Linking
  useEffect(() => {
    if (Platform.OS === 'web' && response?.type === 'success') {
      // The redirect is already handled by the browser
    }
  }, [response]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await promptAsync({
        useProxy: Platform.OS !== 'web', // Use proxy for native, redirect for web
        showInRecents: false,
      });
    } catch (err) {
      Alert.alert('Login Error', 'Could not open authentication window.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ListAI</Text>
      <Text style={styles.subtitle}>Sign in to start creating listings</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <Button
          title="Login with Google"
          onPress={handleLogin}
          style={styles.button}
          textStyle={styles.buttonText}
          disabled={!request}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.screenPadding,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    opacity: 0.7,
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    width: '80%',
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});