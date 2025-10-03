// store/thunks/authThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { signIn, signOut } from '@/lib/auth';
import { setUser, setLoading, setError, logout } from '../slices/authSlice';
import type { User } from '../slices/authSlice';

export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

/**
 * Login thunk
 */
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { dispatch }) => {
    try {
      dispatch(setLoading(true));

      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        twoFactorCode: credentials.twoFactorCode,
        redirect: false,
      });

      if (result?.error) {
        dispatch(setError(result.error));
        return;
      }

      // Handle successful login
      dispatch(setUser(result?.user as User));
    } catch (error) {
      dispatch(setError((error as Error).message));
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Register thunk
 */
export const registerThunk = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, { dispatch }) => {
    try {
      dispatch(setLoading(true));

      // Register using credentials provider
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        name: data.name,
        isRegister: true,
        redirect: false,
      });

      if (result?.error) {
        dispatch(setError(result.error));
        return;
      }

      // Handle successful registration
      dispatch(setUser(result?.user as User));
    } catch (error) {
      dispatch(setError((error as Error).message));
    } finally {
      dispatch(setLoading(false));
    }
  }
);

/**
 * Logout thunk
 */
export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await signOut({ redirect: false });
      dispatch(logout());
    } catch (error) {
      dispatch(setError((error as Error).message));
    }
  }
);