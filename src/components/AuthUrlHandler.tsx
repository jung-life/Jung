import React, { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

export function AuthUrlHandler() {
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('Deep link detected:', url);
      if (!url.includes('#') && !url.includes('?')) {
        console.log('No parameters found in URL');
        return;
      }
      
      try {
        let params: URLSearchParams;
        
        // Handle both hash and query parameters
        if (url.includes('#')) {
          params = new URLSearchParams(url.split('#')[1]);
        } else {
          params = new URLSearchParams(url.split('?')[1]);
        }
        
        console.log('Parsed params:', Object.fromEntries(params.entries()));
        
        // Check for error parameters first
        if (params.has('error') || params.has('error_description')) {
          console.error('Auth error:', params.get('error'), params.get('error_description'));
          Alert.alert('Authentication Error', params.get('error_description') || 'Failed to authenticate');
          return;
        }
        
        if (params.has('access_token') && params.has('refresh_token')) {
          console.log('Found auth tokens in URL, setting session');
          const session = {
            access_token: params.get('access_token')!,
            refresh_token: params.get('refresh_token')!,
          };
          
          const { error } = await supabase.auth.setSession(session);
          
          if (error) {
            console.error('Error setting session:', error);
            Alert.alert('Session Error', error.message);
            return;
          }
          
          const { data } = await supabase.auth.getUser();
          console.log('User authenticated:', data.user?.id);
          
          // Refresh the session to ensure we have the latest data
          await supabase.auth.refreshSession();
        } else {
          console.log('Required tokens not found in URL');
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