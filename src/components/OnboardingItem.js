import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OnboardingItem({ item }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'flex-end', // aligns text at bottom
    paddingHorizontal: 30,
    paddingBottom: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.1)', // subtle overlay for better readability
  },
  title: {
    fontSize: 24, // smaller than before
    fontWeight: 'bold', // bold
    color: 'rgba(255,255,255,0.95)', // light, adaptive on most backgrounds
    marginBottom: 8,
  },
  description: {
    fontSize: 16, // smaller
    fontWeight: '600', // semi-bold
    color: 'rgba(255,255,255,0.9)', // slightly transparent white
    lineHeight: 22,
  },
});
