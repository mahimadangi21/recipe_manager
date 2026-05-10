import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) return 'http://localhost:8002/api/v1';

  const { origin, pathname } = window.location;
  
  // If we're on Hugging Face Spaces, the pathname will be like /spaces/user/repo/
  // On Render/Vercel/Cloud Run, it's usually just / or /recipes
  if (pathname.includes('/spaces/')) {
    const parts = pathname.split('/');
    // The space root is usually parts[0..3] -> /spaces/user/repo/
    const spaceRoot = parts.slice(0, 4).join('/') + '/';
    return `${origin}${spaceRoot}api/v1`;
  }

  // Root deployment (Render, Fly.io, etc.)
  return `${origin}/api/v1`;
};

export const API_URL = getBaseUrl();
export const BASE_URL = API_URL.replace(/\/api\/v1\/?$/, '');

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
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
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    
    // If the response follows our standard structure, extract the actual data.
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      if (response.data.success) {
        return response.data; // We'll return the whole response.data so we can access .data and .message
      }
      return Promise.reject(response.data);
    }
    return response.data;
  },
  async (error) => {
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      fullError: error
    });

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
    
    if (error.response) {
      console.error("API Error Response Data:", error.response.data);
      console.error("API Error Status:", error.response.status);
      console.error("API Error Headers:", error.response.headers);
    } else if (error.request) {
      console.error("API Error Request (No Response):", error.request);
    } else {
      console.error("API Error Message:", error.message);
    }
    
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
