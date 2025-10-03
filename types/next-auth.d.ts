/**
 * @fileoverview Type definitions for Next.js Authentication
 * @module types/next-auth
 * @description Extends Next.js Auth types to include custom user properties
 * and authentication status
 */

import "next-auth";
import type { User as PrismaUser } from "@prisma/client";
import type { DefaultUser } from "next-auth";
import type { 
  Role, 
  Permission, 
  Application, 
  DefaultRole 
} from "@/types/roles";

/**
 * Custom authentication status type
 * @typedef {string} AuthStatus
 * @description Defines possible user authentication states
 * 
 * @property {"pending"} pending - User registration is pending
 * @property {"active"} active - User is active and can access the system
 * @property {"suspended"} suspended - User access is temporarily suspended
 * @property {"banned"} banned - User is permanently banned from the system
 * @property {"deleted"} deleted - User account has been deleted
 * @property {"inactive"} inactive - User account is inactive
 */
export type AuthStatus = "pending" | "active" | "suspended" | "banned" | "deleted" | "inactive";

declare module "next-auth" {
  /**
   * Extended Session interface
   * @interface Session
   * @extends {DefaultSession}
   * @description Extends the default session type with custom user properties
   * 
   * @property {Object} user - User information in the session
   * @property {string} user.id - Unique identifier for the user
   * @property {string} user.email - User's email address
   * @property {string|null} user.name - User's display name
   * @property {UserRole} user.role - User's role in the system
   * @property {AuthStatus} user.status - User's current authentication status
   * @property {string|null} [user.image] - URL to user's profile image
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: string; // For backward compatibility
      status: AuthStatus;
      image?: string | null;
      // Enhanced role system
      roleNames: string[];
      permissionNames: string[];
      applicationPaths: string[];
      
      // Compatibility with existing code
      roles: Role[];
      permissions: Permission[];
      applications: Application[];
    }
  }

  /**
   * Extended User interface
   * @interface User
   * @extends {DefaultUser}
   * @description Extends the built-in User type with custom properties
   * 
   * @property {string} id - Unique identifier for the user
   * @property {string} email - User's email address
   * @property {string|null} name - User's display name
   * @property {string} role - User's role in the system (legacy)
   * @property {AuthStatus} status - User's current authentication status
   * @property {string|null} [image] - URL to user's profile image
   * @property {Role[]} [roles] - User's roles
   * @property {Permission[]} [permissions] - User's permissions
   * @property {Application[]} [applications] - User's accessible applications
   */
  interface User {
    id: string;
    email: string;
    name: string | null;
    role: string; // For backward compatibility
    status: AuthStatus;
    image?: string | null;
    // Enhanced role system
    roles?: Role[];
    permissions?: Permission[];
    applications?: Application[];
  }
}

declare module "next-auth/jwt" {
  /**
   * Extended JWT interface
   * @interface JWT
   * @description Extends the built-in JWT type with custom properties
   * 
   * @property {string} [id] - User's unique identifier
   * @property {UserRole} [role] - User's role in the system
   * @property {AuthStatus} [status] - User's current authentication status
   * @property {string} [email] - User's email address
   * @property {string|null} [name] - User's display name
   * @property {string|null} [picture] - URL to user's profile image
   */
  interface JWT {
    id?: string;
    role?: string; // For backward compatibility
    status?: AuthStatus;
    email?: string;
    name?: string | null;
    picture?: string | null;
    // Enhanced role system - simplified to reduce token size
    roleNames?: string[];
    permissionNames?: string[];
    applicationPaths?: string[];
  }
}
