import storage from 'redux-persist/lib/storage';

// Configuration for redux-persist
export const persistConfig = {
  key: 'root',
  storage,
  // Only persist the cart state
  whitelist: ['cart'],
  // You can add more configuration options here if needed
};
