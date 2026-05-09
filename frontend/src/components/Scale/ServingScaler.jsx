import React, { useState, useEffect } from 'react';
import { Minus, Plus, Users } from 'lucide-react';
import { scaleRecipe } from '../../api/recipeApi';

export function ServingScaler({ recipeId, initialServings, onScale }) {
  const [servings, setServings] = useState(initialServings);
  const [isScaling, setIsScaling] = useState(false);

  useEffect(() => {
    const handleScale = async () => {
      if (servings === initialServings) {
        onScale(null); // Reset to original
        return;
      }
      setIsScaling(true);
      try {
        const scaled = await scaleRecipe(recipeId, servings);
        onScale(scaled.ingredients);
      } catch (err) {
        console.error("Failed to scale recipe", err);
      } finally {
        setIsScaling(false);
      }
    };

    const timer = setTimeout(handleScale, 500);
    return () => clearTimeout(timer);
  }, [servings, recipeId, initialServings, onScale]);

  return (
    <div className="flex items-center gap-4 bg-orange-50 p-3 rounded-lg border border-orange-100">
      <div className="flex items-center gap-2 text-orange-800 font-medium">
        <Users className="h-5 w-5" />
        <span>Servings</span>
      </div>
      <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-md border border-gray-200">
        <button 
          onClick={() => setServings(Math.max(1, servings - 1))}
          className="p-1 text-gray-500 hover:text-primary transition-colors disabled:opacity-50"
          disabled={servings <= 1}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="font-semibold w-6 text-center">{servings}</span>
        <button 
          onClick={() => setServings(servings + 1)}
          className="p-1 text-gray-500 hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {isScaling && <span className="text-xs text-orange-600 animate-pulse">Calculating...</span>}
    </div>
  );
}
