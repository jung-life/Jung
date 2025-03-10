import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from './navigation/types';
import { LandingScreen } from './screens/LandingScreen';
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

const Stack = createNativeStackNavigator<RootStackParamList>();

// Create a linking configuration for deep links
const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Landing: 'landing',
      Login: 'login',
      Register: 'register',
      PostLoginScreen: 'post-login',
      Home: 'home',
      Account: 'account',
    },
  },
};

const AppNavigator = () => {
  const { isLoggedIn, loading } = useSupabase();

  if (loading) {
    return <LoadingScreen />;
  }
 
  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator 
        initialRouteName="Landing"
        screenOptions={{ 
          headerShown: false,
          animation: 'fade'
        }}
      >
        {isLoggedIn ? (
          // Authenticated user routes
          <>
            <Stack.Screen name="PostLoginScreen" component={PostLoginScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="AccountScreen" component={AccountScreen} />
          </>
        ) : (
          // Non-authenticated user routes
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
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