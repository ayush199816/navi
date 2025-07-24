import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const getGuestSightseeingById = createAsyncThunk(
  'guestSightseeings/getById',
  async (id, { rejectWithValue }) => {
    try {
      console.log('Fetching sightseeing with ID:', id);
      const response = await api.get(`/guest-sightseeing/${id}`);
      console.log('API Response:', response.data);
      
      // Handle different response formats
      const sightseeingData = response.data.data || response.data;
      
      if (!sightseeingData) {
        throw new Error('No sightseeing data received');
      }
      
      return sightseeingData;
    } catch (error) {
      console.error('Error in getGuestSightseeingById:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch sightseeing');
    }
  }
);

export const fetchGuestSightseeings = createAsyncThunk(
  'guestSightseeings/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      // Extract excludeId from params if it exists
      const { excludeId, ...queryParams } = params;
      
      // If excludeId is provided, add it to the query params
      if (excludeId) {
        queryParams.excludeId = excludeId;
      }
      
      console.log('Fetching guest sightseeings with params:', queryParams);
      const response = await api.get('/guest-sightseeing', { params: queryParams });
      console.log('API Response:', response.data);
      
      // The backend now returns a consistent response format
      const { data = [], count = 0, page = 1, pages = 1, total = 0 } = response.data;
      
      console.log('Processed data:', { 
        data: Array.isArray(data) ? data : [], 
        count: count || 0, 
        total: total || count || 0,
        page: parseInt(page, 10) || 1, 
        pages: parseInt(pages, 10) || 1 
      });
      
      return {
        data: Array.isArray(data) ? data : [],
        count: count || 0,
        total: total || count || 0,
        page: parseInt(page, 10) || 1,
        pages: parseInt(pages, 10) || 1
      };
    } catch (err) {
      console.error('Error fetching guest sightseeings:', err);
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch guest sightseeings');
    }
  }
);

export const createGuestSightseeing = createAsyncThunk(
  'guestSightseeings/create',
  async (sightseeingData, { rejectWithValue }) => {
    try {
      const response = await api.post('/guest-sightseeing', sightseeingData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create guest sightseeing');
    }
  }
);

export const updateGuestSightseeing = createAsyncThunk(
  'guestSightseeings/update',
  async ({ id, ...updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/guest-sightseeing/${id}`, updates);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update guest sightseeing');
    }
  }
);

export const deleteGuestSightseeing = createAsyncThunk(
  'guestSightseeings/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/guest-sightseeing/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete guest sightseeing');
    }
  }
);

const guestSightseeingSlice = createSlice({
  name: 'guestSightseeings',
  initialState: {
    sightseeings: [],
    currentSightseeing: null,
    loading: false,
    error: null,
    count: 0,
    total: 0,
    page: 1,
    pages: 1
  },
  reducers: {
    clearGuestSightseeingState: (state) => {
      state.sightseeings = [];
      state.currentSightseeing = null;
      state.loading = false;
      state.error = null;
    },
    clearCurrentSightseeing: (state) => {
      state.currentSightseeing = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all sightseeings
      .addCase(fetchGuestSightseeings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGuestSightseeings.fulfilled, (state, action) => {
        state.loading = false;
        state.sightseeings = action.payload.data || [];
        state.count = action.payload.count || 0;
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.pages = action.payload.pages || 1;
      })
      .addCase(fetchGuestSightseeings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch guest sightseeings';
        console.error('Error in fetchGuestSightseeings:', state.error);
      })

    // Handle getGuestSightseeingById
    .addCase(getGuestSightseeingById.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.currentSightseeing = null;
    })
    .addCase(getGuestSightseeingById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentSightseeing = action.payload;
    })
    .addCase(getGuestSightseeingById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.currentSightseeing = null;
    })

    // Create
    builder.addCase(createGuestSightseeing.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    });
    builder.addCase(createGuestSightseeing.fulfilled, (state, action) => {
      state.loading = false;
      state.sightseeings.unshift(action.payload.data);
      state.success = true;
    });
    builder.addCase(createGuestSightseeing.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.success = false;
    });

    // Update
    builder.addCase(updateGuestSightseeing.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    });
    builder.addCase(updateGuestSightseeing.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.sightseeings.findIndex(s => s._id === action.payload.data._id);
      if (index !== -1) {
        state.sightseeings[index] = action.payload.data;
      }
      state.currentSightseeing = action.payload.data;
      state.success = true;
    });
    builder.addCase(updateGuestSightseeing.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.success = false;
    });

    // Delete
    builder.addCase(deleteGuestSightseeing.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.success = false;
    });
    builder.addCase(deleteGuestSightseeing.fulfilled, (state, action) => {
      state.loading = false;
      state.sightseeings = state.sightseeings.filter(s => s._id !== action.payload);
      state.success = true;
    });
    builder.addCase(deleteGuestSightseeing.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.success = false;
    });
  }
});

export const { clearGuestSightseeingState, clearCurrentSightseeing } = guestSightseeingSlice.actions;

export default guestSightseeingSlice.reducer;
