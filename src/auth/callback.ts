import * as Linking from 'expo-linking';
import { useEffect } from 'react';
// Removed Alert and supabase import as they are no longer needed here
// Removed Linking import as well

export default function AuthCallback() {
  useEffect(() => {
    // No manual handling needed here.
    // Supabase client with detectSessionInUrl: true will handle the redirect
    // automatically when the app receives the deep link.
    // The onAuthStateChange listener in supabase.ts will detect the session.
    console.log('AuthCallback mounted. Supabase should handle the URL automatically.');
  }, []);

  // This component doesn't need to render anything
  return null;
}
