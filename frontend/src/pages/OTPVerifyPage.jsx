import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { ShieldCheck, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

const OTPVerifyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const type = location.state?.type || 'signup';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      toast.error('Please enter complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/auth/verify-otp', {
        email,
        otp: otpCode,
        type
      });

      if (response.success) {
        toast.success(response.message || 'Verification successful');
        if (type === 'signup') {
          navigate('/login');
        } else {
          navigate('/reset-password', { state: { email, otp: otpCode } });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
    setResendLoading(true);
    try {
      await axiosInstance.post('/auth/send-otp', {
        email,
        type
      });
      toast.success('OTP sent to your email');
      setTimer(30);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Verify Code</h2>
          <p className="mt-3 text-gray-500">
            Enter the 6-digit code sent to <br />
            <span className="font-bold text-gray-900">{email}</span>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold text-gray-900 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-orange-500 focus:bg-white focus:outline-none transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
              <span className="flex items-center gap-2">
                Verify OTP <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </button>
        </form>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={timer > 0 || resendLoading}
            className={`inline-flex items-center gap-2 text-sm font-bold transition-colors ${
              timer > 0 ? 'text-gray-400' : 'text-orange-600 hover:text-orange-700'
            }`}
          >
            {resendLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            {timer > 0 ? `Resend code in ${timer}s` : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerifyPage;
