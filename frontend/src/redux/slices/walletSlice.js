import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks for wallet operations
export const fetchWalletDetails = createAsyncThunk(
  'wallet/fetchWalletDetails',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/wallets/details');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch wallet details' });
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'wallet/fetchTransactions',
  async ({ page = 1, limit = 10, filters = {} }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters
      }).toString();
      
      const response = await axios.get(`/api/wallets/transactions?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch transactions' });
    }
  }
);

export const addFunds = createAsyncThunk(
  'wallet/addFunds',
  async (fundData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/wallets/add-funds', fundData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to add funds' });
    }
  }
);

export const withdrawFunds = createAsyncThunk(
  'wallet/withdrawFunds',
  async (withdrawData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/wallets/withdraw-funds', withdrawData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to withdraw funds' });
    }
  }
);

// Initial state
const initialState = {
  wallet: {
    balance: 0,
    creditLimit: 0,
    availableCredit: 0,
    pendingAmount: 0
  },
  transactions: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },
  filters: {
    type: '',
    status: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  loading: {
    wallet: false,
    transactions: false,
    addFunds: false,
    withdrawFunds: false
  },
  error: {
    wallet: null,
    transactions: null,
    addFunds: null,
    withdrawFunds: null
  }
};

// Wallet slice
const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearErrors: (state) => {
      state.error = initialState.error;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch wallet details
      .addCase(fetchWalletDetails.pending, (state) => {
        state.loading.wallet = true;
        state.error.wallet = null;
      })
      .addCase(fetchWalletDetails.fulfilled, (state, action) => {
        state.loading.wallet = false;
        state.wallet = action.payload.wallet;
      })
      .addCase(fetchWalletDetails.rejected, (state, action) => {
        state.loading.wallet = false;
        state.error.wallet = action.payload?.message || 'Failed to fetch wallet details';
      })
      
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading.transactions = true;
        state.error.transactions = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading.transactions = false;
        state.transactions = action.payload.transactions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading.transactions = false;
        state.error.transactions = action.payload?.message || 'Failed to fetch transactions';
      })
      
      // Add funds
      .addCase(addFunds.pending, (state) => {
        state.loading.addFunds = true;
        state.error.addFunds = null;
      })
      .addCase(addFunds.fulfilled, (state, action) => {
        state.loading.addFunds = false;
        // Update wallet balance if returned in response
        if (action.payload.wallet) {
          state.wallet = action.payload.wallet;
        }
        // Add new transaction to the list if returned
        if (action.payload.transaction) {
          state.transactions = [action.payload.transaction, ...state.transactions];
        }
      })
      .addCase(addFunds.rejected, (state, action) => {
        state.loading.addFunds = false;
        state.error.addFunds = action.payload?.message || 'Failed to add funds';
      })
      
      // Withdraw funds
      .addCase(withdrawFunds.pending, (state) => {
        state.loading.withdrawFunds = true;
        state.error.withdrawFunds = null;
      })
      .addCase(withdrawFunds.fulfilled, (state, action) => {
        state.loading.withdrawFunds = false;
        // Update wallet balance if returned in response
        if (action.payload.wallet) {
          state.wallet = action.payload.wallet;
        }
        // Add new transaction to the list if returned
        if (action.payload.transaction) {
          state.transactions = [action.payload.transaction, ...state.transactions];
        }
      })
      .addCase(withdrawFunds.rejected, (state, action) => {
        state.loading.withdrawFunds = false;
        state.error.withdrawFunds = action.payload?.message || 'Failed to withdraw funds';
      });
  }
});

export const { setFilters, resetFilters, clearErrors } = walletSlice.actions;

export default walletSlice.reducer;
