import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Memory cache for immediate access
const memoryCache: Record<string, string> = {};

// Sanitize keys to be safe for storage
const sanitizeKey = (key: string): string => {
  return key.replace(/[\/\\:*?"<>|@]/g, '_');
};

// Check if we're running in a problematic environment (iOS simulator)
const isProblematicEnvironment = (): boolean => {
  return Platform.OS === 'ios' && Platform.constants.uiMode === 'simulator';
};

// Create a custom storage directory path that avoids the problematic ExponentExperienceData folder
const getCustomStoragePath = (key: string): string => {
  // Use the app's document directory instead of ExponentExperienceData
  return `${FileSystem.documentDirectory}app_storage/${sanitizeKey(key)}.json`;
};

// Ensure our custom storage directory exists
const ensureCustomStorageDir = async (): Promise<boolean> => {
  if (!FileSystem.documentDirectory) return false;
  
  try {
    const dirPath = `${FileSystem.documentDirectory}app_storage`;
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      console.log('Created custom storage directory:', dirPath);
    }
    return true;
  } catch (error) {
    console.error('Error creating custom storage directory:', error);
    return false;
  }
};

// Initialize our storage system
const initStorage = async (): Promise<void> => {
  if (isProblematicEnvironment()) {
    console.log('Running in problematic environment (iOS simulator), using custom storage path');
    await ensureCustomStorageDir();
  }
  
  // Restore memory cache
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

// Robust storage implementation that works around Expo's file system issues
export const RobustStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Check memory cache first (fastest)
      if (memoryCache[key]) {
        return memoryCache[key];
      }
      
      // Try SecureStore for sensitive data
      try {
        const secureValue = await SecureStore.getItemAsync(sanitizeKey(key));
        if (secureValue !== null) {
          memoryCache[key] = secureValue;
          return secureValue;
        }
      } catch (secureError) {
        console.log(`SecureStore read error for ${key}:`, secureError);
      }
      
      // Try AsyncStorage
      try {
        const asyncValue = await AsyncStorage.getItem(key);
        if (asyncValue !== null) {
          memoryCache[key] = asyncValue;
          return asyncValue;
        }
      } catch (asyncError) {
        console.log(`AsyncStorage read error for ${key}:`, asyncError);
      }
      
      // If we're in a problematic environment, try our custom file storage
      if (isProblematicEnvironment()) {
        try {
          const filePath = getCustomStoragePath(key);
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          
          if (fileInfo.exists) {
            const fileContent = await FileSystem.readAsStringAsync(filePath);
            if (fileContent) {
              memoryCache[key] = fileContent;
              return fileContent;
            }
          }
        } catch (fileError) {
          console.log(`File read error for ${key}:`, fileError);
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Storage getItem error (${key}):`, error);
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    // Update memory cache immediately
    memoryCache[key] = value;
    
    // Try to store in SecureStore if it's small enough
    if (value.length < 2000) {
      try {
        await SecureStore.setItemAsync(sanitizeKey(key), value);
      } catch (secureError) {
        console.log(`SecureStore write error for ${key}:`, secureError);
      }
    }
    
    // Try to store in AsyncStorage
    try {
      await AsyncStorage.setItem(key, value);
    } catch (asyncError) {
      console.log(`AsyncStorage write error for ${key}:`, asyncError);
    }
    
    // If we're in a problematic environment, also store in our custom file storage
    if (isProblematicEnvironment()) {
      try {
        const dirExists = await ensureCustomStorageDir();
        if (dirExists) {
          const filePath = getCustomStoragePath(key);
          await FileSystem.writeAsStringAsync(filePath, value);
        }
      } catch (fileError) {
        console.log(`File write error for ${key}:`, fileError);
      }
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    // Remove from memory cache
    delete memoryCache[key];
    
    // Try to remove from SecureStore
    try {
      await SecureStore.deleteItemAsync(sanitizeKey(key));
    } catch (secureError) {
      console.log(`SecureStore delete error for ${key}:`, secureError);
    }
    
    // Try to remove from AsyncStorage
    try {
      await AsyncStorage.removeItem(key);
    } catch (asyncError) {
      console.log(`AsyncStorage delete error for ${key}:`, asyncError);
    }
    
    // If we're in a problematic environment, also remove from our custom file storage
    if (isProblematicEnvironment()) {
      try {
        const filePath = getCustomStoragePath(key);
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(filePath);
        }
      } catch (fileError) {
        console.log(`File delete error for ${key}:`, fileError);
      }
    }
  }
};

// Function to persist memory cache
export const persistMemoryCache = async (): Promise<void> => {
  try {
    const cacheJson = JSON.stringify(memoryCache);
    await AsyncStorage.setItem('_memory_cache_backup', cacheJson);
  } catch (error) {
    console.error('Error persisting memory cache:', error);
  }
};

// Initialize storage on import
initStorage(); 