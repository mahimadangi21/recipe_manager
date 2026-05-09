import { useEffect, useState } from 'react';
import { useRecipeStore } from '../store/recipeStore';
import RecipeCard from '../components/Recipe/RecipeCard';
import { Loader2, Heart } from 'lucide-react';

const FavoritesPage = () => {
  const { recipes, isLoading, fetchRecipes, setFilters } = useRecipeStore();

  useEffect(() => {
    // Only fetch favorites
    setFilters({ favorites: true });
    fetchRecipes();
    
    // Cleanup on unmount
    return () => setFilters({ favorites: undefined });
  }, [fetchRecipes, setFilters]);

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Heart className="h-8 w-8 text-red-500 fill-red-500" />
          My Favorites
        </h1>
        <p className="text-gray-500 mt-2">Recipes you've saved for later</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
        </div>
      ) : recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
          <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Heart className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-xl font-medium text-gray-900">No favorites yet</h3>
          <p className="text-gray-500 mt-2">Start exploring and save recipes you love!</p>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
