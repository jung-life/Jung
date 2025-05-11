import React, { useEffect } from 'react'; // Import useEffect
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from './navigation/types';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Import useAuth
import { SupabaseProvider } from './contexts/SupabaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import * as Linking from 'expo-linking';
import { useURL } from 'expo-linking';
import { navigationRef } from './navigation/navigationService';
import * as NavigationService from './navigation/navigationService';
// Remove AppNavigator import: import AppNavigator from './navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { useFonts } from 'expo-font';
import { supabase, storeAuthData, checkSession } from './lib/supabase';

// Import Screens directly
import LandingScreen from './screens/LandingScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import PostLoginScreen from './screens/PostLoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ConversationsScreen } from './screens/ConversationsScreen';
import { ChatScreen } from './screens/ChatScreen';
import { AccountScreen } from './screens/AccountScreen';
import { PrivacyPolicyScreen } from './screens/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from './screens/TermsOfServiceScreen';
import { DisclaimerScreen } from './screens/DisclaimerScreen';
import DailyMotivationScreen from './screens/DailyMotivationScreen';
import { EmotionalAssessmentScreen } from './screens/EmotionalAssessmentScreen';
import SelfHelpResourcesScreen from './screens/SelfHelpResourcesScreen';
import MoodTrackerScreen from './screens/MoodTrackerScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { HamburgerMenu } from './components/HamburgerMenu'; // Import HamburgerMenu
import { TouchableOpacity } from 'react-native'; // Added for headerLeft
import { House } from 'phosphor-react-native'; // Added for headerLeft icon

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
      Login: 'login',
      Register: 'register',
      PostLoginScreen: 'post-login',
      Home: 'home',
      AccountScreen: 'account', // Ensure this matches the screen name in RootStackParamList
      // Add other deep linkable screens if needed
    },
  },
};

// Default header options for logged-in screens
const defaultPostLoginOptions = {
  headerShown: true, // Show header by default for these screens
  headerRight: () => <HamburgerMenu />,
  headerStyle: {
    backgroundColor: '#ffffff', // Example color, adjust as needed
  },
  headerTintColor: '#4A3B78', // Example color, adjust as needed
  headerTitleStyle: {
    fontWeight: 'bold' as const,
  },
};

// Main App Component that includes the Navigator
const AppContent = () => {
  const { session, isNewUser, loading } = useAuth();
  const initialUrl = useURL(); // Keep deep link handling

  // Handle deep linking for OAuth
  useEffect(() => {
    const handleAuthRedirect = (url: string | null) => {
      if (!url) return;
      console.log('>>> Handling Auth Redirect URL:', url);
      const fragment = url.split('#')[1];
      if (fragment) {
        console.log('>>> URL Fragment found:', fragment);
        const params = new URLSearchParams(fragment);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          console.log('>>> Tokens found. Attempting manual setSession...');
          supabase.auth.setSession({ access_token, refresh_token })
            .then(({ data, error }) => {
              if (error) console.error('>>> Error calling setSession manually:', error);
              else {
                console.log('>>> Manual setSession call successful. Data:', data);
                if (data.session) storeAuthData(data.session).catch(err => console.error('>>> Error storing session data:', err));
                // No need to manually navigate here, the navigator will react to the session change
              }
            })
            .catch(err => console.error('>>> Exception during manual setSession call:', err));
        } else console.log('>>> access_token or refresh_token not found in URL fragment.');
      } else console.log('>>> URL does not contain a fragment (#).');
    };

    if (initialUrl) handleAuthRedirect(initialUrl);
    const subscription = Linking.addEventListener('url', (event) => handleAuthRedirect(event.url));
    return () => subscription.remove();
  }, [initialUrl]);

  // Load fonts
  const [fontsLoaded, fontError] = useFonts({
    'AntDesign': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf'),
    'FontAwesome': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf'),
  });

  if (loading || (!fontsLoaded && !fontError)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A3B78" />
      </View>
    );
  }

  if (fontError) {
    console.error("Error loading fonts:", fontError);
    return (
       <View style={styles.container}>
         <Text>Error loading fonts.</Text>
       </View>
    );
  }

  // Determine initial route based on auth state
  const initialRoute: keyof RootStackParamList = session?.user
    ? (isNewUser ? 'DisclaimerScreen' : 'PostLoginScreen')
    : 'LandingScreen';

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
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
            <Stack.Screen 
              name="MoodTrackerScreen" 
              component={MoodTrackerScreen} 
              options={({ navigation }) => ({ 
                title: 'Mood Tracker', 
                ...defaultPostLoginOptions,
                headerLeft: () => (
                  <TouchableOpacity onPress={() => navigation.navigate('Home')} style={{ marginLeft: 10, padding: 5 }}>
                    <House size={24} color={defaultPostLoginOptions.headerTintColor} />
                  </TouchableOpacity>
                ),
                headerBackVisible: false, 
              })} 
            />
            {/* Add Landing/Login/Register here ONLY if you want logged-in users to access them */}
            {/* <Stack.Screen name="LandingScreen" component={LandingScreen} options={{ headerShown: false }} /> */}
            {/* <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} /> */}
            {/* <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} /> */}
          </>
        ) : (
          <>
            {/* Logged-out Screens */}
            <Stack.Screen name="LandingScreen" component={LandingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            {/* Note: Privacy/Terms/Disclaimer are already defined above and accessible */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Root App component wrapping providers
export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <SupabaseProvider>
          <AuthProvider>
            <ThemeProvider>
              <AppContent /> {/* Render the component containing hooks and navigator */}
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
  // Centering style removed from container, add back to LoadingScreen if needed
});
