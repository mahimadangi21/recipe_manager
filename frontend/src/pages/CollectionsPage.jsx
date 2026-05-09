import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCollectionStore } from '../store/collectionStore';
import { Loader2, Plus, Folder, Lock, Globe } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

const CollectionsPage = () => {
  const { collections, isLoading, fetchCollections, create } = useCollectionStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', description: '', is_public: false }
  });

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const onSubmit = async (data) => {
    try {
      await create(data);
      toast.success('Collection created!');
      setIsModalOpen(false);
      reset();
    } catch (error) {
      toast.error('Failed to create collection');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Folder className="h-8 w-8 text-orange-500 fill-orange-100" />
            My Collections
          </h1>
          <p className="text-gray-500 mt-2">Organize your recipes into custom lists</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-50 text-orange-600 hover:bg-orange-100 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="h-5 w-5" /> New Collection
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
        </div>
      ) : collections?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections?.map(collection => (
            <Link key={collection.id} to={`/collections/${collection.id}`} className="block group">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{collection.name}</h3>
                  <span className="p-2 bg-gray-50 rounded-full" title={collection.is_public ? "Public" : "Private"}>
                    {collection.is_public ? <Globe className="h-4 w-4 text-gray-400" /> : <Lock className="h-4 w-4 text-gray-400" />}
                  </span>
                </div>
                {collection.description && (
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2">{collection.description}</p>
                )}
                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-sm text-gray-500">
                  <span>{collection.recipes?.length || 0} recipes</span>
                  <span>{new Date(collection.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
          <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Folder className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-xl font-medium text-gray-900">No collections yet</h3>
          <p className="text-gray-500 mt-2 mb-4">Create your first collection to start organizing</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 text-white hover:bg-orange-600 px-4 py-2 rounded-xl font-medium transition-colors"
          >
            Create Collection
          </button>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-gray-600/75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>
          
          {/* Modal Panel */}
          <div className="relative bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-xl leading-6 font-bold text-gray-900 mb-6" id="modal-title">
                      Create New Collection
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                        <input
                          {...register('name', { required: 'Name is required' })}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          placeholder="e.g. Summer BBQ"
                        />
                        {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                        <textarea
                          {...register('description')}
                          rows={3}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                          placeholder="Recipes for the perfect summer barbecue..."
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <input type="checkbox" id="is_public" {...register('is_public')} className="h-5 w-5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded" />
                        <label htmlFor="is_public" className="text-sm font-medium text-gray-700">Make this collection public</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                <button type="submit" className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl border border-transparent px-6 py-2.5 bg-orange-600 text-sm font-semibold text-white hover:bg-orange-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                  Create Collection
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center items-center rounded-xl border border-gray-300 px-6 py-2.5 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors focus:outline-none">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionsPage;
