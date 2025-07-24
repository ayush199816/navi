import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks for lead operations
export const fetchLeads = createAsyncThunk(
  'leads/fetchLeads',
  async ({ page = 1, limit = 10, ...filters }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters
      }).toString();
      
      const response = await axios.get(`/api/leads?${queryParams}`);
      // The backend returns { success: true, data: leads, pagination: {...} }
      return {
        leads: response.data.data || [],
        pagination: response.data.pagination || { page, limit }
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch leads' });
    }
  }
);

export const fetchLeadById = createAsyncThunk(
  'leads/fetchLeadById',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/leads/${leadId}`);
      // The backend returns { success: true, data: lead }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch lead details' });
    }
  }
);

export const createLead = createAsyncThunk(
  'leads/createLead',
  async (leadData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/leads', leadData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to create lead' });
    }
  }
);

export const updateLead = createAsyncThunk(
  'leads/updateLead',
  async ({ leadId, leadData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/leads/${leadId}`, leadData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update lead' });
    }
  }
);

export const deleteLead = createAsyncThunk(
  'leads/deleteLead',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/api/leads/${leadId}`);
      return { leadId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to delete lead' });
    }
  }
);

export const assignLead = createAsyncThunk(
  'leads/assignLead',
  async ({ leadId, agentId }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/leads/${leadId}/assign`, { agentId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to assign lead' });
    }
  }
);

export const updateLeadStatus = createAsyncThunk(
  'leads/updateLeadStatus',
  async ({ leadId, status, notes }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/leads/${leadId}/status`, { status, notes });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to update lead status' });
    }
  }
);

// Initial state
const initialState = {
  leads: [],
  currentLead: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },
  filters: {
    status: '',
    source: '',
    assignedTo: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  loading: {
    leads: false,
    leadDetails: false,
    createLead: false,
    updateLead: false,
    deleteLead: false,
    assignLead: false,
    updateStatus: false
  },
  error: {
    leads: null,
    leadDetails: null,
    createLead: null,
    updateLead: null,
    deleteLead: null,
    assignLead: null,
    updateStatus: null
  }
};

// Lead slice
const leadSlice = createSlice({
  name: 'leads',
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
    },
    clearCurrentLead: (state) => {
      state.currentLead = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch leads
      .addCase(fetchLeads.pending, (state) => {
        state.loading.leads = true;
        state.error.leads = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading.leads = false;
        state.leads = action.payload.leads;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading.leads = false;
        state.error.leads = action.payload?.message || 'Failed to fetch leads';
      })
      
      // Fetch lead by ID
      .addCase(fetchLeadById.pending, (state) => {
        state.loading.leadDetails = true;
        state.error.leadDetails = null;
      })
      .addCase(fetchLeadById.fulfilled, (state, action) => {
        state.loading.leadDetails = false;
        state.currentLead = action.payload.lead;
      })
      .addCase(fetchLeadById.rejected, (state, action) => {
        state.loading.leadDetails = false;
        state.error.leadDetails = action.payload?.message || 'Failed to fetch lead details';
      })
      
      // Create lead
      .addCase(createLead.pending, (state) => {
        state.loading.createLead = true;
        state.error.createLead = null;
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.loading.createLead = false;
        state.leads = [action.payload.lead, ...state.leads];
      })
      .addCase(createLead.rejected, (state, action) => {
        state.loading.createLead = false;
        state.error.createLead = action.payload?.message || 'Failed to create lead';
      })
      
      // Update lead
      .addCase(updateLead.pending, (state) => {
        state.loading.updateLead = true;
        state.error.updateLead = null;
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        state.loading.updateLead = false;
        const updatedLead = action.payload.lead;
        state.leads = state.leads.map(lead => 
          lead._id === updatedLead._id ? updatedLead : lead
        );
        if (state.currentLead && state.currentLead._id === updatedLead._id) {
          state.currentLead = updatedLead;
        }
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.loading.updateLead = false;
        state.error.updateLead = action.payload?.message || 'Failed to update lead';
      })
      
      // Delete lead
      .addCase(deleteLead.pending, (state) => {
        state.loading.deleteLead = true;
        state.error.deleteLead = null;
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.loading.deleteLead = false;
        state.leads = state.leads.filter(lead => lead._id !== action.payload.leadId);
        if (state.currentLead && state.currentLead._id === action.payload.leadId) {
          state.currentLead = null;
        }
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.loading.deleteLead = false;
        state.error.deleteLead = action.payload?.message || 'Failed to delete lead';
      })
      
      // Assign lead
      .addCase(assignLead.pending, (state) => {
        state.loading.assignLead = true;
        state.error.assignLead = null;
      })
      .addCase(assignLead.fulfilled, (state, action) => {
        state.loading.assignLead = false;
        const updatedLead = action.payload.lead;
        state.leads = state.leads.map(lead => 
          lead._id === updatedLead._id ? updatedLead : lead
        );
        if (state.currentLead && state.currentLead._id === updatedLead._id) {
          state.currentLead = updatedLead;
        }
      })
      .addCase(assignLead.rejected, (state, action) => {
        state.loading.assignLead = false;
        state.error.assignLead = action.payload?.message || 'Failed to assign lead';
      })
      
      // Update lead status
      .addCase(updateLeadStatus.pending, (state) => {
        state.loading.updateStatus = true;
        state.error.updateStatus = null;
      })
      .addCase(updateLeadStatus.fulfilled, (state, action) => {
        state.loading.updateStatus = false;
        const updatedLead = action.payload.lead;
        state.leads = state.leads.map(lead => 
          lead._id === updatedLead._id ? updatedLead : lead
        );
        if (state.currentLead && state.currentLead._id === updatedLead._id) {
          state.currentLead = updatedLead;
        }
      })
      .addCase(updateLeadStatus.rejected, (state, action) => {
        state.loading.updateStatus = false;
        state.error.updateStatus = action.payload?.message || 'Failed to update lead status';
      })
  }
});

export const { setFilters, resetFilters, clearErrors, clearCurrentLead } = leadSlice.actions;

export default leadSlice.reducer;
