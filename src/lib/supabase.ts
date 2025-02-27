import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Implement a more reliable storage solution using SecureStore
const LWAStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key)
    } catch (error) {
      console.log('SecureStore getItem error:', error)
      // Fallback to AsyncStorage if SecureStore fails
      try {
        const value = await AsyncStorage.getItem(key)
        return value
      } catch (asyncError) {
        console.log('AsyncStorage getItem error:', asyncError)
        return null
      }
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch (error) {
      console.log('SecureStore setItem error:', error)
      // Fallback to AsyncStorage if SecureStore fails
      try {
        await AsyncStorage.setItem(key, value)
      } catch (asyncError) {
        console.log('AsyncStorage setItem error:', asyncError)
      }
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch (error) {
      console.log('SecureStore removeItem error:', error)
      // Fallback to AsyncStorage if SecureStore fails
      try {
        await AsyncStorage.removeItem(key)
      } catch (asyncError) {
        console.log('AsyncStorage removeItem error:', asyncError)
      }
    }
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: LWAStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Add this function to check if a session exists
export const checkSession = async () => {
  const { data } = await supabase.auth.getSession()
  return data.session
} 