import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setMessage(res.data.message || 'If that email is registered, a reset link has been sent.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-red-600 p-4">
      <div className="glass-morphism rounded-3xl p-8 w-full max-w-md shadow-glass border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Forgot Password</h2>
        {message && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-4 text-green-300 text-sm text-center">{message}</div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 text-red-300 text-sm text-center">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            required
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
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            className="text-indigo-300 hover:underline text-sm"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 