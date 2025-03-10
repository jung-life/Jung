import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as SecureStore from 'expo-secure-store';

type SupabaseContextProps = {
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getGoogleOAuthUrl: () => Promise<string | null>;
  setOAuthSession: (tokens: {
    access_token: string;
    refresh_token: string;
  }) => Promise<void>;
};

const SupabaseContext = createContext<SupabaseContextProps>({
  isLoggedIn: false,
  loading: true,
  login: async () => {},
  logout: async () => {},
  getGoogleOAuthUrl: async () => null,
  setOAuthSession: async () => {},
});

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
      setLoading(false);
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const getGoogleOAuthUrl = async (): Promise<string | null> => {
    const result = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "jung://auth/callback",
      },
    });
    
    return result.data.url;
  };

  const setOAuthSession = async (tokens: {
    access_token: string;
    refresh_token: string;
  }) => {
    const { data, error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    if (error) throw error;

    setIsLoggedIn(data.session !== null);
  };

  return (
    <SupabaseContext.Provider
      value={{
        isLoggedIn,
        loading,
        login,
        logout,
        getGoogleOAuthUrl,
        setOAuthSession
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
}; 