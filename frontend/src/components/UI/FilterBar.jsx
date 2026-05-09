import React from 'react';
import { useRecipeStore } from '../../store/recipeStore';

export function FilterBar() {
  const { filters, setFilter, resetFilters } = useRecipeStore();

  const categories = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'beverage', 'other'];
  const difficulties = ['easy', 'medium', 'hard'];

  return (
    <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
        <select
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          value={filters.category}
          onChange={(e) => setFilter('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">Difficulty</label>
        <select
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          value={filters.difficulty}
          onChange={(e) => setFilter('difficulty', e.target.value)}
        >
          <option value="">All Difficulties</option>
          {difficulties.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
        </select>
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">Max Cook Time (min)</label>
        <input
          type="number"
          className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3"
          placeholder="e.g. 30"
          value={filters.maxCookTime}
          onChange={(e) => setFilter('maxCookTime', e.target.value)}
        />
      </div>

      <div className="flex items-end h-full pt-6">
        <button
          onClick={resetFilters}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
