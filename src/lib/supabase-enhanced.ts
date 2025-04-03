import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { RobustStorage } from './storage-fix';
import * as SecureStore from 'expo-secure-store';

// Default fallback values in case environment variables are not set
const DEFAULT_SUPABASE_URL = 'https://osmhesmrvxusckjfxugr.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zbWhlc21ydnh1c2NramZ4dWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODA0NTY2MzAsImV4cCI6MTk5NjAzMjYzMH0.SZHqIFjXIx8qBMpI7xWB4yrEyB1DM4qzQtTI4ufZEXE';

// Get environment variables with fallbacks
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

console.log('Initializing Supabase with URL:', supabaseUrl);

// Session storage key
const SESSION_KEY = 'supabase-session';

// Enhanced storage adapter that combines RobustStorage with additional error handling
const EnhancedStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      console.log(`Getting item: ${key}`);
      
      // For auth tokens, use our robust storage approach
      if (key.includes('auth-token') || key === SESSION_KEY) {
        const value = await RobustStorage.getItem(key);
        return value;
      }
      
      // For other items, use AsyncStorage
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error in EnhancedStorageAdapter.getItem(${key}):`, error);
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      console.log(`Setting item: ${key}`);
      
      // For auth tokens, use our robust storage approach
      if (key.includes('auth-token') || key === SESSION_KEY) {
        await RobustStorage.setItem(key, value);
        return;
      }
      
      // For other items, use AsyncStorage
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error in EnhancedStorageAdapter.setItem(${key}):`, error);
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    try {
      console.log(`Removing item: ${key}`);
      
      // For auth tokens, use our robust storage approach
      if (key.includes('auth-token') || key === SESSION_KEY) {
        await RobustStorage.removeItem(key);
        return;
      }
      
      // For other items, use AsyncStorage
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error in EnhancedStorageAdapter.removeItem(${key}):`, error);
    }
  }
};

// Create the Supabase client with enhanced storage
export const supabaseEnhanced = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: EnhancedStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce', // Use PKCE flow for better security
  },
});

// Set up auth state change listener with better error handling
supabaseEnhanced.auth.onAuthStateChange((event, session) => {
  try {
    console.log('Auth state changed:', event);
    
    if (session) {
      // Store session in our robust storage
      RobustStorage.setItem(SESSION_KEY, JSON.stringify(session));
      console.log('Session stored successfully');
    } else if (event === 'SIGNED_OUT') {
      // Clear session from storage
      RobustStorage.removeItem(SESSION_KEY);
      console.log('Session cleared on sign out');
    }
  } catch (error) {
    console.error('Error in auth state change handler:', error);
  }
});

// Function to refresh the token with better error handling
export const refreshSessionEnhanced = async () => {
  try {
    console.log('Attempting to refresh session...');
    
    const { data, error } = await supabaseEnhanced.auth.refreshSession();
    
    if (error) {
      console.error('Error refreshing session:', error.message);
      return null;
    }
    
    if (data.session) {
      // Store session in our robust storage
      await RobustStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
      console.log('Session refreshed and stored successfully');
      return data.session;
    }
    
    console.log('No session returned from refresh');
    return null;
  } catch (e) {
    console.error('Unexpected error refreshing session:', e);
    return null;
  }
};

// Function to check if a session exists with better error handling
export const checkSessionEnhanced = async () => {
  try {
    console.log('Checking session...');
    
    // First try to get session from storage
    const storedSession = await RobustStorage.getItem(SESSION_KEY);
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        console.log('Found stored session for user:', parsedSession.user?.id);
        
        // Check if token is expired
        if (parsedSession.expires_at) {
          const expiresAt = new Date(parsedSession.expires_at * 1000);
          const now = new Date();
          
          if (expiresAt > now) {
            console.log('Stored token is valid until:', expiresAt.toLocaleString());
            return { session: parsedSession };
          } else {
            console.log('Stored token is expired, refreshing...');
          }
        }
      } catch (parseError) {
        console.error('Error parsing stored session:', parseError);
      }
    }
    
    // If no valid stored session, get from Supabase
    const { data, error } = await supabaseEnhanced.auth.getSession();
    
    if (error) {
      console.error('Error getting session from Supabase:', error.message);
      return { session: null, error };
    }
    
    if (data.session) {
      console.log('Session found from Supabase for user:', data.session.user.id);
      
      // Store the session
      await RobustStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
      
      // Check token expiry
      if (data.session.expires_at) {
        const expiresAt = new Date(data.session.expires_at * 1000);
        const now = new Date();
        console.log('Token expires at:', expiresAt.toLocaleString());
        console.log('Token is', expiresAt > now ? 'valid' : 'expired');
      } else {
        console.log('No expiration time found in session');
      }
    } else {
      console.log('No session found');
    }
    
    return data;
  } catch (e) {
    console.error('Unexpected error checking session:', e);
    return { session: null, error: e };
  }
};

// Function to manually store auth data with better error handling
export const storeAuthDataEnhanced = async (session: any) => {
  if (!session) {
    console.log('No session provided to storeAuthDataEnhanced');
    return;
  }
  
  try {
    console.log('Storing auth data for user:', session.user?.id);
    
    // Store in our robust storage
    await RobustStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    // Also store in the format Supabase expects
    const key = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
    const data = JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user: session.user
    });
    
    await RobustStorage.setItem(key, data);
    console.log('Auth data stored successfully with key:', key);
  } catch (e) {
    console.error('Error storing auth data:', e);
  }
};

// Function to sign in with email and password with better error handling
export const signInWithEmailEnhanced = async (email: string, password: string) => {
  try {
    console.log('Attempting to sign in with email:', email);
    
    const { data, error } = await supabaseEnhanced.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error.message);
      return { success: false, error: error.message };
    }
    
    if (data?.session) {
      console.log('Sign in successful for user:', data.user.id);
      
      // Store auth data
      await storeAuthDataEnhanced(data.session);
      
      return { 
        success: true, 
        user: data.user,
        session: data.session
      };
    }
    
    console.log('Sign in returned no session');
    return { success: false, error: 'No session returned' };
  } catch (error) {
    console.error('Unexpected error during sign in:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};

// Function to sign out with better error handling
export const signOutEnhanced = async () => {
  try {
    console.log('Attempting to sign out');
    
    // Clear session from storage first
    await RobustStorage.removeItem(SESSION_KEY);
    
    // Also clear the Supabase-specific key
    const key = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
    await RobustStorage.removeItem(key);
    
    // Then sign out from Supabase
    const { error } = await supabaseEnhanced.auth.signOut();
    
    if (error) {
      console.error('Error signing out from Supabase:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('Sign out successful');
    return { success: true };
  } catch (error) {
    console.error('Unexpected error during sign out:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};

// Function to check database health with better error handling
export const checkDatabaseHealthEnhanced = async () => {
  try {
    console.log('Checking database health...');
    
    // Try a simple query
    const { count, error } = await supabaseEnhanced
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('Database health check failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Database health check successful');
    return { success: true };
  } catch (error) {
    console.error('Database connection error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};

// Function to verify environment variables
export const verifyEnvironmentVariablesEnhanced = () => {
  console.log('Verifying environment variables...');
  
  const issues = [];
  
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
    issues.push('EXPO_PUBLIC_SUPABASE_URL is not set, using default');
  } else if (!process.env.EXPO_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    issues.push('EXPO_PUBLIC_SUPABASE_URL does not start with https://');
  }
  
  if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    issues.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set, using default');
  } else if (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.length < 20) {
    issues.push('EXPO_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
  }
  
  const isValid = issues.length === 0;
  
  if (isValid) {
    console.log('Environment variables are valid');
  } else {
    console.warn('Environment variable issues:', issues);
  }
  
  return {
    isValid,
    issues,
    usingDefaults: !process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  };
};

// Initialize and export
export const initializeSupabaseEnhanced = async () => {
  try {
    console.log('Initializing enhanced Supabase client...');
    
    // Verify environment variables
    const envCheck = verifyEnvironmentVariablesEnhanced();
    
    // Check session
    const sessionCheck = await checkSessionEnhanced();
    
    // Check database health
    const dbHealthCheck = await checkDatabaseHealthEnhanced();
    
    return {
      success: true,
      envCheck,
      sessionCheck,
      dbHealthCheck
    };
  } catch (error) {
    console.error('Error initializing enhanced Supabase client:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};
