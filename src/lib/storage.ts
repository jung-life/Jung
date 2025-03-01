import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

// Create a dedicated directory for our app's storage with a unique name
const APP_STORAGE_DIR = `${FileSystem.documentDirectory}jung_app_data_v1/`;

// Ensure our storage directory exists
const ensureStorageDir = async (): Promise<boolean> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(APP_STORAGE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(APP_STORAGE_DIR, { intermediates: true });
      console.log('Created storage directory:', APP_STORAGE_DIR);
    }
    return true;
  } catch (error) {
    console.error('Error ensuring storage directory exists:', error);
    return false;
  }
};

// Initialize storage directory
let storageInitialized = false;
const initStorage = async () => {
  if (!storageInitialized) {
    storageInitialized = await ensureStorageDir();
    console.log('Storage initialization result:', storageInitialized);
  }
  return storageInitialized;
};

// Sanitize keys to be safe for file system
const sanitizeKey = (key: string): string => {
  return key.replace(/[\/\\:*?"<>|@]/g, '_');
};

// Memory cache to avoid excessive file operations
const memoryCache: Record<string, string> = {};

// Hybrid storage implementation with memory cache
export const HybridStorage = {
  getItem: async (key: string): Promise<string | null> => {
    // Check memory cache first
    if (memoryCache[key]) {
      return memoryCache[key];
    }
    
    try {
      // Try SecureStore first for sensitive data
      const secureValue = await SecureStore.getItemAsync(sanitizeKey(key));
      if (secureValue !== null) {
        memoryCache[key] = secureValue; // Cache the result
        return secureValue;
      }
      
      // If file storage is available, try that next
      if (await initStorage()) {
        const safeKey = sanitizeKey(key);
        const filePath = `${APP_STORAGE_DIR}${safeKey}.json`;
        
        try {
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          if (fileInfo.exists) {
            const contents = await FileSystem.readAsStringAsync(filePath);
            memoryCache[key] = contents; // Cache the result
            return contents;
          }
        } catch (fileError) {
          console.log(`File read error for ${key}:`, fileError);
        }
      }
      
      // Last resort: try AsyncStorage
      const asyncValue = await AsyncStorage.getItem(key);
      if (asyncValue !== null) {
        memoryCache[key] = asyncValue; // Cache the result
      }
      return asyncValue;
    } catch (error) {
      console.error(`Storage getItem error (${key}):`, error);
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    // Update memory cache immediately
    memoryCache[key] = value;
    
    try {
      // For small values, use SecureStore
      if (value.length < 2000) {
        await SecureStore.setItemAsync(sanitizeKey(key), value);
        return;
      }
      
      // For larger values, try file storage
      if (await initStorage()) {
        const safeKey = sanitizeKey(key);
        const filePath = `${APP_STORAGE_DIR}${safeKey}.json`;
        
        try {
          await FileSystem.writeAsStringAsync(filePath, value);
          return;
        } catch (fileError) {
          console.log(`File write error for ${key}:`, fileError);
        }
      }
      
      // Last resort: try AsyncStorage
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Storage setItem error (${key}):`, error);
      // Don't throw - we've already updated the memory cache
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    // Remove from memory cache
    delete memoryCache[key];
    
    try {
      // Try to remove from all storage types
      await SecureStore.deleteItemAsync(sanitizeKey(key));
      
      if (await initStorage()) {
        const safeKey = sanitizeKey(key);
        const filePath = `${APP_STORAGE_DIR}${safeKey}.json`;
        
        try {
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(filePath);
          }
        } catch (fileError) {
          console.log(`File delete error for ${key}:`, fileError);
        }
      }
      
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Storage removeItem error (${key}):`, error);
    }
  }
};

// Initialize storage on import
initStorage(); 