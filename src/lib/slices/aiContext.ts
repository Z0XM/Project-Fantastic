import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type AIContext = {
  contextString: string;
  key: string;
  rawValue: any;
};

// Define a type for the slice state
export interface AIContextState {
  value: {
    [key: string]: AIContext;
  };
}

// Define the initial state using that type
const initialState: AIContextState = {
  value: {},
};

export const aiContextSlice = createSlice({
  name: 'aiContext',
  initialState,
  reducers: {
    setContext: (state, action: PayloadAction<AIContext>) => {
      state.value[action.payload.key] = action.payload;
    },
    setMultipleContext: (state, action: PayloadAction<AIContext[]>) => {
      action.payload.forEach((context) => {
        state.value[context.key] = context;
      });
    },
    //TODO: clearContext
  },
});

export const { setContext, setMultipleContext } = aiContextSlice.actions;

export default aiContextSlice.reducer;
