import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, checkDisclaimerStatus, checkDisclaimerStatusDirect, storeAuthData, ensureUserPreferences } from '../lib/supabase';
import { Alert } from 'react-native';
import { Session, User } from '@supabase/supabase-js'; // Import types
import useAuthStore from '../store/useAuthStore'; // Import the Zustand store
import { revenueCatService } from '../lib/revenueCatService'; // Import RevenueCat service

// Define the shape of the context value
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isNewUser: boolean;
  setIsNewUser: (value: boolean) => void;
  handleDisclaimerAccepted: () => void;
  // Update signIn return type to match implementation
  signIn: (email: string, password: string) => Promise<{ success: boolean; isNewUser?: boolean; error?: string }>; 
  signOut: () => Promise<void>;
}

// Create context with the defined type
export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isNewUser: false,
  setIsNewUser: () => {},
  handleDisclaimerAccepted: () => {},
  signIn: async () => ({ success: false, error: 'Not implemented' }), // Provide matching default
  signOut: async () => {}
});

// Define props for AuthProvider
interface AuthProviderProps {
  children: React.ReactNode; // Add type for children
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null); // Type state
  const [user, setUser] = useState<User | null>(null); // Type state
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const setAuthStoreUser = useAuthStore(state => state.setUser); // Get the setUser function from the Zustand store

  // Function to check disclaimer status
  const checkUserDisclaimerStatus = async (currentUser: User | null) => { // Type parameter
    if (!currentUser) return;
    
    console.log("AuthContext: Checking disclaimer for user:", currentUser.id);
    try {
      // First ensure the user_preferences record exists
      await ensureUserPreferences();
      
      // Try the direct method first
      try {
        const hasSeenDisclaimer = await checkDisclaimerStatusDirect();
        console.log("AuthContext: User has seen disclaimer (direct method):", hasSeenDisclaimer);
        setIsNewUser(!hasSeenDisclaimer);
        return;
      } catch (directError) {
        console.error("AuthContext: Error checking disclaimer with direct method:", directError);
        // Fall back to the regular method
      }
      
      // Fall back to regular method
      const hasSeenDisclaimer = await checkDisclaimerStatus();
      console.log("AuthContext: User has seen disclaimer (regular method):", hasSeenDisclaimer);
      setIsNewUser(!hasSeenDisclaimer);
    } catch (error) {
      console.error("AuthContext: Error checking disclaimer:", error);
      // Force disclaimer on error
      setIsNewUser(true);
    }
  };

  // Function to update both user states
  const updateUserState = (newUser: User | null) => {
    setUser(newUser);
    setAuthStoreUser(newUser); // Also update the Zustand store
    console.log("AuthContext: User state updated in both Context and Zustand store:", newUser?.id);
  };

  useEffect(() => {
    // Set loading state
    setLoading(true);
    
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthContext: Initial session check:", !!session);
      setSession(session);
      updateUserState(session?.user ?? null); // Update both user states
      
      if (session?.user) {
        checkUserDisclaimerStatus(session.user);
      }
      
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        console.log('Auth state change session:', session ? `User ID: ${session.user.id}` : 'No session');
        
        setSession(session);
        updateUserState(session?.user ?? null); // Update both user states
        
        // Update state based on event
        if (event === 'SIGNED_IN') {
          console.log("AuthContext: User signed in.");
          // Disclaimer status is checked initially and on manual signIn, 
          // no need to re-check aggressively here. Let the UI react to user state.
          // Removed checkUserDisclaimerStatus call.
          // Removed manual navigation logic. Navigation should react to context state changes.
        } else if (event === 'SIGNED_OUT') {
          console.log("AuthContext: User signed out.");
          setIsNewUser(false); // Reset disclaimer status on sign out
        } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
           console.log(`AuthContext: Event ${event} received.`);
           // Potentially re-check disclaimer or other user details if needed, but keep it simple for now.
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Function to sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data?.user) {
        // Store the user in state
        updateUserState(data.user); // Update both user states
        
        // Store auth data to ensure it's available across the app
        if (data.session) {
          await storeAuthData(data.session);
        }
        
        // First ensure the user_preferences record exists
        await ensureUserPreferences();
        
        // Try the direct method first
        let hasSeenDisclaimer = false;
        try {
          hasSeenDisclaimer = await checkDisclaimerStatusDirect();
          console.log("SignIn: User has seen disclaimer (direct method):", hasSeenDisclaimer);
        } catch (directError) {
          console.error("SignIn: Error checking disclaimer with direct method:", directError);
          // Fall back to the regular method
          hasSeenDisclaimer = await checkDisclaimerStatus();
          console.log("SignIn: User has seen disclaimer (regular method):", hasSeenDisclaimer);
        }
        
        // Set isNewUser based on disclaimer status
        setIsNewUser(!hasSeenDisclaimer);

        // Identify user with RevenueCat
        try {
          await revenueCatService.identifyUser(data.user.id);
          console.log('User identified with RevenueCat successfully');
        } catch (revenueCatError) {
          console.error('Failed to identify user with RevenueCat:', revenueCatError);
          // Don't fail the sign-in process if RevenueCat identification fails
        }
        
        return { success: true, isNewUser: !hasSeenDisclaimer };
      }
      
      return { success: false };
    } catch (error: unknown) { // Add type annotation
      console.error('Error signing in:', error);
      // Type guard for error message
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign in';
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Function to sign out
  const signOut = async () => {
    setLoading(true);
    try {
      // Log out from RevenueCat first
      try {
        await revenueCatService.logOut();
        console.log('User logged out from RevenueCat successfully');
      } catch (revenueCatError) {
        console.error('Failed to log out from RevenueCat:', revenueCatError);
        // Don't fail the sign-out process if RevenueCat logout fails
      }

      await supabase.auth.signOut();
      updateUserState(null); // Update both user states
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisclaimerAccepted = () => {
    console.log('Disclaimer accepted, updating isNewUser state');
    setIsNewUser(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isNewUser,
      setIsNewUser,
      handleDisclaimerAccepted,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);
