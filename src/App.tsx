import React, { useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';

// DEBUG: Catch the exact text error source (disabled for production)
// const originalCreateElement = React.createElement;
// React.createElement = function(type: any, props: any, ...children: any[]) {
//   if (children) {
//     children.forEach((child, index) => {
//       if (typeof child === 'string' && child.trim() !== '' && type !== 'Text') {
//         console.error(`🚨 FOUND TEXT ERROR! String "${child}" in component ${type?.name || type}`);
//         console.trace('Stack trace:');
//       }
//     });
//   }
//   return originalCreateElement.apply(React, arguments as any);
// };

import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import * as Linking from 'expo-linking';
import { useURL } from 'expo-linking';
import { navigationRef } from './navigation/navigationService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { useFonts } from 'expo-font';
import { supabase, storeAuthData } from './lib/supabase';
import { initAnalytics } from './lib/analytics';
import { initializeGoogleSignIn } from './lib/googleSignIn';
import AppNavigator from './navigation/AppNavigator';

let mixpanelInstance;
try {
  const Mixpanel = require('mixpanel-react-native');
  mixpanelInstance = Mixpanel.default || Mixpanel;
  if (mixpanelInstance && typeof mixpanelInstance.init === 'function') {
    // Use a development token or disable in development
    const mixpanelToken = __DEV__ ? null : 'YOUR_PRODUCTION_MIXPANEL_TOKEN';
    if (mixpanelToken) {
      mixpanelInstance.init(mixpanelToken, { trackAutomaticEvents: true });
      console.log('Mixpanel initialized successfully');
    } else {
      console.log('Mixpanel disabled in development mode');
      mixpanelInstance = null;
    }
  } else {
    console.warn('Mixpanel module found but init method is missing');
    mixpanelInstance = null;
  }
  
  // Create mock analytics for development or when Mixpanel is not available
  const mockMixpanel = {
    track: (eventName: string, props?: Record<string, any>) => console.log('Analytics track:', eventName, props),
    init: () => console.log('Analytics initialized (mock)'),
  };
  
  initAnalytics(mixpanelInstance || mockMixpanel);
} catch (error) {
  console.error('Failed to import or initialize Mixpanel:', error);
  const mockMixpanel = {
    track: (eventName: string, props?: Record<string, any>) => console.log('Analytics track (fallback):', eventName, props),
    init: () => console.log('Analytics initialized (fallback)'),
  };
  initAnalytics(mockMixpanel);
}

const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      LandingScreen: 'landing',
      Login: 'login',
      Register: 'register',
      PostLoginScreen: 'post-login',
      Home: 'home',
      AccountScreen: 'account',
    },
  },
};

const AppContent = () => {
  const initialUrl = useURL();
  
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
          if (supabase) {
            supabase.auth.setSession({ access_token, refresh_token })
              .then(({ data, error }) => {
                if (error) console.error('>>> Error calling setSession manually:', error);
                else {
                  console.log('>>> Manual setSession call successful. Data:', data);
                  if (data.session) storeAuthData(data.session).catch(err => console.error('>>> Error storing session data:', err));
                }
              })
              .catch(err => console.error('>>> Exception during manual setSession call:', err));
          } else {
            console.error('>>> Supabase not configured - cannot set session');
          }
        } else console.log('>>> access_token or refresh_token not found in URL fragment.');
      } else console.log('>>> URL does not contain a fragment (#).');
    };

    if (initialUrl) handleAuthRedirect(initialUrl);
    const subscription = Linking.addEventListener('url', (event) => handleAuthRedirect(event.url));
    return () => subscription.remove();
  }, [initialUrl]);

  const [fontsLoaded, fontError] = useFonts({
    'AntDesign': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf'),
    'FontAwesome': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf'),
  });

  if (!fontsLoaded && !fontError) {
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

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  useEffect(() => {
    // Initialize Google Sign-In when the app starts
    initializeGoogleSignIn();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <SupabaseProvider>
            <AuthProvider>
              <ThemeProvider>
                <AppContent />
                <StatusBar style="auto" />
              </ThemeProvider>
            </AuthProvider>
          </SupabaseProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
