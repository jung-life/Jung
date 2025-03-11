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
    <SafeAreaProvider>
      <AuthProvider>
        <SupabaseProvider>
          <AuthUrlHandler />
          <AppNavigator />
          <StatusBar style="auto" />
        </SupabaseProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
} 