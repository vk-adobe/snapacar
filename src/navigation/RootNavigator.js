import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import AuthNavigator from './AuthNavigator';
import CarDetailScreen from '../screens/CarDetailScreen';
import CaptureScreen from '../screens/CaptureScreen';
import FeedScreen from '../screens/FeedScreen';
import PlateSearchScreen from '../screens/PlateSearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

function FeedStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="FeedHome"
        component={FeedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CarDetail"
        component={CarDetailScreen}
        options={{ headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="PlateSearch"
        component={PlateSearchScreen}
        options={{ title: 'Find by plate' }}
      />
    </Stack.Navigator>
  );
}

function SpotStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="SpotForm"
        component={CaptureScreen}
        options={{ title: 'Log a spot' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          minHeight: 52 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const map = {
            Feed: 'grid-outline',
            Add: 'camera-outline',
            Profile: 'person-outline',
          };
          const name = map[route.name] || 'ellipse';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedStack} options={{ title: 'Feed' }} />
      <Tab.Screen name="Add" component={SpotStack} options={{ title: 'Spot' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'You' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { session } = useAuth();

  return (
    <NavigationContainer theme={navTheme}>
      {!session ? (
        <AuthNavigator />
      ) : (
        <AppProvider>
          <MainTabs />
        </AppProvider>
      )}
    </NavigationContainer>
  );
}
