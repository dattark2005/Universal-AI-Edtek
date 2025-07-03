import React from "react";
import { LogOut, User, BookOpen, Sparkles } from "lucide-react";
import { User as UserType } from "../../types";
import { clearCurrentUser } from "../../utils/storage";
import { useNavigate } from "react-router-dom";

interface NavbarProps {
  user: UserType;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const handleLogout = () => {
    clearCurrentUser();
    onLogout();
  };

  const navigate = useNavigate();

  return (
    <nav className="glass-morphism border-b border-white/20 px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-bounce-gentle" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-white text-shadow">
              EduAI Platform
            </h1>
            <p className="text-xs text-white/60 font-medium">
              AI-Powered Learning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-2 backdrop-blur-glass">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full border-2 border-white/30 shadow-card"
            />
            <div
              className="text-sm cursor-pointer"
              onClick={() => navigate("/student/profile")}
              title="Go to Profile"
            >
              <p className="text-white font-display font-semibold underline hover:text-blue-300">
                {user.name}
              </p>
              <p className="text-white/70 capitalize font-medium">
                {user.role}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110 group"
            title="Logout"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
