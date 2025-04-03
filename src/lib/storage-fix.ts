/**
 * Storage fix for AsyncStorage issues in simulators
 * 
 * This file provides a fix for AsyncStorage errors that can occur in simulators,
 * particularly with error messages like:
 * "Failed to create storage directory.Error Domain=NSCocoaErrorDomain Code=512"
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// In-memory fallback as a last resort
const memoryStorage: Record<string, string> = {};

// Flag to track if file-based persistence is viable
let filePersistenceEnabled = true; 
// Flag to track if we've tried to load from persistent storage
let hasAttemptedLoad = false;

/**
 * Robust AsyncStorage wrapper that handles simulator-specific storage issues
 */
export const RobustStorage = {
  /**
   * Get an item from storage with error handling
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn(`Storage getItem error for key ${key}:`, error);
      
      // Try fallback storage for simulator environments
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        try {
          const value = await getFallbackItem(key);
          if (value !== null) {
            return value;
          }
        } catch (fallbackError) {
          console.error(`Fallback storage getItem error for key ${key}:`, fallbackError);
        }
        
        // If FileSystem fails, try in-memory storage as last resort
        console.log(`Trying in-memory storage for key ${key}`);
        return memoryStorage[key] || null;
      }
      
      return null;
    }
  },
  
  /**
   * Set an item in storage with error handling
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Storage setItem error for key ${key}:`, error);
      
      // Try fallback storage for simulator environments
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        try {
          await setFallbackItem(key, value);
        } catch (fallbackError) {
          console.error(`Fallback storage setItem error for key ${key}:`, fallbackError);
          
          // If FileSystem fails, use in-memory storage as last resort
          console.log(`Using in-memory storage for key ${key}`);
          memoryStorage[key] = value;
        }
      }
    }
  },
  
  /**
   * Remove an item from storage with error handling
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`Storage removeItem error for key ${key}:`, error);
      
      // Try fallback storage for simulator environments
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        try {
          await removeFallbackItem(key);
        } catch (fallbackError) {
          console.error(`Fallback storage removeItem error for key ${key}:`, fallbackError);
        }
        
        // Also remove from in-memory storage
        delete memoryStorage[key];
      }
    }
  },
  
  /**
   * Clear all items from storage with error handling
   */
  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.warn('Storage clear error:', error);
      
      // Try fallback storage for simulator environments
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        try {
          await clearFallbackStorage();
        } catch (fallbackError) {
          console.error('Fallback storage clear error:', fallbackError);
        }
        
        // Clear in-memory storage
        for (const key in memoryStorage) {
          delete memoryStorage[key];
        }
      }
    }
  }
};

// --- Enhanced Fallback Storage Logic ---

// Master storage object that will be persisted when possible
const masterStorage: Record<string, string> = {};

/**
 * Get a reliable base directory for file persistence.
 * Returns null if no reliable directory is found.
 */
const getReliableStorageDirectory = (): string | null => {
  const cacheDir = FileSystem.cacheDirectory;
  const docDir = FileSystem.documentDirectory;

  if (cacheDir && typeof cacheDir === 'string' && cacheDir.length > 0) {
    return cacheDir;
  } else if (docDir && typeof docDir === 'string' && docDir.length > 0) {
    console.warn('Cache directory unavailable or invalid, using document directory for fallback storage.');
    return docDir;
  } else {
    console.error('Neither cache nor document directory is available/valid for fallback storage. File persistence disabled.');
    filePersistenceEnabled = false; // Disable file persistence if no valid dir
    return null;
  }
};

/**
 * Get the full path for the storage backup file.
 * Returns null if file persistence is disabled.
 */
const getStorageFilePath = (): string | null => {
  if (!filePersistenceEnabled) return null;
  
  const baseDir = getReliableStorageDirectory();
  if (!baseDir) {
    filePersistenceEnabled = false; // Disable if directory becomes invalid later
    return null;
  }
  
  // Use a simple, safe filename
  return `${baseDir}jung_storage_backup.json`;
};

/**
 * Get an item from fallback storage (memory first, then try loading persistence)
 */
const getFallbackItem = async (key: string): Promise<string | null> => {
  // Ensure we've tried to load from persistent storage at least once
  if (!hasAttemptedLoad) {
    await loadStorageFromPersistence();
  }
  
  return masterStorage[key] || null;
};

/**
 * Set an item in fallback storage (memory first, then try persisting)
 */
const setFallbackItem = async (key: string, value: string): Promise<void> => {
  // Ensure we've tried to load from persistent storage at least once
  if (!hasAttemptedLoad) {
    await loadStorageFromPersistence();
  }
  
  masterStorage[key] = value;
  
  // Try to persist the updated storage (best effort)
  await persistStorage();
};

/**
 * Remove an item from fallback storage (memory first, then try persisting)
 */
const removeFallbackItem = async (key: string): Promise<void> => {
  // Ensure we've tried to load from persistent storage at least once
  if (!hasAttemptedLoad) {
    await loadStorageFromPersistence();
  }
  
  delete masterStorage[key];
  
  // Try to persist the updated storage (best effort)
  await persistStorage();
};

/**
 * Clear all items from fallback storage (memory first, then try persisting)
 */
const clearFallbackStorage = async (): Promise<void> => {
  // Clear the master storage object
  for (const key in masterStorage) {
    delete masterStorage[key];
  }
  
  // Try to persist the empty storage (best effort)
  await persistStorage();
};

/**
 * Try to load storage from persistence (best-effort)
 */
const loadStorageFromPersistence = async (): Promise<void> => {
  if (hasAttemptedLoad) return; // Only attempt once
  hasAttemptedLoad = true;
  
  const storageFile = getStorageFilePath();
  if (!storageFile) {
    console.warn('File persistence disabled, cannot load from file.');
    return; // Exit if file persistence is disabled
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(storageFile);
    
    if (fileInfo.exists && !fileInfo.isDirectory) {
      const content = await FileSystem.readAsStringAsync(storageFile);
      const parsed = JSON.parse(content);
      
      // Merge with master storage (load persisted data into memory)
      Object.assign(masterStorage, parsed);
      console.log('Successfully loaded storage from persistence file:', storageFile);
    } else if (fileInfo.exists && fileInfo.isDirectory) {
       console.error('Storage persistence path exists but is a directory:', storageFile);
       filePersistenceEnabled = false; // Disable persistence if path is wrong type
    }
  } catch (error) {
    console.warn('Failed to load storage from persistence file:', storageFile, error);
    // Don't disable persistence here, maybe it was a temporary read error
  }
};

/**
 * Try to persist the storage (best-effort)
 */
const persistStorage = async (): Promise<void> => {
  const storageFile = getStorageFilePath();
   if (!storageFile) {
    // console.warn('File persistence disabled, cannot save to file.'); // Optional: reduce log noise
    return; // Exit if file persistence is disabled
  }

  try {
     // Ensure directory exists before writing
     const baseDir = storageFile.substring(0, storageFile.lastIndexOf('/'));
     const dirInfo = await FileSystem.getInfoAsync(baseDir);
     if (!dirInfo.exists) {
       await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
       console.log('Created persistence directory:', baseDir);
     } else if (!dirInfo.isDirectory) {
        console.error('Persistence base path exists but is not a directory:', baseDir);
        filePersistenceEnabled = false; // Disable if path is wrong type
        return;
     }

    await FileSystem.writeAsStringAsync(
      storageFile,
      JSON.stringify(masterStorage)
    );
    // console.log('Successfully persisted storage to file:', storageFile); // Optional: reduce log noise
  } catch (error) {
    console.warn('Failed to persist storage to file:', storageFile, error);
    // Check for specific errors that indicate persistence is impossible
    if (error instanceof Error && (error.message.includes('permission') || error.message.includes('directory'))) {
        console.error('Disabling file persistence due to critical error.');
        filePersistenceEnabled = false;
    }
  }
};
