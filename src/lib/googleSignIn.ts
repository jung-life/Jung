 import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Initialize Google Sign-In
export const initializeGoogleSignIn = () => {
  try {
    console.log('🔵 Initializing Google Sign-In...');
    console.log('🔵 GoogleSignin object:', typeof GoogleSignin);
    console.log('🔵 Available methods:', Object.getOwnPropertyNames(GoogleSignin));

    // Try multiple sources for environment variables (physical devices need Constants)
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
                       Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
                       Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

    console.log('🔵 Web Client ID:', webClientId ? `${webClientId.substring(0, 20)}...` : 'Missing');
    console.log('🔵 iOS Client ID:', iosClientId ? `${iosClientId.substring(0, 20)}...` : 'Missing');

    if (!webClientId) {
      console.error('❌ EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set');
      console.error('❌ Check your app.json extra section');
      return false;
    }

    // Follow Supabase documentation pattern exactly with TestFlight enhancements
    const config = {
      webClientId, // This should be the web client ID for Supabase
      scopes: ['https://www.googleapis.com/auth/drive.readonly'], // As per Supabase docs
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
      // Add TestFlight specific configuration
      profileImageSize: 120,
    };

    console.log('🔵 Configuring with Supabase pattern:', {
      webClientId: !!config.webClientId,
      offlineAccess: config.offlineAccess,
      forceCodeForRefreshToken: config.forceCodeForRefreshToken,
      scopes: config.scopes
    });

    console.log('🔵 Full config details for URL scheme debugging:', {
      webClientId: config.webClientId,
      expectedURLScheme: `com.googleusercontent.apps.${config.webClientId?.split('.')[0]}`
    });

    GoogleSignin.configure(config);

    console.log('✅ Google Sign-In configured successfully');

    // Test API availability after configuration
    console.log('🔵 Testing API availability...');
    console.log('🔵 hasPlayServices method:', typeof GoogleSignin.hasPlayServices);
    console.log('🔵 signIn method:', typeof GoogleSignin.signIn);
    console.log('🔵 getCurrentUser method:', typeof GoogleSignin.getCurrentUser);
    console.log('🔵 signOut method:', typeof GoogleSignin.signOut);

    return true;
  } catch (error) {
    console.error('❌ Error configuring Google Sign-In:', error);
    return false;
  }
};

export const signInWithGoogle = async () => {
  try {
    console.log('🔵 Starting Google Sign-In...');

    // Check if device supports Google Play Services first
    await GoogleSignin.hasPlayServices();
    console.log('🔵 Google Play Services available');

    // Check current user status
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      if (currentUser) {
        console.log('🔵 User already signed in:', currentUser.user.email);
        // Sign out to ensure clean state
        await GoogleSignin.signOut();
        console.log('🔵 Cleared previous Google session');
      }
    } catch (userError) {
      console.log('🔵 No previous user session found');
    }

    // Get user info from Google with enhanced configuration for TestFlight
    console.log('🔵 Attempting Google Sign-In with enhanced config...');
    const result = await GoogleSignin.signIn();
    console.log('🔵 Google Sign-In result:', {
      data: !!result.data,
      user: !!result.data?.user,
      idToken: !!result.data?.idToken,
      serverAuthCode: !!result.data?.serverAuthCode,
      scopes: result.data?.scopes
    });

    console.log('🔵 User info:', {
      id: result.data?.user.id,
      email: result.data?.user.email,
      name: result.data?.user.name,
      photo: result.data?.user.photo
    });

    if (!result.data) {
      throw new Error('No data received from Google Sign-In');
    }

    if (!result.data.idToken) {
      console.error('❌ No ID token in result:', result);
      console.error('❌ Available data keys:', Object.keys(result.data || {}));

      // Try to get tokens explicitly
      try {
        const tokens = await GoogleSignin.getTokens();
        console.log('🔵 Retrieved tokens separately:', {
          idToken: !!tokens.idToken,
          accessToken: !!tokens.accessToken
        });

        if (tokens.idToken) {
          // Use the separately retrieved token
          result.data.idToken = tokens.idToken;
        } else {
          throw new Error('No ID token available from Google - check OAuth client configuration');
        }
      } catch (tokenError) {
        console.error('❌ Failed to retrieve tokens:', tokenError);
        throw new Error('No ID token received from Google. This usually means:\n1. OAuth client not properly configured\n2. Incorrect client IDs in app.json\n3. Missing OAuth consent screen setup');
      }
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
    // Try to get current user first (this doesn't require network)
    const currentUser = await GoogleSignin.getCurrentUser();
    if (currentUser) {
      return currentUser;
    }

    // If no current user, try silent sign in
    const userInfo = await GoogleSignin.signInSilently();
    return userInfo;
  } catch (error) {
    console.log('No Google user signed in:', error.message);
    return null;
  }
};

// Helper function to check if user is signed in
export const isGoogleUserSignedIn = async () => {
  try {
    const user = await getCurrentGoogleUser();
    return !!user;
  } catch (error) {
    return false;
  }
};
