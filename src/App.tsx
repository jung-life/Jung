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
import { AuthUrlHandler } from './components/AuthUrlHandler';
import { navigationRef } from './navigation/navigationService';
import * as NavigationService from './navigation/navigationService';
import AppNavigator from './navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

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
    track: (eventName, props) => console.log('Mixpanel track (mock):', eventName, props),
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
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <SupabaseProvider>
            <AuthUrlHandler />
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