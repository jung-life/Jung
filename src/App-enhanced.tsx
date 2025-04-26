import React, { useEffect, useState } from 'react';
import { NavigationContainer, NavigationContainerRefContext } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from './navigation/types';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Import useAuth
import { SupabaseProvider } from './contexts/SupabaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import * as Linking from 'expo-linking';
import { useURL } from 'expo-linking'; // Use useURL hook
import { AuthUrlHandler } from './components/AuthUrlHandler'; // Keep AuthUrlHandler
import { navigationRef, processPendingNavigationActions } from './navigation/navigationService';
import * as NavigationService from './navigation/navigationService';
// Remove AppNavigator import: import AppNavigator from './navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, Alert, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import { useFonts } from 'expo-font'; // Import useFonts
import { initializeSupabaseEnhanced, storeAuthDataEnhanced, checkSessionEnhanced, supabaseEnhanced } from './lib/supabase-enhanced';

// Import Screens directly
import LandingScreen from './screens/LandingScreen';
import LoginScreenEnhanced from './screens/LoginScreen-enhanced'; // Use enhanced version
import { RegisterScreen } from './screens/RegisterScreen';
import PostLoginScreen from './screens/PostLoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ConversationsScreen } from './screens/ConversationsScreen-enhanced'; // Use enhanced version
import { ChatScreen } from './screens/ChatScreen';
import { AccountScreen } from './screens/AccountScreen';
import { PrivacyPolicyScreen } from './screens/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from './screens/TermsOfServiceScreen';
import { DisclaimerScreen } from './screens/DisclaimerScreen';
import DailyMotivationScreen from './screens/DailyMotivationScreen';
import { EmotionalAssessmentScreen } from './screens/EmotionalAssessmentScreen';
import SelfHelpResourcesScreen from './screens/SelfHelpResourcesScreen';
import MoodTrackerScreen from './screens/MoodTrackerScreen'; // Import MoodTrackerScreen
import { LoadingScreen } from './screens/LoadingScreen';
import { HamburgerMenu } from './components/HamburgerMenu'; // Import HamburgerMenu

// Mixpanel setup (keeping existing logic)
let mixpanelInstance;
try {
  const Mixpanel = require('mixpanel-react-native');
  mixpanelInstance = Mixpanel.default || Mixpanel;
  if (mixpanelInstance && typeof mixpanelInstance.init === 'function') {
    mixpanelInstance.init('YOUR_MIXPANEL_TOKEN', { trackAutomaticEvents: true });
    console.log('Mixpanel initialized successfully');
  } else {
    console.warn('Mixpanel module found but init method is missing');
  }
} catch (error) {
  console.error('Failed to import or initialize Mixpanel:', error);
  mixpanelInstance = {
    track: (eventName: string, props?: Record<string, any>) => console.log('Mixpanel track (mock):', eventName, props),
    init: () => console.log('Mixpanel init (mock)'),
  };
}
export const mixpanel = mixpanelInstance;

const Stack = createNativeStackNavigator<RootStackParamList>();

// Linking configuration (keeping existing)
const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      LandingScreen: 'landing',
      Login: 'login', // Ensure this matches the screen name used in the stack
      Register: 'register',
      PostLoginScreen: 'post-login',
      Home: 'home',
      AccountScreen: 'account', // Ensure this matches the screen name
      // Add other deep linkable screens if needed
    },
  },
};

// Default header options for logged-in screens
const defaultPostLoginOptions = {
  headerShown: true,
  headerRight: () => <HamburgerMenu />,
  headerStyle: {
    backgroundColor: '#ffffff', // Example color
  },
  headerTintColor: '#4A3B78', // Example color
  headerTitleStyle: {
    fontWeight: 'bold' as const,
  },
};

// Main App Component that includes the Navigator
const AppContentEnhanced = () => {
  const { session, isNewUser, loading: authLoading } = useAuth(); // Use auth loading state
  const initialUrl = useURL();
  const [initializing, setInitializing] = useState(true); // Keep app init state
  const [initError, setInitError] = useState<string | null>(null); // Keep app init error state

  // Initialize Supabase Enhanced
  useEffect(() => {
    const initialize = async () => {
      try {
        const initResult = await initializeSupabaseEnhanced();
        if (!initResult.success) {
          console.error('Failed to initialize Supabase:', initResult.error);
          setInitError('Failed to initialize the app. Please restart.');
        }
        // Log env/db checks if needed
      } catch (error) {
        console.error('Error during app initialization:', error);
        setInitError('An unexpected error occurred during initialization.');
      } finally {
        setInitializing(false);
      }
    };
    initialize();
  }, []);

  // Handle deep linking (keep existing logic, but ensure it doesn't interfere)
  // AuthUrlHandler might be handling the session setting now
  useEffect(() => {
     // If AuthUrlHandler is setting the session, this manual handling might be redundant
     // or could cause conflicts. Review AuthUrlHandler's logic.
     // For now, keep the listener but be aware of potential overlap.
    const handleDeepLink = (url: string | null) => {
      if (!url) return;
      console.log('App received deep link URL:', url);
      // Let AuthUrlHandler process it, or add specific logic here if needed
    };

    if (initialUrl) handleDeepLink(initialUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => subscription.remove();
  }, [initialUrl]);

  // Load fonts
  const [fontsLoaded, fontError] = useFonts({
    'AntDesign': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf'),
    'FontAwesome': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf'),
  });

  // Combined loading state
  const isLoading = initializing || authLoading || (!fontsLoaded && !fontError);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A3B78" />
      </View>
    );
  }

  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorMessage}>{initError}</Text>
      </View>
    );
  }

   if (fontError) {
    console.error("Error loading fonts:", fontError);
    return (
       <View style={styles.errorContainer}>
         <Text style={styles.errorTitle}>Font Error</Text>
         <Text style={styles.errorMessage}>Could not load required fonts.</Text>
       </View>
    );
  }

  // Determine initial route based on auth state
  const initialRoute: keyof RootStackParamList = session?.user
    ? (isNewUser ? 'DisclaimerScreen' : 'PostLoginScreen')
    : 'LandingScreen';

  return (
    <NavigationContainer 
      ref={navigationRef} 
      linking={linking}
      onReady={() => {
        console.log('NavigationContainer is ready');
        processPendingNavigationActions();
      }}
    >
      <Stack.Navigator initialRouteName={initialRoute}>
        {/* Screens always available */}
        <Stack.Screen name="LoadingScreen" component={LoadingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy', ...defaultPostLoginOptions }} />
        <Stack.Screen name="TermsOfServiceScreen" component={TermsOfServiceScreen} options={{ title: 'Terms of Service', ...defaultPostLoginOptions }} />
        <Stack.Screen name="DisclaimerScreen" component={DisclaimerScreen} options={{ title: 'Disclaimer', ...defaultPostLoginOptions }} />

        {/* Conditional Screens based on Auth */}
        {session?.user ? (
          <>
            {/* Logged-in Screens */}
            <Stack.Screen name="PostLoginScreen" component={PostLoginScreen} options={{ title: 'Home', ...defaultPostLoginOptions }} />
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home', ...defaultPostLoginOptions }} />
            <Stack.Screen name="ConversationsScreen" component={ConversationsScreen} options={{ title: 'Conversations', ...defaultPostLoginOptions }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat', ...defaultPostLoginOptions }} />
            <Stack.Screen name="AccountScreen" component={AccountScreen} options={{ title: 'Account Settings', ...defaultPostLoginOptions }} />
            <Stack.Screen name="DailyMotivationScreen" component={DailyMotivationScreen} options={{ title: 'Daily Motivation', ...defaultPostLoginOptions }} />
            <Stack.Screen name="EmotionalAssessmentScreen" component={EmotionalAssessmentScreen} options={{ title: 'Emotional Assessment', ...defaultPostLoginOptions }} />
            <Stack.Screen name="SelfHelpResourcesScreen" component={SelfHelpResourcesScreen} options={{ title: 'Self-Help Resources', ...defaultPostLoginOptions }} />
            <Stack.Screen name="MoodTrackerScreen" component={MoodTrackerScreen} options={{ title: 'Mood Tracker', ...defaultPostLoginOptions }} />
             {/* Ensure Landing/Login/Register are NOT duplicated here if defined below */}
          </>
        ) : (
          <>
            {/* Logged-out Screens */}
            <Stack.Screen name="LandingScreen" component={LandingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreenEnhanced} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            {/* Note: Privacy/Terms/Disclaimer are already defined above */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Root App component wrapping providers
export default function EnhancedApp() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <SupabaseProvider> {/* Ensure SupabaseProvider uses supabaseEnhanced if needed */}
          <AuthProvider> {/* Ensure AuthProvider uses supabaseEnhanced if needed */}
            <ThemeProvider>
              <AuthUrlHandler /> {/* Add AuthUrlHandler here, outside NavigationContainer */}
              <AppContentEnhanced /> {/* Render the component containing hooks and navigator */}
              <StatusBar style="auto" />
            </ThemeProvider>
          </AuthProvider>
        </SupabaseProvider>
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
    backgroundColor: '#f5f5f5', // Or theme-based color
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5', // Or theme-based color
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e53e3e', // Or theme-based color
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#4a5568', // Or theme-based color
    textAlign: 'center',
    lineHeight: 24,
  },
});
