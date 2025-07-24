import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

// Get all quotes (admin/operations)
export const getQuotes = createAsyncThunk(
  'quotes/getQuotes',
  async ({ page = 1, limit = 10, status, sortBy, hasLead }, { rejectWithValue }) => {
    try {
      let url = `/api/quotes?page=${page}&limit=${limit}`;
      
      if (status) {
        url += `&status=${status}`;
      }
      
      if (sortBy) {
        url += `&sortBy=${sortBy}`;
      }
      
      if (hasLead !== undefined) {
        url += `&hasLead=${hasLead}`;
      }
      
      const res = await axios.get(url);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch quotes');
    }
  }
);

// Get agent's quotes
export const getMyQuotes = createAsyncThunk(
  'quotes/getMyQuotes',
  async ({ page = 1, limit = 10, status, sortBy }, { rejectWithValue }) => {
    try {
      let url = `/api/quotes/my-quotes?page=${page}&limit=${limit}`;
      
      if (status) {
        url += `&status=${status}`;
      }
      
      if (sortBy) {
        url += `&sortBy=${sortBy}`;
      }
      
      const res = await axios.get(url);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch quotes');
    }
  }
);

// Get single quote
export const getQuoteById = createAsyncThunk(
  'quotes/getQuoteById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/quotes/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch quote');
    }
  }
);

// Create quote
export const createQuote = createAsyncThunk(
  'quotes/createQuote',
  async (quoteData, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/quotes', quoteData);
      toast.success('Quote created successfully!');
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create quote');
      return rejectWithValue(err.response?.data?.message || 'Failed to create quote');
    }
  }
);

// Update quote (operations)
export const updateQuote = createAsyncThunk(
  'quotes/updateQuote',
  async ({ id, quoteData }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/quotes/${id}`, quoteData);
      toast.success('Quote updated successfully!');
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update quote');
      return rejectWithValue(err.response?.data?.message || 'Failed to update quote');
    }
  }
);

// Respond to quote (agent)
export const respondToQuote = createAsyncThunk(
  'quotes/respondToQuote',
  async ({ id, response }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/quotes/${id}/response`, { response });
      
      if (response === 'accepted') {
        toast.success('Quote accepted successfully!');
      } else {
        toast.info('Quote rejected');
      }
      
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond to quote');
      return rejectWithValue(err.response?.data?.message || 'Failed to respond to quote');
    }
  }
);

// Delete quote
export const deleteQuote = createAsyncThunk(
  'quotes/deleteQuote',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/quotes/${id}`);
      toast.success('Quote deleted successfully!');
      return id;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete quote');
      return rejectWithValue(err.response?.data?.message || 'Failed to delete quote');
    }
  }
);

const initialState = {
  quotes: [],
  quote: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  }
};

const quoteSlice = createSlice({
  name: 'quotes',
  initialState,
  reducers: {
    clearQuote: (state) => {
      state.quote = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get all quotes
      .addCase(getQuotes.pending, (state) => {
        state.loading = true;
      })
      .addCase(getQuotes.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          pages: action.payload.pages
        };
      })
      .addCase(getQuotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get agent's quotes
      .addCase(getMyQuotes.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyQuotes.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          pages: action.payload.pages
        };
      })
      .addCase(getMyQuotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get single quote
      .addCase(getQuoteById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getQuoteById.fulfilled, (state, action) => {
        state.loading = false;
        state.quote = action.payload.data;
      })
      .addCase(getQuoteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create quote
      .addCase(createQuote.pending, (state) => {
        state.loading = true;
      })
      .addCase(createQuote.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes.unshift(action.payload.data);
      })
      .addCase(createQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update quote
      .addCase(updateQuote.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateQuote.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes = state.quotes.map(quote => 
          quote._id === action.payload.data._id ? action.payload.data : quote
        );
        state.quote = action.payload.data;
      })
      .addCase(updateQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Respond to quote
      .addCase(respondToQuote.pending, (state) => {
        state.loading = true;
      })
      .addCase(respondToQuote.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes = state.quotes.map(quote => 
          quote._id === action.payload.data._id ? action.payload.data : quote
        );
        state.quote = action.payload.data;
      })
      .addCase(respondToQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete quote
      .addCase(deleteQuote.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteQuote.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes = state.quotes.filter(quote => quote._id !== action.payload);
        if (state.quote && state.quote._id === action.payload) {
          state.quote = null;
        }
      })
      .addCase(deleteQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearQuote, clearError } = quoteSlice.actions;
export default quoteSlice.reducer;
