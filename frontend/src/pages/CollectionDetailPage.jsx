import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCollectionStore } from '../store/collectionStore';
import { useAuthStore } from '../store/authStore';
import RecipeCard from '../components/Recipe/RecipeCard';
import { Loader2, ArrowLeft, Trash2, Search, Plus, Globe, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance, { BASE_URL } from '../api/axiosInstance';

const CollectionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCollection, fetchById, isLoading, deleteCollection, removeRecipe, addRecipe } = useCollectionStore();
  const { user } = useAuthStore();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchById(id).catch(() => navigate('/collections'));
  }, [id, fetchById, navigate]);

  if (isLoading || !currentCollection) {
    return (
      <div className="min-h-[50vh] flex justify-center items-center">
        <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  const isOwner = user?.id === currentCollection.owner_id;
  const isAdmin = user?.is_admin;
  const canModify = isOwner || isAdmin;

  const handleDeleteCollection = async () => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      try {
        await deleteCollection(currentCollection.id);
        toast.success('Collection deleted');
        navigate('/collections');
      } catch (error) {
        toast.error('Failed to delete collection');
      }
    }
  };

  const handleRemoveRecipe = async (recipeId) => {
    try {
      await removeRecipe(currentCollection.id, recipeId);
      toast.success('Recipe removed from collection');
    } catch (error) {
      toast.error('Failed to remove recipe');
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const { data } = await axiosInstance.get(`/recipes/?search=${query}`);
      setSearchResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddRecipe = async (recipeId) => {
    try {
      await addRecipe(currentCollection.id, recipeId);
      toast.success('Recipe added to collection');
      setIsAddModalOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add recipe');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 mb-2">
        <Link to="/collections" className="flex items-center text-gray-500 hover:text-orange-500 font-medium transition-colors text-sm">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Collections
        </Link>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{currentCollection.name}</h1>
            <span className="p-1.5 bg-gray-50 rounded-full border border-gray-100" title={currentCollection.is_public ? "Public" : "Private"}>
              {currentCollection.is_public ? <Globe className="h-4 w-4 text-gray-500" /> : <Lock className="h-4 w-4 text-gray-500" />}
            </span>
          </div>
          {currentCollection.description && (
            <p className="text-gray-600 text-lg">{currentCollection.description}</p>
          )}
        </div>
        
        {canModify && (
          <div className="flex gap-3">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-orange-50 text-orange-600 hover:bg-orange-100 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" /> Add Recipes
            </button>
            <button 
              onClick={handleDeleteCollection}
              className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-5 w-5" /> Delete
            </button>
          </div>
        )}
      </div>

      {currentCollection.recipes?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentCollection.recipes.map(recipe => (
            <div key={recipe.id} className="relative group">
              <RecipeCard recipe={recipe} />
              {canModify && (
                <button
                  onClick={(e) => { e.preventDefault(); handleRemoveRecipe(recipe.id); }}
                  className="absolute top-3 left-3 p-2 rounded-full bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all z-20"
                  title="Remove from collection"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
          <div className="mx-auto w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-orange-300" />
          </div>
          <h3 className="text-xl font-medium text-gray-900">Collection is empty</h3>
          <p className="text-gray-500 mt-2 mb-6">Add some recipes to this collection to get started</p>
          {canModify && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-orange-500 text-white hover:bg-orange-600 px-6 py-2 rounded-xl font-medium transition-colors"
            >
              Add Recipes Now
            </button>
          )}
        </div>
      )}

      {/* Add Recipe Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsAddModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full h-[600px] flex flex-col">
              <div className="bg-white px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-bold text-gray-900">Add Recipes to {currentCollection.name}</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-500">×</button>
              </div>
              
              <div className="p-6 flex-grow flex flex-col min-h-0">
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-orange-500 focus:border-orange-500 bg-gray-50 focus:bg-white"
                    placeholder="Search for recipes to add..."
                  />
                </div>

                <div className="flex-grow overflow-y-auto border border-gray-100 rounded-xl bg-gray-50 p-2">
                  {isSearching ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map(recipe => (
                        <div key={recipe.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center hover:border-orange-200 transition-colors">
                          <div className="flex items-center gap-4">
                            {recipe.images?.[0]?.url ? (
                              <img src={recipe.images[0].url.startsWith('http') ? recipe.images[0].url : `${BASE_URL}${recipe.images[0].url}`} alt="" className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-xl">🍽️</div>
                            )}
                            <div>
                              <h4 className="font-semibold text-gray-900">{recipe.title}</h4>
                              <p className="text-sm text-gray-500 capitalize">{recipe.category} • {recipe.difficulty}</p>
                            </div>
                          </div>
                          
                          {currentCollection.recipes?.some(r => r.id === recipe.id) ? (
                            <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">Added</span>
                          ) : (
                            <button
                              onClick={() => handleAddRecipe(recipe.id)}
                              className="px-4 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 rounded-lg text-sm font-medium transition-colors"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <div className="flex justify-center items-center h-full text-gray-500">
                      No recipes found matching "{searchQuery}"
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full text-gray-400 text-center px-4">
                      Type above to search across all public recipes and your own recipes.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetailPage;
