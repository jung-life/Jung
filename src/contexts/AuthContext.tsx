import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, checkDisclaimerStatus } from '../lib/supabase';

// Create context with setIsNewUser
export const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  isNewUser: false,
  setIsNewUser: (value: boolean) => {}
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(undefined);

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

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isNewUser,
      setIsNewUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext); 