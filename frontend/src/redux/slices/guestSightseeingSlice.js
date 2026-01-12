import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const getGuestSightseeingById = createAsyncThunk(
  'guestSightseeings/getById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/guest-sightseeing/${id}`);
      
      // Handle different response formats
      const sightseeingData = response.data.data || response.data;
      
      if (!sightseeingData) {
        throw new Error('No sightseeing data received');
      }
      
      return sightseeingData;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch sightseeing');
    }
  }
);

export const getGuestSightseeingByPath = createAsyncThunk(
  'guestSightseeings/getByPath',
  async ({ country, city, slug }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/guest-sightseeing/by-path/${encodeURIComponent(country)}/${encodeURIComponent(city)}/${encodeURIComponent(slug)}`
      );

      const sightseeingData = response.data.data || response.data;

      if (!sightseeingData) {
        throw new Error('No sightseeing data received');
      }

      return sightseeingData;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch sightseeing');
    }
  }
);

export const fetchGuestSightseeings = createAsyncThunk(
  'guestSightseeings/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      // Set default query params with high limit to get all records
      const queryParams = {
        ...params,
        limit: params.limit || 1000,  // Default to 1000 if not specified
        isActive: true
      };
      
      // If excludeId is provided, add it to the query params
      if (params.excludeId) {
        queryParams.excludeId = params.excludeId;
      }
      
      const response = await api.get('/guest-sightseeing', { params: queryParams });
      
      // The backend now returns a consistent response format
      const { data = [], count = 0, page = 1, pages = 1, total = 0 } = response.data;
      
      return {
        data: Array.isArray(data) ? data : [],
        count: count || 0,
        total: total || count || 0,
        page: parseInt(page, 10000) || 1,
        pages: parseInt(pages, 10000) || 1
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch guest sightseeings');
    }
  }
);

export const createGuestSightseeing = createAsyncThunk(
  'guestSightseeings/create',
  async (sightseeingData, { rejectWithValue }) => {
    try {
      const config = {};
      
      // If data is FormData, we don't set Content-Type header
      // Let the browser set it with the correct boundary
      if (!(sightseeingData instanceof FormData)) {
        config.headers = {
          'Content-Type': 'application/json'
        };
      }
      
      const response = await api.post('/guest-sightseeing', sightseeingData, config);
      return response.data;
    } catch (err) {
      console.error('Error creating guest sightseeing:', err);
      return rejectWithValue(err.response?.data?.message || 'Failed to create guest sightseeing');
    }
  }
);

export const updateGuestSightseeing = createAsyncThunk(
  'guestSightseeings/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const config = {};
      
      // If data is FormData, we don't set Content-Type header
      // Let the browser set it with the correct boundary
      if (!(data instanceof FormData)) {
        config.headers = {
          'Content-Type': 'application/json'
        };
      }
      
      const response = await api.put(`/guest-sightseeing/${id}`, data, config);
      return response.data;
    } catch (err) {
      console.error('Error updating guest sightseeing:', err);
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

    // Handle getGuestSightseeingByPath
    .addCase(getGuestSightseeingByPath.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.currentSightseeing = null;
    })
    .addCase(getGuestSightseeingByPath.fulfilled, (state, action) => {
      state.loading = false;
      state.currentSightseeing = action.payload;
    })
    .addCase(getGuestSightseeingByPath.rejected, (state, action) => {
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
