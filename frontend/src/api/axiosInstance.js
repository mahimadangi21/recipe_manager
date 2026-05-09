import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002/api/v1';
export const BASE_URL = API_URL.replace(/\/api\/v1\/?$/, '');

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const userToken = localStorage.getItem('token');
  const adminToken = localStorage.getItem('adminToken');
  
  // Choose token based on route and role
  const isAdminRoute = config.url.includes('/admin/');
  const storedRole = localStorage.getItem('role');
  
  let token;
  if (isAdminRoute || storedRole === 'admin') {
    token = adminToken || userToken;
  } else {
    token = userToken || adminToken;
  }
  
  console.log(`API Request [${config.method.toUpperCase()}] ${config.url}`, { 
    isAdminRoute, 
    storedRole,
    hasAdminToken: !!adminToken, 
    hasUserToken: !!userToken,
    selected: (isAdminRoute || storedRole === 'admin') ? 'admin' : 'user'
  });

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    // If the response follows our standard structure, extract the actual data.
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success) {
        return response.data; // We'll return the whole response.data so we can access .data and .message
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout') ||
      requestUrl.includes('/admin/login') ||
      requestUrl.includes('/admin/logout');
    const isAdminRequest = requestUrl.includes('/admin/');
    
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthRequest &&
      !isAdminRequest // Don't try to refresh user session for admin routes
    ) {
      originalRequest._retry = true;
      try {
        const response = await axiosInstance.post('/auth/refresh');
        const token = response.data.access_token;
        useAuthStore.getState().setToken(token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      } catch (err) {
        useAuthStore.getState().logout();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
