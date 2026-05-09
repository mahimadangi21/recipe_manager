import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { Mail, ArrowRight, Loader2, ChevronLeft, KeyRound } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      if (response.success) {
        toast.success(response.message || 'OTP sent to your email');
        navigate('/verify-otp', { state: { email, type: 'reset' } });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
            <KeyRound className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Forgot Password?</h2>
          <p className="mt-3 text-gray-500">
            No worries! Enter your email below and we'll send you a code to reset it.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all sm:text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                <span className="flex items-center gap-2">
                  Send Reset Code <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors py-2"
            >
              <ChevronLeft className="h-4 w-4" /> Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
