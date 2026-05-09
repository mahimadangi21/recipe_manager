import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

export const useAdminStore = create((set, get) => ({
  admin: null,
  isAuthenticated: !!localStorage.getItem('adminToken'),
  isLoading: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post('/admin/login', credentials);
      console.log('Admin Login Response:', response);
      if (response.success) {
        localStorage.setItem('adminToken', response.token);
        localStorage.setItem('role', response.user.role);
        set({ admin: response.user, isAuthenticated: true });
        return response;
      }
    } finally {
      set({ isLoading: false });
    }
  },

  loadAdmin: async () => {
    if (!localStorage.getItem('adminToken')) return;
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get('/admin/profile');
      if (response.success) {
        set({ admin: response.data, isAuthenticated: true });
      } else {
        get().logout();
      }
    } catch {
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    console.log('Logging out admin...');
    try {
      await axiosInstance.post('/admin/logout');
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem('adminToken');
    if (localStorage.getItem('role') === 'admin') {
      localStorage.removeItem('role');
    }
    set({ admin: null, isAuthenticated: false });
  }
}));
