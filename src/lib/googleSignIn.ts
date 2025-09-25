 import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Initialize Google Sign-In
export const initializeGoogleSignIn = () => {
  try {
    // Try multiple sources for environment variables (physical devices need Constants)
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
                       Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
                       Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    
    console.log('🔵 Initializing Google Sign-In...');
    console.log('🔵 Web Client ID:', webClientId ? 'Set' : 'Missing');
    console.log('🔵 iOS Client ID:', iosClientId ? 'Set' : 'Missing');
    
    if (!webClientId) {
      console.error('❌ EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set');
      return false;
    }
    
    if (!iosClientId) {
      console.error('❌ EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is not set');
      return false;
    }
    
    GoogleSignin.configure({
      webClientId,
      iosClientId,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
    
    console.log('✅ Google Sign-In configured successfully');
    return true;
  } catch (error) {
    console.error('❌ Error configuring Google Sign-In:', error);
    return false;
  }
};

export const signInWithGoogle = async () => {
  try {
    console.log('🔵 Starting Google Sign-In...');
    
    // Check if device supports Google Play Services
    await GoogleSignin.hasPlayServices();
    console.log('🔵 Google Play Services available');
    
    // Get user info from Google
    const result = await GoogleSignin.signIn();
    console.log('🔵 Google Sign-In successful:', {
      id: result.data?.user.id,
      email: result.data?.user.email,
      name: result.data?.user.name,
      hasIdToken: !!result.data?.idToken
    });
    
    if (!result.data?.idToken) {
      throw new Error('No ID token received from Google');
    }
    
    if (!supabase) {
      console.error('❌ Supabase client not available');
      console.error('Environment check:');
      console.error('- EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
      console.error('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
      throw new Error('Supabase client not available - check environment variables in app.json or .env');
    }
    
    console.log('🔵 Authenticating with Supabase...');
    
    // Sign in to Supabase with Google ID token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: result.data.idToken,
    });
    
    if (error) {
      console.error('❌ Supabase authentication error:', error);
      throw error;
    }
    
    console.log('✅ Supabase authentication successful');
    return { data, userInfo: result.data };
  } catch (error: any) {
    console.error('❌ Google Sign-In error:', error);
    
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign-in is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available');
    } else {
      throw error;
    }
  }
};

export const signOutGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    console.log('✅ Google Sign-Out successful');
  } catch (error) {
    console.error('❌ Google Sign-Out error:', error);
  }
};

export const getCurrentGoogleUser = async () => {
  try {
    const userInfo = await GoogleSignin.signInSilently();
    return userInfo;
  } catch (error) {
    console.log('No Google user signed in');
    return null;
  }
};
