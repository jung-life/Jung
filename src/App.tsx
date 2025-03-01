import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingScreen } from './screens/LandingScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { DisclaimerScreen } from './screens/DisclaimerScreen';
import { ConversationsScreen } from './screens/ConversationsScreen';
import { ChatScreen } from './screens/ChatScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { checkDisclaimerStatus } from './lib/supabase';
import { persistMemoryCache } from './lib/storage';
import { AppState } from 'react-native';

const Stack = createStackNavigator();

const Navigation = () => {
  const { user, loading, isNewUser, setIsNewUser } = useAuth();
  
  // Force check disclaimer status on every render when user is logged in
  useEffect(() => {
    const checkDisclaimer = async () => {
      if (user) {
        console.log("App.tsx: Checking disclaimer status for user");
        try {
          const hasSeenDisclaimer = await checkDisclaimerStatus();
          console.log("App.tsx: User has seen disclaimer:", hasSeenDisclaimer);
          setIsNewUser(!hasSeenDisclaimer);
        } catch (error) {
          console.error("App.tsx: Error checking disclaimer:", error);
          // Force disclaimer screen on error
          setIsNewUser(true);
        }
      }
    };
    
    checkDisclaimer();
  }, [user, setIsNewUser]);
  
  // Add this to log the current state
  useEffect(() => {
    console.log("Navigation state:", { 
      userExists: !!user, 
      isLoading: loading, 
      isNewUser 
    });
  }, [user, loading, isNewUser]);
  
  // Add this at the top of the Navigation component
  useEffect(() => {
    // Force all users to see disclaimer
    if (user) {
      console.log("FORCING DISCLAIMER SCREEN FOR ALL USERS");
      setIsNewUser(true);
    }
  }, [user, setIsNewUser]);
  
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App is going to background or being closed
        persistMemoryCache();
      }
    });

    return () => {
      subscription.remove();
      // Also persist on unmount
      persistMemoryCache();
    };
  }, []);
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  // Force the disclaimer screen if we're not sure
  if (user && isNewUser === undefined) {
    return <LoadingScreen />;
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : isNewUser ? (
          <Stack.Screen name="Disclaimer" component={DisclaimerScreen} />
        ) : (
          <>
            <Stack.Screen name="Conversations" component={ConversationsScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
} 