# State Management Specification

## Overview

This document outlines the state management system used in the application, which is built using Redux Toolkit and Redux Persist for client-side state management.

## Architecture

### 1. Store Configuration

```typescript
// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import rootReducer from './rootReducer';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'settings'], // Persist only specific slices
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
```

### 2. Root Reducer

```typescript
// store/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  settings: settingsReducer,
});

export default rootReducer;
```

## State Slices

### 1. Authentication Slice

```typescript
// store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});
```

### 2. Settings Slice

```typescript
// store/slices/settingsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  theme: 'light' | 'dark';
  notifications: boolean;
  autoSave: boolean;
}

const initialState: SettingsState = {
  theme: 'light',
  notifications: true,
  autoSave: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleNotifications: (state) => {
      state.notifications = !state.notifications;
    },
    setAutoSave: (state, action: PayloadAction<boolean>) => {
      state.autoSave = action.payload;
    },
  },
});
```

## Implementation Details

### 1. Store Provider Setup

```typescript
// app/providers.tsx
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store/store';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                {children}
            </PersistGate>
        </Provider>
    );
}
```

### 2. State Usage in Components

```typescript
// Example component using Redux state
import { useSelector, useDispatch } from 'react-redux';
import { setTheme } from '@/store/slices/settingsSlice';

const ThemeToggle = () => {
    const theme = useSelector((state) => state.settings.theme);
    const dispatch = useDispatch();

    const toggleTheme = () => {
        dispatch(setTheme(theme === 'light' ? 'dark' : 'light'));
    };

    return (
        <button onClick={toggleTheme}>
            Toggle Theme
        </button>
    );
};
```

## State Management Patterns

### 1. Action Creators

- Use Redux Toolkit's createSlice for automatic action creators
- Implement thunks for async operations
- Handle side effects in thunks

### 2. Selectors

- Create memoized selectors using createSelector
- Implement reusable selector functions
- Use selector composition for complex state derivation

### 3. State Updates

- Immutable updates using Redux Toolkit's createSlice
- Batch updates when necessary
- Handle optimistic updates for better UX

## Performance Considerations

### 1. State Structure

- Normalize complex data structures
- Avoid deeply nested state
- Use proper state splitting

### 2. Re-rendering Optimization

- Use selective state subscription
- Implement memoization
- Avoid unnecessary state updates

### 3. Redux DevTools Integration

- Enable development tools
- Monitor state changes
- Debug state updates

## Security Considerations

### 1. Sensitive Data

- Don't store sensitive information
- Clear sensitive data on logout
- Implement proper state persistence

### 2. State Validation

- Validate state updates
- Sanitize user input
- Handle edge cases

## Testing Strategy

### 1. Unit Tests

- Test individual reducers
- Verify action creators
- Check selector functions

### 2. Integration Tests

- Test state flow
- Verify component integration
- Check persistence behavior

## Maintenance Guidelines

### 1. State Updates

- Document state changes
- Maintain type safety
- Update related components

### 2. Performance Monitoring

- Monitor state size
- Check re-render frequency
- Optimize as needed

## Dependencies

```json
{
  "dependencies": {
    "@reduxjs/toolkit": "^2.2.7",
    "react-redux": "^9.1.2",
    "redux-persist": "^6.0.0"
  }
}
```
