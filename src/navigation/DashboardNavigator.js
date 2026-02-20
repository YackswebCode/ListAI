// src/navigation/DashboardNavigator.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../utils/theme';

// Screens
import AIListingScreen from '../screens/AIListingScreen';
import HomeScreen from '../screens/HomeScreen';
import ListingsScreen from '../screens/ListingsScreen';

const Tab = createBottomTabNavigator();

export default function DashboardNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 100,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'AIListing') iconName = 'camera-outline';
          else if (route.name === 'Listings') iconName = 'list-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="AIListing" component={AIListingScreen} />
      <Tab.Screen name="Listings" component={ListingsScreen} />
    </Tab.Navigator>
  );
}