import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { User } from "./types";
import { authAPI, setAuthToken, removeAuthToken } from "./services/api";
import { setCurrentUser, getCurrentUser } from "./utils/storage";
import LoginPage from "./components/Auth/LoginPage";
import Navbar from "./components/Layout/Navbar";
import AuthCallback from "./components/Auth/AuthCallback";
import ResetPassword from "./components/Auth/ResetPassword";

// Lazy load dashboard components for better performance
const StudentDashboard = lazy(() => import("./components/Student/Dashboard"));
const TeacherDashboard = lazy(() => import("./components/Teacher/Dashboard"));
const ManageAssignments = lazy(
  () => import("./components/Teacher/ManageAssignments")
);

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-red-600 flex items-center justify-center">
    <div className="glass-morphism rounded-3xl p-8 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-spin"></div>
        <div className="text-white text-xl font-display font-semibold text-shadow">
          Loading...
        </div>
      </div>
    </div>
  </div>
);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        // First try to get user from localStorage for instant loading
        const storedUser = getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
          setIsLoading(false);

          // Then verify with server in background
          try {
            const response = await authAPI.getCurrentUser();
            if (response.success) {
              const updatedUser = response.data.user;
              if (JSON.stringify(updatedUser) !== JSON.stringify(storedUser)) {
                setUser(updatedUser);
                setCurrentUser(updatedUser);
              }
            }
          } catch (error) {
            console.warn("Background auth verification failed:", error);
            // Keep using stored user data
          }
          return;
        }

        // If no stored user, fetch from server
        try {
          const response = await authAPI.getCurrentUser();
          if (response.success) {
            setUser(response.data.user);
            setCurrentUser(response.data.user);
          } else {
            removeAuthToken();
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          removeAuthToken();
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      removeAuthToken();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-red-600">
        {user && <Navbar user={user} onLogout={handleLogout} />}

        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route
              path="/"
              element={
                !user ? (
                  <LoginPage onLogin={handleLogin} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />

            <Route
              path="/dashboard"
              element={
                user ? (
                  user.role === "student" ? (
                    <StudentDashboard />
                  ) : (
                    <TeacherDashboard />
                  )
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/login"
              element={
                !user ? (
                  <LoginPage onLogin={handleLogin} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              }
            />

            <Route
              path="/teacher/manage-assignments"
              element={
                user && user.role === "teacher" ? (
                  <ManageAssignments />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            <Route
              path="/auth/callback"
              element={<AuthCallback onLogin={handleLogin} />}
            />

            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
