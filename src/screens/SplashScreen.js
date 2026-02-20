// src/screens/SplashScreen.js
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/theme';

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
        // Hide splash and navigate directly to Dashboard (HomeScreen inside Tab Navigator)
        await SplashScreen.hideAsync();
        navigation.replace('Dashboard'); // <-- changed from 'Onboarding'
      }
    }
    prepare();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/icon.png')} // App logo
        style={styles.logo}
      />
      <Text style={styles.title}>Welcome to ListAI</Text>
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