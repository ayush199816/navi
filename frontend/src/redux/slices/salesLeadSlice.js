import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const fetchSalesLeads = createAsyncThunk(
  'salesLeads/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/sales-leads', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch sales leads');
    }
  }
);

export const fetchSalesLead = createAsyncThunk(
  'salesLeads/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/sales-leads/${id}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch sales lead');
    }
  }
);

export const createSalesLead = createAsyncThunk(
  'salesLeads/create',
  async (leadData, { rejectWithValue }) => {
    try {
      const response = await api.post('/sales-leads', leadData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create sales lead');
    }
  }
);

export const updateSalesLead = createAsyncThunk(
  'salesLeads/update',
  async ({ id, ...updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/sales-leads/${id}`, updates);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update sales lead');
    }
  }
);

export const deleteSalesLead = createAsyncThunk(
  'salesLeads/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/sales-leads/${id}`);
      return { id };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete sales lead');
    }
  }
);

export const addSalesLeadNote = createAsyncThunk(
  'salesLeads/addNote',
  async ({ id, content }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/sales-leads/${id}`, { notes: content });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add note');
    }
  }
);

const initialState = {
  leads: [],
  currentLead: null,
  loading: false,
  error: null,
  total: 0,
  filters: {
    status: '',
    priority: '',
    assignedTo: '',
    source: ''
  },
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1
  }
};

const salesLeadSlice = createSlice({
  name: 'salesLeads',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page when filters change
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetCurrentLead: (state) => {
      state.currentLead = null;
    }
  },
  extraReducers: (builder) => {
    // Delete lead
    builder.addCase(deleteSalesLead.fulfilled, (state, action) => {
      state.leads = state.leads.filter(lead => lead._id !== action.payload.id);
      state.loading = false;
    });
    
    // Fetch all leads
    builder.addCase(fetchSalesLeads.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSalesLeads.fulfilled, (state, action) => {
      state.loading = false;
      state.leads = action.payload.data || [];
      state.total = action.payload.count || 0;
      state.pagination.totalPages = Math.ceil(
        (action.payload.count || 0) / state.pagination.limit
      );
    });
    builder.addCase(fetchSalesLeads.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch single lead
    builder.addCase(fetchSalesLead.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSalesLead.fulfilled, (state, action) => {
      state.loading = false;
      const leadData = action.payload.data || action.payload; // Handle both response formats
      
      // Ensure we have all required fields with defaults
      state.currentLead = {
        ...leadData,
        assignedTo: leadData.assignedTo || null,
        createdBy: leadData.createdBy || null,
        quote: leadData.quote || null,
        notes: Array.isArray(leadData.notes) ? leadData.notes : [],
        status: leadData.status || 'new',
        priority: leadData.priority || 'medium',
        source: leadData.source || 'website'
      };
      
      // Also update in the leads array if it exists there
      const leadIndex = state.leads.findIndex(lead => lead._id === leadData._id);
      if (leadIndex !== -1) {
        state.leads[leadIndex] = state.currentLead;
      }
    });
    builder.addCase(fetchSalesLead.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to fetch lead details';
    });

    // Create lead
    builder.addCase(createSalesLead.fulfilled, (state, action) => {
      state.leads.unshift(action.payload.data);
      state.total += 1;
    });

    // Update lead
    builder.addCase(updateSalesLead.fulfilled, (state, action) => {
      const updatedLead = action.payload.data;
      
      // Update in leads array
      const index = state.leads.findIndex(lead => lead._id === updatedLead._id);
      if (index !== -1) {
        // Preserve any existing populated fields that might not be in the response
        const existingLead = state.leads[index];
        state.leads[index] = {
          ...existingLead,
          ...updatedLead,
          // Ensure we don't lose populated fields
          assignedTo: updatedLead.assignedTo || existingLead.assignedTo,
          createdBy: updatedLead.createdBy || existingLead.createdBy,
          quote: updatedLead.quote || existingLead.quote
        };
      }
      
      // Update current lead if it's the one being updated
      if (state.currentLead?._id === updatedLead._id) {
        state.currentLead = {
          ...state.currentLead,
          ...updatedLead,
          // Preserve any existing populated fields
          assignedTo: updatedLead.assignedTo || state.currentLead.assignedTo,
          createdBy: updatedLead.createdBy || state.currentLead.createdBy,
          quote: updatedLead.quote || state.currentLead.quote
        };
      }
    });

    // Add note
    builder.addCase(addSalesLeadNote.fulfilled, (state, action) => {
      const updatedLead = action.payload.data || action.payload;
      
      // Update current lead if it's the one being updated
      if (state.currentLead?._id === updatedLead._id) {
        state.currentLead = {
          ...state.currentLead,
          notes: Array.isArray(updatedLead.notes) ? updatedLead.notes : [],
          lastContacted: updatedLead.lastContacted || new Date().toISOString()
        };
      }
      
      // Also update in the leads array
      const leadIndex = state.leads.findIndex(lead => lead._id === updatedLead._id);
      if (leadIndex !== -1) {
        state.leads[leadIndex] = {
          ...state.leads[leadIndex],
          lastContacted: updatedLead.lastContacted || state.leads[leadIndex].lastContacted
        };
      }
    });
  }
});

export const { setFilters, setPagination, resetCurrentLead } = salesLeadSlice.actions;

export default salesLeadSlice.reducer;
