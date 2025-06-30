import React, { useState } from 'react';
import { User, Edit3, Save, X, Calendar, Mail, BookOpen } from 'lucide-react';
import { getCurrentUser, updateUserProfile, getUserQuizResults, getUserClassrooms } from '../../utils/storage';

const ProfileSection: React.FC = () => {
  const [user, setUser] = useState(getCurrentUser());
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    bio: user?.bio || ''
  });

  if (!user) return null;

  const quizResults = getUserQuizResults(user.id);
  const classrooms = getUserClassrooms(user.id, user.role);
  const averageScore = quizResults.length > 0 
    ? Math.round(quizResults.reduce((sum, result) => sum + result.score, 0) / quizResults.length)
    : 0;

  const handleSave = () => {
    updateUserProfile(editForm);
    setUser({ ...user, ...editForm });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      name: user.name,
      bio: user.bio || ''
    });
    setIsEditing(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Profile</h2>
      
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-start gap-6">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-full border-4 border-white/30"
            />
            
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-white">{user.name}</h3>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-white/70" />
                    <span className="text-white/70 capitalize">{user.role}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-4 h-4 text-white/70" />
                    <span className="text-white/70">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-white/70" />
                    <span className="text-white/70">
                      Joined {new Date(user.joinedAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  {user.bio && (
                    <p className="text-white/80 leading-relaxed">{user.bio}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {user.role === 'student' && (
            <>
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-6 h-6 text-blue-300" />
                  <h4 className="text-lg font-semibold text-white">Quizzes Taken</h4>
                </div>
                <p className="text-3xl font-bold text-white">{quizResults.length}</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-6 h-6 text-green-300" />
                  <h4 className="text-lg font-semibold text-white">Average Score</h4>
                </div>
                <p className="text-3xl font-bold text-white">{averageScore}%</p>
              </div>
            </>
          )}
          
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-orange-300" />
              <h4 className="text-lg font-semibold text-white">Classrooms</h4>
            </div>
            <p className="text-3xl font-bold text-white">{classrooms.length}</p>
          </div>
        </div>

        {/* Classrooms */}
        {classrooms.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h4 className="text-lg font-semibold text-white mb-4">My Classrooms</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  className={`bg-gradient-to-r ${classroom.color} backdrop-blur-sm rounded-lg p-4 border border-white/20`}
                >
                  <h5 className="text-white font-semibold mb-1">{classroom.name}</h5>
                  <p className="text-white/70 text-sm mb-2">{classroom.subject}</p>
                  <p className="text-white/60 text-xs">
                    {user.role === 'teacher' ? `${classroom.students.length} students` : `Code: ${classroom.code}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {user.role === 'student' && quizResults.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h4 className="text-lg font-semibold text-white mb-4">Recent Quiz Results</h4>
            <div className="space-y-3">
              {quizResults.slice(-5).reverse().map((result) => (
                <div key={result.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{result.subject}</p>
                    <p className="text-white/60 text-sm">
                      {new Date(result.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{result.score}%</p>
                    <p className="text-white/60 text-sm">
                      {Math.round((result.score / 100) * result.totalQuestions)}/{result.totalQuestions}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSection;