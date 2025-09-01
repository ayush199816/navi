import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  total: 0,
  count: 0,
  loading: false,
  error: null
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { id, quantity = 1 } = action.payload;
      
      // For sightseeing items, we want to add them as separate entries
      // since they have unique combinations of date/pax
      if (action.payload.type === 'sightseeing') {
        state.items.push({ ...action.payload });
      } else {
        // For other item types, maintain the existing quantity-based behavior
        const existingItem = state.items.find(item => item.id === id);
        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          state.items.push({ ...action.payload, quantity });
        }
      }
      
      // Update totals
      state.count = state.items.reduce((total, item) => {
        return total + (item.type === 'sightseeing' ? 1 : item.quantity);
      }, 0);
      
      state.total = state.items.reduce((total, item) => {
        if (item.type === 'sightseeing') {
          // Use offerPrice if available, otherwise use regular price
          // Both prices should be in USD at this point
          const itemPrice = item.hasOffer ? (item.offerPrice || item.price) : item.price;
          return total + (item.totalPrice || (itemPrice * (item.pax || 1)));
        }
        // For non-sightseeing items, ensure we're using USD prices
        return total + (item.price * item.quantity);
      }, 0);
    },
    
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      
      // Update totals
      state.count = state.items.reduce((total, item) => total + item.quantity, 0);
      state.total = state.items.reduce(
        (total, item) => total + (item.price * item.quantity),
        0
      );
    },
    
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.id === id);
      
      if (item) {
        item.quantity = Math.max(1, quantity);
        
        // Update totals
        state.count = state.items.reduce((total, item) => total + item.quantity, 0);
        state.total = state.items.reduce(
          (total, item) => total + (item.price * item.quantity),
          0
        );
      }
    },
    
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.count = 0;
      state.error = null;
    },
    
    setCartLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    setCartError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    // For loading cart from localStorage or API
    setCart: (state, action) => {
      state.items = action.payload.items || [];
      state.total = action.payload.total || 0;
      state.count = action.payload.count || 0;
      state.loading = false;
      state.error = null;
    }
  }
});

// Export actions
export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setCartLoading,
  setCartError,
  setCart
} = cartSlice.actions;

// Selectors
export const selectCartItems = state => state.cart.items;
export const selectCartTotal = state => state.cart.total;
export const selectCartCount = state => state.cart.count;
export const selectCartLoading = state => state.cart.loading;
export const selectCartError = state => state.cart.error;

export default cartSlice.reducer;
