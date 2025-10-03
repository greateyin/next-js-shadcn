/**
 * @fileoverview Redux store configuration with persistence support
 * @module store/store
 */

import { configureStore } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import rootReducer from './rootReducer';
import { PersistPartial } from 'redux-persist/es/persistReducer';

/**
 * Redux persist configuration
 * @constant
 */

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'userConfig'], // Only persist these reducers
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Configured Redux store with persistence
 * @constant
 */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

/**
 * Redux persistor instance
 * @constant
 */
export const persistor = persistStore(store);

/**
 * Root state type including persistence
 * @typedef {ReturnType<typeof store.getState> & PersistPartial} RootState
 */
export type RootState = ReturnType<typeof store.getState> & PersistPartial;

/**
 * Typed dispatch function
 * @typedef {typeof store.dispatch} AppDispatch
 */
export type AppDispatch = typeof store.dispatch;

/**
 * Typed dispatch hook
 * @returns {AppDispatch} Typed dispatch function
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed selector hook
 * @constant
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * @deprecated Use RootState instead
 * @typedef {RootState} AppState
 */
export type AppState = RootState;