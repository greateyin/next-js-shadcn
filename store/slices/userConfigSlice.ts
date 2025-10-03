// store/slices/userConfigSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserConfigState {
  theme: 'light' | 'dark';
  language: string;
}

const initialState: UserConfigState = {
  theme: 'light',
  language: 'en',
};

const userConfigSlice = createSlice({
  name: 'userConfig',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload;
    },
    setLanguage(state, action: PayloadAction<string>) {
      state.language = action.payload;
    },
  },
});

export const { setTheme, setLanguage } = userConfigSlice.actions;
export default userConfigSlice.reducer;
