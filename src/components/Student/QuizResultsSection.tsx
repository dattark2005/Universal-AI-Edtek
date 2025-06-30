import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Calendar,
  Target,
  TrendingUp,
  Award,
  Star,
  BookOpen,
  BarChart3,
  Filter,
  Search,
} from "lucide-react";
import { getCurrentUser } from "../../utils/storage";
import { SUBJECTS } from "../../utils/mockData";
import axios from "axios";

const QuizResultsSection: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const user = useMemo(() => getCurrentUser(), []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.get("/api/quizzes/results", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResults(res.data.data.results || []);
      } catch (err: any) {
        setError("Failed to fetch quiz results. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [user?.id]);

  // Get unique subjects from quiz results
  const subjectsTaken = Array.from(
    new Set(results.map((result) => result.subject))
  );

  // Filter and sort results
  const filteredResults = results
    .filter((result) => {
      const matchesSubject =
        selectedSubject === "all" || result.subject === selectedSubject;
      const matchesSearch = result.subject
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesSubject && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        );
      }
      return b.score - a.score;
    });

  // Calculate statistics
  const totalQuizzes = results.length;
  const averageScore =
    totalQuizzes > 0
      ? Math.round(
          results.reduce((sum, result) => sum + result.score, 0) / totalQuizzes
        )
      : 0;
  const bestScore =
    totalQuizzes > 0 ? Math.max(...results.map((r) => r.score)) : 0;
  const recentImprovement =
    totalQuizzes >= 2
      ? results[results.length - 1].score - results[results.length - 2].score
      : 0;

  const getScoreColor = (score: number): string => {
    if (score >= 90) return "from-emerald-500 to-green-600";
    if (score >= 80) return "from-blue-500 to-cyan-600";
    if (score >= 70) return "from-yellow-500 to-orange-600";
    if (score >= 60) return "from-orange-500 to-red-500";
    return "from-red-500 to-pink-600";
  };

  const getGradeText = (score: number): string => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Improvement";
  };

  // Group results by subject
  const resultsBySubject = useMemo(() => {
    const map: Record<string, any[]> = {};
    results.forEach((result) => {
      if (!map[result.subject]) map[result.subject] = [];
      map[result.subject].push(result);
    });
    // Sort each subject's results by completedAt descending
    Object.keys(map).forEach((subject) => {
      map[subject].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
    });
    return map;
  }, [results]);

  // Only show the latest result per subject as a card
  const subjectCards = Object.keys(resultsBySubject).map((subject) => {
    const subjectResults = resultsBySubject[subject];
    const latestResult = subjectResults[0];
    const previousResults = subjectResults.slice(1);
    return {
      subject,
      latestResult,
      previousResults,
      count: subjectResults.length,
    };
  });

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="glass-morphism rounded-3xl p-12 max-w-md mx-auto">
          <h3 className="text-2xl font-display font-bold text-white mb-4">
            Loading Quiz Results...
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

  if (totalQuizzes === 0) {
    return (
      <div className="text-center py-16">
        <div className="glass-morphism rounded-3xl p-12 max-w-md mx-auto">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-display font-bold text-white mb-4">
            No Quiz Results Yet
          </h3>
          <p className="text-white/70 text-lg mb-6">
            Take your first quiz to see your results and track your progress!
          </p>
          <div className="bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-2xl p-4 border border-white/20">
            <BookOpen className="w-8 h-8 text-primary-300 mx-auto mb-2" />
            <p className="text-white/80 text-sm">
              Start with any subject to begin your learning journey
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2 text-shadow-lg">
            Quiz Results
          </h2>
          <p className="text-white/70 text-lg">
            Track your learning progress and achievements
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-white/50 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-glass"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-glass"
          >
            <option value="all" className="bg-neutral-800">
              All Subjects
            </option>
            {subjectsTaken.map((subject) => (
              <option key={subject} value={subject} className="bg-neutral-800">
                {subject}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "score")}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-glass"
          >
            <option value="date" className="bg-neutral-800">
              Sort by Date
            </option>
            <option value="score" className="bg-neutral-800">
              Sort by Score
            </option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-morphism rounded-2xl p-6 border border-white/20 card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-glow">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium">Total Quizzes</p>
              <p className="text-2xl font-display font-bold text-white">
                {totalQuizzes}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-morphism rounded-2xl p-6 border border-white/20 card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-glow">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium">Average Score</p>
              <p className="text-2xl font-display font-bold text-white">
                {averageScore}%
              </p>
            </div>
          </div>
        </div>

        <div className="glass-morphism rounded-2xl p-6 border border-white/20 card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-glow">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium">Best Score</p>
              <p className="text-2xl font-display font-bold text-white">
                {bestScore}%
              </p>
            </div>
          </div>
        </div>

        <div className="glass-morphism rounded-2xl p-6 border border-white/20 card-hover">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 bg-gradient-to-r ${
                recentImprovement >= 0
                  ? "from-green-500 to-emerald-600"
                  : "from-red-500 to-pink-600"
              } rounded-xl flex items-center justify-center shadow-glow`}
            >
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium">Recent Change</p>
              <p
                className={`text-2xl font-display font-bold ${
                  recentImprovement >= 0 ? "text-green-300" : "text-red-300"
                }`}
              >
                {recentImprovement >= 0 ? "+" : ""}
                {recentImprovement}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {subjectCards.map(
          ({ subject, latestResult, previousResults, count }) => {
            const isExpandable = count > 1;
            return (
              <div
                key={subject}
                className={`glass-morphism rounded-2xl p-6 border border-white/20 card-hover${
                  isExpandable ? " cursor-pointer" : ""
                }`}
                onClick={
                  isExpandable
                    ? () =>
                        setExpandedSubject(
                          expandedSubject === subject ? null : subject
                        )
                    : undefined
                }
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Score Circle */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-20 h-20 bg-gradient-to-r ${getScoreColor(
                        latestResult.score
                      )} rounded-full flex items-center justify-center shadow-glow relative`}
                    >
                      <span className="text-2xl font-display font-bold text-white">
                        {latestResult.score}%
                      </span>
                      {latestResult.score >= 90 && (
                        <div className="absolute -top-2 -right-2">
                          <Star className="w-6 h-6 text-yellow-400 fill-current animate-bounce-gentle" />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Quiz Info */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-display font-bold text-white mb-1">
                          {subject}
                        </h3>
                        <p className="text-white/70 font-medium">
                          {getGradeText(latestResult.score)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(
                                latestResult.completedAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="w-4 h-4" />
                            <span>
                              {Math.round(
                                (latestResult.score / 100) *
                                  latestResult.totalQuestions
                              )}
                              /{latestResult.totalQuestions} correct
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            <span>
                              {count} quiz{count > 1 ? "zes" : ""} taken
                            </span>
                          </div>
                        </div>
                        {isExpandable && (
                          <p className="text-xs text-blue-300 mt-2">
                            Click for previous scores
                          </p>
                        )}
                      </div>
                      {/* Performance Badge */}
                      <div className="flex-shrink-0">
                        <div
                          className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            latestResult.score >= 90
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : latestResult.score >= 80
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : latestResult.score >= 70
                              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                              : latestResult.score >= 60
                              ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {latestResult.score >= 90
                            ? "🏆 Excellent"
                            : latestResult.score >= 80
                            ? "🎯 Very Good"
                            : latestResult.score >= 70
                            ? "👍 Good"
                            : latestResult.score >= 60
                            ? "📈 Fair"
                            : "📚 Keep Learning"}
                        </div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getScoreColor(
                            latestResult.score
                          )} transition-all duration-1000 ease-out`}
                          style={{ width: `${latestResult.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Expandable previous scores */}
                {isExpandable &&
                  expandedSubject === subject &&
                  previousResults.length > 0 && (
                    <div className="mt-6 bg-white/5 rounded-xl p-4">
                      <h4 className="text-white/80 font-semibold mb-2">
                        Previous Scores
                      </h4>
                      <ul className="space-y-2">
                        {previousResults.map((res, idx) => (
                          <li key={res.id} className="flex items-center gap-4">
                            <span className="text-white/70 text-sm">
                              {new Date(res.completedAt).toLocaleDateString()}:
                            </span>
                            <span className="text-white font-bold">
                              {res.score}%
                            </span>
                            <span className="text-white/50 text-xs">
                              (
                              {Math.round(
                                (res.score / 100) * res.totalQuestions
                              )}
                              /{res.totalQuestions} correct)
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            );
          }
        )}
      </div>

      {filteredResults.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <div className="glass-morphism rounded-2xl p-8 max-w-md mx-auto">
            <Search className="w-12 h-12 text-white/50 mx-auto mb-4" />
            <h3 className="text-xl font-display font-semibold text-white mb-2">
              No Results Found
            </h3>
            <p className="text-white/70">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizResultsSection;
