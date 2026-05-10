import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecipeStore } from '../store/recipeStore';
import { Plus, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CreateRecipePage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { create, update, fetchById, isLoading } = useRecipeStore();
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      servings: 4,
      prep_time_minutes: 15,
      cook_time_minutes: 30,
      category: 'dinner',
      difficulty: 'medium',
      is_public: true,
      ingredients: [{ name: '', quantity: 1, unit: 'pcs', notes: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients'
  });

  useEffect(() => {
    if (isEditing) {
      fetchById(id).then(data => {
        reset(data);
        if (data.images?.[0]?.url) {
          setImagePreview(data.images[0].url);
        }
      }).catch(() => navigate('/recipes'));
    }
  }, [id, isEditing, fetchById, reset, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        await update(id, data, imageFile);
        toast.success('Recipe updated!');
        navigate(`/recipes/${id}`);
      } else {
        const newRecipe = await create(data, imageFile);
        toast.success('Recipe created!');
        navigate(`/recipes/${newRecipe.id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save recipe');
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <div className="mb-8 border-b border-gray-100 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">{isEditing ? 'Edit Recipe' : 'Create New Recipe'}</h1>
        <p className="text-gray-500 mt-2">Share your culinary masterpiece with the world</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Image Upload */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-gray-900">Recipe Photo</h2>
          <div className="flex flex-col md:flex-row items-center gap-8 p-6 border-2 border-dashed border-gray-200 rounded-3xl hover:border-orange-300 transition-all bg-gray-50/50">
            <div className="relative h-48 w-full md:w-80 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex items-center justify-center group">
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Change Photo</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <ImageIcon className="h-10 w-10 mb-2 stroke-[1.5px]" />
                  <span className="text-xs font-bold uppercase tracking-wider">No Image Selected</span>
                </div>
              )}
            </div>
            <div className="flex-grow text-center md:text-left space-y-4">
              <div>
                <p className="text-lg font-bold text-gray-900">Upload a delicious photo</p>
                <p className="text-sm text-gray-500">A great photo makes your recipe more appealing.</p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-md shadow-orange-200 active:scale-95">
                <Plus className="h-4 w-4" />
                Select Image
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">PNG, JPG or WEBP • MAX 5MB</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-5 pt-6 border-t border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Title</label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="block w-full px-4 py-3 border border-gray-300 focus:ring-orange-500 focus:border-orange-500 rounded-xl shadow-sm"
              placeholder="e.g. Grandma's Apple Pie"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              {...register('description')}
              rows={3}
              className="block w-full px-4 py-3 border border-gray-300 focus:ring-orange-500 focus:border-orange-500 rounded-xl shadow-sm"
              placeholder="A brief description of this recipe..."
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select {...register('category')} className="block w-full px-4 py-3 border border-gray-300 focus:ring-orange-500 focus:border-orange-500 rounded-xl shadow-sm">
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="dessert">Dessert</option>
                <option value="snack">Snack</option>
                <option value="beverage">Beverage</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select {...register('difficulty')} className="block w-full px-4 py-3 border border-gray-300 focus:ring-orange-500 focus:border-orange-500 rounded-xl shadow-sm">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (mins)</label>
              <input type="number" {...register('prep_time_minutes', { valueAsNumber: true })} className="block w-full px-4 py-3 border border-gray-300 focus:ring-orange-500 focus:border-orange-500 rounded-xl shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cook Time (mins)</label>
              <input type="number" {...register('cook_time_minutes', { valueAsNumber: true })} className="block w-full px-4 py-3 border border-gray-300 focus:ring-orange-500 focus:border-orange-500 rounded-xl shadow-sm" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
            <input type="number" {...register('servings', { valueAsNumber: true, min: 1 })} className="block w-full md:w-1/4 px-4 py-3 border border-gray-300 focus:ring-orange-500 focus:border-orange-500 rounded-xl shadow-sm" />
          </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-5 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Ingredients</h2>
            <button type="button" onClick={() => append({ name: '', quantity: 1, unit: '', notes: '' })} className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors">
              <Plus className="h-4 w-4" /> Add Ingredient
            </button>
          </div>
          
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="w-20">
                  <input type="number" step="0.1" {...register(`ingredients.${index}.quantity`, { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500" placeholder="Qty" />
                </div>
                <div className="w-24">
                  <input {...register(`ingredients.${index}.unit`)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500" placeholder="Unit" />
                </div>
                <div className="flex-grow">
                  <input {...register(`ingredients.${index}.name`, { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500" placeholder="Ingredient name" />
                </div>
                <div className="flex-grow hidden md:block">
                  <input {...register(`ingredients.${index}.notes`)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500" placeholder="Notes (optional)" />
                </div>
                <button type="button" onClick={() => remove(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-5 pt-6 border-t border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Instructions</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Steps (One step per line)</label>
            <textarea
              {...register('instructions', { required: 'Instructions are required' })}
              rows={8}
              className="block w-full px-4 py-3 border border-gray-300 focus:ring-orange-500 focus:border-orange-500 rounded-xl shadow-sm"
              placeholder="1. Preheat oven to 350°F...&#10;2. Mix ingredients..."
            />
            {errors.instructions && <p className="mt-1 text-sm text-red-600">{errors.instructions.message}</p>}
          </div>
        </div>
        
        {/* Visibility */}
        <div className="pt-6 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_public" {...register('is_public')} className="h-5 w-5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded" />
            <label htmlFor="is_public" className="text-gray-900 font-medium">Make this recipe public</label>
          </div>
          <p className="text-xs text-gray-500 pl-7 italic">
            Note: Public recipes are submitted as requests and will be visible once approved by an administrator.
          </p>
        </div>

        <div className="pt-6 flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex justify-center items-center px-8 py-3 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : null}
            {isEditing ? 'Save Changes' : 'Create Recipe'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRecipePage;
