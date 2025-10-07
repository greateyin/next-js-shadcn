/**
 * @fileoverview Centralized export point for user-related Server Actions
 * @module actions/user
 * @description Unified exports for all user-related Server Actions
 */

// User query and management related
export {
  getUserByEmail,
  getUserById,
  updateUser,
  deleteUser,
} from "./queries";
