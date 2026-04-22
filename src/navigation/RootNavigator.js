import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import AuthNavigator from './AuthNavigator';
import CarDetailScreen from '../screens/CarDetailScreen';
import CaptureScreen from '../screens/CaptureScreen';
import FeedScreen from '../screens/FeedScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
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
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'Add') {
            return (
              <View style={spotTabStyles.spotBtn}>
                <Ionicons name="camera" size={22} color="#fff" />
              </View>
            );
          }
          const map = {
            Feed: focused ? 'grid' : 'grid-outline',
            Rank: focused ? 'trophy' : 'trophy-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          const name = map[route.name] || 'ellipse';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedStack} options={{ title: 'Feed' }} />
      <Tab.Screen name="Add" component={SpotStack} options={{ title: 'Spot' }} />
      <Tab.Screen name="Rank" component={LeaderboardScreen} options={{ title: 'Rank' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'You' }} />
    </Tab.Navigator>
  );
}

const spotTabStyles = StyleSheet.create({
  spotBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});

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
