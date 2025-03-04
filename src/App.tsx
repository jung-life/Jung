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
import { checkDisclaimerStatus, checkDatabaseHealth, ensureDatabaseStructure, ensureUserPreferences, initializeDatabase, updateDatabaseSchema, ensureCorrectIdType, fixDatabaseSchema } from './lib/supabase';
import { persistMemoryCache } from './lib/storage';
import { AppState, Linking, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { preloadAvatarImages } from './lib/imagePreloader';
import { AccountScreen } from './screens/AccountScreen';
import { SecurityScreen } from './screens/SecurityScreen';
import { useNavigation } from '@react-navigation/native';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { PrivacyPolicyScreen } from './screens/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from './screens/TermsOfServiceScreen';

const Stack = createStackNavigator();

const Navigation = () => {
  const { user, loading, isNewUser, setIsNewUser } = useAuth();
  
  // Update the checkDisclaimer function in App.tsx to be more reliable

  useEffect(() => {
    const checkDisclaimer = async () => {
      if (user) {
        // Type assertion to tell TypeScript that user is a User object
        const currentUser = user as User;
        console.log("App.tsx: Checking disclaimer status for user:", currentUser.id);
        try {
          // Force a fresh check from the database
          const { data, error } = await supabase
            .from('user_preferences')
            .select('has_seen_disclaimer')
            .eq('user_id', currentUser.id)
            .single();
            
          if (error) {
            console.error("App.tsx: Error fetching disclaimer status:", error);
            // Force disclaimer screen on error
            setIsNewUser(true);
            return;
          }
          
          const hasSeenDisclaimer = data?.has_seen_disclaimer === true;
          console.log("App.tsx: Direct DB check - User has seen disclaimer:", hasSeenDisclaimer);
          
          // Explicitly set isNewUser based on disclaimer status
          if (!hasSeenDisclaimer) {
            console.log("App.tsx: User has NOT seen disclaimer, showing disclaimer screen");
            setIsNewUser(true);
          } else {
            console.log("App.tsx: User HAS seen disclaimer, skipping to main app");
            setIsNewUser(false);
          }
        } catch (error) {
          console.error("App.tsx: Error checking disclaimer:", error);
          // Force disclaimer screen on error
          setIsNewUser(true);
        }
      }
    };
    
    // Run this check whenever the user changes
    if (user) {
      checkDisclaimer();
    }
  }, [user, setIsNewUser]);
  
  // Add this to log the current state
  useEffect(() => {
    console.log("Navigation state:", { 
      userExists: !!user, 
      isLoading: loading, 
      isNewUser 
    });
  }, [user, loading, isNewUser]);
  
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
    const handleDeepLink = async (event: { url: string }) => {
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
              // Don't use navigation here
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
  }, []);
  
  useEffect(() => {
    // Preload avatar images when the app starts
    preloadAvatarImages().then(results => {
      const successCount = results.filter(Boolean).length;
      console.log(`Preloaded ${successCount}/${results.length} avatar images`);
    });
  }, []);
  
  useEffect(() => {
    // Check database health but don't try to modify structure
    checkDatabaseHealth().then(isHealthy => {
      if (!isHealthy) {
        Alert.alert(
          'Database Connection Issue',
          'There seems to be an issue connecting to the database. Some features may not work properly.',
          [{ text: 'OK' }]
        );
      }
    });
    
    // Skip these operations that require high permissions
    // updateDatabaseSchema();
    // initializeDatabase();
    // ensureCorrectIdType();
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
  
  useEffect(() => {
    const initApp = async () => {
      try {
        // First try to fix any database schema issues
        await fixDatabaseSchema();
        
        // Then initialize the database
        await initializeDatabase();
        
        // Continue with other initialization...
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };
    
    initApp();
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
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
          </>
        ) : isNewUser ? (
          <>
            <Stack.Screen name="Disclaimer" component={DisclaimerScreen} />
            <Stack.Screen name="SecurityScreen" component={SecurityScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Conversations" component={ConversationsScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="AccountScreen" component={AccountScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
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