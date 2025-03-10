import React, { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import * as NavigationService from '../navigation/navigationService';

export function AuthUrlHandler() {
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('Deep link detected:', url);
      
      try {
        // Extract parameters from URL
        let params: URLSearchParams | null = null;
        
        // Handle different URL formats
        if (url.includes('#')) {
          params = new URLSearchParams(url.split('#')[1]);
        } else if (url.includes('?')) {
          params = new URLSearchParams(url.split('?')[1]);
        }
        
        if (!params) {
          console.log('No parameters found in URL');
          return;
        }
        
        console.log('Parsed params:', Object.fromEntries(params.entries()));
        
        // Check for error parameters
        if (params.has('error')) {
          console.error('Auth error:', params.get('error'));
          Alert.alert('Authentication Error', params.get('error') || 'Failed to authenticate');
          return;
        }
        
        // Handle access token
        if (params.has('access_token')) {
          console.log('Found access token in URL, setting session...');
          
          const session = {
            access_token: params.get('access_token')!,
            refresh_token: params.get('refresh_token') || '',
          };
          
          const { data, error } = await supabase.auth.setSession(session);
          
          if (error) {
            console.error('Error setting session:', error);
            Alert.alert('Session Error', error.message);
            return;
          }
          
          console.log('Session set successfully:', data);
          
          // Force navigation to PostLoginScreen
          NavigationService.reset('PostLoginScreen');
        }
      } catch (error) {
        console.error('Error processing auth redirect:', error);
        Alert.alert('Authentication Error', 'Failed to process authentication response');
      }
    };

    // Listen for deep links while the app is open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('URL event received:', url);
      handleDeepLink(url);
    });

    // Check if app was opened via a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        handleDeepLink(url);
      }
    });

    // Also listen for auth state changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (session) {
        console.log('User authenticated via state change');
      }
    });

    return () => {
      subscription.remove();
      authSubscription.unsubscribe();
    };
  }, []);

  return null; // This component doesn't render anything
} 