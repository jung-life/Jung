import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, enhancedAuth } from '../lib/supabase';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

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
      try {
        console.log('📱 SupabaseContext: Checking existing session...');

        // Use enhanced auth for physical devices
        if (Constants.isDevice) {
          const { data } = await enhancedAuth.getSession();
          setIsLoggedIn(!!data.session);
          console.log('📱 Enhanced session check:', data.session ? 'Has session' : 'No session');
        } else if (supabase) {
          const { data } = await supabase.auth.getSession();
          setIsLoggedIn(!!data.session);
          console.log('📱 Standard session check:', data.session ? 'Has session' : 'No session');
        } else {
          console.log('📱 No Supabase client available');
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("📱 Error checking session:", error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes only if supabase is available
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('📱 Auth state changed:', event, session ? 'Has session' : 'No session');
          setIsLoggedIn(!!session);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('📱 SupabaseContext: Login attempt...');

      // Use enhanced auth for physical devices
      if (Constants.isDevice) {
        const result = await enhancedAuth.signInWithEmail(email, password);
        if (result.error) throw result.error;
        console.log('📱 Enhanced login successful');
      } else if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        console.log('📱 Standard login successful');
      } else {
        throw new Error('Supabase client not available');
      }
    } catch (error) {
      console.error("📱 Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('📱 SupabaseContext: Logout attempt...');

      // Use enhanced auth for physical devices
      if (Constants.isDevice) {
        const result = await enhancedAuth.signOut();
        if (result.error) throw result.error;
        console.log('📱 Enhanced logout successful');
      } else if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        console.log('📱 Standard logout successful');
      } else {
        console.log('📱 No Supabase client available for logout');
      }
    } catch (error) {
      console.error("📱 Logout error:", error);
      throw error;
    }
  };

  const getGoogleOAuthUrl = async (): Promise<string | null> => {
    try {
      if (!supabase) {
        console.error("📱 No Supabase client available for OAuth");
        return null;
      }

      const result = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "jung://auth/callback",
        },
      });

      return result.data.url;
    } catch (error) {
      console.error("📱 OAuth URL error:", error);
      return null;
    }
  };

  const setOAuthSession = async (tokens: {
    access_token: string;
    refresh_token: string;
  }) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });

      if (error) throw error;

      setIsLoggedIn(data.session !== null);
    } catch (error) {
      console.error("📱 Set session error:", error);
      throw error;
    }
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
