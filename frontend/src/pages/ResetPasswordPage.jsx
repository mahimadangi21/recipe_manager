import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { Lock, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const otp = location.state?.otp;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email || !otp) {
      navigate('/forgot-password');
    }
  }, [email, otp, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/auth/reset-password', {
        email,
        otp,
        new_password: password
      });

      if (response.success) {
        toast.success(response.message || 'Password reset successfully!');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">New Password</h2>
          <p className="mt-3 text-gray-500">
            Create a secure new password for your account.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Confirm New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
              <span className="flex items-center gap-2">
                Update Password <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
