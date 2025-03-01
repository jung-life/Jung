import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { HybridStorage } from './storage'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a custom storage adapter specifically for Supabase auth
const SupabaseAuthStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Try AsyncStorage directly for auth tokens
      const value = await AsyncStorage.getItem(key);
      console.log(`Auth token ${key} ${value ? 'found' : 'not found'} in AsyncStorage`);
      
      if (value) {
        // Also update our memory cache
        await HybridStorage.setItem(key, value);
        return value;
      }
      
      // Fall back to our hybrid storage
      return await HybridStorage.getItem(key);
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // Store in AsyncStorage directly
      await AsyncStorage.setItem(key, value);
      console.log(`Auth token ${key} stored in AsyncStorage`);
      
      // Also update our hybrid storage
      await HybridStorage.setItem(key, value);
    } catch (error) {
      console.error('Error storing auth token:', error);
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    try {
      // Remove from AsyncStorage
      await AsyncStorage.removeItem(key);
      console.log(`Auth token ${key} removed from AsyncStorage`);
      
      // Also remove from hybrid storage
      await HybridStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }
};

// Create the Supabase client with our custom storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SupabaseAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Add this function to check if a session exists
export const checkSession = async () => {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Update the getAvatarUrl function to handle missing files
export const getAvatarUrl = (filename: string): string => {
  // Just return the direct public URL without trying to create a signed URL
  return `https://osmhesmrvxusckjfxugr.supabase.co/storage/v1/object/public/avatars/${filename}`;
};

// Check if a user has premium access
export const checkPremiumAccess = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('premium_access')
      .select('expires_at')
      .eq('user_id', user.id)
      .single();
      
    if (error || !data) return false;
    
    // Check if premium access is still valid
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    return expiresAt > now;
  } catch (error) {
    console.error('Error checking premium access:', error);
    return false;
  }
};

// Current disclaimer version
export const CURRENT_DISCLAIMER_VERSION = 2;

// Check if user has seen the current version of the disclaimer
export const checkDisclaimerStatus = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user found');
      return false;
    }
    
    console.log('Checking disclaimer status for user:', user.id);
    
    const { data, error } = await supabase
      .from('user_preferences')
      .select('has_seen_disclaimer, disclaimer_version')
      .eq('user_id', user.id)
      .single();
      
    if (error) {
      console.error('Error fetching user preferences:', error);
      return false;
    }
    
    if (!data) {
      console.log('No user preferences found, creating default entry');
      // Create default entry
      const { error: insertError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          has_seen_disclaimer: false,
          disclaimer_version: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error creating user preferences:', insertError);
      }
      
      return false;
    }
    
    // Check if user has seen the current version of the disclaimer
    const hasSeenCurrentVersion = 
      data.has_seen_disclaimer === true && 
      data.disclaimer_version === CURRENT_DISCLAIMER_VERSION;
    
    console.log('User has seen disclaimer:', data.has_seen_disclaimer);
    console.log('User disclaimer version:', data.disclaimer_version);
    console.log('Current disclaimer version:', CURRENT_DISCLAIMER_VERSION);
    console.log('Has seen current version:', hasSeenCurrentVersion);
    
    return hasSeenCurrentVersion;
  } catch (error) {
    console.error('Error checking disclaimer status:', error);
    // Default to showing disclaimer on error
    return false;
  }
}; 