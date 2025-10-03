// store/slices/appSettingsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppSettingsState {
  notifications: boolean;
  autoSave: boolean;
}

const initialState: AppSettingsState = {
  notifications: true,
  autoSave: false,
};

const appSettingsSlice = createSlice({
  name: 'appSettings',
  initialState,
  reducers: {
    toggleNotifications(state) {
      state.notifications = !state.notifications;
    },
    setAutoSave(state, action: PayloadAction<boolean>) {
      state.autoSave = action.payload;
    },
  },
});

export const { toggleNotifications, setAutoSave } = appSettingsSlice.actions;
export default appSettingsSlice.reducer;