import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native'; // Removed NavigationContainerRefContext
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
// Removed * as NavigationService import as it's not directly used after refactor
// Remove AppNavigator import: import AppNavigator from './navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, Alert, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import { useFonts } from 'expo-font'; // Import useFonts
import { initializeSupabaseEnhanced } from './lib/supabase-enhanced'; // Removed unused imports

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
import JournalingScreen from './screens/JournalingScreen'; // Import JournalingScreen
import { LoadingScreen } from './screens/LoadingScreen';
import TestAvatarScreen from './screens/TestAvatarScreen'; // Import TestAvatarScreen
import { HamburgerMenu } from './components/HamburgerMenu'; // Import HamburgerMenu
import { TouchableOpacity } from 'react-native'; // Added for headerLeft
import { House } from 'phosphor-react-native'; // Added for headerLeft icon
import { ConversationHistoryScreen } from './screens/ConversationHistoryScreen-enhanced'; // Import enhanced version
import { ConversationInsightsScreenEnhanced } from './screens/ConversationInsightsScreen-enhanced'; // Import enhanced version (Corrected import name)

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

// Define Auth Stack Navigator
const AuthStackNavigator = () => (
  <Stack.Navigator initialRouteName="LandingScreen">
    {/* Logged-out Screens */}
    <Stack.Screen name="LandingScreen" component={LandingScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Login" component={LoginScreenEnhanced} options={{ headerShown: false }} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
    {/* Common screens accessible without login */}
    <Stack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy', ...defaultPostLoginOptions }} />
    <Stack.Screen name="TermsOfServiceScreen" component={TermsOfServiceScreen} options={{ title: 'Terms of Service', ...defaultPostLoginOptions }} />
    <Stack.Screen name="DisclaimerScreen" component={DisclaimerScreen} options={{ title: 'Disclaimer', ...defaultPostLoginOptions }} />
  </Stack.Navigator>
);

// Define Main App Stack Navigator
// Pass isNewUser as a prop
const MainStackNavigator = ({ isNewUser }: { isNewUser: boolean }) => (
   <Stack.Navigator 
     initialRouteName={isNewUser ? 'DisclaimerScreen' : 'PostLoginScreen'}
     screenOptions={{ headerShown: false }}
   >
    {/* Logged-in Screens */}
    <Stack.Screen name="PostLoginScreen" component={PostLoginScreen} options={{ title: 'Home', ...defaultPostLoginOptions }} />
    <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home', ...defaultPostLoginOptions }} />
    <Stack.Screen name="ConversationsScreen" component={ConversationsScreen} options={{ title: 'Conversations', ...defaultPostLoginOptions }} />
    <Stack.Screen name="ConversationHistoryScreen" component={ConversationHistoryScreen} options={{ title: 'Conversation History', ...defaultPostLoginOptions }} />
    {/* Use the correct component name and screen name from types.ts */}
    <Stack.Screen name="ConversationInsightsScreen-enhanced" component={ConversationInsightsScreenEnhanced} options={{ title: 'Conversation Insights', ...defaultPostLoginOptions }} /> 
    <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat', ...defaultPostLoginOptions }} />
    <Stack.Screen name="AccountScreen" component={AccountScreen} options={{ title: 'Account Settings', ...defaultPostLoginOptions }} />
    <Stack.Screen name="DailyMotivationScreen" component={DailyMotivationScreen} options={{ title: 'Daily Motivation', ...defaultPostLoginOptions }} />
    <Stack.Screen name="EmotionalAssessmentScreen" component={EmotionalAssessmentScreen} options={{ title: 'Emotional Assessment', ...defaultPostLoginOptions }} />
    <Stack.Screen name="SelfHelpResourcesScreen" component={SelfHelpResourcesScreen} options={{ title: 'Self-Help Resources', ...defaultPostLoginOptions }} />
    <Stack.Screen
      name="MoodTrackerScreen"
      component={MoodTrackerScreen}
      options={({ navigation }) => ({
        title: 'Mood Tracker',
        headerShown: true, // Explicitly set headerShown
        headerBackVisible: false,
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={{ marginLeft: 10, padding: 5 }}>
            <House size={24} color={defaultPostLoginOptions.headerTintColor} />
          </TouchableOpacity>
        ),
        headerRight: () => <HamburgerMenu />, // Explicitly set headerRight
        headerStyle: defaultPostLoginOptions.headerStyle,
        headerTintColor: defaultPostLoginOptions.headerTintColor,
        headerTitleStyle: defaultPostLoginOptions.headerTitleStyle,
      })}
    />
    <Stack.Screen name="JournalingScreen" component={JournalingScreen} options={{ title: 'Journal', ...defaultPostLoginOptions }} />
    {/* Common screens also accessible when logged in */}
    <Stack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy', ...defaultPostLoginOptions }} />
    <Stack.Screen name="TermsOfServiceScreen" component={TermsOfServiceScreen} options={{ title: 'Terms of Service', ...defaultPostLoginOptions }} />
    <Stack.Screen name="DisclaimerScreen" component={DisclaimerScreen} options={{ title: 'Disclaimer', ...defaultPostLoginOptions }} />
     {/* Loading screen might not be needed here if handled outside */}
     {/* <Stack.Screen name="LoadingScreen" component={LoadingScreen} options={{ headerShown: false }} /> */}
  </Stack.Navigator>
);


// Main App Component that renders the correct navigator
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
      } catch (error) {
        console.error('Error during app initialization:', error);
        setInitError('An unexpected error occurred during initialization.');
      } finally {
        setInitializing(false);
      }
    };
    initialize();
  }, []);

  // Handle deep linking (keep existing logic)
  useEffect(() => {
    const handleDeepLink = (url: string | null) => {
      if (!url) return;
      console.log('App received deep link URL:', url);
      // Let AuthUrlHandler process it
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

  // Render the NavigationContainer wrapping the conditional navigator logic
  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={() => {
        console.log('NavigationContainer is ready');
        // No longer processing pending actions - relying on declarative navigation
      }}
      onStateChange={(state) => {
        console.log('Navigation state changed:', state ? 'New state available' : 'No state');
      }}
    >
      {/* Conditionally render the correct navigator based on session state */}
      {session?.user ? <MainStackNavigator isNewUser={isNewUser} /> : <AuthStackNavigator />}
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
