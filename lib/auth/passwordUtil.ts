/**
 * @fileoverview Password utility functions
 * @module lib/auth/passwordUtil
 * @description Provides functions for secure password hashing and verification
 * using the Web Crypto API
 */

/**
 * Convert ArrayBuffer to Base64 string
 * @function
 * @param {ArrayBuffer} buffer - ArrayBuffer to convert
 * @returns {string} Base64 encoded string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * @function
 * @param {string} base64 - Base64 string to convert
 * @returns {ArrayBuffer} Decoded ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a random salt
 * @async
 * @function
 * @param {number} length - Length of salt in bytes
 * @returns {Promise<Uint8Array>} Random salt
 */
async function generateSalt(length: number = 16): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Hash a password with PBKDF2
 * @async
 * @function
 * @param {string} password - Password to hash
 * @param {Uint8Array} salt - Salt for hashing
 * @returns {Promise<ArrayBuffer>} Hashed password
 */
async function pbkdf2Hash(
  password: string,
  salt: Uint8Array
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const key = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256
  );
}

/**
 * Hash a password for storage
 * @async
 * @function
 * @param {string} password - Password to hash
 * @returns {Promise<string>} Base64 encoded salt and hash
 * 
 * @example
 * ```ts
 * const hashedPassword = await hashPassword("myPassword123");
 * // Store hashedPassword in database
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await generateSalt();
  const hash = await pbkdf2Hash(password, salt);
  
  // Combine salt and hash
  const hashArray = new Uint8Array(hash);
  const combinedArray = new Uint8Array(salt.length + hashArray.length);
  combinedArray.set(salt);
  combinedArray.set(hashArray, salt.length);
  
  // Convert to base64 for storage
  return arrayBufferToBase64(combinedArray.buffer);
}

/**
 * Verify a password against a stored hash
 * @async
 * @function
 * @param {string} password - Password to verify
 * @param {string} storedHash - Stored hash to verify against
 * @returns {Promise<boolean>} True if password matches
 * 
 * @example
 * ```ts
 * const isValid = await verifyPassword("myPassword123", storedHash);
 * if (isValid) {
 *   // Password is correct
 * }
 * ```
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const combined = base64ToArrayBuffer(storedHash);
    const combinedArray = new Uint8Array(combined);
    
    // Extract salt and hash
    const salt = combinedArray.slice(0, 16);
    const storedHashPart = combinedArray.slice(16);
    
    // Hash the input password
    const inputHash = await pbkdf2Hash(password, salt);
    const inputHashArray = new Uint8Array(inputHash);
    
    // Compare hashes
    if (storedHashPart.length !== inputHashArray.length) {
      return false;
    }
    
    for (let i = 0; i < storedHashPart.length; i++) {
      if (storedHashPart[i] !== inputHashArray[i]) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}