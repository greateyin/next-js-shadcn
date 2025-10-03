/**
 * Utility functions for cryptographic operations using Web Crypto API
 */

/**
 * Converts an ArrayBuffer to a Base64 string
 * @param {ArrayBuffer} buffer - The buffer to convert
 * @returns {string} The Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const binary = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
  return btoa(binary);
}

/**
 * Converts a Base64 string to an ArrayBuffer
 * @param {string} base64 - The Base64 string to convert
 * @returns {ArrayBuffer} The ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generates a random token of specified length
 * @param {number} length - The length of the token (default: 32)
 * @returns {string} The generated token
 */
export function generateToken(length: number = 32): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));
  return arrayBufferToBase64(randomBytes.buffer).replace(/[^a-zA-Z0-9]/g, '').slice(0, length);
}

/**
 * Hashes a string using SHA-256 with Web Crypto API
 * @param {string} str - The string to hash
 * @returns {Promise<string>} The hashed string in hex format
 */
export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password using Web Crypto API with PBKDF2
 * @param {string} password - The password to hash
 * @returns {Promise<string>} The hashed password in Base64 format with salt prefix
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Convert password to key material
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // Import password as key
  const key = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive key using PBKDF2
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256 // 256 bits
  );
  
  // Combine salt and derived key
  const combined = new Uint8Array(salt.length + derivedKey.byteLength);
  combined.set(salt);
  combined.set(new Uint8Array(derivedKey), salt.length);
  
  return arrayBufferToBase64(combined.buffer);
}

/**
 * Verify a password against a hash by extracting salt and rehashing
 * @param {string} password - The plain password to verify
 * @param {string} hashedPassword - The stored hashed password
 * @returns {Promise<boolean>} True if the passwords match
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    console.log("Verifying password with hash format:", hashedPassword?.substring(0, 10) + "...");
    
    // Check if it might be a bcrypt hash (starts with $2a$ or $2b$)
    if (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$')) {
      console.error("Detected bcrypt hash format, but Web Crypto API cannot verify bcrypt passwords");
      throw new Error("Incompatible password hash format (bcrypt)");
    }
    
    // Check for development mode password with dev_ prefix
    if (hashedPassword.startsWith('dev_')) {
      console.log("Detected development password format");
      const encodedPassword = hashedPassword.substring(4); // Remove 'dev_' prefix
      const decodedPassword = Buffer.from(encodedPassword, 'base64').toString();
      console.log("Development password check");
      return password === decodedPassword;
    }
    
    // For debugging
    try {
      // Extract salt and derive key using the same parameters
      const data = base64ToArrayBuffer(hashedPassword);
      console.log("Successfully parsed base64 hash, length:", data.byteLength);
      
      // Split the data: first 16 bytes are salt, the rest is the hashed password
      const salt = new Uint8Array(data, 0, 16);
      console.log("Salt extracted, length:", salt.length);
      
      // Convert password to key material
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);
      
      // Import password as key
      const key = await crypto.subtle.importKey(
        'raw',
        passwordData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );
      
      // Derive key using PBKDF2 with the same parameters
      const derivedKey = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        key,
        256 // 256 bits
      );
      
      // Compare the derived key with the stored key
      const storedKey = new Uint8Array(data.slice(16));
      const newKey = new Uint8Array(derivedKey);
      
      console.log("Comparison lengths - stored:", storedKey.length, "new:", newKey.length);
      
      // Constant-time comparison to prevent timing attacks
      if (storedKey.length !== newKey.length) {
        console.log("Key length mismatch");
        return false;
      }
      
      let diff = 0;
      for (let i = 0; i < storedKey.length; i++) {
        diff |= storedKey[i] ^ newKey[i];
      }
      
      console.log("Password comparison result:", diff === 0);
      return diff === 0;
    } catch (error) {
      console.error("Error in standard password verification:", error);
      
      // No fallback for production security
      
      return false;
    }
  } catch (error) {
    console.error("Error in password verification:", error);
    return false;
  }
}

/**
 * Alias for verifyPassword to maintain backward compatibility
 */
export const comparePasswords = verifyPassword;

/**
 * Generate a secure random string for use as a password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

/**
 * Generate a time-based token for 2FA
 */
export function generateTwoFactorToken(): string {
  return generateToken(6).replace(/[^0-9]/g, '');
}

/**
 * Hash a token (for email verification, password reset, etc.)
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}