import { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  Star, 
  TrendingUp, 
  Clock, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  ExternalLink,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Loader2,
  Bell,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/adminApi';
import { toast } from 'react-hot-toast';

const AdminDashboardPage = ({ activeTab = 'overview' }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);

  const filteredRecipes = recipes.filter(r => 
    filterStatus === 'all' ? true : r.status === filterStatus
  );

  useEffect(() => {
    fetchData();
    
    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(() => {
      fetchData(); // Refresh all data to keep stats up to date
    }, 30000);
    
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch individually to prevent one failure from blocking others
    const fetchAnalytics = async () => {
      try {
        const res = await adminApi.getAnalytics();
        setStats(res.data);
      } catch (e) {
        console.error('Analytics failed:', e);
        const errorMsg = e.response?.data?.message || e.response?.data?.detail || e.message || 'Failed to load metrics';
        toast.error(errorMsg);
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await adminApi.getUsers();
        setUsers(res.data || []);
      } catch (e) {
        console.error('Users failed:', e);
        const errorMsg = e.response?.data?.message || e.response?.data?.detail || e.message || 'Failed to load users';
        toast.error(errorMsg);
      }
    };

    const fetchRecipes = async () => {
      try {
        const res = await adminApi.getRecipes();
        setRecipes(res.data || []);
      } catch (e) {
        console.error('Recipes failed:', e);
        const errorMsg = e.response?.data?.message || e.response?.data?.detail || e.message || 'Failed to load recipes';
        toast.error(errorMsg);
      }
    };

    const fetchSubmissions = async () => {
      try {
        const res = await adminApi.getSubmissions();
        setSubmissions(res.data || []);
      } catch (e) {
        console.error('Submissions failed:', e);
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await adminApi.getNotifications();
        setNotifications(res.data || []);
      } catch (e) {
        console.error('Notifications failed:', e);
      }
    };

    try {
      await Promise.allSettled([
        fetchAnalytics(),
        fetchUsers(),
        fetchRecipes(),
        fetchSubmissions(),
        fetchNotifications()
      ]);
    } catch (e) {
      console.error('Data fetch critical error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (userId) => {
    setActionLoading(`user-${userId}`);
    try {
      await adminApi.toggleUserStatus(userId);
      toast.success('User status updated');
      await fetchData();
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setActionLoading(`delete-user-${userId}`);
    try {
      await adminApi.deleteUser(userId);
      toast.success('User deleted');
      await fetchData();
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;
    setActionLoading(`recipe-${recipeId}`);
    try {
      await adminApi.deleteRecipe(recipeId);
      toast.success('Recipe deleted');
      await fetchData();
    } catch (error) {
      toast.error('Failed to delete recipe');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (subId) => {
    setActionLoading(`sub-${subId}`);
    try {
      await adminApi.approveSubmission(subId);
      toast.success('Recipe approved');
      await fetchData();
    } catch (error) {
      toast.error('Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (subId) => {
    setActionLoading(`sub-reject-${subId}`);
    try {
      await adminApi.rejectSubmission(subId);
      toast.success('Submission rejected');
      await fetchData();
    } catch (error) {
      toast.error('Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      toast.error('Failed to mark as read');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
          <p className="text-gray-500 font-medium">Initializing Administration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Banner */}
      <div className="bg-white border-b border-gray-200 pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-orange-600" />
                Administrative Command Center
              </h1>
              <p className="text-gray-500 text-sm mt-1">Real-time platform metrics and management</p>
            </div>
            <div className="flex items-center gap-4 relative">
              <div className="flex items-center gap-2">
                <button 
                  onClick={fetchData}
                  disabled={loading}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh Data
                </button>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-xl border transition-all relative ${showNotifications ? 'text-orange-600 bg-orange-50 border-orange-100' : 'text-gray-400 hover:text-orange-500 bg-white border-gray-100'}`}
                >
                  <Bell className="h-6 w-6" />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                      <h4 className="font-bold text-gray-900 text-sm">Notifications</h4>
                      <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{notifications.filter(n => !n.is_read).length} Unread</span>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                            className={`p-4 border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${n.is_read ? 'opacity-60' : 'bg-orange-50/30 hover:bg-orange-50'}`}
                          >
                            <div className="flex gap-3">
                              <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${n.is_read ? 'bg-orange-500' : 'bg-gray-300'}`} />
                              <div>
                                <p className="text-xs font-bold text-gray-800">{n.title}</p>
                                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                                <p className="text-[9px] text-gray-400 mt-2">{new Date(n.created_at).toLocaleTimeString()}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center">
                          <Bell className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-xs text-gray-400 font-medium">All caught up!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-gray-900">Admin User</p>
                  <p className="text-[10px] text-gray-400 font-medium tracking-tighter">COMMAND CENTER</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border-2 border-white shadow-sm">
                  UN
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-8 mt-8 border-b border-transparent">
            {[
              { id: 'overview', label: 'Overview', path: '/admin/dashboard' },
              { id: 'users', label: 'Users', path: '/admin/users' },
              { id: 'recipes', label: 'Recipes', path: '/admin/recipes' },
              { id: 'submissions', label: 'Submissions', path: '/admin/submissions' },
              { id: 'notifications', label: 'Notifications', path: '/admin/notifications', badge: notifications.some(n => !n.is_read) }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`pb-4 px-1 text-sm font-bold uppercase tracking-wider transition-all relative ${
                  activeTab === tab.id ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  {tab.label}
                  {tab.badge && (
                    <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                  )}
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard title="Total Users" value={stats?.totalUsers} icon={<Users />} color="blue" />
              <StatCard title="All Recipes" value={stats?.totalRecipes} icon={<BookOpen />} color="orange" />
              <StatCard title="Approved" value={stats?.approvedRecipes} icon={<CheckCircle2 />} color="green" />
              <StatCard title="Pending" value={stats?.pendingSubmissions} icon={<MessageSquare />} color="amber" />
              <StatCard title="Rejected" value={stats?.rejectedRecipes} icon={<XCircle />} color="red" />
              <StatCard title="Engagement" value={stats?.engagement} icon={<TrendingUp />} color="purple" />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Recent Submissions
                </h3>
                <div className="space-y-4">
                  {submissions.slice(0, 5).map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                          {sub.title?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{sub.title}</p>
                          <p className="text-xs text-gray-500">By {sub.submitter_name || 'Unknown'} · {new Date(sub.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300" />
                    </div>
                  ))}
                  {submissions.length === 0 && <p className="text-center py-8 text-gray-400 italic">No pending submissions</p>}
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  New Users
                </h3>
                <div className="space-y-4">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {user.username?.[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900">{user.username}</p>
                            {(new Date() - new Date(user.created_at)) / (1000 * 60 * 60) < 24 && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-[8px] font-black text-green-700 uppercase rounded border border-green-200">New</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                        {user.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">User Management</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none w-64"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                            {user.username?.[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900">{user.username}</p>
                              {(new Date() - new Date(user.created_at)) / (1000 * 60 * 60) < 24 && (
                                <span className="px-2 py-0.5 bg-green-500 text-[10px] font-black text-white uppercase rounded-lg shadow-sm shadow-green-100">New</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`flex items-center gap-1.5 text-xs font-bold ${
                          user.is_active ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-green-600' : 'bg-red-600'}`} />
                          {user.is_active ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleToggleUser(user.id)}
                            disabled={actionLoading === `user-${user.id}`}
                            className={`p-2 rounded-xl transition-all ${
                              user.is_active ? 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600' : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                            title={user.is_active ? 'Block User' : 'Unblock User'}
                          >
                            {actionLoading === `user-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : (user.is_active ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />)}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={actionLoading === `delete-user-${user.id}`}
                            className="p-2 bg-gray-100 text-gray-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                          >
                            {actionLoading === `delete-user-${user.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'recipes' && (
          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Platform Recipes</h3>
              <div className="flex items-center gap-3">
                <select 
                  className="bg-gray-50 border-none rounded-xl text-sm px-4 py-2 focus:ring-2 focus:ring-orange-500/20 outline-none"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button 
                  onClick={() => navigate('/recipes/new')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all"
                >
                  + Add Recipe
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
              {filteredRecipes.map((recipe) => (
                <div key={recipe.id} className="group bg-white rounded-[2rem] border border-gray-100 hover:border-orange-200 transition-all overflow-hidden shadow-sm hover:shadow-md">
                  {/* Image Preview */}
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    <img 
                      src={recipe.images?.[0]?.url.startsWith('http') ? recipe.images[0].url : `http://localhost:8000${recipe.images?.[0]?.url}`} 
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=1000'; }}
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        className="p-2 bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-600 rounded-xl transition-all shadow-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest text-gray-900 rounded-full shadow-sm">
                        {recipe.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="font-bold text-gray-900 text-lg mb-1 truncate">{recipe.title}</h4>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${recipe.is_public ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs font-bold text-gray-400">{recipe.is_public ? 'Public' : 'Private'}</span>
                      </div>
                      <button 
                        onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
                      >
                        Manage <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Review Queue</h3>
              <p className="text-sm text-gray-500 mt-1">Approve or reject community recipe contributions</p>
            </div>
            <div className="divide-y divide-gray-100">
              {submissions.map((sub) => (
                <div key={sub.id} className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-gray-50/30 transition-colors">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                      <BookOpen className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-gray-900 text-lg">{sub.title}</h4>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                          sub.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 max-w-md line-clamp-2">{sub.description || sub.payload?.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleApprove(sub.id)}
                      disabled={actionLoading === `sub-${sub.id}` || sub.status !== 'pending'}
                      className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading === `sub-${sub.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(sub.id)}
                      disabled={actionLoading === `sub-reject-${sub.id}` || sub.status !== 'pending'}
                      className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading === `sub-reject-${sub.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && <div className="p-20 text-center text-gray-400 italic">Queue is empty</div>}
            </div>
          </div>
        )}



        {activeTab === 'notifications' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Platform Notifications</h3>
                <p className="text-sm text-gray-500 mt-1">Audit log of system events and user actions</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={async () => {
                    try {
                      await axiosInstance.post('/notifications/clear-all');
                      setNotifications([]);
                      toast.success('All notifications cleared');
                    } catch (e) {
                      toast.error('Failed to clear notifications');
                    }
                  }}
                  className="px-4 py-2 text-gray-500 hover:text-red-600 text-sm font-bold transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className={`p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors ${n.is_read ? 'opacity-75' : 'bg-orange-50/20'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${n.is_read ? 'bg-gray-100 text-gray-400' : 'bg-orange-100 text-orange-600'}`}>
                        <Bell className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-bold text-gray-900 ${n.is_read ? '' : 'text-orange-900'}`}>{n.title}</p>
                          {!n.is_read && <span className="px-2 py-0.5 rounded-full bg-orange-500 text-[10px] text-white font-bold uppercase tracking-wider">New</span>}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(n.created_at).toLocaleString()}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> {n.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!n.is_read && (
                      <button 
                        onClick={() => handleMarkAsRead(n.id)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Bell className="h-10 w-10 text-gray-300" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">No Notifications</h4>
                  <p className="text-gray-500 mt-2">The platform audit log is currently empty.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    red: 'bg-red-50 text-red-600 border-red-100'
  };

  return (
    <div className={`p-8 rounded-[2.5rem] bg-white border border-gray-200 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm border ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">{title}</p>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
