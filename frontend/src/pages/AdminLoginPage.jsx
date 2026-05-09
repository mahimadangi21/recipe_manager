import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Shield, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import axiosInstance from '../api/axiosInstance';

const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAdminStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(adminLoginSchema)
  });

  useEffect(() => {
    if (useAdminStore.getState().isAuthenticated) {
      console.log('Admin is already authenticated, redirecting to /admin/dashboard');
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    console.log('Admin login attempt started:', data.email);
    try {
      const response = await login(data);
      console.log('Admin Login API Response:', response);
      
      if (response.success) {
        // Verification
        const storedToken = localStorage.getItem('adminToken');
        const storedRole = localStorage.getItem('role');
        console.log('Stored Admin Data Check:', { token: !!storedToken, role: storedRole });

        toast.success('Admin authentication successful');
        console.log('Redirecting to /admin/dashboard...');
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('Admin Login Error:', err);
      const msg = err.response?.data?.detail || 'Admin login failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50/50">
      <div className="relative overflow-hidden bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-gray-100">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-purple-200/30 blur-3xl" />
        
        <div className="text-center mb-10">
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 w-20 h-20 rounded-3xl rotate-12 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200">
            <Shield className="h-10 w-10 text-white -rotate-12" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Portal</h1>
          <p className="text-gray-500 mt-2 font-medium">Secure access for RecipeManager staff</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 ml-1">Admin Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-500 text-gray-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                {...register('email')}
                type="email"
                className={`block w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 ${errors.email ? 'border-red-200 focus:border-red-500 focus:ring-red-500/10' : 'border-transparent focus:border-orange-500 focus:ring-orange-500/10'} rounded-2xl shadow-sm focus:outline-none transition-all sm:text-sm font-medium text-gray-900`}
                placeholder="admin@recipemanager.com"
              />
            </div>
            {errors.email && <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="block text-sm font-bold text-gray-700">Password</label>
              <button type="button" className="text-xs font-bold text-orange-600 hover:text-orange-700">Forgot?</button>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-500 text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`block w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 ${errors.password ? 'border-red-200 focus:border-red-500 focus:ring-red-500/10' : 'border-transparent focus:border-orange-500 focus:ring-orange-500/10'} rounded-2xl shadow-sm focus:outline-none transition-all sm:text-sm font-medium text-gray-900`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-xs font-bold text-red-500 ml-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 focus:outline-none focus:ring-4 focus:ring-orange-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  Authenticate
                  <Shield className="h-4 w-4" />
                </>
              )}
            </span>
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Authorized Access Only</p>
          <p className="mt-2 text-[10px] text-gray-400 leading-relaxed">
            This system is protected by end-to-end encryption. All login attempts are logged and monitored for security purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
