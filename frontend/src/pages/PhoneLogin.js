import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, CheckCircle } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../utils/toast';

const PhoneLogin = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const [resendSeconds, setResendSeconds] = useState(52);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    console.log('Sending OTP to:', phone);
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/send-otp', { phone });
      setOtpSent(true);
      setTempPhone(phone);
      setResendSeconds(52);
      toast.success(response.data.message || 'OTP sent successfully');
      if (process.env.NODE_ENV === 'development' && response.data.otp) {
        toast.info(`Development OTP: ${response.data.otp}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!otpSent || resendSeconds <= 0) return;

    const timer = setInterval(() => {
      setResendSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [otpSent, resendSeconds]);

  const handleResendOTP = async () => {
    if (!tempPhone || resendSeconds > 0) return;

    setLoading(true);
    try {
      const response = await api.post('/api/auth/send-otp', { phone: tempPhone });
      setResendSeconds(52);
      setOtp('');
      toast.success(response.data.message || 'OTP resent successfully');
      if (process.env.NODE_ENV === 'development' && response.data.otp) {
        toast.info(`Development OTP: ${response.data.otp}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/verify-otp', { phone: tempPhone, otp });
      
      if (response.data.isNewUser) {
        // New user - redirect to role selection
        navigate('/role-selection', { state: { phone: response.data.phone } });
      } else {
        // Existing user - login
        login(response.data.user);
        toast.success('Logged in successfully');
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundImage: `url('https://static.prod-images.emergentagent.com/jobs/a65215cc-1af9-49fb-adba-a050f0ccd8b2/images/6fdb1da7a4425f7079e157cc4fa49a295b46a0f0399d96e71ece64a6351bbc51.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="bg-white border border-slate-200 p-8 md:p-12 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 font-heading tracking-tight">Welcome</h1>
          <p className="text-base text-slate-600 font-body">Enter your phone number to get started</p>
        </div>

        {!otpSent ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-900 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border border-slate-200 rounded-none px-4 py-3 pl-12 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  data-testid="phone-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-none px-6 py-3 font-medium hover:bg-primary-hover transition-all disabled:opacity-50"
              data-testid="send-otp-button"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-success mb-4">
              <CheckCircle size={16} />
              <span>OTP sent to {tempPhone}</span>
            </div>

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-slate-900 mb-2">
                Enter OTP
              </label>
              <input
                id="otp"
                type="text"
                maxLength="6"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="border border-slate-200 rounded-none px-4 py-3 w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-center text-2xl tracking-widest"
                data-testid="otp-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-none px-6 py-3 font-medium hover:bg-primary-hover transition-all disabled:opacity-50"
              data-testid="verify-otp-button"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading || resendSeconds > 0}
              className="w-full border border-slate-200 text-slate-900 rounded-none px-6 py-3 font-medium hover:border-primary hover:text-primary transition-all disabled:opacity-50"
              data-testid="resend-otp-button"
            >
              {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
            </button>

            <button
              type="button"
              onClick={() => { setOtpSent(false); setOtp(''); setResendSeconds(52); }}
              className="w-full text-slate-600 text-sm hover:text-slate-900 transition-all"
            >
              Change phone number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PhoneLogin;