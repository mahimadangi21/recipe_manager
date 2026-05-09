import { Link } from 'react-router-dom';
import { Clock, Users, Heart, Star } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useRecipeStore } from '../../store/recipeStore';
import { BASE_URL } from '../../api/axiosInstance';

const DEFAULT_FOOD_IMAGE =
  'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?q=80&w=2000&auto=format&fit=crop';

const getCategoryEmoji = (category) => {
  const map = {
    breakfast: '🍳',
    lunch: '🥪',
    dinner: '🍽️',
    dessert: '🍰',
    snack: '🥨',
    beverage: '🥤',
    other: '🍲'
  };
  return map[category] || '🍲';
};

const RecipeCard = ({ recipe }) => {
  const { isAuthenticated } = useAuthStore();
  const { toggleFavorite } = useRecipeStore();
  
  const primaryImage = recipe.images?.find(img => img.is_primary)?.url || recipe.images?.[0]?.url || DEFAULT_FOOD_IMAGE;
  const ingredientPreview = (recipe.ingredients || []).slice(0, 3).map((ing) => ing.name).join(', ');
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  const handleFavorite = async (e) => {
    e.preventDefault(); // Prevent navigating to detail page
    if (!isAuthenticated) return;
    try {
      await toggleFavorite(recipe.id);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Link to={`/recipes/${recipe.id}`} className="block group">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
        {/* Image container */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {primaryImage ? (
            <img 
              src={primaryImage.startsWith('http') ? primaryImage : `${BASE_URL}${primaryImage}`} 
              alt={recipe.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_FOOD_IMAGE;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-orange-50 group-hover:bg-orange-100 transition-colors">
              <span className="text-6xl">{getCategoryEmoji(recipe.category)}</span>
            </div>
          )}
          
          {/* Favorite button */}
          {isAuthenticated && (
            <button 
              onClick={handleFavorite}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-gray-400 hover:text-red-500 transition-all z-10"
            >
              <Heart className={`h-5 w-5 ${recipe.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full capitalize shadow-sm">
              {recipe.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
              {recipe.title}
            </h3>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3 min-h-10">
            {recipe.description || 'A flavorful recipe made with fresh ingredients and simple cooking steps.'}
          </p>

          <p className="text-xs text-gray-500 line-clamp-1 mb-4">
            <span className="font-semibold text-gray-600">Ingredients:</span>{' '}
            {ingredientPreview || 'Ingredient details available in recipe view'}
          </p>

          <div className="flex items-center gap-1 mb-4">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-medium text-gray-700">{recipe.avg_rating || 'New'}</span>
            {recipe.review_count > 0 && (
              <span className="text-sm text-gray-400">({recipe.review_count})</span>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-orange-400" />
                <span>{totalTime}m total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-400" />
                <span>{recipe.servings}</span>
              </div>
            </div>
            
            <span className={`text-xs font-medium px-2 py-1 rounded-md ${
              recipe.difficulty === 'easy' ? 'bg-green-50 text-green-700' :
              recipe.difficulty === 'medium' ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'
            } capitalize`}>
              {recipe.difficulty}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
