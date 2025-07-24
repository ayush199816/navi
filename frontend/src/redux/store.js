import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import authReducer from './slices/authSlice';
import packageReducer from './slices/packageSlice';
import quoteReducer from './slices/quoteSlice';
import bookingReducer from './slices/bookingSlice';
import leadReducer from './slices/leadSlice';
import walletReducer from './slices/walletSlice';
import itineraryReducer from './slices/itinerarySlice';
import lmsReducer from './slices/lmsSlice';
import uiReducer from './slices/uiSlice';
import userReducer from './slices/userSlice';
import salesLeadReducer from './slices/salesLeadSlice';
import guestSightseeingReducer from './slices/guestSightseeingSlice';
import cartReducer from './slices/cartSlice';

// Persist configuration for the cart
const cartPersistConfig = {
  key: 'cart',
  storage,
  whitelist: ['items', 'total', 'count']
};

// Combine reducers with persistence for cart
const rootReducer = combineReducers({
  auth: authReducer,
  packages: packageReducer,
  quotes: quoteReducer,
  bookings: bookingReducer,
  leads: leadReducer,
  wallet: walletReducer,
  itineraries: itineraryReducer,
  lms: lmsReducer,
  ui: uiReducer,
  users: userReducer,
  salesLeads: salesLeadReducer,
  guestSightseeings: guestSightseeingReducer,
  cart: persistReducer(cartPersistConfig, cartReducer)
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
});

// Create the persisted store
const persistor = persistStore(store);

export { store, persistor };
export default store;
