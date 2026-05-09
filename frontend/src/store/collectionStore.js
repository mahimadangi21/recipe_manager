import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

export const useCollectionStore = create((set, get) => ({
  collections: [],
  currentCollection: null,
  isLoading: false,
  error: null,

  fetchCollections: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await axiosInstance.get('/collections/');
      set({ collections: result.data });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await axiosInstance.get(`/collections/${id}`);
      set({ currentCollection: result.data });
      return result.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  create: async (collectionData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await axiosInstance.post('/collections/', collectionData);
      set((state) => ({ collections: [...state.collections, result.data] }));
      return result.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  update: async (id, collectionData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await axiosInstance.put(`/collections/${id}`, collectionData);
      set((state) => ({
        collections: state.collections.map((c) => (c.id === id ? result.data : c)),
        currentCollection: state.currentCollection?.id === id ? result.data : state.currentCollection
      }));
      return result.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCollection: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/collections/${id}`);
      set((state) => ({
        collections: state.collections.filter((c) => c.id !== id),
        currentCollection: state.currentCollection?.id === id ? null : state.currentCollection
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addRecipe: async (collectionId, recipeId) => {
    try {
      await axiosInstance.post(`/collections/${collectionId}/recipes?recipe_id=${recipeId}`);
      if (get().currentCollection?.id === collectionId) {
        await get().fetchById(collectionId);
      }
    } catch (error) {
      throw error;
    }
  },

  removeRecipe: async (collectionId, recipeId) => {
    try {
      await axiosInstance.delete(`/collections/${collectionId}/recipes/${recipeId}`);
      if (get().currentCollection?.id === collectionId) {
        await get().fetchById(collectionId);
      }
    } catch (error) {
      throw error;
    }
  }
}));
