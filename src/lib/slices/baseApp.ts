import { Business } from '@prisma/client';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define a type for the slice state
export interface BaseAppState {
  business: Business | null;
}

// Define the initial state using that type
const initialState: BaseAppState = {
  business: null,
};

export const baseAppSlice = createSlice({
  name: 'baseApp',
  initialState,
  reducers: {
    setBusiness: (state, action: PayloadAction<Business>) => {
      state.business = action.payload;
    },
  },
});

export const { setBusiness } = baseAppSlice.actions;

export default baseAppSlice.reducer;
