import React, { useState } from 'react';

interface RoleSelectionProps {
  onRoleSelected: (role: 'student' | 'teacher') => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelected }) => {
  const [role, setRole] = useState<'student' | 'teacher' | ''>('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError('Please select a role.');
      return;
    }
    setError('');
    onRoleSelected(role as 'student' | 'teacher');
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
          <h2 className="text-3xl font-bold text-white mb-2 text-shadow-lg bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Choose Your Role</h2>
          <p className="text-white/80 font-medium text-lg">Select your role to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 justify-center w-full">
            {/* Student Box */}
            <div
              className={`glass-morphism py-4 px-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer w-full text-center shadow-lg ${role === 'student' ? 'border-blue-500 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 shadow-blue-500/30 scale-105 ring-2 ring-blue-400' : 'border-white/20 bg-white/5 hover:scale-105'}`}
              onClick={() => setRole('student')}
            >
              <input
                type="radio"
                name="role"
                value="student"
                checked={role === 'student'}
                onChange={() => setRole('student')}
                className="hidden"
              />
              <div className="text-xl font-semibold text-white mb-2 text-center">I am a Student</div>
            </div>
            {/* Teacher Box */}
            <div
              className={`glass-morphism py-4 px-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer w-full text-center shadow-lg ${role === 'teacher' ? 'border-blue-500 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 shadow-blue-500/30 scale-105 ring-2 ring-blue-400' : 'border-white/20 bg-white/5 hover:scale-105'}`}
              onClick={() => setRole('teacher')}
            >
              <input
                type="radio"
                name="role"
                value="teacher"
                checked={role === 'teacher'}
                onChange={() => setRole('teacher')}
                className="hidden"
              />
              <div className="text-xl font-semibold text-white mb-2 text-center">I am a Teacher</div>
            </div>
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button type="submit" className="bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">Continue</button>
        </form>
      </div>
    </div>
  );
};

export default RoleSelection; 