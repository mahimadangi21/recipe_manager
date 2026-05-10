import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../api/axiosInstance';
import {
  Shield, Users, Mail, Calendar, Loader2, AlertCircle,
  ShieldAlert, UserCheck, UserMinus, BookOpen, Layers,
  BarChart3, MessageSquare, Star, FileText, ShieldCheck, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4`}>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
    </div>
  </div>
);

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [usersRes, analyticsRes] = await Promise.all([
        axiosInstance.get('/auth/users'),
        axiosInstance.get('/admin/dashboard/analytics'),
      ]);
      setUsers(usersRes.data || []);
      setAnalytics(analyticsRes.data || {});
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch admin data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAdmin = async (userId, currentStatus) => {
    try {
      await axiosInstance.put(`/auth/users/${userId}/role`, { is_admin: !currentStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, is_admin: !currentStatus } : u));
      toast.success('User role updated');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update user role');
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await axiosInstance.put(`/auth/users/${userId}/status`, { is_active: !currentStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update user status');
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-red-50 p-6 rounded-full mb-6">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 max-w-md">
          You do not have the required permissions to view this page. This area is reserved for administrators only.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'User Management' },
    { id: 'content', label: 'Content' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-xl">
              <Shield className="h-7 w-7 text-white" />
            </div>
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Manage users, content, and platform activity</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={Users} label="Users" value={analytics?.users} color="bg-purple-100 text-purple-600" />
          <StatCard icon={BookOpen} label="Recipes" value={analytics?.recipes} color="bg-orange-100 text-orange-600" />
          <StatCard icon={Layers} label="Collections" value={analytics?.collections} color="bg-blue-100 text-blue-600" />
          <StatCard icon={Star} label="Reviews" value={analytics?.reviews} color="bg-yellow-100 text-yellow-600" />
          <StatCard icon={MessageSquare} label="Comments" value={analytics?.comments} color="bg-green-100 text-green-600" />
          <StatCard icon={FileText} label="Pending" value={analytics?.pendingSubmissions} color="bg-red-100 text-red-600" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-xl font-medium text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      ) : activeTab === 'overview' ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" /> Quick Actions
            </h3>
            <div className="space-y-3">
              <button onClick={() => navigate('/recipes/new')} className="w-full flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors text-left">
                <BookOpen className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Create New Recipe</p>
                  <p className="text-xs text-gray-500">Add a new recipe to the platform</p>
                </div>
              </button>
              <button onClick={() => navigate('/submissions')} className="w-full flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-left">
                <FileText className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Review Submissions</p>
                  <p className="text-xs text-gray-500">{analytics?.pendingSubmissions} pending review</p>
                </div>
              </button>
              <button onClick={() => setActiveTab('users')} className="w-full flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-left">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Manage Users</p>
                  <p className="text-xs text-gray-500">{users.length} total registered users</p>
                </div>
              </button>
            </div>
          </div>

          {/* Platform Health */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="h-6 w-6 text-purple-200" />
              <h3 className="text-lg font-bold">Platform Health</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'API Status', status: 'Operational' },
                { label: 'Database', status: 'Connected' },
                { label: 'Auth Service', status: 'Active' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3">
                  <span className="text-purple-100 text-sm">{item.label}</span>
                  <span className="flex items-center gap-2 text-green-300 text-sm font-semibold">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-purple-200 text-xs mt-6">
              Admin: {user?.username} · Last refreshed: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">All Users</h2>
              <p className="text-sm text-gray-500">{users.length} registered accounts</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          className="h-10 w-10 rounded-full object-cover bg-gray-100 border border-gray-200"
                          src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.username}&background=f97316&color=fff`}
                          alt=""
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{u.username}</p>
                          <p className="text-xs text-gray-400">ID: {u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {u.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_admin ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                          <Shield className="h-3 w-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                          disabled={u.id === user.id}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${u.is_admin ? 'text-purple-600 hover:bg-purple-50' : 'text-gray-400 hover:bg-gray-50'}`}
                          title={u.is_admin ? 'Demote to User' : 'Promote to Admin'}
                        >
                          <ShieldAlert className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u.id, u.is_active)}
                          disabled={u.id === user.id}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${u.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={u.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {u.is_active ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-orange-100 p-3 rounded-2xl">
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Platform Recipes</h3>
                <p className="text-sm text-gray-500">{analytics?.recipes} total recipes published</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/recipes')}
              className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
            >
              Browse & Manage Recipes
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-100 p-3 rounded-2xl">
                <Layers className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">User Collections</h3>
                <p className="text-sm text-gray-500">{analytics?.collections} collections created</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/collections')}
              className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
            >
              Monitor Collections
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-red-100 p-3 rounded-2xl">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Recipe Submissions</h3>
                <p className="text-sm text-gray-500">{analytics?.pendingSubmissions} awaiting review</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/submissions')}
              className="w-full py-3 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition-colors"
            >
              Review Submissions
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-yellow-100 p-3 rounded-2xl">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Community Engagement</h3>
                <p className="text-sm text-gray-500">{analytics?.reviews} reviews · {analytics?.comments} comments</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/recipes')}
              className="w-full py-3 bg-yellow-50 text-yellow-700 rounded-xl font-medium hover:bg-yellow-100 transition-colors"
            >
              View All Recipes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
