import * as CryptoJS from 'crypto-js';

// Fixed encryption key for development - in production, this should be securely stored
const ENCRYPTION_KEY = "jungian_app_encryption_key";

/**
 * Encrypts data using AES encryption
 * @param data - String data to encrypt
 * @returns Encrypted string
 */
export const encryptData = (data: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    // Return a base64 encoded version as fallback
    return 'FALLBACK:' + btoa(data);
  }
};

/**
 * Decrypts AES encrypted data with multiple fallback methods
 * @param encryptedData - Encrypted string to decrypt
 * @returns Decrypted string or a placeholder if decryption fails
 */
export const decryptData = (encryptedData: string): string => {
  // Input validation
  if (!encryptedData || typeof encryptedData !== 'string') {
    console.warn('decryptData received invalid input:', encryptedData);
    return "[Encrypted Content]";
  }

  // Handle fallback encoding
  if (encryptedData.startsWith('FALLBACK:')) {
    try {
      return atob(encryptedData.substring(9));
    } catch (error) {
      console.error('Failed to decode fallback data:', error);
      return "[Encrypted Content]";
    }
  }

  // If the input doesn't look encrypted, it might already be plaintext
  if (!encryptedData.startsWith('U2FsdGVkX1') && 
      !encryptedData.match(/^[A-Za-z0-9+/=]{20,}$/) &&
      encryptedData.length < 100) {
    return encryptedData;
  }

  // Try AES decryption with the current key
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    
    // Check if decryption was successful (no empty strings or replacement characters)
    if (decryptedText && decryptedText.length > 0 && !decryptedText.includes('�')) {
      return decryptedText;
    }
  } catch (aesError) {
    console.warn('AES decryption failed:', aesError instanceof Error ? aesError.message : String(aesError));
  }

  // Try decryption with the old security.ts key format (dynamic keys from SecureStore)
  // This is a fallback for data encrypted with the old system
  try {
    // Try a few common key variations that might have been used
    const commonKeys = [
      CryptoJS.SHA256("default_key").toString(), // Common fallback
      "user_specific_key", // Another possible key
      encryptedData.substring(0, 32) // Try using part of the encrypted data as key (not secure but might work for recovery)
    ];

    for (const testKey of commonKeys) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, testKey);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        
        if (decryptedText && decryptedText.length > 0 && !decryptedText.includes('�')) {
          console.log('Successfully decrypted with fallback key');
          return decryptedText;
        }
      } catch (error) {
        // Continue to next key
      }
    }
  } catch (error) {
    console.warn('Fallback key decryption failed:', error);
  }

  // Try base64 decode as last resort (for data that was base64 encoded instead of encrypted)
  try {
    const decoded = atob(encryptedData);
    if (decoded.startsWith('UNENCRYPTED:')) {
      return decoded.substring(12);
    }
    // If it's valid JSON, it might be unencrypted data that was base64 encoded
    if (decoded.startsWith('{') && decoded.endsWith('}')) {
      try {
        JSON.parse(decoded); // Test if it's valid JSON
        return decoded;
      } catch (jsonError) {
        // Not valid JSON, continue
      }
    }
  } catch (base64Error) {
    // Not valid base64
  }

  // All decryption attempts failed
  console.warn('All decryption methods failed for data. Data may be corrupted or encrypted with unknown key.');
  return "[Encrypted Content]";
};
