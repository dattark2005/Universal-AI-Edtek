import React, { useState } from "react";
import {
  Upload,
  CheckSquare,
  User,
  Users,
  Sparkles,
  BookOpen,
} from "lucide-react";
import UploadAssignment from "./UploadAssignment";
import EvaluateSubmissions from "./EvaluateSubmissions";
import StudyPlanManager from "./StudyPlanManager";
import ProfileSection from "../Profile/ProfileSection";
import ClassroomSection from "../Classroom/ClassroomSection";
import { useNavigate } from "react-router-dom";

type ActiveSection =
  | "upload"
  | "evaluate"
  | "study-plans"
  | "classrooms"
  | "profile";

const TeacherDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection>("upload");
  const navigate = useNavigate();

  const sections = [
    {
      id: "upload" as const,
      name: "Upload Assignment",
      icon: Upload,
      color: "from-primary-500 to-primary-600",
    },
    {
      id: "evaluate" as const,
      name: "Evaluate Submissions",
      icon: CheckSquare,
      color: "from-success-500 to-success-600",
    },
    {
      id: "study-plans" as const,
      name: "Study Plans",
      icon: BookOpen,
      color: "from-purple-500 to-pink-600",
    },
    {
      id: "classrooms" as const,
      name: "Classrooms",
      icon: Users,
      color: "from-secondary-500 to-secondary-600",
    },
    {
      id: "profile" as const,
      name: "Profile",
      icon: User,
      color: "from-accent-500 to-accent-600",
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "upload":
        return <UploadAssignment />;
      case "evaluate":
        return <EvaluateSubmissions />;
      case "study-plans":
        return <StudyPlanManager />;
      case "classrooms":
        return <ClassroomSection />;
      case "profile":
        return <ProfileSection />;
      default:
        return <UploadAssignment />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-red-600 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="glass-morphism rounded-3xl shadow-glass border border-white/20 overflow-hidden animate-fade-in">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-72 bg-white/5 p-6 border-r border-white/10 flex-shrink-0">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-glow">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xl font-display font-bold text-white text-shadow">
                    Teacher Dashboard
                  </h2>
                </div>
                <p className="text-white/60 text-sm font-medium">
                  Manage your classes and students
                </p>
              </div>

              <nav className="space-y-3">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                        isActive
                          ? `bg-gradient-to-r ${section.color} text-white shadow-glow scale-105`
                          : "text-white/70 hover:text-white hover:bg-white/10 hover:scale-105"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isActive
                            ? "bg-white/20 shadow-card"
                            : "bg-white/10 group-hover:bg-white/20"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-display font-semibold">
                          {section.name}
                        </div>
                        {isActive && (
                          <div className="text-xs text-white/80">Active</div>
                        )}
                      </div>
                    </button>
                  );
                })}
                <button
                  onClick={() => navigate("/teacher/manage-assignments")}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group text-white/70 hover:text-white hover:bg-white/10 hover:scale-105"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 group-hover:bg-white/20 transition-all duration-300">
                    <span role="img" aria-label="manage">
                      🗂️
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="font-display font-semibold">
                      Manage Assignments
                    </div>
                  </div>
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 animate-slide-up overflow-hidden">
              <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {renderSection()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
