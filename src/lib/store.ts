import { configureStore } from '@reduxjs/toolkit';
import baseAppReducer from './slices/baseApp';
import aiContextReducer from './slices/aiContext';

export const makeStore = () => {
  return configureStore({
    reducer: {
      baseApp: baseAppReducer,
      aiContext: aiContextReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
