import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { setAuthToken } from '../services/api';

const VerifyEmailCodePage: React.FC = () => {
  const location = useLocation();
  const [email, setEmail] = useState(() => (location.state && (location.state as any).email) || '');
  const [password] = useState(() => (location.state && (location.state as any).password) || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !code) {
      setError('Please enter your email and the verification code.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-email-code', { email, code });
      if (res.data.success) {
        if (password) {
          // Auto-login after verification
          const loginRes = await axios.post('/api/auth/login', { email, password });
          if (loginRes.data.success && loginRes.data.token) {
            setAuthToken(loginRes.data.token);
            localStorage.setItem('currentUser', JSON.stringify(loginRes.data.user || loginRes.data.data?.user));
            setSuccess('Email verified and logged in! Redirecting to dashboard...');
            setTimeout(() => navigate('/dashboard'), 1500);
            return;
          }
        }
        setSuccess('Email verified successfully! Please log in.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(res.data.message || 'Verification failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMessage('');
    setResendLoading(true);
    try {
      const res = await axios.post('/api/auth/resend-verification', { email });
      setResendMessage(res.data.message || 'Verification code resent.');
    } catch (err: any) {
      setResendMessage(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-red-600 p-4">
      <div className="glass-morphism rounded-3xl p-8 w-full max-w-md shadow-glass border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Verify Your Email</h2>
        <p className="text-white/80 text-center mb-4">Enter the 6-digit code sent to your email address.</p>
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 text-red-300 text-sm text-center">{error}</div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-4 text-green-300 text-sm text-center">{success}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            required
          />
          <input
            type="text"
            placeholder="6-digit Code"
            value={code}
            onChange={e => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            required
            maxLength={6}
            pattern="[0-9]{6}"
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 rounded-2xl font-display font-semibold transition-all duration-300 ${
              loading
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-glow hover:shadow-glow-lg hover:scale-105'
            }`}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            className="text-indigo-300 hover:underline text-sm"
            onClick={handleResend}
            disabled={resendLoading || !email}
          >
            {resendLoading ? 'Resending...' : 'Resend Code'}
          </button>
          {resendMessage && <div className="mt-2 text-xs text-white">{resendMessage}</div>}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailCodePage; 