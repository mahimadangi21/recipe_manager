import axiosInstance from './axiosInstance';

const api = axiosInstance;

export const getRecipes = async (params) => {
  const { data } = await api.get('/recipes', { params });
  return data;
};

export const getRecipeById = async (id) => {
  const { data } = await api.get(`/recipes/${id}`);
  return data;
};

export const createRecipe = async (recipeData) => {
  const { data } = await api.post('/recipes', recipeData);
  return data;
};

export const updateRecipe = async (id, recipeData) => {
  const { data } = await api.put(`/recipes/${id}`, recipeData);
  return data;
};

export const deleteRecipe = async (id) => {
  await api.delete(`/recipes/${id}`);
};

export const toggleFavorite = async (id) => {
  const { data } = await api.patch(`/recipes/${id}/favorite`);
  return data;
};

export const scaleRecipe = async (id, servings) => {
  const { data } = await api.get(`/recipes/${id}/scale`, { params: { servings } });
  return data;
};

export const addIngredient = async (id, ingredientData) => {
  const { data } = await api.post(`/recipes/${id}/ingredients`, ingredientData);
  return data;
};

export const updateIngredient = async (id, ingId, ingredientData) => {
  const { data } = await api.put(`/recipes/${id}/ingredients/${ingId}`, ingredientData);
  return data;
};

export const deleteIngredient = async (id, ingId) => {
  await api.delete(`/recipes/${id}/ingredients/${ingId}`);
};
