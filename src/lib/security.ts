import * as CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import * as SecureStore from 'expo-secure-store';

// Get encryption key from secure storage, or generate a new one
export const getEncryptionKey = async (): Promise<string> => {
  try {
    // Try to get existing encryption key
    let encryptionKey = await SecureStore.getItemAsync('encryption_key');
    
    // If no key exists, generate a new one
    if (!encryptionKey) {
      // Generate a random 256-bit key
      const newKey = CryptoJS.lib.WordArray.random(32).toString();
      
      // Store the key securely
      await SecureStore.setItemAsync('encryption_key', newKey);
      encryptionKey = newKey;
    }
    
    return encryptionKey;
  } catch (error) {
    console.error('Error getting encryption key:', error);
    // Fallback to a derived key if secure storage fails
    return CryptoJS.SHA256(uuidv4()).toString();
  }
};

// Encrypt data
export const encryptData = async (data: string): Promise<string> => {
  try {
    const encryptionKey = await getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(data, encryptionKey).toString();
    return encrypted;
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt data
export const decryptData = async (encryptedData: string): Promise<string> => {
  try {
    const encryptionKey = await getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Anonymize text by removing personal identifiers
export const anonymizeText = (text: string): string => {
  // Replace potential personal identifiers with placeholders
  // This is a simple implementation - a more robust solution would use NLP
  const anonymized = text
    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]') // Simple name detection
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]') // Phone numbers
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL]') // Email addresses
    .replace(/\b\d{5}(?:[-\s]\d{4})?\b/g, '[ZIP]'); // ZIP codes
    
  return anonymized;
};
