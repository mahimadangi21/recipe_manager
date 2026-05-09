import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useRecipeStore } from '../../store/recipeStore';

export function SearchBar() {
  const { filters, setFilter } = useRecipeStore();
  const [searchTerm, setSearchTerm] = useState(filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilter('search', searchTerm);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, setFilter]);

  return (
    <div className="relative max-w-md w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
        placeholder="Search recipes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}
