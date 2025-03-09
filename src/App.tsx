import React, { useEffect, useState } from 'react';
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
import { supabase } from './lib/supabase';
import * as Linking from 'expo-linking';
import AuthCallback from './auth/callback';
import { AuthUrlHandler } from './components/AuthUrlHandler';

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

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        setIsAuthenticated(!!data.session);
        setIsLoading(false);
      } catch (e) {
        console.error('Unexpected error checking auth:', e);
        setIsLoading(false);
      }
    };

    checkAuth();

    // Set up auth state listener with better error handling
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setIsAuthenticated(!!session);
        
        // If user just signed in, navigate to post-login screen
        if (event === 'SIGNED_IN' && session) {
          // You could trigger navigation here if needed
        }
      }
    );

    return () => {
      // Clean up the subscription
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Use the AuthCallback component to handle deep links
  // This is in addition to the URL handler you already have
  AuthCallback();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthUrlHandler />
        <NavigationContainer linking={linking}>
          <Stack.Navigator 
            initialRouteName="Landing"
            screenOptions={{ 
              headerShown: false,
              animation: 'fade'
            }}
          >
            {isAuthenticated ? (
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
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
} 