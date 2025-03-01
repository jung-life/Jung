import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { saveSession, getSession, clearAuthData } from './secureStorage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Custom storage adapter that uses SecureStore
const SecureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    // For Supabase auth, we'll use our secure session storage
    if (key.includes('auth-token')) {
      const session = await getSession()
      if (session) {
        return JSON.stringify(session)
      }
      return null
    }
    // For other items, fall back to AsyncStorage
    return await AsyncStorage.getItem(key)
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    // For Supabase auth, use our secure session storage
    if (key.includes('auth-token')) {
      try {
        const session = JSON.parse(value)
        await saveSession(session)
      } catch (e) {
        console.error('Error parsing session for secure storage:', e)
        await AsyncStorage.setItem(key, value)
      }
      return
    }
    // For other items, use AsyncStorage
    await AsyncStorage.setItem(key, value)
  },
  
  removeItem: async (key: string): Promise<void> => {
    // For Supabase auth, clear all auth data
    if (key.includes('auth-token')) {
      await clearAuthData()
      return
    }
    // For other items, use AsyncStorage
    await AsyncStorage.removeItem(key)
  }
}

// Create the Supabase client with secure storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Set up auth state change listener to securely store session
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    saveSession(session)
    console.log('Auth state changed:', event)
  } else if (event === 'SIGNED_OUT') {
    clearAuthData()
    console.log('User signed out')
  }
})

// Function to refresh the token manually if needed
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('Error refreshing session:', error.message)
      return null
    }
    if (data.session) {
      await saveSession(data.session)
      return data.session
    }
    return null
  } catch (e) {
    console.error('Unexpected error refreshing session:', e)
    return null
  }
}

// Add this function to check if a session exists and log details
export const checkSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error.message)
      return null
    }
    
    if (data.session) {
      console.log('Session found:', data.session.user.id)
      // Check token expiry
      const expiresAt = new Date(data.session.expires_at * 1000)
      const now = new Date()
      console.log('Token expires at:', expiresAt.toLocaleString())
      console.log('Token is', expiresAt > now ? 'valid' : 'expired')
    } else {
      console.log('No session found')
    }
    
    return data.session
  } catch (e) {
    console.error('Unexpected error checking session:', e)
    return null
  }
}

// Function to manually store auth data
export const storeAuthData = async (session) => {
  if (!session) return
  
  try {
    const key = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`
    const data = JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user: session.user
    })
    
    await AsyncStorage.setItem(key, data)
    console.log('Manually stored auth data with key:', key)
  } catch (e) {
    console.error('Error storing auth data:', e)
  }
}

// Update the getAvatarUrl function to use environment variables
export const getAvatarUrl = (filename: string): string => {
  const storageUrl = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_URL;
  const bucket = process.env.EXPO_PUBLIC_AVATAR_BUCKET || 'avatars';
  
  if (!storageUrl) {
    console.error('EXPO_PUBLIC_SUPABASE_STORAGE_URL is not defined in environment variables');
    // Fallback to hardcoded URL only if environment variable is missing
    return `https://osmhesmrvxusckjfxugr.supabase.co/storage/v1/object/public/avatars/${filename}`;
  }
  
  return `${storageUrl}/${bucket}/${filename}`;
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

// Function to check database health
export const checkDatabaseHealth = async () => {
  try {
    // Try to get the count of users
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('Database health check failed:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

// Function to create necessary tables if they don't exist
export const ensureDatabaseStructure = async () => {
  try {
    // Check if the profiles table exists
    const { error } = await supabase.rpc('create_profiles_if_not_exists');
    
    if (error) {
      console.error('Error ensuring database structure:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring database structure:', error);
    return false;
  }
};

// Improved Supabase connection test function
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL || 'Not set');
    console.log('Supabase Anon Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set');
    
    // First, check if we can get the session (doesn't require database access)
    const sessionResponse = await supabase.auth.getSession();
    console.log('Auth service test:', sessionResponse.error ? 'Failed' : 'OK');
    
    if (sessionResponse.error) {
      return {
        success: false,
        error: 'Auth service error: ' + sessionResponse.error.message,
        details: sessionResponse.error
      };
    }
    
    // Try a simple query that doesn't depend on specific tables
    console.log('Testing database connection with simple query...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('schemaname, tablename')
      .limit(1);
      
    if (schemaError) {
      console.error('Basic database query failed:', schemaError);
      
      // Try a different approach - check service health
      const healthResponse = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/`);
      const isHealthy = healthResponse.ok;
      
      if (!isHealthy) {
        return {
          success: false,
          error: 'Supabase API is not responding correctly',
          details: { status: healthResponse.status, statusText: healthResponse.statusText }
        };
      }
      
      return {
        success: false,
        error: schemaError.message || 'Database query failed',
        details: schemaError
      };
    }
    
    // If we got here, basic connectivity works
    console.log('Basic database connectivity: OK');
    
    // Now try the specific table we need
    const { data, error } = await supabase
      .from('user_preferences')
      .select('count(*)', { count: 'exact', head: true });
      
    if (error) {
      console.error('user_preferences table query failed:', error);
      return {
        success: true, // Basic connectivity works
        warning: 'user_preferences table may not exist: ' + error.message,
        details: error
      };
    }
    
    return {
      success: true,
      data,
      authStatus: 'OK',
      message: 'Connection successful'
    };
  } catch (error) {
    console.error('Unexpected error testing Supabase connection:', error);
    return {
      success: false,
      error: error.message || 'Unexpected error',
      details: error
    };
  }
};

// Function to ensure user preferences exist
export const ensureUserPreferences = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user found');
      return false;
    }
    
    // Check if user preferences already exist
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking user preferences:', error);
      return false;
    }
    
    // If user preferences don't exist, create them
    if (!data) {
      console.log('Creating user preferences for user:', user.id);
      
      const { error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          has_seen_disclaimer: false,
          disclaimer_version: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error creating user preferences:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring user preferences:', error);
    return false;
  }
};

// Function to verify environment variables
export const verifyEnvironmentVariables = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  const issues = [];
  
  if (!supabaseUrl) {
    issues.push('EXPO_PUBLIC_SUPABASE_URL is not set');
  } else if (!supabaseUrl.startsWith('https://')) {
    issues.push('EXPO_PUBLIC_SUPABASE_URL does not start with https://');
  }
  
  if (!supabaseAnonKey) {
    issues.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set');
  } else if (supabaseAnonKey.length < 20) {
    issues.push('EXPO_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

// Add this function to your supabase.ts file

export const initializeDatabase = async () => {
  try {
    // Check if tables exist and create them if needed
    const { error } = await supabase.rpc('initialize_database');
    
    if (error) {
      console.error('Error initializing database:', error);
      
      // Fallback: Try to create tables directly
      await supabase.rpc('create_tables_if_not_exist');
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error in database initialization:', error);
  }
};

// Add this function to your supabase.ts file

export const updateDatabaseSchema = async () => {
  try {
    console.log('Checking and updating database schema...');
    
    // First try to add missing columns using SQL
    try {
      await supabase.rpc('add_missing_columns');
    } catch (error) {
      console.error('Error adding missing columns via RPC:', error);
      
      // Fallback: Try direct SQL (requires more permissions)
      try {
        // Try to add is_from_user column to messages table
        await supabase.rpc('execute_sql', {
          sql_query: 'ALTER TABLE IF EXISTS public.messages ADD COLUMN IF NOT EXISTS is_from_user BOOLEAN DEFAULT FALSE;'
        });
        
        // Try to add avatar_url column to profiles table
        await supabase.rpc('execute_sql', {
          sql_query: 'ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
        });
      } catch (sqlError) {
        console.error('Error executing direct SQL:', sqlError);
      }
    }
    
    // Then initialize the database with the updated schema
    await initializeDatabase();
    
    console.log('Database schema update completed');
  } catch (error) {
    console.error('Error updating database schema:', error);
  }
};

// Add this function to handle UUID vs bigint issues

export const ensureCorrectIdType = async () => {
  try {
    // Check if the user_id column in profiles is UUID type
    const { data, error } = await supabase.rpc('check_column_type', {
      table_name: 'profiles',
      column_name: 'id'
    });
    
    if (error) {
      console.error('Error checking column type:', error);
      return;
    }
    
    // If the column is not UUID type, try to convert it
    if (data && data !== 'uuid') {
      console.log('Converting id column to UUID type...');
      await supabase.rpc('convert_column_to_uuid', {
        table_name: 'profiles',
        column_name: 'id'
      });
    }
  } catch (error) {
    console.error('Error ensuring correct ID type:', error);
  }
};