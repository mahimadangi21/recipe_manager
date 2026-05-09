import React from 'react';
import { useForm as useRHForm, useFieldArray as useRHFArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Loader2 } from 'lucide-react';

const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().optional(),
  category: z.enum(['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'beverage', 'other']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  servings: z.number().min(1, 'Must be at least 1').int(),
  prep_time_minutes: z.number().min(0).optional(),
  cook_time_minutes: z.number().min(0).optional(),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  instructions: z.string().min(1, 'Instructions are required'),
  ingredients: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    quantity: z.number().positive('Must be positive'),
    unit: z.string().min(1, 'Unit is required'),
    notes: z.string().optional()
  })).min(1, 'At least one ingredient is required')
});

export function RecipeForm({ initialData, onSubmit, isSubmitting }) {
  const [imagePreview, setImagePreview] = React.useState(initialData?.images?.[0]?.url || '');
  const [imageFile, setImageFile] = React.useState(null);

  const { register, control, handleSubmit, formState: { errors } } = useRHForm({
    resolver: zodResolver(recipeSchema.omit({ image_url: true })),
    defaultValues: initialData || {
      title: '', description: '', category: 'other', difficulty: 'medium',
      servings: 4, prep_time_minutes: 0, cook_time_minutes: 0,
      instructions: '',
      ingredients: [{ name: '', quantity: 1, unit: 'pieces', notes: '' }]
    }
  });

  const { fields, append, remove } = useRHFArray({
    control,
    name: "ingredients"
  });

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

  const handleFormSubmit = (data) => {
    onSubmit(data, imageFile);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
      
      {/* Section 1: Basic Info */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
            <input type="text" {...register('title')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea {...register('description')} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select {...register('category')} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
              {['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'beverage', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Difficulty</label>
            <select {...register('difficulty')} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
              {['easy', 'medium', 'hard'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Servings <span className="text-red-500">*</span></label>
            <input type="number" {...register('servings', { valueAsNumber: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
            {errors.servings && <p className="mt-1 text-sm text-red-600">{errors.servings.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipe Image</label>
            <div className="flex flex-col md:flex-row items-center gap-6 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-300 transition-colors bg-gray-50/50">
              <div className="relative h-40 w-full md:w-64 bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <Plus className="h-8 w-8 mb-2" />
                    <span className="text-xs font-medium">No Image</span>
                  </div>
                )}
              </div>
              <div className="flex-grow text-center md:text-left">
                <p className="text-sm font-bold text-gray-900 mb-1">Upload a delicious photo</p>
                <p className="text-xs text-gray-500 mb-4">PNG, JPG, GIF up to 5MB</p>
                <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm inline-block">
                  Choose File
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Prep Time (min)</label>
            <input type="number" {...register('prep_time_minutes', { valueAsNumber: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cook Time (min)</label>
            <input type="number" {...register('cook_time_minutes', { valueAsNumber: true })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
          </div>
        </div>
      </div>

      {/* Section 2: Ingredients */}
      <div className="space-y-6 pt-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2">Ingredients</h3>
        {errors.ingredients?.root && <p className="text-sm text-red-600">{errors.ingredients.root.message}</p>}
        
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg relative">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 flex-grow">
                <div className="sm:col-span-2">
                  <input placeholder="Ingredient name (e.g. Flour)" {...register(`ingredients.${index}.name`)} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                  {errors.ingredients?.[index]?.name && <p className="text-xs text-red-600 mt-1">{errors.ingredients[index].name.message}</p>}
                </div>
                <div>
                  <input type="number" step="0.01" placeholder="Qty" {...register(`ingredients.${index}.quantity`, { valueAsNumber: true })} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                  {errors.ingredients?.[index]?.quantity && <p className="text-xs text-red-600 mt-1">{errors.ingredients[index].quantity.message}</p>}
                </div>
                <div>
                  <input placeholder="Unit (e.g. cups)" {...register(`ingredients.${index}.unit`)} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                </div>
                <div className="sm:col-span-4">
                  <input placeholder="Notes (optional, e.g. finely chopped)" {...register(`ingredients.${index}.notes`)} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-transparent sm:text-sm" />
                </div>
              </div>
              <button type="button" onClick={() => remove(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md mt-1">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
          
          <button type="button" onClick={() => append({ name: '', quantity: 1, unit: 'pieces', notes: '' })} className="mt-2 inline-flex items-center px-4 py-2 border border-dashed border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
            <Plus className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
            Add Ingredient
          </button>
        </div>
      </div>

      {/* Section 3: Instructions */}
      <div className="space-y-6 pt-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2">Instructions <span className="text-red-500">*</span></h3>
        <p className="text-sm text-gray-500">Tip: Press Enter between each step</p>
        <div>
          <textarea rows={8} {...register('instructions')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="1. Preheat oven...&#10;2. Mix dry ingredients..."></textarea>
          {errors.instructions && <p className="mt-1 text-sm text-red-600">{errors.instructions.message}</p>}
        </div>
      </div>

      <div className="pt-6 flex justify-end gap-4 border-t">
        <button type="submit" disabled={isSubmitting} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
          {isSubmitting ? <><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> Saving...</> : 'Save Recipe'}
        </button>
      </div>

    </form>
  );
}
