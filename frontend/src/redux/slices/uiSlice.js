import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: false,
  activeModal: null,
  modalData: null,
  modalOpen: false,
  loading: false,
  notifications: []
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    openSidebar: (state) => {
      state.sidebarOpen = true;
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },
    openModal: (state, action) => {
      state.activeModal = action.payload.modalType;
      state.modalData = action.payload.modalData || null;
      state.modalOpen = true;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
      state.modalOpen = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    }
  }
});

export const {
  toggleSidebar,
  openSidebar,
  closeSidebar,
  openModal,
  closeModal,
  setLoading,
  addNotification,
  removeNotification,
  clearNotifications
} = uiSlice.actions;

export default uiSlice.reducer;
