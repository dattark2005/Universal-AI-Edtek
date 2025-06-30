import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Play,
  Download,
  BookOpen,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Calendar,
  Target,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { getCurrentUser } from "../../utils/storage";
import { StudyPlan } from "../../types";
import axios from "axios";

const StudyPlansSection: React.FC = () => {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useMemo(() => getCurrentUser(), []);

  useEffect(() => {
    const fetchPlans = async () => {
      if (!user) return;
      const token = localStorage.getItem("authToken");
      if (!token) {
        setStudyPlans([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/study-plans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudyPlans(res.data.data.studyPlans || []);
      } catch (err: any) {
        setError("Failed to fetch study plans. Please try again.");
        if (err.response && err.response.status === 403) {
          setStudyPlans([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [refreshKey]);

  const refreshPlans = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleLinkClick = (url: string, title: string) => {
    // Validate URL before opening
    if (isValidUrl(url)) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      console.error("Invalid URL:", url);
      alert(
        `Sorry, the link "${title}" appears to be invalid. Please try searching for "${title}" manually.`
      );
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  const getLinkIcon = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return <Play className="w-4 h-4 text-red-400" />;
    } else if (url.includes(".pdf") || url.toLowerCase().includes("pdf")) {
      return <FileText className="w-4 h-4 text-red-400" />;
    } else {
      return <ExternalLink className="w-4 h-4 text-blue-400" />;
    }
  };

  const groupedPlans = studyPlans.reduce((acc, plan) => {
    if (!acc[plan.subject]) {
      acc[plan.subject] = [];
    }
    acc[plan.subject].push(plan);
    return acc;
  }, {} as Record<string, StudyPlan[]>);

  // Only show study plans for the current user (handle userId as string or object)
  const userStudyPlansRaw = useMemo(
    () =>
      studyPlans.filter((plan) => {
        if (!user?.id) return false;
        if (typeof plan.userId === "string") return plan.userId === user.id;
        if (typeof plan.userId === "object" && plan.userId !== null) {
          const userIdObj = plan.userId as any;
          return userIdObj._id === user.id || userIdObj.id === user.id;
        }
        return false;
      }),
    [studyPlans, user]
  );

  // Only show one study plan per subject (most recent by createdAt)
  const userStudyPlans = useMemo(() => {
    const latestPlans: Record<string, StudyPlan> = {};
    userStudyPlansRaw.forEach((plan) => {
      const subject = plan.subject;
      if (
        !latestPlans[subject] ||
        new Date(plan.createdAt) > new Date(latestPlans[subject].createdAt)
      ) {
        latestPlans[subject] = plan;
      }
    });
    return Object.values(latestPlans);
  }, [userStudyPlansRaw]);

  // If selectedPlan is not owned by the user, redirect to main list
  useEffect(() => {
    if (selectedPlan) {
      let planUserId = selectedPlan.userId;
      if (typeof planUserId === "object" && planUserId !== null) {
        planUserId = (planUserId as any)._id || (planUserId as any).id;
      }
      if (planUserId !== user?.id) {
        setSelectedPlan(null);
      }
    }
  }, [selectedPlan, user]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="glass-morphism rounded-3xl p-12 max-w-md mx-auto">
          <h3 className="text-2xl font-display font-bold text-white mb-4">
            Loading Study Plans...
          </h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="glass-morphism rounded-3xl p-12 max-w-md mx-auto">
          <h3 className="text-2xl font-display font-bold text-red-400 mb-4">
            {error}
          </h3>
        </div>
      </div>
    );
  }

  if (studyPlans.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="glass-morphism rounded-3xl p-12 max-w-md mx-auto">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-display font-bold text-white mb-4">
            No Study Plans Yet
          </h3>
          <p className="text-white/70 text-lg mb-6">
            Complete some quizzes to generate personalized study plans with AI
            recommendations.
          </p>
          <div className="bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-2xl p-6 border border-white/20">
            <Sparkles className="w-8 h-8 text-primary-300 mx-auto mb-3" />
            <p className="text-white/80 text-sm leading-relaxed">
              Our AI analyzes your quiz performance and creates customized
              learning paths with videos, notes, and documents tailored to your
              needs using Google Gemini AI.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedPlan) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setSelectedPlan(null)}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            ← Back to Study Plans
          </button>
          <div>
            <h2 className="text-3xl font-display font-bold text-white text-shadow-lg">
              {selectedPlan.subject} Study Plan
            </h2>
            <p className="text-white/70 text-lg">
              AI-generated personalized learning path
            </p>
          </div>
        </div>

        <div className="glass-morphism rounded-3xl p-8 border border-white/20 shadow-glass">
          {/* Plan Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-white/20">
              <Target className="w-8 h-8 text-blue-400 mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">
                Performance Score
              </h4>
              <p className="text-3xl font-display font-bold text-white">
                {selectedPlan.score}%
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-white/20">
              <Calendar className="w-8 h-8 text-green-400 mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">Created</h4>
              <p className="text-lg font-semibold text-white">
                {new Date(selectedPlan.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-white/20">
              <Sparkles className="w-8 h-8 text-purple-400 mb-3" />
              <h4 className="text-lg font-semibold text-white mb-2">
                AI Generated
              </h4>
              <p className="text-lg font-semibold text-white">Gemini AI</p>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="mb-8">
            <h4 className="text-xl font-display font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              AI Recommendation
            </h4>
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20">
              <p className="text-white/90 leading-relaxed text-lg">
                {selectedPlan.plan.textPlan}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Videos */}
            <div className="space-y-4">
              <h4 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-red-400" />
                Recommended Videos ({selectedPlan.plan.videos.length})
              </h4>
              <div className="space-y-3">
                {selectedPlan.plan.videos.map((video, index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 card-hover group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/30 transition-colors">
                        <Play className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm mb-1 line-clamp-2">
                          {video.title}
                        </p>
                        <p className="text-white/60 text-xs mb-2">
                          {video.duration}
                        </p>
                        {video.url && (
                          <button
                            onClick={() =>
                              handleLinkClick(video.url, video.title)
                            }
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded-md"
                          >
                            {getLinkIcon(video.url)}
                            Watch Video
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h4 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-400" />
                Study Notes ({selectedPlan.plan.notes.length})
              </h4>
              <div className="space-y-3">
                {selectedPlan.plan.notes.map((note, index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 card-hover group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/30 transition-colors">
                        <FileText className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm mb-1 line-clamp-2">
                          {note.title}
                        </p>
                        <p className="text-white/60 text-xs mb-2">
                          {note.type}
                        </p>
                        {note.content && (
                          <p className="text-white/70 text-xs line-clamp-2 mb-2">
                            {note.content}
                          </p>
                        )}
                        {(note as any).url && (
                          <button
                            onClick={() =>
                              handleLinkClick((note as any).url, note.title)
                            }
                            className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 text-xs transition-colors bg-green-500/10 hover:bg-green-500/20 px-2 py-1 rounded-md"
                          >
                            {getLinkIcon((note as any).url)}
                            View Resource
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <h4 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-400" />
                Documents ({selectedPlan.plan.documents.length})
              </h4>
              <div className="space-y-3">
                {selectedPlan.plan.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 card-hover group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                        {getLinkIcon(doc.url)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm mb-1 line-clamp-2">
                          {doc.title}
                        </p>
                        <p className="text-white/60 text-xs mb-2">{doc.type}</p>
                        <div className="flex items-center gap-2">
                          {isValidUrl(doc.url) ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-yellow-400" />
                          )}
                          <span className="text-white/50 text-xs">
                            {isValidUrl(doc.url)
                              ? "Link verified"
                              : "Link may need verification"}
                          </span>
                        </div>
                        {doc.url && (
                          <button
                            onClick={() => handleLinkClick(doc.url, doc.title)}
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded-md mt-2"
                          >
                            {getLinkIcon(doc.url)}
                            {doc.type === "PDF" ? "View PDF" : "View Document"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-3 text-shadow-lg">
            AI-Generated Study Plans
          </h2>
          <p className="text-white/70 text-lg">
            Personalized learning paths powered by Google Gemini AI
          </p>
        </div>
        <button
          onClick={refreshPlans}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
      {/* Single grid for all study plans */}
      <div className="grid grid-cols-1 gap-6">
        {userStudyPlans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan)}
            className="bg-white/5 rounded-2xl p-6 border border-white/10 cursor-pointer card-hover"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      plan.score >= 90
                        ? "bg-emerald-500"
                        : plan.score >= 80
                        ? "bg-blue-500"
                        : plan.score >= 70
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  >
                    {plan.score}%
                  </div>
                  <span className="text-white/70 text-sm font-medium">
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {plan.score >= 90 && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium">
                    <Sparkles className="w-3 h-3" />
                    Excellent Performance
                  </div>
                )}
              </div>
              {/* Show subject on each card */}
              <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-semibold ml-2">
                {plan.subject}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-white/80 text-sm line-clamp-3">
                {plan.plan.textPlan}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/5 rounded-lg p-3">
                <Play className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <p className="text-white/70 text-xs">
                  {plan.plan.videos.length} Videos
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <FileText className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <p className="text-white/70 text-xs">
                  {plan.plan.notes.length} Notes
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <Download className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <p className="text-white/70 text-xs">
                  {plan.plan.documents.length} Docs
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyPlansSection;
