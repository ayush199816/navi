import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

// Get all bookings (admin/operations)
export const getBookings = createAsyncThunk(
  'bookings/getBookings',
  async ({ page = 1, limit = 10, status, sortBy }, { rejectWithValue }) => {
    try {
      let url = `/api/bookings?page=${page}&limit=${limit}`;
      
      if (status) {
        url += `&status=${status}`;
      }
      
      if (sortBy) {
        url += `&sortBy=${sortBy}`;
      }
      
      const res = await axios.get(url);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

// Get agent's bookings
export const getMyBookings = createAsyncThunk(
  'bookings/getMyBookings',
  async ({ page = 1, limit = 10, status, sortBy }, { rejectWithValue }) => {
    try {
      let url = `/api/bookings/my-bookings?page=${page}&limit=${limit}`;
      
      if (status) {
        url += `&status=${status}`;
      }
      
      if (sortBy) {
        url += `&sortBy=${sortBy}`;
      }
      
      const res = await axios.get(url);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

// Get single booking
export const getBookingById = createAsyncThunk(
  'bookings/getBookingById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/bookings/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch booking');
    }
  }
);

// Create booking
export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/bookings', bookingData);
      toast.success('Booking created successfully!');
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create booking');
      return rejectWithValue(err.response?.data?.message || 'Failed to create booking');
    }
  }
);

// Update booking status
export const updateBookingStatus = createAsyncThunk(
  'bookings/updateBookingStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      console.log(`Updating booking ${id} status to ${status}`);
      console.log('Request payload:', { status });
      
      // Log the exact URL and payload being sent
      const url = `/api/bookings/${id}/status`;
      console.log('Request URL:', url);
      
      // Make the API call with explicit content type
      const res = await axios.put(url, 
        { status }, 
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      console.log('Response received:', res.data);
      toast.success(`Booking status updated to ${status}!`);
      return res.data;
    } catch (err) {
      console.error('Error updating booking status:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      toast.error(err.response?.data?.message || 'Failed to update booking status');
      return rejectWithValue(err.response?.data?.message || 'Failed to update booking status');
    }
  }
);

// Generate invoice
export const generateInvoice = createAsyncThunk(
  'bookings/generateInvoice',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/bookings/${id}/invoice`);
      toast.success('Invoice generated successfully!');
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
      return rejectWithValue(err.response?.data?.message || 'Failed to generate invoice');
    }
  }
);

// Cancel booking
export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/bookings/${id}/cancel`, { reason });
      toast.info('Booking cancelled successfully');
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
      return rejectWithValue(err.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

// Update booking details
export const updateBooking = createAsyncThunk(
  'bookings/updateBooking',
  async ({ id, bookingData }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/bookings/${id}`, bookingData);
      toast.success('Booking updated successfully!');
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update booking');
      return rejectWithValue(err.response?.data?.message || 'Failed to update booking');
    }
  }
);

const initialState = {
  bookings: [],
  booking: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  }
};

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearBooking: (state) => {
      state.booking = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get all bookings
      .addCase(getBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(getBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          pages: action.payload.pages
        };
      })
      .addCase(getBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get agent's bookings
      .addCase(getMyBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        // Normalize booking data to ensure consistent field naming
        state.bookings = action.payload.data.map(booking => {
          // Ensure pricing data is properly structured
          const pricing = booking.pricing || {};
          const totalAmount = booking.totalAmount || pricing.totalAmount || 0;
          
          return {
            ...booking,
            // Ensure bookingStatus is always available
            bookingStatus: booking.bookingStatus || booking.status,
            // Ensure status is always available for backward compatibility
            status: booking.status || booking.bookingStatus,
            // Ensure totalAmount is always available at the root level
            totalAmount: totalAmount,
            // Ensure pricing object exists and has all required fields
            pricing: {
              ...pricing,
              totalAmount: pricing.totalAmount || totalAmount,
              packagePrice: pricing.packagePrice || 0,
              agentPrice: pricing.agentPrice || 0,
              discountAmount: pricing.discountAmount || 0,
              currency: pricing.currency || 'INR'
            }
          };
        });
        
        state.pagination = {
          page: action.payload.pagination?.page || 1,
          limit: action.payload.pagination?.limit || 10,
          total: action.payload.total || 0,
          pages: action.payload.pagination?.totalPages || 1
        };
        
        console.log('Normalized bookings with pricing:', state.bookings);
      })
      .addCase(getMyBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get single booking
      .addCase(getBookingById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.booking = action.payload.data;
      })
      .addCase(getBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings.unshift(action.payload.data);
        state.booking = action.payload.data;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update booking status
      .addCase(updateBookingStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = state.bookings.map(booking => 
          booking._id === action.payload.data._id ? action.payload.data : booking
        );
        state.booking = action.payload.data;
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Generate invoice
      .addCase(generateInvoice.pending, (state) => {
        state.loading = true;
      })
      .addCase(generateInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = state.bookings.map(booking => 
          booking._id === action.payload.data._id ? action.payload.data : booking
        );
        state.booking = action.payload.data;
      })
      .addCase(generateInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Cancel booking
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = state.bookings.map(booking => 
          booking._id === action.payload.data._id ? action.payload.data : booking
        );
        state.booking = action.payload.data;
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update booking details
      .addCase(updateBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = state.bookings.map(booking => 
          booking._id === action.payload.data._id ? action.payload.data : booking
        );
        state.booking = action.payload.data;
      })
      .addCase(updateBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearBooking, clearError } = bookingSlice.actions;
export default bookingSlice.reducer;
