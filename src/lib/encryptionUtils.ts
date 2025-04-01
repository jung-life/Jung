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
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypts AES encrypted data
 * @param encryptedData - Encrypted string to decrypt
 * @returns Decrypted string
 */
export const decryptData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
};
