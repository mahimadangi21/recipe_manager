import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { RecipeForm } from '../components/Recipe/RecipeForm';
import { useRecipeStore } from '../store/recipeStore';

export default function EditRecipePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRecipe, fetchById, update, isLoading, error } = useRecipeStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchById(id).catch(err => {
      console.error('Failed to fetch recipe:', err);
      toast.error('Recipe not found or access denied');
      navigate('/recipes');
    });
  }, [id, fetchById, navigate]);

  const handleSubmit = async (data, imageFile) => {
    setIsSubmitting(true);
    try {
      await update(id, data, imageFile);
      toast.success('Recipe updated successfully!');
      navigate(`/recipes/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update recipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !currentRecipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="text-gray-500 font-medium">Loading recipe details...</p>
        </div>
      </div>
    );
  }

  if (error && !currentRecipe) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong.</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <button onClick={() => navigate('/recipes')} className="bg-orange-500 text-white px-6 py-2 rounded-full font-bold">
          Go back to Recipes
        </button>
      </div>
    );
  }

  if (!currentRecipe) return null;

  // Ensure ingredients have all necessary fields for the form
  const initialData = {
    ...currentRecipe,
    ingredients: currentRecipe.ingredients.map(i => ({
      name: i.name, quantity: i.quantity, unit: i.unit, notes: i.notes || ''
    }))
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Edit Recipe</h1>
      <RecipeForm initialData={initialData} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
