import { useEffect, useMemo, useState, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { toast } from 'react-hot-toast';
import { Loader2, RefreshCw, PlusCircle, Trash2, Calendar, ClipboardList, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import ErrorBoundary from '../components/UI/ErrorBoundary';

const today = new Date().toISOString().slice(0, 10);

const MealPlannerPageContent = () => {
  const [plan, setPlan] = useState([]);
  const [shopping, setShopping] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [recipeId, setRecipeId] = useState('');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [planDate, setPlanDate] = useState(today);
  const [mealType, setMealType] = useState('dinner');
  const [servings, setServings] = useState(1);

  // ─── Search recipes for autocomplete ──────────────────────────────────────
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!recipeSearch.trim() || recipeSearch.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setSearching(true);
        const res = await axiosInstance.get(`/recipes/?search=${encodeURIComponent(recipeSearch)}&page_size=5`);
        const data = res.data?.data ?? [];
        setSuggestions(data);
      } catch (err) {
        console.error('Autocomplete Error:', err);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [recipeSearch]);

  // ─── Fetch both plan + shopping list ─────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [planRes, shopRes] = await Promise.all([
        axiosInstance.get('/meal-planner/'),
        axiosInstance.get('/meal-planner/shopping-list'),
      ]);

      const planData = planRes.data?.data ?? planRes.data ?? [];
      const shopData = shopRes.data?.data ?? shopRes.data ?? [];

      setPlan(Array.isArray(planData) ? planData : []);
      setShopping(Array.isArray(shopData) ? shopData : []);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to load';
      console.error('Meal Planner Load Error:', msg, err);
      toast.error(`Load failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Group plan by date ───────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const out = {};
    for (const item of plan) {
      const key = item.planned_date;
      out[key] = out[key] || [];
      out[key].push(item);
    }
    return out;
  }, [plan]);

  // ─── Bug fix: Add meal with correct field names + proper error surface ──
  const addItem = async (e) => {
    e.preventDefault();
    
    // Validate: Recipe required
    if (!recipeId) {
      toast.error('Please select a recipe from the list');
      return;
    }
    // Validate: Date required
    if (!planDate) {
      toast.error('Date is required');
      return;
    }
    // Validate: Meal type required
    if (!mealType) {
      toast.error('Meal type is required');
      return;
    }
    // Validate: Servings required
    if (!servings || servings < 1) {
      toast.error('Servings must be at least 1');
      return;
    }

    setAdding(true);
    try {
      await axiosInstance.post('/meal-planner/', {
        recipe_id: Number(recipeId),
        planned_date: planDate,
        meal_type: mealType,
        servings: Number(servings),
      });
      
      setRecipeId('');
      setRecipeSearch('');
      toast.success(`Successfully added to ${mealType} on ${planDate}`);

      // Auto-generate/update shopping list and refresh everything
      await load(); // Update plan state first
      await generateList(); // Then generate from updated plan
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to add meal item';
      console.error('Add Meal Error:', msg, err.response?.data);
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  // ─── Remove from plan ────────────────────────────────────────────────────
  const removeItem = async (id) => {
    try {
      await axiosInstance.delete(`/meal-planner/${id}`);
      setPlan(prev => prev.filter(i => i.id !== id));
      toast.success('Removed from plan');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to delete item';
      console.error('Remove Item Error:', msg);
      toast.error(msg);
    }
  };

  // ─── Bug 2 fix: generate then re-fetch shopping list ─────────────────────
  const generateList = async () => {
    if (plan.length === 0) {
      toast.error('Add some meals to your plan first!');
      return;
    }
    setGenerating(true);
    const toastId = toast.loading('Generating shopping list...');
    try {
      await axiosInstance.post('/meal-planner/shopping-list/generate');
      // Re-fetch the shopping list so we get the latest items
      const shopRes = await axiosInstance.get('/meal-planner/shopping-list');
      const shopData = shopRes.data?.data ?? shopRes.data ?? [];
      setShopping(Array.isArray(shopData) ? shopData : []);
      toast.success(`Shopping list ready! ${shopData.length} items`, { id: toastId });
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to generate list';
      console.error('Generate List Error:', msg);
      toast.error(msg, { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const toggleShoppingItem = async (id, currentStatus) => {
    // Optimistic update
    setShopping(prev => prev.map(i => i.id === id ? { ...i, checked: !currentStatus } : i));
    try {
      await axiosInstance.put(`/meal-planner/shopping-list/${id}`, { checked: !currentStatus });
    } catch (err) {
      // Rollback on failure
      setShopping(prev => prev.map(i => i.id === id ? { ...i, checked: currentStatus } : i));
      toast.error('Failed to update item');
    }
  };

  const deleteShoppingItem = async (id) => {
    try {
      await axiosInstance.delete(`/meal-planner/shopping-list/${id}`);
      setShopping(prev => prev.filter(i => i.id !== id));
      toast.success('Item removed');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete item';
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">

        {/* ── Left: Meal Planner ── */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-100">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              Meal Planner
            </h1>

            {/* Add Form */}
            <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div className="space-y-1 relative">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Recipe Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={recipeSearch}
                    onChange={(e) => {
                      setRecipeSearch(e.target.value);
                      setShowSuggestions(true);
                      if (!e.target.value) setRecipeId('');
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search recipes..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500 transition-all pr-10"
                    autoComplete="off"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowSuggestions(false)}
                    />
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                      {suggestions.map((recipe) => (
                        <button
                          key={recipe.id}
                          type="button"
                          onClick={() => {
                            setRecipeId(recipe.id);
                            setRecipeSearch(recipe.title);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-orange-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                        >
                          {recipe.images?.[0] && (
                            <img 
                              src={recipe.images[0].url.startsWith('http') ? recipe.images[0].url : `http://localhost:8000${recipe.images[0].url}`} 
                              className="w-8 h-8 rounded-lg object-cover" 
                              alt="" 
                            />
                          )}
                          <div>
                            <p className="text-sm font-bold text-gray-900">{recipe.title}</p>
                            <div className="flex gap-1">
                              <span className="text-[8px] font-black uppercase bg-gray-100 px-1 py-0.5 rounded text-gray-400">{recipe.category}</span>
                              <span className="text-[8px] font-black uppercase bg-orange-100 px-1 py-0.5 rounded text-orange-400">{recipe.difficulty}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Date</label>
                <input
                  type="date"
                  value={planDate}
                  onChange={(e) => setPlanDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Meal</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Servings</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={adding}
                className="md:col-span-2 lg:col-span-4 bg-gray-900 hover:bg-black text-white rounded-xl py-3 font-semibold transition-all shadow-lg hover:shadow-xl transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
                {adding ? 'Adding...' : 'Add to Weekly Plan'}
              </button>
            </form>

            {/* Plan list */}
            <div className="space-y-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
              ) : Object.keys(grouped).length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/30">
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Calendar className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Your meal plan is empty.</p>
                  <p className="text-gray-400 text-sm mt-1">Start by adding recipes using the form above.</p>
                </div>
              ) : Object.entries(grouped).sort().map(([date, items]) => (
                <div key={date} className="border-b border-gray-50 pb-6 last:border-0">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-sm font-bold border border-orange-200 shadow-sm">
                      {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </h3>
                  <div className="grid gap-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl hover:shadow-md transition-all group border-l-4 border-l-orange-500">
                        <div className="flex items-center space-x-4">
                          {item.recipe?.images?.[0] ? (
                            <img
                              src={item.recipe.images[0].url.startsWith('http')
                                ? item.recipe.images[0].url
                                : `http://localhost:8000${item.recipe.images[0].url}`}
                              alt={item.recipe.title}
                              className="w-12 h-12 rounded-xl object-cover shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 font-bold uppercase text-xs border border-orange-100">
                              {(item.meal_type || 'M')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900 truncate max-w-[250px]">
                              {item.recipe?.title || `Recipe #${item.recipe_id}`}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-black uppercase bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{item.meal_type}</span>
                              <span className="text-xs text-gray-400 font-medium">{item.servings} serving{item.servings !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-300 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Shopping List ── */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sticky top-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-orange-500" />
                Shopping List
              </h2>
              <span className="bg-orange-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                {shopping.length} items
              </span>
            </div>

            <button
              onClick={generateList}
              disabled={generating}
              className="w-full mb-6 py-3 bg-orange-50 text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-100 transition-all flex items-center justify-center gap-2 border border-orange-200 border-dashed group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              {generating ? 'Generating...' : 'Refresh Shopping List'}
            </button>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
                </div>
              ) : shopping.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <ClipboardList className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-xs font-medium">Add meals then click Refresh</p>
                </div>
              ) : shopping.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center p-3 rounded-xl group transition-all border ${item.checked ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-50 hover:border-orange-200 shadow-sm'}`}
                >
                  <button
                    onClick={() => toggleShoppingItem(item.id, item.checked)}
                    className={`w-5 h-5 rounded-md border-2 flex-shrink-0 transition-all flex items-center justify-center ${item.checked ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-200'}`}
                  >
                    {item.checked && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                  </button>
                  <div className="flex-1 ml-3 overflow-hidden">
                    <p className={`text-sm font-bold truncate ${item.checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {item.ingredient_name}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{item.quantity}</p>
                  </div>
                  <button
                    onClick={() => deleteShoppingItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {shopping.length > 0 && (
              <div className="pt-6 space-y-3">
                <button
                  onClick={() => window.print()}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Printer className="h-4 w-4" />
                  Print Shopping List
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print view */}
      <div className="hidden print:block print:p-8">
        <h1 className="text-2xl font-bold mb-4">My Shopping List</h1>
        <div className="space-y-4">
          {shopping.map(item => (
            <div key={item.id} className="flex items-center border-b border-gray-200 py-2">
              <div className="w-4 h-4 border border-black mr-4" />
              <div>
                <p className="font-bold">{item.ingredient_name}</p>
                <p className="text-sm">{item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MealPlannerPage = () => (
  <ErrorBoundary>
    <MealPlannerPageContent />
  </ErrorBoundary>
);

export default MealPlannerPage;
