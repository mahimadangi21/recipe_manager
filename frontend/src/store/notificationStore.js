import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';
import { toast } from 'react-hot-toast';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get('/notifications/');
      const data = Array.isArray(response) ? response : response.data || [];
      set({ 
        notifications: data, 
        unreadCount: data.filter(n => !n.is_read).length,
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      const updated = get().notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      );
      set({ 
        notifications: updated, 
        unreadCount: updated.filter(n => !n.is_read).length 
      });
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  },

  deleteNotification: async (id) => {
    try {
      await axiosInstance.delete(`/notifications/${id}`);
      const updated = get().notifications.filter(n => n.id !== id);
      set({ 
        notifications: updated, 
        unreadCount: updated.filter(n => !n.is_read).length 
      });
      toast.success('Notification removed');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  },

  clearAll: async () => {
    try {
      await axiosInstance.post('/notifications/clear-all');
      set({ notifications: [], unreadCount: 0 });
      toast.success('Cleared all notifications');
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  }
}));
