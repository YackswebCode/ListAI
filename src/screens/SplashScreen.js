import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS, SIZES } from '../utils/theme';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function SplashScreenComponent({ navigation }) {
  useEffect(() => {
    async function prepare() {
      try {
        // Simulate loading resources (database, etc.)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Hide splash and navigate to appropriate screen
        await SplashScreen.hideAsync();
        // Check if user is logged in (we'll implement later)
        // For now, go to Onboarding
        navigation.replace('Onboarding');
      }
    }
    prepare();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/icon.png')} // Use your app icon or logo
        style={styles.logo}
      />
      <Text style={styles.title}>Welcome to ListAI </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});