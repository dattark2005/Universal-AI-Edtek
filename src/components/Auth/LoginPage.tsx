import React, { useState } from 'react';
import { User, BookOpen, GraduationCap, Sparkles, Star, Eye, EyeOff } from 'lucide-react';
import { User as UserType } from '../../types';
import { authAPI, setAuthToken } from '../../services/api';

interface LoginPageProps {
  onLogin: (user: UserType) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'teacher'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      
      if (isLogin) {
        // Login request
        response = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
      } else {
        // Registration request
        response = await authAPI.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        });
      }

      if (response.success) {
        // Store auth token
        setAuthToken(response.data.token);
        
        // Store user data
        const userData: UserType = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          avatar: response.data.user.avatar,
          role: response.data.user.role,
          bio: response.data.user.bio,
          joinedAt: new Date(response.data.user.joinedAt || response.data.user.createdAt)
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        onLogin(userData);
      } else {
        setError(response.message || 'Authentication failed');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // For now, we'll show a message that Google OAuth needs to be set up
      setError('Google OAuth is not configured yet. Please use email/password authentication.');
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-bounce-gentle"></div>
      </div>

      <div className="glass-morphism rounded-3xl p-8 w-full max-w-md shadow-glass border border-white/20 relative z-10 animate-scale-in">
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl mx-auto flex items-center justify-center shadow-glow">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-bounce-gentle" />
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-3 text-shadow-lg bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            EduAI Platform
          </h1>
          <p className="text-white/80 font-medium text-lg">Your AI-powered learning companion</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-6">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              isLogin
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              !isLogin
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                required={!isLogin}
                className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          )}

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {!isLogin && (
            <div>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="student" className="bg-gray-800">I'm a Student</option>
                <option value="teacher" className="bg-gray-800">I'm a Teacher</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 rounded-2xl font-display font-semibold transition-all duration-300 ${
              loading
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-glow hover:shadow-glow-lg hover:scale-105'
            }`}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-white/60">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full mt-4 bg-white text-neutral-800 py-4 px-6 rounded-2xl font-display font-semibold flex items-center justify-center gap-3 transition-all duration-300 shadow-card hover:shadow-card-hover hover:scale-105 group ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 rounded-full group-hover:animate-spin"></div>
            <span className="text-lg">Continue with Google</span>
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Join thousands of learners worldwide
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;