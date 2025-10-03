/**
 * @fileoverview Authentication helper utilities for initializing Auth.js
 * @module lib/auth-helpers
 */

import { AuthConfig } from "@auth/core/types";
import { Auth } from "@auth/core";

/** Singleton instance of the Auth.js configuration */
let authInstance: any = null;

/**
 * Creates and initializes an Auth.js instance
 * @async
 * @param {AuthConfig} config - The authentication configuration object
 * @returns {Promise<any>} The initialized Auth.js instance
 * @throws {Error} When initialization fails
 */
export async function createAuth(config: AuthConfig) {
  if (!authInstance) {
    try {
      // Create a mock request for initialization
      const mockRequest = new Request("http://localhost:3000/api/auth");
      authInstance = Auth(mockRequest, config);
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      throw error;
    }
  }
  return authInstance;
}
