// store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Represents a user in the authentication system.
 * @interface User
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's display name */
  name: string | null;
  /** User's email address */
  email: string;
  /** Timestamp when the email was verified */
  emailVerified: Date | null;
  /** URL to user's profile image */
  image: string | null;
  /** User's role in the system */
  role: "user" | "admin";
  /** Whether two-factor authentication is enabled */
  isTwoFactorEnabled: boolean;
  /** Current status of the user account */
  status: "active" | "suspended" | "deleted";
}

/**
 * Represents the authentication state in the Redux store.
 * @interface AuthState
 */
interface AuthState {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** The currently authenticated user */
  user: User | null;
  /** Any authentication error message */
  error: string | null;
  /** Whether an authentication operation is in progress */
  isLoading: boolean;
  /** Whether two-factor authentication is required */
  isTwoFactorRequired?: boolean;
}

/**
 * Initial state for the authentication slice
 */
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  error: null,
  isLoading: false,
  isTwoFactorRequired: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
      state.isTwoFactorRequired = false;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    setTwoFactorRequired(state, action: PayloadAction<boolean>) {
      state.isTwoFactorRequired = action.payload;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isTwoFactorRequired = false;
    },
  },
});

export const { setLoading, setUser, setError, setTwoFactorRequired, logout } = authSlice.actions;
export default authSlice.reducer;
