import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from './navigation/types';
import LandingScreen from './screens/LandingScreen';
import LoginScreenEnhanced from './screens/LoginScreen-enhanced';
import { RegisterScreen } from './screens/RegisterScreen';
import { HomeScreen } from './screens/HomeScreen';
import { AccountScreen } from './screens/AccountScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import PostLoginScreen from './screens/PostLoginScreen';
import DailyMotivationScreen from './screens/DailyMotivationScreen'; // Import the screen as default
import { ConversationsScreen } from './screens/ConversationsScreen-enhanced'; // Corrected import name
import { AuthProvider } from './contexts/AuthContext';
import { SupabaseProvider } from './contexts/SupabaseContext';
import * as Linking from 'expo-linking';
import { AuthUrlHandler } from './components/AuthUrlHandler';
import { navigationRef } from './navigation/navigationService';
import * as NavigationService from './navigation/navigationService';
import AppNavigator from './navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { initializeSupabaseEnhanced } from './lib/supabase-enhanced';

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

export default function EnhancedApp() {
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize the enhanced Supabase client
        const initResult = await initializeSupabaseEnhanced();
        
        if (!initResult.success) {
          console.error('Failed to initialize Supabase:', initResult.error);
          setInitError('Failed to initialize the app. Please restart the app and try again.');
        }
        
        // Log environment check results
        if (initResult.envCheck && !initResult.envCheck.isValid) {
          console.warn('Environment variable issues:', initResult.envCheck.issues);
          if (initResult.envCheck.usingDefaults) {
            console.warn('Using default Supabase credentials. This may cause authentication issues.');
          }
        }
        
        // Log database health check results
        if (initResult.dbHealthCheck && !initResult.dbHealthCheck.success) {
          console.error('Database health check failed:', initResult.dbHealthCheck.error);
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
        setInitError('An unexpected error occurred during initialization. Please restart the app.');
      } finally {
        setInitializing(false);
      }
    };
    
    initialize();
  }, []);

  // Show loading screen during initialization
  if (initializing) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <LoadingScreen />
        </View>
      </SafeAreaProvider>
    );
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <SafeAreaProvider>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Initialization Error</Text>
          <Text style={styles.errorMessage}>{initError}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <SupabaseProvider>
            <AuthUrlHandler />
            <NavigationContainer ref={navigationRef} linking={linking}>
              <Stack.Navigator
                initialRouteName="LandingScreen"
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen name="LandingScreen" component={LandingScreen} />
                <Stack.Screen name="Login" component={LoginScreenEnhanced} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="PostLoginScreen" component={PostLoginScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="AccountScreen" component={AccountScreen} />
                <Stack.Screen name="DailyMotivationScreen" component={DailyMotivationScreen} />
                {/* Add the Conversations screen */}
                <Stack.Screen name="ConversationsScreen" component={ConversationsScreen} /> 
              </Stack.Navigator>
            </NavigationContainer>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 24,
  },
});
