import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Constants
const AUTH_TOKEN_KEY = 'auth-token';
const REFRESH_TOKEN_KEY = 'refresh-token';
const SESSION_KEY = 'user-session';

// Check if running on web (Expo web doesn't support SecureStore)
const isWeb = Platform.OS === 'web';

/**
 * Securely save authentication token
 */
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    }
    console.log('Auth token saved securely');
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

/**
 * Securely retrieve authentication token
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

/**
 * Securely save refresh token
 */
export const saveRefreshToken = async (token: string): Promise<void> => {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    }
    console.log('Refresh token saved securely');
  } catch (error) {
    console.error('Error saving refresh token:', error);
  }
};

/**
 * Securely retrieve refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving refresh token:', error);
    return null;
  }
};

/**
 * Save entire session object
 */
export const saveSession = async (session: any): Promise<void> => {
  if (!session) return;
  
  try {
    const sessionString = JSON.stringify(session);
    if (isWeb) {
      await AsyncStorage.setItem(SESSION_KEY, sessionString);
    } else {
      await SecureStore.setItemAsync(SESSION_KEY, sessionString);
    }
    
    // Also save individual tokens for easier access
    if (session.access_token) {
      await saveAuthToken(session.access_token);
    }
    if (session.refresh_token) {
      await saveRefreshToken(session.refresh_token);
    }
    
    console.log('Session saved securely');
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

/**
 * Retrieve entire session object
 */
export const getSession = async (): Promise<any | null> => {
  try {
    let sessionString;
    if (isWeb) {
      sessionString = await AsyncStorage.getItem(SESSION_KEY);
    } else {
      sessionString = await SecureStore.getItemAsync(SESSION_KEY);
    }
    
    if (!sessionString) return null;
    return JSON.parse(sessionString);
  } catch (error) {
    console.error('Error retrieving session:', error);
    return null;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    if (isWeb) {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, SESSION_KEY]);
    } else {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
    console.log('Auth data cleared');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}; 