import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { toast } from 'react-hot-toast';
import Skeleton from '../components/UI/Skeleton';

const today = new Date().toISOString().slice(0, 10);

const MealPlannerPage = () => {
  const [plan, setPlan] = useState([]);
  const [shopping, setShopping] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recipeId, setRecipeId] = useState('');
  const [planDate, setPlanDate] = useState(today);
  const [mealType, setMealType] = useState('dinner');
  const [servings, setServings] = useState(1);

  const load = async () => {
    try {
      setLoading(true);
      const [planRes, shopRes] = await Promise.all([
        axiosInstance.get('/meal-planner/'),
        axiosInstance.get('/meal-planner/shopping-list'),
      ]);
      setPlan(planRes.data || []);
      setShopping(shopRes.data?.items || []);
    } catch (err) {
      toast.error('Failed to load meal planner');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const out = {};
    for (const item of plan) {
      out[item.plan_date] = out[item.plan_date] || [];
      out[item.plan_date].push(item);
    }
    return out;
  }, [plan]);

  const addItem = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/meal-planner/', {
        recipe_id: Number(recipeId),
        plan_date: planDate,
        meal_type: mealType,
        servings: Number(servings),
      });
      setRecipeId('');
      await load();
      toast.success('Meal added to plan');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.detail || 'Failed to add meal item');
    }
  };

  const removeItem = async (id) => {
    try {
      await axiosInstance.delete(`/meal-planner/${id}`);
      await load();
      toast.success('Removed from plan');
    } catch {
      toast.error('Failed to delete item');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Meal Planner</h1>
            <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 bg-gray-50 p-6 rounded-2xl">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Recipe ID</label>
                <input value={recipeId} onChange={(e) => setRecipeId(e.target.value)} placeholder="e.g. 12" className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Date</label>
                <input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Meal</label>
                <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Servings</label>
                <input type="number" min="1" value={servings} onChange={(e) => setServings(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <button className="md:col-span-2 lg:col-span-4 bg-gray-900 hover:bg-black text-white rounded-xl py-3 font-semibold transition-all">Add to Weekly Plan</button>
            </form>

            <div className="space-y-6">
              {loading ? (
                <Skeleton count={3} className="h-20 w-full" />
              ) : Object.keys(grouped).length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                  <p className="text-gray-500">Your meal plan is empty. Start by adding recipes!</p>
                </div>
              ) : Object.entries(grouped).sort().map(([date, items]) => (
                <div key={date} className="border-b border-gray-50 pb-6 last:border-0">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-sm mr-3">
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </h3>
                  <div className="grid gap-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl hover:shadow-md transition-all group">
                        <div className="flex items-center space-x-4">
                          {item.recipe?.images?.[0] ? (
                            <img src={item.recipe.images[0].url.startsWith('http') ? item.recipe.images[0].url : `http://localhost:8001${item.recipe.images[0].url}`} alt={item.recipe.title} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 font-bold uppercase text-xs">
                              {item.meal_type[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 truncate max-w-[200px]" title={item.recipe?.title}>
                              {item.recipe?.title || `Recipe #${item.recipe_id}`}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">{item.meal_type} • {item.servings} servings</p>
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sticky top-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Shopping List</h2>
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg">{shopping.length} items</span>
            </div>
            <div className="space-y-3">
              {loading ? (
                <Skeleton count={5} className="h-12 w-full" />
              ) : shopping.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">Add meals to generate list</p>
                </div>
              ) : shopping.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="flex items-center p-3 bg-gray-50 rounded-xl group hover:bg-orange-50 transition-all">
                  <div className="w-2 h-2 rounded-full bg-orange-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 capitalize">{item.name}</p>
                    <p className="text-xs text-gray-500">{Number(item.quantity).toFixed(2)} {item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
            {shopping.length > 0 && (
              <button onClick={() => window.print()} className="w-full mt-6 border-2 border-gray-100 hover:border-orange-500 hover:text-orange-500 rounded-xl py-3 font-semibold transition-all flex items-center justify-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                </svg>
                <span>Print List</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlannerPage;
