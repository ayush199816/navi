import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axiosConfig';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';

// Helper function to set auth token in headers
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    return decoded.exp < Date.now() / 1000;
  } catch (error) {
    return true;
  }
};

// Load user from token
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem('token');
    
    // Don't reject if there's no token or it's expired, just return null
    if (!token || isTokenExpired(token)) {
      return null;
    }
    
    try {
      setAuthToken(token);
      const res = await axios.get('/api/auth/me');
      return res.data;
    } catch (err) {
      localStorage.removeItem('token');
      // Only return error if it's not a 401 (Unauthorized) error
      if (err.response?.status !== 401) {
        return rejectWithValue(err.response?.data?.message || 'Failed to load user');
      }
      return null;
    }
  }
);

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      // Append user data to form data
      Object.keys(userData).forEach(key => {
        if (key === 'documents') {
          if (userData.documents.gstCertificate) {
            formData.append('gstCertificate', userData.documents.gstCertificate);
          }
          if (userData.documents.udyamCertificate) {
            formData.append('udyamCertificate', userData.documents.udyamCertificate);
          }
        } else {
          formData.append(key, userData[key]);
        }
      });
      
      const res = await axios.post('/api/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Registration successful! Please wait for approval.');
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/auth/login', userData);
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setAuthToken(res.data.token);
        toast.success('Login successful!');
      }
      
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

// Update profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.put('/api/auth/updateprofile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Profile updated successfully');
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
      return rejectWithValue(err.response?.data?.message || 'Failed to update profile');
    }
  }
);

// Admin approve agent
export const approveAgent = createAsyncThunk(
  'auth/approveAgent',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/auth/users/${userId}/approve`);
      toast.success('Agent approved successfully');
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve agent');
      return rejectWithValue(err.response?.data?.message || 'Failed to approve agent');
    }
  }
);

// Admin reject agent
export const rejectAgent = createAsyncThunk(
  'auth/rejectAgent',
  async ({ userId, reason }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/auth/users/${userId}/reject`, { reason });
      toast.success('Agent rejected successfully');
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject agent');
      return rejectWithValue(err.response?.data?.message || 'Failed to reject agent');
    }
  }
);

// Change password
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const res = await axios.put('/api/auth/updatepassword', passwordData);
      toast.success('Password changed successfully!');
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
      return rejectWithValue(err.response?.data?.message || 'Failed to change password');
    }
  }
);

const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  user: null,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      setAuthToken(null);
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
      toast.info('You have been logged out');
    },
    clearError: (state) => {
      state.error = null;
    },
    clearAuthState: (state) => {
      state.loading = false;
      state.error = null;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Load user
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.data || action.payload;
        } else {
          state.isAuthenticated = false;
          state.user = null;
        }
        state.loading = false;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.user = null;
        state.error = action.payload;
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        
        // Handle guest registration success
        if (action.payload.data?.role === 'user' && action.payload.data?.user_type === 'guest') {
          toast.success('Welcome! Please check your email to verify your account.');
          window.location.href = '/login';
        } else {
          // For other roles, use existing success message
          toast.success('Registration successful! Please wait for approval.');
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.loading = false;
        state.user = action.payload.data;
        
        // Show welcome message
        if (action.payload.data) {
          toast.success('Welcome back!');
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.user = null;
        state.error = action.payload;
      })
      
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = {
          ...state.user,
          ...action.payload,
          onboardingCompleted: action.payload.onboardingCompleted || false
        };
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, clearError, clearAuthState } = authSlice.actions;
export default authSlice.reducer;
