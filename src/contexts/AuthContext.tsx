import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, checkDisclaimerStatus, storeAuthData } from '../lib/supabase';
import { Alert } from 'react-native';

// Create context with setIsNewUser
export const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  isNewUser: false,
  setIsNewUser: (value: boolean) => {},
  signIn: async (email: string, password: string) => {},
  signOut: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(undefined);
  const [errorMessage, setErrorMessage] = useState('');

  // Function to check disclaimer status
  const checkUserDisclaimerStatus = async (currentUser) => {
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

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check if this is a sign-in or sign-up
        if (event === 'SIGNED_IN' || event === 'SIGNED_UP') {
          console.log("AuthContext: User signed in/up, checking disclaimer");
          await checkUserDisclaimerStatus(session?.user);
        } else if (event === 'SIGNED_OUT') {
          setIsNewUser(undefined);
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Function to sign in with email and password
  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Handle specific error codes
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Invalid email or password');
        } else {
          setErrorMessage(error.message);
        }
        return false;
      }
      
      // Session is automatically saved by our auth state change listener
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Error signing in:', error.message);
      setErrorMessage('An unexpected error occurred');
      return false;
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
      console.error('Error signing out:', error.message);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isNewUser,
      setIsNewUser,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext); 