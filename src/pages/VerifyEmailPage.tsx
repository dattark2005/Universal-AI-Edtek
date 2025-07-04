import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }
    axios.get(`/api/auth/verify-email?token=${token}`)
      .then(res => {
        if (res.data.success) {
          setStatus('success');
          setMessage('Your email has been verified! You can now log in.');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(res.data.message || 'Verification failed.');
        }
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed.');
      });
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-red-600 p-4">
      <div className="glass-morphism rounded-3xl p-8 w-full max-w-md shadow-glass border border-white/20 text-center">
        <h2 className="text-2xl font-bold text-white mb-6">Email Verification</h2>
        <div className={`p-4 rounded-lg mb-4 ${status === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-300' : status === 'error' ? 'bg-red-500/20 border border-red-500/30 text-red-300' : 'bg-blue-500/20 border border-blue-500/30 text-blue-200'}`}>{message}</div>
        {status !== 'pending' && (
          <button
            className="mt-4 px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage; 