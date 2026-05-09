import axiosInstance from './axiosInstance';

export const adminApi = {
  getAnalytics: () => axiosInstance.get('/admin/dashboard/analytics'),
  
  getUsers: () => axiosInstance.get('/admin/users'),
  toggleUserStatus: (userId) => axiosInstance.post(`/admin/users/${userId}/toggle-status`),
  deleteUser: (userId) => axiosInstance.delete(`/admin/users/${userId}`),
  
  getRecipes: () => axiosInstance.get('/admin/recipes'),
  deleteRecipe: (recipeId) => axiosInstance.delete(`/admin/recipes/${recipeId}`),
  
  getSubmissions: () => axiosInstance.get('/admin/submissions/'),
  approveSubmission: (subId) => axiosInstance.post(`/admin/submissions/${subId}/review`, { approved: true }),
  rejectSubmission: (subId) => axiosInstance.post(`/admin/submissions/${subId}/review`, { approved: false }),
};
