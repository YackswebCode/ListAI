// src/screens/LoginScreen.js
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import { COLORS, SIZES } from '../utils/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  // Configure Google OAuth client IDs for each platform
  const clientIds = {
    expo: '468785841880-21p3qp4ikjb3hbgidglqc2lsq0176eiv.apps.googleusercontent.com',
    android: '468785841880-q69oefrm664rtbc4m173hdc3q5fmnkfr.apps.googleusercontent.com',
    ios: '468785841880-g8807i0podnk87t87b8cmd37vgo4os94.apps.googleusercontent.com',
    web: '468785841880-21p3qp4ikjb3hbgidglqc2lsq0176eiv.apps.googleusercontent.com',
  };

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId:
      Platform.OS === 'android'
        ? clientIds.android
        : Platform.OS === 'ios'
        ? clientIds.ios
        : Platform.OS === 'web'
        ? clientIds.web
        : clientIds.expo,
    scopes: ['profile', 'email'],
    redirectUri: makeRedirectUri({
      // For Expo Go and standalone apps
      useProxy: Platform.OS !== 'web',
    }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      setLoading(true);
      const { authentication } = response;

      fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: {
          Authorization: `Bearer ${authentication.accessToken}`,
        },
      })
        .then(res => res.json())
        .then(user => {
          setLoading(false);
          // Navigate to Dashboard with user info
          navigation.replace('Dashboard', { user });
        })
        .catch(err => {
          setLoading(false);
          Alert.alert('Login Failed', 'Unable to fetch user data.');
          console.log(err);
        });
    } else if (response?.type === 'error') {
      Alert.alert('Login Error', 'Google authentication failed.');
    }
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ListAI</Text>
      <Text style={styles.subtitle}>Sign in to start creating listings</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <Button
          title="Login with Google"
          onPress={() =>
            promptAsync({
              useProxy: Platform.OS !== 'web', // Proxy only for mobile, web uses redirect
            })
          }
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
