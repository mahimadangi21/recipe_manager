import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

const ACCESS_TOKEN_KEY = 'recipe_manager_access_token';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: true,

  setToken: (token, role) => {
    console.log('Setting token and role:', { role });
    if (token) {
      localStorage.setItem('token', token);
      if (role) localStorage.setItem('role', role);
    } else {
      localStorage.removeItem('token');
      if (localStorage.getItem('role') === 'user') {
        localStorage.removeItem('role');
      }
    }
    set({ accessToken: token, isAuthenticated: !!token });
  },
  
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await axiosInstance.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      console.log('Raw Login Response:', response);
      get().setToken(response.token, response.user.role);
      const userData = await get().loadUser();
      return { ...response, user: userData };
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (userData) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post('/auth/signup', userData);
      return response.data;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch {
      // Ignore
    }
    localStorage.removeItem('token');
    if (localStorage.getItem('role') === 'user') {
      localStorage.removeItem('role');
    }
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      let token = get().accessToken;

      if (!token) {
        // Try to restore session from refresh cookie.
        const result = await axiosInstance.post('/auth/refresh');
        token = result.data.access_token;
        get().setToken(token);
      }

      const result = await axiosInstance.get('/auth/me');
      set({ user: result.data });
      return result.data;
    } catch {
      localStorage.removeItem('token');
      if (localStorage.getItem('role') === 'user') {
        localStorage.removeItem('role');
      }
      set({ user: null, accessToken: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (userData) => {
    const result = await axiosInstance.put('/auth/me', userData);
    set({ user: result.data });
    return result.data;
  }
}));
