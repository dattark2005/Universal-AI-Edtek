import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

function validatePassword(password: string) {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain a number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain a special character.';
  return '';
}

interface SetPasswordProps {
  onPasswordSet: (password: string) => void;
}

const SetPassword: React.FC<SetPasswordProps> = ({ onPasswordSet }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    onPasswordSet(password);
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
          <h2 className="text-3xl font-bold text-white mb-2 text-shadow-lg bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Set Your Password</h2>
          <p className="text-white/80 font-medium text-lg">Create a password to secure your account</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-12"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-12"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70"
              onClick={() => setShowConfirmPassword(v => !v)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button type="submit" className="bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">Set Password</button>
        </form>
      </div>
    </div>
  );
};

export default SetPassword;
