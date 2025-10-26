/**
 * @fileoverview User registration actions
 * @module app/auth/register/actions
 * @description Handles user registration functionality including
 * password hashing and user record creation
 */

import { hashPassword } from "@/lib/crypto";
import { db } from "@/lib/db";

/**
 * Registration form data interface
 * @interface RegisterFormData
 * @description Defines the structure of user registration data
 * 
 * @property {string} email - User's email address
 * @property {string} password - User's unhashed password
 * @property {string} [name] - Optional user's display name
 * 
 * @example
 * ```ts
 * const formData: RegisterFormData = {
 *   email: 'user@example.com',
 *   password: 'secure-password',
 *   name: 'John Doe'
 * }
 * ```
 */
interface RegisterFormData {
  email: string;
  password: string;
  name?: string;
}

/**
 * Register a new user
 * @async
 * @function register
 * @description Creates a new user account with:
 * - Password hashing
 * - Database record creation
 * - Default role assignment
 * 
 * @param {RegisterFormData} data - User registration data
 * @returns {Promise<User>} The created user record
 * 
 * @example
 * ```ts
 * // Register a new user
 * const user = await register({
 *   email: 'user@example.com',
 *   password: 'secure-password',
 *   name: 'John Doe'
 * });
 * 
 * // Register without name
 * const basicUser = await register({
 *   email: 'basic@example.com',
 *   password: 'secure-password'
 * });
 * ```
 * 
 * @throws {Error} If user creation fails or email is already taken
 */
export async function register(data: RegisterFormData) {
  const hashedPassword = await hashPassword(data.password);

  // ⚠️ SECURITY: Do NOT set role field - roles are assigned via UserRole join table
  // Default role will be assigned after email verification
  const user = await db.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      status: "pending",
      // role field does not exist in User model - use UserRole join table instead
    }
  });

  return user;
}