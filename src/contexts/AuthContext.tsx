import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, checkDisclaimerStatus, storeAuthData } from '../lib/supabase';
import { Alert } from 'react-native';
import { Session, User } from '@supabase/supabase-js'; // Import types

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

  // Function to check disclaimer status
  const checkUserDisclaimerStatus = async (currentUser: User | null) => { // Type parameter
    if (!currentUser) return;
    
    console.log("AuthContext: Checking disclaimer for user:", currentUser.id);
    try {
      const hasSeenDisclaimer = await checkDisclaimerStatus();
      console.log("AuthContext: User has seen disclaimer:", hasSeenDisclaimer);
      setIsNewUser(!hasSeenDisclaimer);
    } catch (error) {
      console.error("AuthContext: Error checking disclaimer:", error);
      // Force disclaimer on error
      setIsNewUser(true);
    }
  };

  useEffect(() => {
    // Set loading state
    setLoading(true);
    
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthContext: Initial session check:", !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserDisclaimerStatus(session.user);
      }
      
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check if this is a sign-in or token refresh/update
        // SIGNED_IN should cover the initial sign-in after signup as well
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          console.log("AuthContext: User signed in/updated, checking disclaimer");
          await checkUserDisclaimerStatus(session?.user ?? null); // Pass null if user is undefined
          
          // Store auth data to ensure it's available across the app - REMOVED (Client handles persistence)
          // if (session) {
          //   await storeAuthData(session);
          // }
        } else if (event === 'SIGNED_OUT') {
          setIsNewUser(false);
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
        // Check if user has seen disclaimer
        const hasSeenDisclaimer = await checkDisclaimerStatus();
        
        // Set isNewUser based on disclaimer status
        setIsNewUser(!hasSeenDisclaimer);
        
        // Store the user in state
        setUser(data.user);
        
        // Store auth data to ensure it's available across the app - REMOVED (Client handles persistence)
        // if (data.session) {
        //   await storeAuthData(data.session);
        // }
        
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
      await supabase.auth.signOut();
      setUser(null);
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
