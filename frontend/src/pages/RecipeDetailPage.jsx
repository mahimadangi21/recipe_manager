import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRecipeStore } from '../store/recipeStore';
import { useAuthStore } from '../store/authStore';
import { BASE_URL } from '../api/axiosInstance';
import { Clock, Users, Heart, Share2, Edit2, Trash2, Copy, ArrowLeft, Loader2, Star, CheckCircle, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const RecipeDetailPage = ({ isPublicView = false }) => {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const { 
    currentRecipe: recipe, 
    fetchById, 
    fetchByShareToken, 
    deleteRecipe, 
    toggleFavorite, 
    copyRecipe, 
    fetchReviews,
    fetchComments,
    createReview,
    createComment,
    deleteComment,
    isLoading 
  } = useRecipeStore();
  const { user, isAuthenticated } = useAuthStore();
  
  const [servings, setServings] = useState(4);
  const [isCopied, setIsCopied] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [activeSection, setActiveSection] = useState('reviews');

  useEffect(() => {
    const loadData = async () => {
      if (isPublicView && token) {
        const r = await fetchByShareToken(token);
        setServings(r.servings);
        const [revs, comms] = await Promise.all([fetchReviews(r.id), fetchComments(r.id)]);
        setReviews(revs);
        setComments(comms);
      } else if (id) {
        const r = await fetchById(id);
        setServings(r.servings);
        const [revs, comms] = await Promise.all([fetchReviews(r.id), fetchComments(r.id)]);
        setReviews(revs);
        setComments(comms);
      }
    };
    loadData();
  }, [id, token, isPublicView]);

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return navigate('/login');
    try {
      await createReview(recipe.id, newReview);
      toast.success('Review posted!');
      setNewReview({ rating: 5, comment: '' });
      const revs = await fetchReviews(recipe.id);
      setReviews(revs);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to post review');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return navigate('/login');
    if (!newComment.trim()) return;
    try {
      await createComment(recipe.id, { content: newComment });
      toast.success('Comment posted!');
      setNewComment('');
      const comms = await fetchComments(recipe.id);
      setComments(comms);
    } catch (e) {
      toast.error('Failed to post comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(recipe.id, commentId);
      toast.success('Comment deleted');
      setComments(comments.filter(c => c.id !== commentId));
    } catch (e) {
      toast.error('Failed to delete comment');
    }
  };

  if (isLoading || !recipe) {
    return (
      <div className="min-h-[50vh] flex justify-center items-center">
        <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  const isOwner = user?.id === recipe.owner_id;
  const isAdmin = user?.is_admin;
  const canModify = isAdmin;
  const scaleFactor = servings / (recipe.servings || 1);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await deleteRecipe(recipe.id);
        toast.success('Recipe deleted');
        navigate('/recipes');
      } catch (error) {
        toast.error('Failed to delete recipe');
      }
    }
  };

  const handleCopyRecipe = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const newRecipe = await copyRecipe(recipe.id);
      toast.success('Recipe copied to your account!');
      navigate(`/recipes/${newRecipe.id}`);
    } catch (error) {
      toast.error('Failed to copy recipe');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/r/${recipe.share_token}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success('Share link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {!isPublicView && (
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <Link to="/recipes" className="flex items-center text-gray-500 hover:text-orange-500 font-medium transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Recipes
          </Link>
          <div className="flex gap-2">
            <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors shadow-sm">
              {isCopied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />} 
              Share
            </button>
            {canModify && (
              <>
                <Link to={`/recipes/${recipe.id}/edit`} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors shadow-sm">
                  <Edit2 className="h-4 w-4" /> Edit
                </Link>
                <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors shadow-sm">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </>
            )}
            {!isOwner && isAuthenticated && (
              <button onClick={() => toggleFavorite(recipe.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors shadow-sm">
                <Heart className={`h-4 w-4 ${recipe.is_favorite ? 'fill-red-500 text-red-500' : ''}`} /> 
                {recipe.is_favorite ? 'Saved' : 'Save'}
              </button>
            )}
            {isAdmin && !isOwner && (
              <button onClick={handleCopyRecipe} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium transition-colors shadow-sm">
                <Copy className="h-4 w-4" /> Copy Recipe
              </button>
            )}
          </div>
        </div>
      )}

      {/* Image Gallery */}
      <div className="h-[400px] w-full bg-gray-100 relative">
        {recipe.images && recipe.images.length > 0 ? (
          <Swiper
            pagination={{ clickable: true }}
            navigation={true}
            modules={[Pagination, Navigation]}
            className="w-full h-full"
          >
            {recipe.images.map((img) => (
              <SwiperSlide key={img.id}>
                <img 
                  src={img.url.startsWith('http') ? img.url : `${BASE_URL}${img.url}`} 
                  className="w-full h-full object-cover" 
                  alt={recipe.title} 
                />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-orange-50">
            <span className="text-8xl">🍽️</span>
          </div>
        )}
      </div>

      <div className="p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full capitalize">
            {recipe.category}
          </span>
          <span className={`text-sm font-medium px-3 py-1 rounded-full capitalize ${
            recipe.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            recipe.difficulty === 'medium' ? 'bg-amber-100 text-amber-800' :
            'bg-red-100 text-red-800'
          }`}>
            {recipe.difficulty}
          </span>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">{recipe.title}</h1>
        
        {recipe.description && (
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            {recipe.description}
          </p>
        )}

        <div className="flex flex-wrap gap-8 py-6 border-y border-gray-100 mb-8 bg-gray-50 rounded-2xl px-6">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full shadow-sm"><Clock className="h-6 w-6 text-orange-500" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Prep Time</p>
              <p className="font-semibold text-gray-900">{Math.round((recipe.prep_time_minutes || 0) * scaleFactor)} mins</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full shadow-sm"><Clock className="h-6 w-6 text-orange-500" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Cook Time</p>
              <p className="font-semibold text-gray-900">{Math.round((recipe.cook_time_minutes || 0) * scaleFactor)} mins</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full shadow-sm"><Users className="h-6 w-6 text-blue-500" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Servings</p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-600 transition-colors"
                >-</button>
                <span className="font-semibold text-gray-900 w-4 text-center">{servings}</span>
                <button 
                  onClick={() => setServings(servings + 1)}
                  className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-gray-600 transition-colors"
                >+</button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {/* Ingredients */}
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-600 p-1 rounded-lg">🛒</span>
              Ingredients
            </h2>
            <ul className="space-y-4">
              {recipe.ingredients?.map((ing, idx) => (
                <li key={idx} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0"></div>
                  <div>
                    <span className="font-semibold text-gray-900">
                      {ing.quantity ? (ing.quantity * scaleFactor).toFixed(1).replace(/\.0$/, '') : ''} {ing.unit}
                    </span>{' '}
                    <span className="text-gray-700">{ing.name}</span>
                    {ing.notes && <p className="text-sm text-gray-500 mt-0.5">{ing.notes}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-600 p-1 rounded-lg">👩‍🍳</span>
              Instructions
            </h2>
            <div className="space-y-6">
              {recipe.instructions?.split('\n').filter(s => s.trim()).map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center shadow-sm">
                    {idx + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews and Comments Section */}
        <div className="mt-12 pt-12 border-t border-gray-100">
          <div className="flex gap-8 border-b border-gray-100 mb-8">
            <button 
              onClick={() => setActiveSection('reviews')}
              className={`pb-4 font-bold text-lg transition-all relative ${activeSection === 'reviews' ? 'text-orange-600' : 'text-gray-400'}`}
            >
              Reviews ({reviews.length})
              {activeSection === 'reviews' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-t-full" />}
            </button>
            <button 
              onClick={() => setActiveSection('comments')}
              className={`pb-4 font-bold text-lg transition-all relative ${activeSection === 'comments' ? 'text-orange-600' : 'text-gray-400'}`}
            >
              Comments ({comments.length})
              {activeSection === 'comments' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-t-full" />}
            </button>
          </div>

          {activeSection === 'reviews' ? (
            <div className="space-y-8">
              {isAuthenticated && user?.id !== recipe.owner_id && !reviews.some(r => r.user_id === user?.id) && (
                <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
                  <h4 className="font-bold text-gray-900 mb-4">Rate this recipe</h4>
                  <form onSubmit={handlePostReview}>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star} 
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className={`p-1 transition-transform hover:scale-110`}
                        >
                          <Star className={`h-8 w-8 ${star <= newReview.rating ? 'fill-orange-500 text-orange-500' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                    <textarea 
                      placeholder="Share your experience with this recipe..."
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none min-h-[100px] text-sm"
                    />
                    <button 
                      type="submit"
                      className="mt-4 px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
                    >
                      Post Review
                    </button>
                  </form>
                </div>
              )}

              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <div key={rev.id} className="flex gap-4 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 uppercase">
                        {rev.username?.[0] || 'U'}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-900">{rev.username || 'Anonymous User'}</p>
                            <div className="flex gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className={`h-3 w-3 ${star <= rev.rating ? 'fill-orange-500 text-orange-500' : 'text-gray-200'}`} />
                              ))}
                            </div>
                          </div>
                          <span className="text-[11px] text-gray-400 font-medium uppercase tracking-widest">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{rev.comment}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-3xl">
                    <Star className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium italic">No reviews yet. Be the first to rate it!</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {isAuthenticated && (
                <div className="bg-blue-50/30 p-6 rounded-3xl border border-blue-50">
                  <h4 className="font-bold text-gray-900 mb-4">Leave a comment</h4>
                  <form onSubmit={handlePostComment}>
                    <textarea 
                      placeholder="Ask a question or share a thought..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none min-h-[100px] text-sm"
                    />
                    <button 
                      type="submit"
                      className="mt-4 px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-sm"
                    >
                      Post Comment
                    </button>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comm) => (
                    <div key={comm.id} className="p-6 bg-white border border-gray-50 rounded-3xl hover:border-gray-100 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs uppercase">
                            {comm.username?.[0] || 'U'}
                          </div>
                          <p className="font-bold text-gray-900 text-sm">{comm.username || 'User'}</p>
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(comm.created_at).toLocaleDateString()}</span>
                        </div>
                        {(comm.user_id === user?.id || user?.is_admin) && (
                          <button 
                            onClick={() => handleDeleteComment(comm.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed ml-11">{comm.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-3xl">
                    <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium italic">No comments yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailPage;
