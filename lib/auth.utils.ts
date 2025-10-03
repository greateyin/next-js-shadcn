/**
 * @fileoverview Authentication utility functions using NextAuth.js
 * @module lib/auth.utils
 */

import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth"

/**
 * Initialize NextAuth.js with the provided configuration
 * @constant
 * @type {Object}
 * @property {Function} auth - Authentication function for protecting routes
 * @property {Function} signIn - Function to handle sign-in
 * @property {Function} signOut - Function to handle sign-out
 */
const { auth, signIn, signOut } = NextAuth(authConfig)

export { auth, signIn, signOut }