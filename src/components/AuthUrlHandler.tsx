import React, { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import * as NavigationService from '../navigation/navigationService';
import { supabaseEnhanced, storeAuthDataEnhanced } from '../lib/supabase-enhanced';

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
          
          try {
            // Set session in both regular and enhanced Supabase clients
            const { data, error } = await supabase.auth.setSession(session);
            
            if (error) {
              console.error('Error setting session in regular client:', error);
              Alert.alert('Session Error', error.message);
              return;
            }
            
            console.log('Session set successfully in regular client:', data);
            
            // Also set session in enhanced client
            try {
              const enhancedResult = await supabaseEnhanced.auth.setSession(session);
              console.log('Session set in enhanced client:', enhancedResult.error ? 'Failed' : 'Success');
            } catch (enhancedError) {
              console.error('Error setting session in enhanced client:', enhancedError);
              // Continue anyway since the regular client succeeded
            }
            
            // Store session data manually as a backup
            if (data.session) {
              try {
                await storeAuthDataEnhanced(data.session);
                console.log('Session data manually stored');
              } catch (storageError) {
                console.error('Error storing session data:', storageError);
                // Continue anyway
              }
            }
            
            // Add a small delay to ensure the session is fully processed
            setTimeout(() => {
              console.log('Navigating to PostLoginScreen...');
              NavigationService.reset('PostLoginScreen');
              
              // Double-check the session after navigation
              setTimeout(async () => {
                const { data: sessionData } = await supabase.auth.getSession();
                if (!sessionData.session) {
                  console.error('Session not found after navigation, trying to recover...');
                  // Try to recover by setting the session again
                  await supabase.auth.setSession(session);
                  console.log('Session recovery attempt completed');
                }
              }, 1000);
            }, 500);
          } catch (sessionError) {
            console.error('Exception setting session:', sessionError);
            Alert.alert('Session Error', 'Failed to set session');
          }
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
