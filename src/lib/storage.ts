import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Memory cache to ensure data is available even if storage fails
const memoryCache: Record<string, string> = {};

// Sanitize keys to be safe for storage
const sanitizeKey = (key: string): string => {
  return key.replace(/[\/\\:*?"<>|@]/g, '_');
};

// Simple hybrid storage implementation that prioritizes in-memory cache
export const HybridStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Check memory cache first (fastest)
      if (memoryCache[key]) {
        console.log(`Memory cache hit for ${key}`);
        return memoryCache[key];
      }
      
      // Try SecureStore for sensitive data
      try {
        const secureValue = await SecureStore.getItemAsync(sanitizeKey(key));
        if (secureValue !== null) {
          console.log(`SecureStore hit for ${key}`);
          memoryCache[key] = secureValue; // Cache the result
          return secureValue;
        }
      } catch (secureError) {
        console.log(`SecureStore read error for ${key}:`, secureError);
      }
      
      // Fall back to AsyncStorage
      try {
        const asyncValue = await AsyncStorage.getItem(key);
        if (asyncValue !== null) {
          console.log(`AsyncStorage hit for ${key}`);
          memoryCache[key] = asyncValue; // Cache the result
          return asyncValue;
        }
      } catch (asyncError) {
        console.log(`AsyncStorage read error for ${key}:`, asyncError);
      }
      
      console.log(`No storage hit for ${key}`);
      return null;
    } catch (error) {
      console.error(`Storage getItem error (${key}):`, error);
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    // Update memory cache immediately
    memoryCache[key] = value;
    console.log(`Updated memory cache for ${key}`);
    
    // Try to store in SecureStore if it's small enough
    if (value.length < 2000) {
      try {
        await SecureStore.setItemAsync(sanitizeKey(key), value);
        console.log(`Stored ${key} in SecureStore`);
        return; // Success, no need to try AsyncStorage
      } catch (secureError) {
        console.log(`SecureStore write error for ${key}:`, secureError);
      }
    }
    
    // Fall back to AsyncStorage
    try {
      await AsyncStorage.setItem(key, value);
      console.log(`Stored ${key} in AsyncStorage`);
    } catch (asyncError) {
      console.log(`AsyncStorage write error for ${key}:`, asyncError);
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    // Remove from memory cache
    delete memoryCache[key];
    console.log(`Removed ${key} from memory cache`);
    
    // Try to remove from SecureStore
    try {
      await SecureStore.deleteItemAsync(sanitizeKey(key));
      console.log(`Removed ${key} from SecureStore`);
    } catch (secureError) {
      console.log(`SecureStore delete error for ${key}:`, secureError);
    }
    
    // Try to remove from AsyncStorage
    try {
      await AsyncStorage.removeItem(key);
      console.log(`Removed ${key} from AsyncStorage`);
    } catch (asyncError) {
      console.log(`AsyncStorage delete error for ${key}:`, asyncError);
    }
  }
};

// Add a function to persist the memory cache on app close
export const persistMemoryCache = async (): Promise<void> => {
  try {
    // Store the entire cache as a JSON string
    const cacheJson = JSON.stringify(memoryCache);
    await AsyncStorage.setItem('_memory_cache_backup', cacheJson);
    console.log('Memory cache persisted with', Object.keys(memoryCache).length, 'items');
  } catch (error) {
    console.error('Error persisting memory cache:', error);
  }
};

// Add a function to restore the memory cache on app start
export const restoreMemoryCache = async (): Promise<void> => {
  try {
    const cacheJson = await AsyncStorage.getItem('_memory_cache_backup');
    if (cacheJson) {
      const restoredCache = JSON.parse(cacheJson);
      Object.assign(memoryCache, restoredCache);
      console.log('Memory cache restored with', Object.keys(restoredCache).length, 'items');
    }
  } catch (error) {
    console.error('Error restoring memory cache:', error);
  }
};

// Initialize by restoring the cache
restoreMemoryCache(); 