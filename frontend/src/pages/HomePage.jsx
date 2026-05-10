import { useEffect, useState } from 'react';
import { useRecipeStore } from '../store/recipeStore';
import RecipeCard from '../components/Recipe/RecipeCard';
import { Search, SlidersHorizontal, Sparkles, Loader2, X } from 'lucide-react';
import Skeleton from '../components/UI/Skeleton';

const HomePage = () => {
  const { recipes, isLoading, fetchRecipes, filters, setFilters } = useRecipeStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters({ search: searchTerm || undefined });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, setFilters]);

  useEffect(() => {
    fetchRecipes();
  }, [filters, fetchRecipes]);

  const hasActiveFilters = Boolean(filters.category || filters.difficulty || filters.search);

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-amber-50 to-white p-6 md:p-8">
        <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-amber-200/40 blur-3xl" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Curated meals for every mood
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">Discover Recipes</h1>
            <p className="mt-2 text-gray-600">Find your next favorite meal and save time in the kitchen.</p>
          </div>

          <div className="w-full md:w-96 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-xl border border-white/80 bg-white pl-10 pr-3 py-3 shadow-sm focus:ring-orange-500 focus:border-orange-500 transition-colors outline-none"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">{isLoading ? '...' : recipes.length} recipes</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">Fast weeknight ideas</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">Healthy options</span>
        </div>
      </div>

      {/* Filters (Simplified) */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </div>
        <select 
          className="border border-gray-200 rounded-lg px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
          value={filters.category || ''}
          onChange={(e) => setFilters({ category: e.target.value || undefined })}
        >
          <option value="">All Categories</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="dessert">Dessert</option>
          <option value="snack">Snack</option>
          <option value="beverage">Beverage</option>
        </select>

        <select 
          className="border border-gray-200 rounded-lg px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
          value={filters.difficulty || ''}
          onChange={(e) => setFilters({ difficulty: e.target.value || undefined })}
        >
          <option value="">Any Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setFilters({ search: undefined, category: undefined, difficulty: undefined });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Recipe Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Skeleton count={8} className="h-80 w-full" />
        </div>
      ) : recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-medium text-gray-900">No recipes found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your filters or search term</p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilters({ search: undefined, category: undefined, difficulty: undefined });
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
            >
              <X className="h-4 w-4" />
              Reset filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
