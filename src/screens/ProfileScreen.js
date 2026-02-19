import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/icon.png')} // placeholder avatar
        style={styles.avatar}
      />
      <Text style={styles.name}>Test User</Text>
      <Text style={styles.email}>testuser@example.com</Text>
      <Text style={styles.subtitle}>
        Manage your account and preferences here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.screenPadding,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: COLORS.text,
    opacity: 0.7,
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
});
