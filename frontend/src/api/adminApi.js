import axiosInstance from './axiosInstance';

export const adminApi = {
  getAnalytics: () => axiosInstance.get('/admin/dashboard/analytics'),
  
  getUsers: () => axiosInstance.get('/admin/users'),
  toggleUserStatus: (userId) => axiosInstance.post(`/admin/users/${userId}/toggle-status`),
  deleteUser: (userId) => axiosInstance.delete(`/admin/users/${userId}`),
  
  getRecipes: () => axiosInstance.get('/admin/recipes'),
  deleteRecipe: (recipeId) => axiosInstance.delete(`/admin/recipes/${recipeId}`),
  
  getSubmissions: () => axiosInstance.get('/admin/submissions'),
  approveSubmission: (recipeId) => axiosInstance.post(`/admin/recipes/${recipeId}/approve`),
  rejectSubmission: (recipeId) => axiosInstance.post(`/admin/recipes/${recipeId}/reject`),
  getNotifications: () => axiosInstance.get('/admin/notifications'),
};
