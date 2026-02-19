import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Text,
  Dimensions,
  ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import OnboardingItem from '../components/OnboardingItem';
import { onboardingData } from '../constants/onboardingData';
import { COLORS, SIZES } from '../utils/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (slidesRef.current && currentIndex < onboardingData.length - 1) {
        slidesRef.current.scrollToIndex({ 
          index: currentIndex + 1, 
          animated: true 
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const getStarted = () => navigation.replace('Login');

  // Animated slide rendering with scale & fade
  const renderAnimatedItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, transform: [{ scale }], opacity }}>
        <ImageBackground
          source={item.image}
          style={styles.image}
          resizeMode="cover"
        >
          {/* Gradient overlay at bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.gradientOverlay}
          />
          <OnboardingItem item={item} />
        </ImageBackground>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Get Started */}
      <TouchableOpacity style={styles.getStartedButton} onPress={getStarted}>
        <Text style={styles.getStartedText}>Get Started</Text>
      </TouchableOpacity>

      <FlatList
        data={onboardingData}
        renderItem={renderAnimatedItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        ref={slidesRef}
        // ✅ Add getItemLayout to enable scrollToIndex
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Pagination dots */}
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, i) => {
            const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 25, 10],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                style={[styles.dot, { width: dotWidth, opacity }]}
                key={i.toString()}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  getStartedButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  getStartedText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  image: { flex: 1, justifyContent: 'flex-end', width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 250,
  },
  footer: { paddingHorizontal: SIZES.screenPadding, paddingBottom: 30, position: 'absolute', bottom: 0, width: '100%' },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  dot: { height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginHorizontal: 5 },
});