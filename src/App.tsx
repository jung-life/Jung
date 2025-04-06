import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from './navigation/types';
import LandingScreen from './screens/LandingScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { HomeScreen } from './screens/HomeScreen';
import { AccountScreen } from './screens/AccountScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import PostLoginScreen from './screens/PostLoginScreen';
import { AuthProvider } from './contexts/AuthContext';
import { SupabaseProvider, useSupabase } from './contexts/SupabaseContext';
import * as Linking from 'expo-linking';
// Removed AuthUrlHandler import as it's conflicting and unnecessary
import { navigationRef } from './navigation/navigationService';
import * as NavigationService from './navigation/navigationService';
import AppNavigator from './navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator } from 'react-native'; // Add View, ActivityIndicator
import { useFonts } from 'expo-font'; // Import useFonts
// Keep these imports for type checking, but loading is handled by useFonts
import AntDesign from '@expo/vector-icons/AntDesign'; 
import FontAwesome from '@expo/vector-icons/FontAwesome';


// Instead, use a conditional import with error handling
let mixpanelInstance;
try {
  // Dynamic import to handle potential missing module
  const Mixpanel = require('mixpanel-react-native');
  mixpanelInstance = Mixpanel.default || Mixpanel;
  
  if (mixpanelInstance && typeof mixpanelInstance.init === 'function') {
    mixpanelInstance.init('YOUR_MIXPANEL_TOKEN', {
      trackAutomaticEvents: true,
    });
    console.log('Mixpanel initialized successfully');
  } else {
    console.warn('Mixpanel module found but init method is missing');
  }
} catch (error) {
  console.error('Failed to import or initialize Mixpanel:', error);
  // Create a dummy implementation to prevent crashes
  mixpanelInstance = {
    // Add explicit types to parameters
    track: (eventName: string, props?: Record<string, any>) => console.log('Mixpanel track (mock):', eventName, props),
    init: () => console.log('Mixpanel init (mock)'),
  };
}

// Export for use in other files
export const mixpanel = mixpanelInstance;

const Stack = createNativeStackNavigator<RootStackParamList>();

// Create a linking configuration for deep links
const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      LandingScreen: 'landing',
      Login: 'login',
      Register: 'register',
      PostLoginScreen: 'post-login',
      Home: 'home',
      Account: 'account',
    },
  },
};

export default function App() {
  // Load fonts explicitly
  const [fontsLoaded, fontError] = useFonts({
    // Use the actual font names required by @expo/vector-icons
    'AntDesign': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf'),
    'FontAwesome': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf'),
  });

  // Show loading indicator while fonts load or if there's an error
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Log font loading errors
  if (fontError) {
    console.error("Error loading fonts:", fontError);
    // Optionally render an error message
  }
  
  // Render the app only when fonts are loaded
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <SupabaseProvider>
            {/* Removed AuthUrlHandler component */}
            <AppNavigator />
            <StatusBar style="auto" />
          </SupabaseProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
