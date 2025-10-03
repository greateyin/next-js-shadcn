import { User, LoginCredentials, RegisterCredentials } from '../types';
import { getCsrfToken } from 'next-auth/react';

/**
 * Authenticates a user with their credentials
 * @param credentials - The user's login credentials
 * @returns Promise resolving to the authenticated user
 * @throws Error if login fails
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  const csrfToken = await getCsrfToken();
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken || '',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login failed');
  }

  return response.json();
}

/**
 * Logs out the current user
 * @returns Promise that resolves when logout is complete
 * @throws Error if logout fails
 */
export async function logout(): Promise<void> {
  const response = await fetch('/api/auth/logout', { method: 'POST' });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Logout failed');
  }
}

/**
 * Registers a new user with the provided credentials
 * @param credentials - The new user's registration information
 * @returns Promise resolving to the newly created user
 * @throws Error if registration fails
 */
export async function register(credentials: RegisterCredentials): Promise<User> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Registration failed');
  }

  return response.json();
}