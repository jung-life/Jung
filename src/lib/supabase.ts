import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
// Keep AsyncStorage import for potential fallback or other uses if needed
import AsyncStorage from '@react-native-async-storage/async-storage'; 
// Remove imports related to the previous custom secureStorage implementation
// import { saveSession, getSession, clearAuthData } from './secureStorage'; 

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Don't throw error - handle gracefully
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

// Create an adapter for expo-secure-store
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// Create the Supabase client only if environment variables exist
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: ExpoSecureStoreAdapter, // Use the new adapter
        autoRefreshToken: true,
        persistSession: true, 
        detectSessionInUrl: true,
      },
    })
  : null;

// Add safety wrapper for all Supabase operations
export const safeSupabaseCall = async (operation: () => Promise<any>) => {
  if (!supabase) {
    console.error('Supabase not configured - missing environment variables');
    return { data: null, error: { message: 'Database not available' } };
  }
  
  try {
    return await operation();
  } catch (error) {
    console.error('Supabase call failed:', error);
    return { data: null, error };
  }
};

// Remove the redundant onAuthStateChange listener here.
// The listener in LoginScreenEnhanced.tsx will handle navigation.

// Function to refresh the token manually if needed
// Note: This function might need adjustment if saveSession relied on the old custom storage
export const refreshSession = async () => {
  try {
    // Supabase client handles refresh and persistence via the storage adapter automatically
    const { data, error } = await supabase.auth.refreshSession(); 
    if (error) {
      console.error('Error refreshing session:', error.message);
      return null;
    }
    // No need to manually save session when using the adapter
    // await saveSession(data.session) 
    return data.session;
  } catch (e) {
    console.error('Unexpected error refreshing session:', e);
    return null;
  }
};

// Add this function to check if a session exists and log details
export const checkSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error.message);
      return null;
    }
    
    if (data.session) {
      console.log('Session found:', data.session.user.id);
      // Check token expiry
      if (data.session.expires_at) { // Add null check here
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
    
    return data.session;
  } catch (e) {
    console.error('Unexpected error checking session:', e);
    return null;
  }
}

// Function to manually store auth data
export const storeAuthData = async (session: any) => {
  if (!session) return
  
  try {
    // Use a safe fallback if supabaseUrl is undefined
    const url = supabaseUrl || 'default'
    const key = `sb-${url.split('//')[1]?.split('.')[0] || 'default'}-auth-token`
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
export const CURRENT_DISCLAIMER_VERSION = 1;

// Function to check if user has seen disclaimer
export const checkDisclaimerStatus = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    console.log('Checking disclaimer status for user:', user.id);
    
    const { data, error } = await supabase
      .from('user_preferences')
      .select('has_seen_disclaimer, disclaimer_version')
      .eq('user_id', user.id)
      .single();
      
    if (error) {
      console.error('Error checking disclaimer status:', error);
      return false;
    }
    
    return data?.has_seen_disclaimer && data?.disclaimer_version >= CURRENT_DISCLAIMER_VERSION;
  } catch (error) {
    console.error('Exception checking disclaimer status:', error);
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
    // Instead of trying to create tables directly, use RPC functions
    // that have been granted the proper permissions in Supabase
    const { error } = await supabase.rpc('ensure_database_structure');
    
    if (error) {
      console.warn('Error from ensure_database_structure RPC:', error);
      // Continue anyway - tables might already exist
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring database structure:', error);
    // Continue anyway - don't block the app for this
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
  } catch (error: unknown) {
    console.error('Unexpected error testing Supabase connection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
      details: error
    };
  }
};

// Simplified user preferences function
export const ensureUserPreferences = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user found');
      return false;
    }
    
    console.log('Ensuring user preferences for user ID:', user.id);
    
    // Use a direct SQL approach to avoid type issues
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        INSERT INTO public.user_preferences (user_id, has_seen_disclaimer, disclaimer_version)
        VALUES ('${user.id}', false, 0)
        ON CONFLICT (user_id) DO NOTHING;
      `
    });
    
    if (error) {
      console.error('Error ensuring user preferences:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in ensureUserPreferences:', error);
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

// Simplified database initialization
export const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // Create the user_preferences table with correct UUID type
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        -- Create user_preferences table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.user_preferences (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          has_seen_disclaimer BOOLEAN DEFAULT false,
          disclaimer_version INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
        ON public.user_preferences(user_id);
      `
    });
    
    if (error) {
      console.error('Error initializing database:', error);
    } else {
      console.log('Database initialized successfully');
    }
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

// Update the ensureCorrectIdType function to handle the type conversion properly
export const ensureCorrectIdType = async () => {
  try {
    console.log('Converting id column to UUID type...');
    
    // Use an RPC function to handle the type conversion
    const { error } = await supabase.rpc('convert_id_columns_to_uuid');
    
    if (error) {
      console.warn('Error converting ID columns:', error);
      // Continue anyway
    } else {
      console.log('Database initialized successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error converting ID columns:', error);
    return false;
  }
};

// Fix the information_schema query
export const fixDatabaseSchema = async () => {
  try {
    console.log('Attempting to fix database schema type issues...');
    
    // Create the table directly with SQL
    const { error: createError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.user_preferences (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL,
          has_seen_disclaimer BOOLEAN DEFAULT false,
          disclaimer_version INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `
    });
    
    if (createError) {
      console.error('Error creating table:', createError);
    } else {
      console.log('Successfully created user_preferences table');
    }
    
    return true;
  } catch (error) {
    console.error('Error in fixDatabaseSchema:', error);
    return false;
  }
};

// Add this function to check disclaimer status using direct SQL
export const checkDisclaimerStatusDirect = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user found when checking disclaimer');
      return false;
    }
    
    // Use direct SQL to check disclaimer status
    const { data, error } = await supabase.rpc('check_disclaimer_status', {
      user_id_param: user.id
    });
    
    if (error) {
      console.error('Error checking disclaimer status:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error in checkDisclaimerStatusDirect:', error);
    return false;
  }
};

// Add this helper function to check auth state
export const checkAuthState = async () => {
  const { data, error } = await supabase.auth.getSession();
  console.log('Current auth state:', data?.session ? 'Authenticated' : 'Not authenticated');
  if (error) console.error('Auth state error:', error);
  return data;
};
