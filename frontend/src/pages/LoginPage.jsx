import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ChefHat, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('User is already authenticated, redirecting to /dashboard');
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    console.log('Login attempt started:', data.identifier);
    try {
      const response = await login(data.identifier, data.password);
      console.log('Login API Response:', response);
      
      // Verification
      const storedToken = localStorage.getItem('token');
      const storedRole = localStorage.getItem('role');
      console.log('Stored Data Check:', { token: !!storedToken, role: storedRole });

      toast.success('Welcome back!');
      console.log('Redirecting to /dashboard...');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login Error:', error);
      toast.error(error.response?.data?.detail || 'Failed to login');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="relative overflow-hidden bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-orange-200/50 blur-3xl" />
        <div className="text-center mb-8">
          <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to continue to RecipeManager</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('identifier')}
                type="text"
                className={`block w-full pl-10 pr-3 py-2 border ${errors.identifier ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'} rounded-xl shadow-sm focus:outline-none transition-colors sm:text-sm`}
                placeholder="you@example.com or username"
              />
            </div>
            {errors.identifier && <p className="mt-1 text-sm text-red-600">{errors.identifier.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`block w-full pl-10 pr-10 py-2 border ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'} rounded-xl shadow-sm focus:outline-none transition-colors sm:text-sm`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            <div className="flex justify-end mt-1">
              <Link to="/forgot-password" size="sm" className="text-sm font-medium text-orange-600 hover:text-orange-500 transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">Don't have an account? </span>
          <Link to="/register" className="font-medium text-orange-600 hover:text-orange-500">
            Sign up
          </Link>
        </div>
        <p className="mt-5 text-center text-xs text-gray-400">Cook smarter, save favorites, and plan delicious meals.</p>
      </div>
    </div>
  );
};

export default LoginPage;
