import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

export default function AuthCallback() {
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('Handling deep link:', url);
      
      // Extract params from URL
      if (!url.includes('#') && !url.includes('?')) return;
      
      let params: Record<string, string> = {};
      
      // Handle both hash and query parameters
      if (url.includes('#')) {
        params = url.split('#')[1].split('&').reduce((acc, param) => {
          const [key, value] = param.split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
      } else if (url.includes('?')) {
        params = url.split('?')[1].split('&').reduce((acc, param) => {
          const [key, value] = param.split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
      }
      
      // If we have an access token, set the session
      if (params.access_token) {
        console.log('Setting session with tokens');
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token || '',
        });
        
        if (error) {
          console.error('Error setting session:', error);
          Alert.alert('Authentication Error', 'Failed to complete authentication');
        } else {
          console.log('Authentication successful');
        }
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Check for initial URL
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
} 