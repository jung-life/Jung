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
          const errorCode = params.get('error_code') || '';
          const errorDesc = params.get('error_description') || '';
          console.error('Auth error:', params.get('error'), 'Code:', errorCode, 'Description:', errorDesc);
          
          // If it's a database error saving new user, we can still proceed
          if (errorDesc.includes('Database error saving new user')) {
            console.log('Database error detected in AuthUrlHandler, but proceeding anyway');
            // This is a known issue where the user is actually created but there's an error saving additional data
            
            // Try to extract tokens from the URL
            try {
              // Extract parameters from URL
              let params: URLSearchParams | null = null;
              
              // Handle different URL formats
              if (url.includes('#')) {
                params = new URLSearchParams(url.split('#')[1]);
              } else if (url.includes('?')) {
                params = new URLSearchParams(url.split('?')[1]);
              }
              
              if (params && params.has('access_token')) {
                const access_token = params.get('access_token')!;
                const refresh_token = params.get('refresh_token') || '';
                
                console.log('Found tokens in URL after database error, setting session manually');
                
                // Set session in both Supabase clients for maximum compatibility
                const { error } = await supabase.auth.setSession({
                  access_token,
                  refresh_token
                });
                
                if (error) {
                  console.error('Error setting session after database error:', error);
                } else {
                  console.log('Session set successfully after database error');
                  
                  // Also store in enhanced client
                  try {
                    await storeAuthDataEnhanced({
                      access_token,
                      refresh_token
                    });
                  } catch (enhancedError) {
                    console.warn('Error storing session in enhanced client:', enhancedError);
                  }
                }
              }
            } catch (tokenError) {
              console.error('Error extracting tokens after database error:', tokenError);
            }
            
            // Check for session after a short delay to ensure auth state is updated
            setTimeout(async () => {
              const { data } = await supabase.auth.getSession();
              if (data?.session) {
                console.log('Session confirmed after database error - user should be logged in');
              } else {
                console.warn('No session found after database error - user may need to log in again');
                Alert.alert(
                  'Partial Registration',
                  'Your account was created, but some profile data could not be saved. Please log in again.',
                  [{ text: 'OK' }]
                );
              }
            }, 1000);
          } else {
            // For other errors, show an alert and return
            Alert.alert('Authentication Error', errorDesc || 'Failed to authenticate');
            return;
          }
        }
        
        // Handle access token
        if (params.has('access_token')) {
          console.log('Found access token in URL, setting session...');
          
          const session = {
            access_token: params.get('access_token')!,
            refresh_token: params.get('refresh_token') || '',
          };
          
          try {
            // Set session in both Supabase clients for maximum compatibility
            const { error } = await supabase.auth.setSession(session);
            
            if (error) {
              console.error('Error setting session via AuthUrlHandler:', error);
              Alert.alert('Session Error', `Failed to set session: ${error.message}`);
              return;
            }
            
            // Also store in enhanced client
            try {
              await storeAuthDataEnhanced(session);
            } catch (enhancedError) {
              console.warn('Error storing session in enhanced client:', enhancedError);
              // Continue anyway since standard client worked
            }
            
            console.log('Session set successfully via AuthUrlHandler. Manually navigating...');
            
            console.log('Session set successfully via AuthUrlHandler. App-enhanced will handle navigation.');
            // No explicit navigation needed here. Let the session state change trigger App-enhanced re-render.
            
            // Double-check session after a short delay (optional, for logging)
            setTimeout(async () => {
              const { data } = await supabase.auth.getSession();
              if (data?.session) {
                console.log('Session confirmed after delay.');
              } else {
                console.warn('No session found after delay, but continuing anyway');
              }
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
      if (event === 'SIGNED_IN' && session) {
        console.log('User authenticated via state change, navigating...');
        console.log('User authenticated via state change. App-enhanced will handle navigation.');
        // No explicit navigation needed here. Let the session state change trigger App-enhanced re-render.
      }
    });

    return () => {
      subscription.remove();
      authSubscription.unsubscribe();
    };
  }, []);

  return null; // This component doesn't render anything
}
