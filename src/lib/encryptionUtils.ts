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
  // Attempt 1: AES (expects U2FsdGVkX1... format from CryptoJS AES)
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    if (bytes.sigBytes > 0) {
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      // If no replacement chars, assume success (empty string is valid plaintext)
      if (!decryptedText.includes('\uFFFD')) {
        return decryptedText;
      }
      console.warn('AES decryption resulted in replacement characters.');
    }
    // If sigBytes <= 0 or replacement characters found, fall through.
    // No explicit throw here to allow fallbacks if AES was tried on non-AES data.
  } catch (aesError) {
    // AES decryption itself threw an error (e.g. malformed input for AES)
    // Log but allow fallbacks, as input might not have been AES.
    // console.log('AES decryption attempt threw error, trying fallbacks:', aesError.message);
  }

  // Attempt 2: TripleDES (for data possibly encrypted by TripleDES fallback in encryptData)
  try {
    const tdesKey = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
    const tdesBytes = CryptoJS.TripleDES.decrypt(encryptedData, tdesKey, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    if (tdesBytes.sigBytes > 0) {
      const tdesDecryptedText = tdesBytes.toString(CryptoJS.enc.Utf8);
      if (!tdesDecryptedText.includes('\uFFFD')) {
        // console.log('Successfully decrypted with TripleDES fallback.');
        return tdesDecryptedText;
      }
      console.warn('TripleDES decryption resulted in replacement characters.');
    }
  } catch (tdesError) {
    // console.log('TripleDES decryption attempt threw error, trying fallbacks:', tdesError.message);
  }
  
  // Attempt 3: Base64 "UNENCRYPTED:" fallback (for very old data from encryptData's last resort)
  try {
    const decoded = atob(encryptedData); // atob throws if not valid base64
    if (decoded.startsWith('UNENCRYPTED:')) {
      // console.log('Successfully "decrypted" with base64 UNENCRYPTED fallback.');
      return decoded.substring(12);
    }
  } catch (base64Error) {
    // Not base64 or not our specific format.
  }

  // If all attempts fail to produce clean text, throw an error.
  console.warn('All decryption methods failed to produce clean text for the provided encryptedData.');
  throw new Error('All decryption methods failed.');
};
