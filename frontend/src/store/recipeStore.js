import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

export const useRecipeStore = create((set, get) => ({
  recipes: [],
  currentRecipe: null,
  totalCount: 0,
  isLoading: false,
  error: null,
  filters: {
    page: 1,
    page_size: 12,
  },

  setFilters: (newFilters) => set({ filters: { ...get().filters, ...newFilters, page: 1 } }),
  setPage: (page) => set({ filters: { ...get().filters, page } }),

  fetchRecipes: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await axiosInstance.get('/recipes/', { params: get().filters });
      set({ recipes: result.data });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyRecipes: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await axiosInstance.get('/recipes/', { params: { owned: true, page: 1, page_size: 100 } });
      set({ recipes: result.data });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPublicRecipes: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await axiosInstance.get('/recipes/public');
      set({ recipes: result.data });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAdminRecipes: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await axiosInstance.get('/admin/recipes');
      set({ recipes: result.data });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await axiosInstance.get(`/recipes/${id}`);
      set({ currentRecipe: result.data });
      return result.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchByShareToken: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const result = await axiosInstance.get(`/recipes/shared/${token}`);
      set({ currentRecipe: result.data });
      return result.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  uploadImage: async (recipeId, file) => {
    const formData = new FormData();
    formData.append('files', file);
    try {
      const result = await axiosInstance.post(`/recipes/${recipeId}/images/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return result.data;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  },

  create: async (recipeData, imageFile) => {
    set({ isLoading: true, error: null });
    try {
      const result = await axiosInstance.post('/recipes/', recipeData);
      const newRecipe = result.data;
      
      if (imageFile) {
        await get().uploadImage(newRecipe.id, imageFile);
        // Fetch again to get updated images array
        const updated = await get().fetchById(newRecipe.id);
        set((state) => ({ recipes: [updated, ...state.recipes] }));
        return updated;
      }
      
      set((state) => ({ recipes: [newRecipe, ...state.recipes] }));
      return newRecipe;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  update: async (id, recipeData, imageFile) => {
    set({ isLoading: true, error: null });
    try {
      const result = await axiosInstance.put(`/recipes/${id}`, recipeData);
      let updatedRecipe = result.data;

      if (imageFile) {
        await get().uploadImage(id, imageFile);
        updatedRecipe = await get().fetchById(id);
      }

      set((state) => ({
        recipes: state.recipes.map((r) => (r.id === id ? updatedRecipe : r)),
        currentRecipe: state.currentRecipe?.id === id ? updatedRecipe : state.currentRecipe
      }));
      return updatedRecipe;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteRecipe: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/recipes/${id}`);
      set((state) => ({
        recipes: state.recipes.filter((r) => r.id !== id),
        currentRecipe: state.currentRecipe?.id === id ? null : state.currentRecipe
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (id) => {
    const isFavFilter = get().filters.favorites;
    try {
      // Optimistic update
      set((state) => ({
        recipes: state.recipes.map((r) => (r.id === id ? { ...r, is_favorite: !r.is_favorite } : r)),
        currentRecipe: state.currentRecipe?.id === id ? { ...state.currentRecipe, is_favorite: !state.currentRecipe.is_favorite } : state.currentRecipe
      }));

      const result = await axiosInstance.post(`/recipes/${id}/favorite`);
      const isFav = result.data.is_favorite;

      set((state) => {
        let newRecipes = state.recipes.map((r) => (r.id === id ? { ...r, is_favorite: isFav } : r));
        
        // If we are on the favorites page and the item was unfavorited, remove it from the list
        if (isFavFilter && !isFav) {
          newRecipes = newRecipes.filter(r => r.id !== id);
        }

        return {
          recipes: newRecipes,
          currentRecipe: state.currentRecipe?.id === id ? { ...state.currentRecipe, is_favorite: isFav } : state.currentRecipe
        };
      });
    } catch (error) {
      // Revert on error by refetching
      get().fetchById(id);
      throw error;
    }
  },

  copyRecipe: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await axiosInstance.post(`/recipes/${id}/copy`);
      set((state) => ({ recipes: [result.data, ...state.recipes] }));
      return result.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  }
}));
