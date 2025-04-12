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
import { useURL } from 'expo-linking'; // Import useURL
import { navigationRef } from './navigation/navigationService';
import * as NavigationService from './navigation/navigationService';
import AppNavigator from './navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native'; // Added Text
import { useFonts } from 'expo-font';
import { useEffect } from 'react'; // Import useEffect
import { supabase, storeAuthData, checkSession } from './lib/supabase'; // Import supabase client and functions
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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
      Account: 'account',
    },
  },
};

export default function App() {
  // Get the URL the app was opened with using the hook
  const initialUrl = useURL();

  // Handle the initial URL or subsequent deep links for OAuth
  useEffect(() => {
    const handleAuthRedirect = (url: string | null) => {
      if (!url) {
        console.log('>>> handleAuthRedirect called with null URL');
        return;
      }
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
              if (error) {
                console.error('>>> Error calling setSession manually:', error);
              } else {
                console.log('>>> Manual setSession call successful. Data:', data);
                
                // Also manually store the session data in AsyncStorage as a backup
                if (data.session) {
                  storeAuthData(data.session)
                    .then(() => console.log('>>> Session data manually stored in AsyncStorage'))
                    .catch(err => console.error('>>> Error storing session data:', err));
                }
                
                // Add a small delay to ensure the session is fully processed
                setTimeout(() => {
                  console.log('>>> Manually navigating to PostLoginScreen...');
                  NavigationService.reset('PostLoginScreen');
                  
                  // Double-check the session after navigation
                  setTimeout(() => {
                    checkSession()
                      .then(session => {
                        if (!session) {
                          console.error('>>> Session not found after navigation, trying to recover...');
                          // Try to recover by setting the session again
                          supabase.auth.setSession({ access_token, refresh_token })
                            .then(() => console.log('>>> Session recovery attempt completed'));
                        }
                      });
                  }, 1000);
                }, 500);
              }
            })
            .catch(err => {
               console.error('>>> Exception during manual setSession call:', err);
            });
        } else {
           console.log('>>> access_token or refresh_token not found in URL fragment.');
        }
      } else {
         console.log('>>> URL does not contain a fragment (#).');
      }
    };

    // Handle the initial URL obtained from useURL hook when the component mounts
    if (initialUrl) {
      console.log('>>> Handling initial URL from useURL hook:', initialUrl);
      handleAuthRedirect(initialUrl);
    }

    // Also listen for subsequent links using the traditional listener as a fallback,
    // though useURL should ideally handle the initial redirect case.
    console.log('>>> Setting up Linking event listener as fallback...');
    const subscription = Linking.addEventListener('url', (event) => handleAuthRedirect(event.url));

    return () => {
      console.log('>>> Removing Linking event listener...');
      subscription.remove();
    };
  // We only want to process the initialUrl once, but the listener needs to persist.
  // The dependency array ensures the effect runs when initialUrl is first available.
  }, [initialUrl]);


  // Load fonts explicitly
  const [fontsLoaded, fontError] = useFonts({
    'AntDesign': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf'),
    'FontAwesome': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (fontError) {
    console.error("Error loading fonts:", fontError);
    // Optionally render an error message or fallback UI
    return (
       <View style={styles.container}>
         <Text>Error loading fonts.</Text>
       </View>
    );
  }

  // Render the app only when fonts are loaded
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <SupabaseProvider>
            <AppNavigator />
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
    justifyContent: 'center', // Center loading indicator
    alignItems: 'center',     // Center loading indicator
  },
});
