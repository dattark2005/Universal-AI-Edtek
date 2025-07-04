import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, FileText, BarChart3, User, Users, Sparkles, Award, MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import QuizSection from './QuizSection';
import StudyPlansSection from './StudyPlansSection';
import LeaderboardSection from './LeaderboardSection';
import AssignmentsSection from './AssignmentsSection';
import ProfileSection from '../Profile/ProfileSection';
import ClassroomSection from '../Classroom/ClassroomSection';
import QuizResultsSection from './QuizResultsSection';
import GeminiChatbot from '../AI/GeminiChatbot';
import axios from 'axios';

type ActiveSection = 'quiz' | 'study-plans' | 'leaderboard' | 'assignments' | 'profile' | 'classrooms' | 'quiz-results';

const StudentDashboard: React.FC<{ user: any; setUser: (user: any) => void }> = ({ user, setUser }) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<ActiveSection>('quiz');
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    if (location.state && location.state.section) {
      setActiveSection(location.state.section);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const quizRes = await axios.get('/api/quizzes/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuizzes(quizRes.data.data.quizzes || []);
        const classroomRes = await axios.get('/api/classrooms', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClassrooms(classroomRes.data.data.classrooms || []);
      } catch (err) {
        setQuizzes([]);
        setClassrooms([]);
      }
    };
    if (user?.id) fetchStats();
  }, [user?.id]);

  const quizzesTaken = quizzes.length;
  const averageScore = quizzes.length > 0 ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length) : 0;
  const classroomsCount = classrooms.length;

  const sections = [
    { id: 'quiz' as const, name: 'Take Quiz', icon: BookOpen, color: 'from-primary-500 to-primary-600' },
    { id: 'quiz-results' as const, name: 'Quiz Results', icon: Award, color: 'from-purple-500 to-pink-600' },
    { id: 'study-plans' as const, name: 'Study Plans', icon: FileText, color: 'from-secondary-500 to-secondary-600' },
    { id: 'leaderboard' as const, name: 'Leaderboard', icon: Trophy, color: 'from-warning-500 to-warning-600' },
    { id: 'assignments' as const, name: 'Assignments', icon: BarChart3, color: 'from-accent-500 to-accent-600' },
    { id: 'classrooms' as const, name: 'Classrooms', icon: Users, color: 'from-success-500 to-success-600' },
    { id: 'profile' as const, name: 'Profile', icon: User, color: 'from-error-500 to-error-600' }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'quiz':
        return <QuizSection />;
      case 'quiz-results':
        return <QuizResultsSection />;
      case 'study-plans':
        return <StudyPlansSection />;
      case 'leaderboard':
        return <LeaderboardSection />;
      case 'assignments':
        return <AssignmentsSection />;
      case 'classrooms':
        return <ClassroomSection />;
      case 'profile':
        return <ProfileSection user={user} setUser={setUser} />;
      default:
        return <QuizSection />;
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
                  <h2 className="text-xl font-display font-bold text-white text-shadow">Student Dashboard</h2>
                </div>
                <p className="text-white/60 text-sm font-medium">Explore your learning journey</p>
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
                          : 'text-white/70 hover:text-white hover:bg-white/10 hover:scale-105'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive 
                          ? 'bg-white/20 shadow-card' 
                          : 'bg-white/10 group-hover:bg-white/20'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-display font-semibold">{section.name}</div>
                        {isActive && <div className="text-xs text-white/80">Active</div>}
                      </div>
                    </button>
                  );
                })}
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

        {/* AI Chatbot Button */}
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-full flex items-center justify-center shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-110 z-40"
        >
          <MessageCircle className="w-8 h-8 text-white" />
        </button>

        {/* Gemini Chatbot */}
        <GeminiChatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
      </div>
    </div>
  );
};

export default StudentDashboard;