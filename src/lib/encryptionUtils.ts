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
 * @returns Decrypted string or a placeholder if decryption fails
 */
export const decryptData = (encryptedData: string): string => {
  // If input is null, undefined, or not a string, return a placeholder
  if (!encryptedData || typeof encryptedData !== 'string') {
    console.warn('decryptData received invalid input:', encryptedData);
    return "[Encrypted Content]";
  }
  
  // If the input doesn't look encrypted (doesn't start with common encryption patterns),
  // it might already be plaintext, so return it as is
  if (!encryptedData.startsWith('U2FsdGVkX1') && 
      !encryptedData.match(/^[A-Za-z0-9+/=]{20,}$/) &&
      encryptedData.length < 100) {
    return encryptedData;
  }

  // Helper to check if decrypted text is suspicious (e.g., still looks encrypted)
  const isSuspiciousOutput = (text: string, originalInput: string): boolean => {
    if (typeof text !== 'string') return true; 
    if (text === originalInput) return true; 
    if (text.startsWith('U2FsdGVkX1')) return true; 

    // Check for non-printable ASCII characters (excluding tab, newline, carriage return)
    let nonPrintableCharFound = false;
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
        nonPrintableCharFound = true;
        break;
      }
    }
    if (nonPrintableCharFound) {
      // console.warn("Suspicious: output contains non-printable characters.");
      return true;
    }

    // Heuristic: If the string is moderately long and consists ONLY of hex characters 
    // or ONLY of base64 characters (without spaces), it might be suspicious.
    if (text.length > 20) { // Arbitrary length threshold 
      const hexRegex = /^[0-9a-fA-F]+$/;
      const base64Regex = /^[A-Za-z0-9+/=]+$/;
      
      if (hexRegex.test(text)) {
        // Further check: ensure it's not just a large number that happens to be in hex.
        // If it contains A-F, it's more likely a hex string than a decimal number.
        if (/[a-fA-F]/.test(text) || text.length > String(Number.MAX_SAFE_INTEGER).length) {
           // console.warn("Suspicious: output looks like a long hex string.");
          return true;
        }
      }
      
      if (base64Regex.test(text) && !text.includes(' ') && text.length > 32) { // Stricter length for spaceless base64
        // This is more likely an encoded blob if it's long, pure base64, and has no spaces.
        // console.warn("Suspicious: output looks like a long, spaceless base64 string.");
        return true;
      }
    }
    return false;
  };

  // Attempt 1: AES (expects U2FsdGVkX1... format from CryptoJS AES)
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    if (bytes.sigBytes > 0) {
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedText.includes('\uFFFD') && !isSuspiciousOutput(decryptedText, encryptedData)) {
        return decryptedText;
      }
      // console.warn('AES decryption resulted in replacement characters or suspicious output.');
    }
    // If sigBytes <= 0, replacement characters found, or output is suspicious, fall through.
  } catch (aesError) {
    // AES decryption itself threw an error (e.g. malformed input for AES)
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
      if (!tdesDecryptedText.includes('\uFFFD') && !isSuspiciousOutput(tdesDecryptedText, encryptedData)) {
        // console.log('Successfully decrypted with TripleDES fallback.');
        return tdesDecryptedText;
      }
      // console.warn('TripleDES decryption resulted in replacement characters or suspicious output.');
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

  // If all attempts fail to produce clean text, return a placeholder instead of throwing an error
  console.warn('All decryption methods failed to produce clean text for the provided encryptedData.');
  return "[Encrypted Content]";
};
