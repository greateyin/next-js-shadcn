/** 
 * Represents a user in the authentication system
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name (optional) */
  name: string | null;
}

/**
 * Represents the authentication state in the application
 */
export interface AuthState {
  /** Indicates if the user is currently authenticated */
  isAuthenticated: boolean;
  /** The currently authenticated user, if any */
  user: User | null;
  /** Indicates if an authentication operation is in progress */
  loading: boolean;
  /** Error message from the last authentication operation, if any */
  error: string | null;
}

/**
 * Credentials required for user login
 */
export interface LoginCredentials {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

/**
 * Credentials required for user registration
 */
export interface RegisterCredentials {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
  /** User's display name (optional) */
  name?: string;
}