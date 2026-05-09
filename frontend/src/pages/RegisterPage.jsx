import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ChefHat, Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    try {
      await signup({
        username: data.username,
        email: data.email,
        password: data.password
      });
      toast.success('Verification code sent to your email!');
      navigate('/verify-otp', { state: { email: data.email, type: 'signup' } });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="relative overflow-hidden bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="text-center mb-8">
          <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create an Account</h1>
          <p className="text-gray-500 mt-2">Join RecipeManager today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('username')}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 focus:ring-orange-500 focus:border-orange-500 rounded-xl shadow-sm sm:text-sm"
                placeholder="chef123"
              />
            </div>
            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('email')}
                type="email"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 focus:ring-orange-500 focus:border-orange-500 rounded-xl shadow-sm sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
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
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 focus:ring-orange-500 focus:border-orange-500 rounded-xl shadow-sm sm:text-sm"
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 focus:ring-orange-500 focus:border-orange-500 rounded-xl shadow-sm sm:text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">Already have an account? </span>
          <Link to="/login" className="font-medium text-orange-600 hover:text-orange-500">
            Log in
          </Link>
        </div>
        <p className="mt-5 text-center text-xs text-gray-400">Build your personal cookbook and access recipes anywhere.</p>
      </div>
    </div>
  );
};

export default RegisterPage;
