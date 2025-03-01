import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { HybridStorage } from './storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Add this helper function to sanitize keys for storage
const sanitizeKey = (key: string): string => {
  // Replace any characters that might cause file system issues
  return key.replace(/[\/\\:*?"<>|@]/g, '_');
};

// Update the LWAStorage implementation
const LWAStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const safeKey = sanitizeKey(key);
    try {
      // Check if this is a large value that we've split
      const isLargeValue = await AsyncStorage.getItem(`${safeKey}_isLarge`);
      
      if (isLargeValue === 'true') {
        // Retrieve from AsyncStorage instead
        return await AsyncStorage.getItem(safeKey);
      }
      
      // Try SecureStore first for normal-sized values
      return await SecureStore.getItemAsync(safeKey);
    } catch (error) {
      console.log('SecureStore getItem error:', error);
      // Fallback to AsyncStorage
      try {
        return await AsyncStorage.getItem(safeKey);
      } catch (asyncError) {
        console.log('AsyncStorage getItem error:', asyncError);
        return null;
      }
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    const safeKey = sanitizeKey(key);
    try {
      // Check if value is too large for SecureStore
      if (value.length > 2000) { // Using 2000 to be safe
        // Mark this as a large value
        await AsyncStorage.setItem(`${safeKey}_isLarge`, 'true');
        // Store in AsyncStorage
        await AsyncStorage.setItem(safeKey, value);
        return;
      }
      
      // Store in SecureStore if it's small enough
      await SecureStore.setItemAsync(safeKey, value);
    } catch (error) {
      console.log('SecureStore setItem error:', error);
      // Fallback to AsyncStorage
      try {
        await AsyncStorage.setItem(safeKey, value);
      } catch (asyncError) {
        console.log('AsyncStorage setItem error:', asyncError);
      }
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    const safeKey = sanitizeKey(key);
    try {
      // Check if this was a large value
      const isLargeValue = await AsyncStorage.getItem(`${safeKey}_isLarge`);
      if (isLargeValue === 'true') {
        // Remove the marker and the value from AsyncStorage
        await AsyncStorage.removeItem(`${safeKey}_isLarge`);
        await AsyncStorage.removeItem(safeKey);
        return;
      }
      
      // Otherwise remove from SecureStore
      await SecureStore.deleteItemAsync(safeKey);
    } catch (error) {
      console.log('SecureStore removeItem error:', error);
      // Try to remove from AsyncStorage as well
      try {
        await AsyncStorage.removeItem(`${safeKey}_isLarge`);
        await AsyncStorage.removeItem(safeKey);
      } catch (asyncError) {
        console.log('AsyncStorage removeItem error:', asyncError);
      }
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: HybridStorage,
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

// Increment the version to force all users to see the disclaimer
export const CURRENT_DISCLAIMER_VERSION = 2;

// Update this function to check disclaimer version
export const checkDisclaimerStatus = async () => {
  try {
    console.log('Checking disclaimer status...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No user found when checking disclaimer');
      return false;
    }
    
    console.log('Checking disclaimer for user:', user.id);
    
    const { data, error } = await supabase
      .from('user_preferences')
      .select('has_seen_disclaimer, disclaimer_version')
      .eq('user_id', user.id)
      .single();
      
    if (error) {
      console.log('Error fetching user preferences:', error);
      console.log('Forcing disclaimer screen due to error');
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