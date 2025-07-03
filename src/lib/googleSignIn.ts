import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';

// Initialize Google Sign-In
export const initializeGoogleSignIn = () => {
  try {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
    console.log('✅ Google Sign-In configured successfully');
  } catch (error) {
    console.error('❌ Error configuring Google Sign-In:', error);
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
    
    if (result.data?.idToken && supabase) {
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
    } else {
      throw new Error('No ID token received from Google or Supabase not available');
    }
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
