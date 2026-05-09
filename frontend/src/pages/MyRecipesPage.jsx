import { useEffect } from 'react';
import { useRecipeStore } from '../store/recipeStore';
import RecipeCard from '../components/Recipe/RecipeCard';
import { BookOpen, Plus, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyRecipesPage = () => {
  const { recipes, isLoading, fetchMyRecipes } = useRecipeStore();

  useEffect(() => {
    fetchMyRecipes();
  }, [fetchMyRecipes]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-orange-500" />
            My Recipes
          </h1>
          <p className="text-gray-600 mt-2">Manage the recipes you've created and shared.</p>
        </div>
        <Link 
          to="/recipes/new"
          className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
        >
          <Plus className="h-5 w-5" />
          Create New Recipe
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
        </div>
      ) : recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
          <div className="text-6xl mb-4">🍳</div>
          <h3 className="text-xl font-medium text-gray-900">You haven't created any recipes yet</h3>
          <p className="text-gray-500 mt-2">Start sharing your culinary creations with the world!</p>
          <Link
            to="/recipes/new"
            className="mt-6 inline-flex items-center gap-2 bg-orange-500 px-6 py-2 rounded-xl text-sm font-bold text-white hover:bg-orange-600 transition-all"
          >
            Create your first recipe
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyRecipesPage;
