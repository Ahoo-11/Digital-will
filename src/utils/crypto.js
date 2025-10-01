/**
 * Client-side encryption utilities using Web Crypto API
 * AES-256-GCM with PBKDF2 key derivation
 */

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Generate a random salt
 */
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generate a random IV
 */
function generateIV() {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt data with password
 * @param {string} data - Data to encrypt
 * @param {string} password - Encryption password
 * @returns {Promise<string>} Encrypted data in format "iv:salt:ciphertext" (base64)
 */
export async function encryptData(data, password) {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const salt = generateSalt();
    const iv = generateIV();
    const key = await deriveKey(password, salt);
    
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      dataBuffer
    );
    
    // Format: iv:salt:ciphertext (all base64)
    const ivBase64 = arrayBufferToBase64(iv);
    const saltBase64 = arrayBufferToBase64(salt);
    const ciphertextBase64 = arrayBufferToBase64(ciphertext);
    
    return `${ivBase64}:${saltBase64}:${ciphertextBase64}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data with password
 * @param {string} encryptedData - Encrypted data in format "iv:salt:ciphertext"
 * @param {string} password - Decryption password
 * @returns {Promise<string>} Decrypted data
 */
export async function decryptData(encryptedData, password) {
  try {
    const [ivBase64, saltBase64, ciphertextBase64] = encryptedData.split(':');
    
    if (!ivBase64 || !saltBase64 || !ciphertextBase64) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
    const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
    const ciphertext = base64ToArrayBuffer(ciphertextBase64);
    
    const key = await deriveKey(password, salt);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data - wrong password or corrupted data');
  }
}

/**
 * Generate a unique vault ID
 */
export function generateVaultId() {
  return crypto.randomUUID();
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  const minLength = 12;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain uppercase letters');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain lowercase letters');
  }
  if (!hasNumbers) {
    errors.push('Password must contain numbers');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain special characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Estimate encrypted data size
 */
export function estimateEncryptedSize(data) {
  // Base64 encoding increases size by ~33%
  // Add overhead for IV, salt, and GCM tag
  const overhead = IV_LENGTH + SALT_LENGTH + 16; // 16 bytes for GCM auth tag
  const base64Overhead = Math.ceil((data.length + overhead) * 1.33);
  return base64Overhead + 2; // +2 for colons
}
