import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import userConfigReducer from './slices/userConfigSlice';
import appSettingsReducer from './slices/appSettingsSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  userConfig: userConfigReducer,
  appSettings: appSettingsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
