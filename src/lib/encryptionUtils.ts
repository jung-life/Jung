import * as CryptoJS from 'crypto-js';

// Fixed encryption key for development - in production, this should be securely stored
const ENCRYPTION_KEY = "jungian_app_encryption_key";

/**
 * Encrypts data using AES encryption with fallback for environments without secure random
 * @param data - String data to encrypt
 * @returns Encrypted string
 */
export const encryptData = (data: string): string => {
  try {
    // Try standard AES encryption first
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Error with standard encryption, trying fallback:', error);
    
    try {
      // Fallback to a simpler encryption method that doesn't require secure random
      // This is less secure but better than no encryption
      const simpleCipher = CryptoJS.enc.Utf8.parse(data);
      const simpleKey = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
      
      // Use Triple DES which has different initialization requirements
      const encrypted = CryptoJS.TripleDES.encrypt(
        simpleCipher, 
        simpleKey,
        {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7
        }
      );
      
      return encrypted.toString();
    } catch (fallbackError) {
      console.error('Fallback encryption also failed:', fallbackError);
      
      // Last resort: base64 encoding (not encryption, but prevents casual viewing)
      console.warn('Using base64 encoding as last resort (NOT SECURE)');
      return btoa('UNENCRYPTED:' + data);
    }
  }
};

/**
 * Decrypts AES encrypted data with fallback methods
 * @param encryptedData - Encrypted string to decrypt
 * @returns Decrypted string
 */
export const decryptData = (encryptedData: string): string => {
  try {
    // Try standard AES decryption first
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    // If we got a valid result, return it
    if (decrypted) {
      return decrypted;
    }
    
    throw new Error('Standard decryption produced empty result');
  } catch (error) {
    console.error('Error with standard decryption, trying fallback:', error);
    
    try {
      // Try Triple DES decryption as fallback
      const simpleKey = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
      const decrypted = CryptoJS.TripleDES.decrypt(
        encryptedData,
        simpleKey,
        {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7
        }
      );
      
      const result = decrypted.toString(CryptoJS.enc.Utf8);
      if (result) {
        return result;
      }
      
      throw new Error('Fallback decryption produced empty result');
    } catch (fallbackError) {
      console.error('Fallback decryption also failed:', fallbackError);
      
      // Check if it's our base64 encoded last resort
      try {
        const decoded = atob(encryptedData);
        if (decoded.startsWith('UNENCRYPTED:')) {
          return decoded.substring(12); // Remove the prefix
        }
      } catch (base64Error) {
        // Not base64 encoded, continue to final error
      }
      
      // If all methods fail, return the original data with a warning
      console.warn('All decryption methods failed, returning original data');
      return encryptedData;
    }
  }
};
