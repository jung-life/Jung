import { supabase, refreshSession, checkAuthState } from './supabase';

/**
 * Enhanced function to fetch data from Supabase with better error handling and retry logic
 * Can be used for conversations, messages, and other data that requires authentication
 */
export const enhancedSupabaseFetch = async <T>(
  fetcher: () => Promise<{ data: T | null; error: any }>,
  maxRetries = 2
): Promise<{ data: T | null; error: any }> => {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      // First check if we have a valid session
      const authState = await checkAuthState();
      if (!authState?.session) {
        console.log('No valid session found, attempting to refresh...');
        const refreshed = await refreshSession();
        if (!refreshed) {
          console.error('Session refresh failed');
          return { data: null, error: new Error('Authentication required') };
        }
      }
      
      // Try to fetch the data
      const result = await fetcher();
      
      // If successful or error is not auth-related, return
      if (!result.error || !isAuthError(result.error)) {
        return result;
      }
      
      // If we got an auth error, try refreshing the token
      console.log('Auth error, attempting to refresh session...');
      await refreshSession();
      
    } catch (e) {
      console.error('Error in enhancedSupabaseFetch:', e);
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
export const ensureAuth = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      return true;
    }
    
    // Try to refresh the session
    const refreshed = await refreshSession();
    return !!refreshed;
  } catch (e) {
    console.error('Error in ensureAuth:', e);
    return false;
  }
};

/**
 * Wrapper for Supabase queries with enhanced error handling
 */
export const fetchConversationsList = async (userId: string) => {
  return enhancedSupabaseFetch(async () => {
    const response = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return response;
  });
};
