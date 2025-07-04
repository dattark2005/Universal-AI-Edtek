import React, { useState, useEffect } from "react";
import { User, Edit3, Save, X, Calendar, Mail, BookOpen, Eye, EyeOff } from "lucide-react";
import {
  getCurrentUser,
  updateUserProfile,
  getUserQuizResults,
  getUserClassrooms,
} from "../../utils/storage";
import { eduAPI } from "../../services/api";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ProfileSection: React.FC = () => {
  const [user, setUser] = useState(getCurrentUser());
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  if (!user) return null;

  const quizResults = getUserQuizResults(user.id);
  const classrooms = getUserClassrooms(user.id, user.role);
  const averageScore =
    quizResults.length > 0
      ? Math.round(
          quizResults.reduce((sum, result) => sum + result.score, 0) /
            quizResults.length
        )
      : 0;

  // Set hasPassword based on user data from context/props
  useEffect(() => {
    // Since we don't have the /api/auth/me endpoint, we'll set hasPassword to true
    // for now, or you can implement this logic based on your user data source
    setHasPassword(true);
  }, []);

  function validatePassword(password: string) {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain a number.';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain a special character.';
    return '';
  }

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.put(
        "/api/users/profile",
        { name: editForm.name, bio: editForm.bio },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUserProfile(editForm);
      setUser({ ...user, ...editForm });
      setIsEditing(false);
    } catch (err) {
      // handle error
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: user.name,
      bio: user.bio || "",
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
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <textarea
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm({ ...editForm, bio: e.target.value })
                    }
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
                    <h3 className="text-2xl font-bold text-white">
                      {user.name}
                    </h3>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-white/70" />
                    <span className="text-white/70 capitalize">
                      {user.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-4 h-4 text-white/70" />
                    <span className="text-white/70">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-white/70" />
                    <span className="text-white/70">
                      Joined{" "}
                      {new Date(
                        user.joinedAt || Date.now()
                      ).toLocaleDateString()}
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
          {user.role === "student" && (
            <>
              <div
                className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 cursor-pointer hover:shadow-lg transition"
                onClick={() => navigate("/student/quiz-results")}
              >
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-6 h-6 text-blue-300" />
                  <h4 className="text-lg font-semibold text-white">
                    Quizzes Taken
                  </h4>
                </div>
                <p className="text-3xl font-bold text-white">
                  {quizResults.length}
                </p>
              </div>

              <div
                className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 cursor-pointer hover:shadow-lg transition"
                onClick={() => navigate("/student/quiz-results")}
              >
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-6 h-6 text-green-300" />
                  <h4 className="text-lg font-semibold text-white">
                    Average Score
                  </h4>
                </div>
                <p className="text-3xl font-bold text-white">{averageScore}%</p>
              </div>
            </>
          )}

          <div
            className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 cursor-pointer hover:shadow-lg transition"
            onClick={() => navigate("/student/classrooms")}
          >
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
            <h4 className="text-lg font-semibold text-white mb-4">
              My Classrooms
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  className={`bg-gradient-to-r ${classroom.color} backdrop-blur-sm rounded-lg p-4 border border-white/20`}
                >
                  <h5 className="text-white font-semibold mb-1">
                    {classroom.name}
                  </h5>
                  <p className="text-white/70 text-sm mb-2">
                    {classroom.subject}
                  </p>
                  <p className="text-white/60 text-xs">
                    {user.role === "teacher"
                      ? `${classroom.students.length} students`
                      : `Code: ${classroom.code}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {user.role === "student" && quizResults.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h4 className="text-lg font-semibold text-white mb-4">
              Recent Quiz Results
            </h4>
            <div className="space-y-3">
              {quizResults
                .slice(-5)
                .reverse()
                .map((result) => (
                  <div
                    key={result.id}
                    className="flex justify-between items-center p-3 bg-white/5 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{result.subject}</p>
                      <p className="text-white/60 text-sm">
                        {new Date(result.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">
                        {result.score}%
                      </p>
                      <p className="text-white/60 text-sm">
                        {Math.round(
                          (result.score / 100) * result.totalQuestions
                        )}
                        /{result.totalQuestions}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Password Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mt-6">
          <h4 className="text-lg font-semibold text-white mb-4">
            {hasPassword ? "Change Password" : "Set Password"}
          </h4>
          {passwordError && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-2 text-red-300 text-sm text-center">
              {passwordError}
            </div>
          )}
          {passwordMessage && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-2 text-green-300 text-sm text-center">
              {passwordMessage}
            </div>
          )}
          {showPasswordForm ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPasswordError("");
                setPasswordMessage("");
                setPasswordLoading(true);
                try {
                  if (hasPassword) {
                    // 1. Check if current password is correct
                    const checkRes = await axios.post(
                      "/api/auth/login",
                      {
                        email: user.email,
                        password: currentPassword,
                      }
                    );
                    if (!checkRes.data.success) {
                      setPasswordError("Current password is incorrect.");
                      setPasswordLoading(false);
                      return;
                    }
                  }
                  // 2. Validate new password
                  const validationError = validatePassword(newPassword);
                  if (validationError) {
                    setPasswordError(validationError);
                    setPasswordLoading(false);
                    return;
                  }
                  // 2.5. Check new password is not same as current password
                  if (currentPassword && newPassword === currentPassword) {
                    setPasswordError("New password cannot be the same as the current password.");
                    setPasswordLoading(false);
                    return;
                  }
                  // 3. Check confirm password
                  if (newPassword !== confirmPassword) {
                    setPasswordError("Passwords do not match.");
                    setPasswordLoading(false);
                    return;
                  }
                  // 4. Change password securely
                  if (hasPassword) {
                    const res = await axios.post(
                      "/api/auth/change-password",
                      {
                        currentPassword,
                        newPassword,
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(
                            "authToken"
                          )}`,
                        },
                      }
                    );
                    if (res.data.success) {
                      setPasswordMessage("Password changed successfully!");
                      setShowPasswordForm(false);
                    } else {
                      setPasswordError(
                        res.data.message || "Failed to change password."
                      );
                    }
                  } else {
                    // Set password for the first time
                    const payload: any = {
                      email: user.email,
                      name: user.name,
                      role: user.role,
                      password: newPassword,
                    };
                    const res = await axios.post(
                      "/api/auth/set-password",
                      payload
                    );
                    if (res.data.success) {
                      setPasswordMessage("Password set successfully!");
                      setShowPasswordForm(false);
                      if (
                        res.data.data &&
                        typeof res.data.data.hasPassword !== "undefined"
                      ) {
                        setHasPassword(res.data.data.hasPassword);
                      }
                    } else {
                      setPasswordError(
                        res.data.message || "Failed to set password."
                      );
                    }
                  }
                } catch (err: any) {
                  setPasswordError(
                    err.response?.data?.message || "Failed to update password."
                  );
                } finally {
                  setPasswordLoading(false);
                }
              }}
              className="space-y-4"
            >
              {hasPassword && (
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-12"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-12"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70"
                  onClick={() => setShowNewPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-12"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={passwordLoading}
                className={`w-full py-3 px-6 rounded-2xl font-display font-semibold transition-all duration-300 ${
                  passwordLoading
                    ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-glow hover:shadow-glow-lg hover:scale-105"
                }`}
              >
                {passwordLoading
                  ? hasPassword
                    ? "Changing..."
                    : "Setting..."
                  : hasPassword
                  ? "Change Password"
                  : "Set Password"}
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="w-full mt-2 text-blue-300 hover:underline"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3 px-6 rounded-2xl font-display font-semibold w-full"
            >
              {hasPassword ? "Change Password" : "Set Password"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
