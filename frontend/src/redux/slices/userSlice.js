import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/users');
      return res.data.data;
    } catch (err) {
      console.error('Error in fetchUsers:', err);
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const updateUserApproval = createAsyncThunk(
  'users/updateApproval',
  async ({ userId, isApproved }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/users/${userId}/approval`, { isApproved });
      return res.data.data;
    } catch (err) {
      console.error('Error in updateUserApproval:', err);
      return rejectWithValue(err.response?.data?.message || 'Failed to update user approval');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/create',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('Creating user with data:', userData);
      const res = await api.post('/users', userData);
      console.log('User created successfully:', res.data);
      return res.data.data;
    } catch (err) {
      console.error('Error in createUser:', {
        message: err.message,
        response: {
          data: err.response?.data,
          status: err.response?.status,
        },
      });
      return rejectWithValue(
        err.response?.data?.message || 'Failed to create user. Please try again.'
      );
    }
  }
);

export const getPendingAgentApprovals = createAsyncThunk(
  'users/getPendingAgentApprovals',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching pending approvals...');
      const res = await api.get('/users/pending-approvals');
      console.log('Pending approvals response:', res.data);
      return res.data.data || [];
    } catch (err) {
      console.error('Error in getPendingAgentApprovals:', {
        message: err.message,
        response: {
          data: err.response?.data,
          status: err.response?.status,
          headers: err.response?.headers,
        },
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers,
        },
      });
      
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error?.message || 
                         err.message || 
                         'Failed to fetch pending approvals';
      
      return rejectWithValue(errorMessage);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    pendingAgentApprovals: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    // Fetch users
    builder.addCase(fetchUsers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.users = action.payload;
    });
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to fetch users';
    });

    // Create user
    builder.addCase(createUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createUser.fulfilled, (state, action) => {
      state.loading = false;
      state.users.push(action.payload);
    });
    builder.addCase(createUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Update user approval
    builder.addCase(updateUserApproval.fulfilled, (state, action) => {
      const updatedUser = action.payload;
      const index = state.users.findIndex(user => user._id === updatedUser._id);
      if (index !== -1) {
        state.users[index] = updatedUser;
      }
    });

    // Get pending agent approvals
    builder.addCase(getPendingAgentApprovals.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getPendingAgentApprovals.fulfilled, (state, action) => {
      state.loading = false;
      state.pendingAgentApprovals = action.payload;
    });
    builder.addCase(getPendingAgentApprovals.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to fetch pending approvals';
    });
  }
});

export default userSlice.reducer;
