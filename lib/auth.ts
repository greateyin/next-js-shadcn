/**
 * @fileoverview Proxy exports to maintain imports from lib/auth path
 * @module lib/auth
 * @description Redirects imports to the consolidated auth implementation
 */

// Re-export everything from the main auth implementation
export * from "@/auth";
