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
import { checkDisclaimerStatus, checkDatabaseHealth, ensureDatabaseStructure, ensureUserPreferences, initializeDatabase, updateDatabaseSchema, ensureCorrectIdType } from './lib/supabase';
import { persistMemoryCache } from './lib/storage';
import { AppState, Linking, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { preloadAvatarImages } from './lib/imagePreloader';
import { AccountScreen } from './screens/AccountScreen';

const Stack = createStackNavigator();

const Navigation = () => {
  const { user, loading, isNewUser, setIsNewUser, navigation } = useAuth();
  
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
  
  useEffect(() => {
    // Handle deep links for email confirmation
    const handleDeepLink = async (event) => {
      const url = event.url;
      console.log('Deep link received:', url);
      
      // Check if this is an email confirmation link
      if (url.includes('confirm-email') || url.includes('token=')) {
        try {
          // Extract the token from the URL
          const token = url.split('token=')[1]?.split('&')[0];
          
          if (token) {
            // Process the confirmation
            const { error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'email',
            });
            
            if (error) {
              console.error('Error confirming email:', error);
              Alert.alert('Error', 'Failed to confirm your email. Please try again.');
            } else {
              Alert.alert('Success', 'Your email has been confirmed! You can now log in.');
              // Navigate to login screen
              navigation.navigate('Landing');
            }
          }
        } catch (error) {
          console.error('Error processing confirmation link:', error);
        }
      }
    };

    // Add event listener for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check for initial URL (app opened via deep link)
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigation]);
  
  useEffect(() => {
    // Preload avatar images when the app starts
    preloadAvatarImages().then(results => {
      const successCount = results.filter(Boolean).length;
      console.log(`Preloaded ${successCount}/${results.length} avatar images`);
    });
  }, []);
  
  useEffect(() => {
    const checkDatabase = async () => {
      const isHealthy = await checkDatabaseHealth();
      
      if (!isHealthy) {
        Alert.alert(
          'Database Connection Issue',
          'There seems to be an issue connecting to the database. Some features may not work properly.',
          [{ text: 'OK' }]
        );
      }
      
      // Ensure all required tables exist
      await ensureDatabaseStructure();
    };
    
    checkDatabase();
  }, []);
  
  useEffect(() => {
    const checkUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Ensure user preferences exist
        const success = await ensureUserPreferences();
        
        if (!success) {
          console.warn('Failed to ensure user preferences exist');
        }
      }
    };
    
    checkUserData();
  }, []);
  
  useEffect(() => {
    // Check and update database schema
    updateDatabaseSchema().then(() => {
      // Then initialize database tables
      initializeDatabase();
      // Ensure ID columns are the correct type
      ensureCorrectIdType();
    });
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
            <Stack.Screen name="AccountScreen" component={AccountScreen} />
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