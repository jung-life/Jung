import { supabaseEnhanced, refreshSessionEnhanced, checkSessionEnhanced } from './supabase-enhanced';

/**
 * Enhanced function to fetch data from Supabase with better error handling and retry logic
 * This version is specifically designed to work with the enhanced Supabase client
 */
export const enhancedSupabaseFetchWithTypes = async <T>(
  fetcher: () => any, // Accept any Supabase query builder
  maxRetries = 2
): Promise<{ data: T[] | null; error: any }> => {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      // First check if we have a valid session
      const { session, error: sessionError } = await checkSessionEnhanced();
      
      if (sessionError || !session) {
        console.log('No valid session found, attempting to refresh...');
        const refreshed = await refreshSessionEnhanced();
        if (!refreshed) {
          console.error('Session refresh failed');
          return { data: null, error: new Error('Authentication required') };
        }
      }
      
      // Try to fetch the data
      // Execute the fetcher function which returns a Supabase query builder
      // Then await the query to get the result
      const { data, error } = await fetcher();
      
      // If successful or error is not auth-related, return
      if (!error || !isAuthError(error)) {
        return { data, error };
      }
      
      // If we got an auth error, try refreshing the token
      console.log('Auth error, attempting to refresh session...');
      await refreshSessionEnhanced();
      
    } catch (e) {
      console.error('Error in enhancedSupabaseFetchWithTypes:', e);
      return { data: null, error: e };
    }
    
    retries++;
    // Small delay between retries
    if (retries <= maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return { data: null, error: new Error('Maximum retries exceeded') };
};

/**
 * Check if an error is authentication related
 */
function isAuthError(error: any): boolean {
  if (!error) return false;
  
  // Check common auth error codes and messages
  if (typeof error === 'object') {
    const errorCodes = ['PGRST301', 'PGRST302', '401', '403'];
    const errorMessages = ['unauthorized', 'not authorized', 'jwt expired', 'invalid token'];
    
    // Check error code
    if (error.code && errorCodes.some(code => error.code.toString().includes(code))) {
      return true;
    }
    
    // Check error message
    if (error.message && errorMessages.some(msg => 
      error.message.toLowerCase().includes(msg))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Helper function to ensure auth is initialized before making requests
 */
export const ensureAuthEnhanced = async (): Promise<boolean> => {
  try {
    const { session } = await checkSessionEnhanced();
    if (session) {
      return true;
    }
    
    // Try to refresh the session
    const refreshed = await refreshSessionEnhanced();
    return !!refreshed;
  } catch (e) {
    console.error('Error in ensureAuthEnhanced:', e);
    return false;
  }
};
