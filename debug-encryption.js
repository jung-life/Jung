#!/usr/bin/env node

/**
 * Debug script for encryption/decryption issues in the Jung app
 * This script helps diagnose problems with encrypted data
 */

const CryptoJS = require('crypto-js');

// Fixed encryption key used in encryptionUtils.ts
const ENCRYPTION_KEY = "jungian_app_encryption_key";

/**
 * Debug decryption function that matches the new encryptionUtils.ts
 */
function debugDecryptData(encryptedData) {
  console.log('\n=== DECRYPTION DEBUG ===');
  console.log('Input data:', encryptedData);
  console.log('Input type:', typeof encryptedData);
  console.log('Input length:', encryptedData ? encryptedData.length : 'N/A');
  
  // Input validation
  if (!encryptedData || typeof encryptedData !== 'string') {
    console.log('❌ Invalid input - not a string or null');
    return "[Encrypted Content]";
  }

  // Handle fallback encoding
  if (encryptedData.startsWith('FALLBACK:')) {
    try {
      console.log('🔍 Detected fallback encoding...');
      const result = Buffer.from(encryptedData.substring(9), 'base64').toString('utf8');
      console.log('✅ Fallback decoding successful');
      console.log('Decrypted text:', result);
      return result;
    } catch (error) {
      console.log('❌ Failed to decode fallback data:', error.message);
      return "[Encrypted Content]";
    }
  }

  // If the input doesn't look encrypted, it might already be plaintext
  if (!encryptedData.startsWith('U2FsdGVkX1') && 
      !encryptedData.match(/^[A-Za-z0-9+/=]{20,}$/) &&
      encryptedData.length < 100) {
    console.log('✅ Data appears to be plaintext already');
    return encryptedData;
  }

  console.log('🔍 Attempting AES decryption with current key...');
  // Try AES decryption with the current key
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    
    // Check if decryption was successful (no empty strings or replacement characters)
    if (decryptedText && decryptedText.length > 0 && !decryptedText.includes('�')) {
      console.log('✅ AES decryption successful');
      console.log('Decrypted text:', decryptedText);
      return decryptedText;
    } else {
      console.log('❌ AES decryption failed: empty result or replacement characters');
    }
  } catch (aesError) {
    console.log('❌ AES decryption failed:', aesError.message);
  }

  console.log('🔍 Attempting fallback keys...');
  // Try decryption with fallback keys
  const commonKeys = [
    CryptoJS.SHA256("default_key").toString(),
    "user_specific_key",
    encryptedData.substring(0, 32)
  ];

  for (let i = 0; i < commonKeys.length; i++) {
    const testKey = commonKeys[i];
    try {
      console.log(`  Testing key ${i + 1}...`);
      const bytes = CryptoJS.AES.decrypt(encryptedData, testKey);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      
      if (decryptedText && decryptedText.length > 0 && !decryptedText.includes('�')) {
        console.log(`✅ Successfully decrypted with fallback key ${i + 1}`);
        console.log('Decrypted text:', decryptedText);
        return decryptedText;
      }
    } catch (error) {
      console.log(`  Key ${i + 1} failed`);
    }
  }

  console.log('🔍 Attempting base64 decode as last resort...');
  // Try base64 decode as last resort
  try {
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
    if (decoded.startsWith('UNENCRYPTED:')) {
      console.log('✅ Base64 UNENCRYPTED fallback successful');
      const result = decoded.substring(12);
      console.log('Decrypted text:', result);
      return result;
    }
    // If it's valid JSON, it might be unencrypted data that was base64 encoded
    if (decoded.startsWith('{') && decoded.endsWith('}')) {
      try {
        JSON.parse(decoded); // Test if it's valid JSON
        console.log('✅ Found valid JSON in base64 data');
        console.log('Decrypted text:', decoded);
        return decoded;
      } catch (jsonError) {
        console.log('❌ Base64 data is not valid JSON');
      }
    }
  } catch (base64Error) {
    console.log('❌ Base64 decode failed:', base64Error.message);
  }

  console.log('❌ All decryption methods failed');
  return "[Encrypted Content]";
}

/**
 * Test encryption function
 */
function testEncryption(data) {
  console.log('\n=== ENCRYPTION TEST ===');
  console.log('Original data:', data);
  
  try {
    const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    console.log('✅ Encryption successful');
    console.log('Encrypted data:', encrypted);
    
    // Test decryption
    const decrypted = debugDecryptData(encrypted);
    console.log('Round-trip test:', decrypted === data ? '✅ PASSED' : '❌ FAILED');
    
    return encrypted;
  } catch (error) {
    console.log('❌ Encryption failed:', error.message);
  }
}

// If running directly (not imported)
if (require.main === module) {
  // Test with the problematic encrypted string from the error
  const problematicData = "U2FsdGVkX1+jTxcXyCC9eJ76aEyXw2XCPyxeuAgT+8tNxkyAINjXrzOHZfYFhYaM2CDbGfAoQmrqOZDS68OPkTLFM+gYpd+c55qQoZFHEjiVffDFwmh7EV6IxmBY7vyICQzQG0ZR+hXnt8RQ5EAX3kUOvAX+uo2IT1pcVaLe7X9iPgBKvutJHvshGeU0ZS0GymIJUyyTryIRZ+DBbSi3kXwVwIetzINhimSda9MHJSp2t2qUC/AiLC5It7xJ/KtNoi3mEds64RIzXQc5rYi7sIcopr/n1AaxckMdZqY58YjU26IodK6P0ehEvtooaJLI4ySRCN4wWWJ9lkX6vrjZaQ==";
  
  console.log('🔍 Debugging problematic encrypted data from error log...');
  debugDecryptData(problematicData);
  
  // Test with sample data
  console.log('\n' + '='.repeat(50));
  const sampleData = JSON.stringify({
    primary_emotion: 'happy',
    secondary_emotions: ['excited', 'confident'],
    intensity: 7,
    needs: ['connection', 'growth']
  });
  
  testEncryption(sampleData);
}

module.exports = { debugDecryptData, testEncryption };
