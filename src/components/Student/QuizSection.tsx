import React, { useState, useEffect, useMemo } from "react";
import {
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Sparkles,
  Trophy,
  Target,
  BookOpen,
  // ArrowRight,
} from "lucide-react";
import { externalQuizAPI } from "../../services/api";
import {
  generateStudyPlanWithGemini,
  QuizResultData,
} from "../../services/geminiService";
import {
  getCurrentUser,
  // saveQuizResult,
  // saveStudyPlan,
} from "../../utils/storage";
import { QuizResult, StudyPlan } from "../../types";
import axios from "axios";
import Loader from "../Layout/Loader";

interface ExternalQuestion {
  id: number;
  question: string;
  description?: string;
  answers: {
    answer_a?: string;
    answer_b?: string;
    answer_c?: string;
    answer_d?: string;
    answer_e?: string;
    answer_f?: string;
  };
  multiple_correct_answers: string;
  correct_answers: {
    answer_a_correct?: string;
    answer_b_correct?: string;
    answer_c_correct?: string;
    answer_d_correct?: string;
    answer_e_correct?: string;
    answer_f_correct?: string;
  };
  correct_answer?: string;
  explanation?: string;
  tip?: string;
  tags?: Array<{ name: string }>;
  category: string;
  difficulty: string;
}

interface ProcessedQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const QuizSection: React.FC = () => {
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [currentQuiz, setCurrentQuiz] = useState<ProcessedQuestion[] | null>(
    null
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatingStudyPlan, setGeneratingStudyPlan] = useState(false);
  const [aiPlanGenerated, setAiPlanGenerated] = useState(false);
  const timerRef = React.useRef<any>(null);

  const user = useMemo(() => getCurrentUser(), []);

  useEffect(() => {
    loadAvailableSubjects();
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timeLeft > 0) {
        // Clear any running timers
      }
    };
  }, [timeLeft]);

  const loadAvailableSubjects = async () => {
    try {
      const subjects = await externalQuizAPI.getAvailableSubjects();
      setAvailableSubjects(subjects);
    } catch (error) {
      console.error("Error loading subjects:", error);
      setError("Failed to load available subjects");
    }
  };

  const processExternalQuestions = (
    externalQuestions: ExternalQuestion[]
  ): ProcessedQuestion[] => {
    return externalQuestions
      .map((q, index) => {
        const options: string[] = [];
        const correctAnswers: boolean[] = [];

        // Extract options and correct answers
        Object.entries(q.answers).forEach(([key, value]) => {
          if (value && value.trim()) {
            options.push(value.trim());
            const correctKey =
              `${key}_correct` as keyof typeof q.correct_answers;
            correctAnswers.push(q.correct_answers[correctKey] === "true");
          }
        });

        // Find the first correct answer index
        const correctAnswer = correctAnswers.findIndex(
          (isCorrect) => isCorrect
        );

        return {
          id: q.id.toString(),
          question: q.question || `Question ${index + 1}`,
          options,
          correctAnswer: correctAnswer >= 0 ? correctAnswer : 0,
          explanation: q.explanation || q.tip || "No explanation available",
        };
      })
      .filter((q) => q.options.length >= 2); // Only include questions with at least 2 options
  };

  const startQuiz = async (subject: string) => {
    setLoading(true);
    setError("");

    try {
      const externalQuestions = await externalQuizAPI.fetchQuizQuestions(
        subject,
        10
      );

      if (!externalQuestions || externalQuestions.length === 0) {
        throw new Error("No questions available for this subject");
      }

      const processedQuestions = processExternalQuestions(externalQuestions);

      if (processedQuestions.length === 0) {
        throw new Error("No valid questions found for this subject");
      }

      setCurrentQuiz(processedQuestions);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setTimeLeft(600); // 10 minutes
      setQuizCompleted(false);
      setQuizResult(null);

      // Start timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            completeQuiz([]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error("Error starting quiz:", error);
      setError(error.message || "Failed to start quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuiz && currentQuestionIndex < currentQuiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeQuiz(answers);
    }
  };

  const completeQuiz = async (finalAnswers: number[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!currentQuiz || !user) return;

    let correctAnswers = 0;
    const detailedAnswers: QuizResultData["answers"] = [];

    finalAnswers.forEach((answer, index) => {
      const question = currentQuiz[index];
      const isCorrect = answer === question?.correctAnswer;
      if (isCorrect) {
        correctAnswers++;
      }
      detailedAnswers.push({
        question: question?.question || "",
        userAnswer: question?.options[answer] || "No answer",
        correctAnswer: question?.options[question?.correctAnswer] || "Unknown",
        isCorrect,
      });
    });

    const score = Math.round((correctAnswers / currentQuiz.length) * 100);
    const timeSpent = 600 - timeLeft;

    // Save quiz result to MongoDB
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        "/api/quizzes/results",
        {
          subject: selectedSubject,
          score,
          totalQuestions: currentQuiz.length,
          correctAnswers,
          timeSpent,
          answers: finalAnswers,
          questions: currentQuiz.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
          })),
          completedAt: new Date(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      console.error("Error saving quiz result to MongoDB:", err);
    }

    setQuizResult({
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      quizId: `external-${selectedSubject}`,
      subject: selectedSubject,
      score,
      totalQuestions: currentQuiz.length,
      completedAt: new Date(),
      answers: finalAnswers,
    });
    setQuizCompleted(true);

    // Generate AI study plan with Gemini (non-blocking)
    setGeneratingStudyPlan(true);
    try {
      const quizResultData: QuizResultData = {
        score: correctAnswers,
        totalQuestions: currentQuiz.length,
        course: selectedSubject,
        answers: detailedAnswers,
      };

      const aiStudyPlan = await generateStudyPlanWithGemini(quizResultData);
      const studyPlan: StudyPlan = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        subject: selectedSubject,
        score,
        plan: {
          videos: (aiStudyPlan.courses[0]?.resources[0]?.links || [])
            .filter((link) => link.title && link.url && "30 mins")
            .map((link) => ({
              title: link.title,
              url: link.url,
              duration: "30 mins",
            })),
          notes: (aiStudyPlan.courses[0]?.focusAreas || [])
            .filter((area) => area.category && area.strength)
            .map((area) => ({
              title: area.category,
              content: `Focus on ${area.category} - Current strength: ${area.strength}`,
              type: "Study Notes",
            })),
          documents: (aiStudyPlan.courses[0]?.resources[0]?.links || [])
            .slice(0, 2)
            .filter((link) => link.title && link.url)
            .map((link) => ({
              title: link.title,
              url: link.url,
              type: "PDF",
            })),
          textPlan:
            aiStudyPlan.courses[0]?.recommendations
              ?.filter(Boolean)
              .join(" ") || "Continue practicing to improve your skills.",
        },
        createdAt: new Date(),
      };
      // Save study plan to MongoDB
      try {
        const token = localStorage.getItem("authToken");
        // Fetch existing study plans for this user and subject
        const res = await axios.get(
          "/api/study-plans?subject=" + encodeURIComponent(selectedSubject),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const existingPlans = res.data.data.studyPlans || [];
        const existingPlan = existingPlans.find(
          (plan: any) =>
            plan.subject === selectedSubject && plan.userId === user.id
        );
        if (existingPlan) {
          // Update existing plan
          await axios.put(
            `/api/study-plans/${existingPlan._id || existingPlan.id}`,
            studyPlan,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } else {
          // Create new plan
          await axios.post("/api/study-plans", studyPlan, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch (err) {
        console.error("Error saving study plan to MongoDB:", err);
      }
      setAiPlanGenerated(true);
    } catch (error) {
      console.error("Error generating AI study plan:", error);
    } finally {
      setGeneratingStudyPlan(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return "from-emerald-500 to-green-600";
    if (score >= 80) return "from-blue-500 to-cyan-600";
    if (score >= 70) return "from-yellow-500 to-orange-600";
    if (score >= 60) return "from-orange-500 to-red-500";
    return "from-red-500 to-pink-600";
  };

  const getPerformanceMessage = (score: number): string => {
    if (score >= 90) return "Outstanding! You're a true master! 🏆";
    if (score >= 80) return "Excellent work! Keep it up! 🌟";
    if (score >= 70) return "Good job! You're on the right track! 👍";
    if (score >= 60) return "Not bad! Keep practicing! 📚";
    return "Don't give up! Practice makes perfect! 💪";
  };

  // Memoize subject cards to prevent unnecessary re-renders
  const subjectCards = useMemo(() => {
    return availableSubjects.map((subject, index) => (
      <div
        key={subject}
        className={`glass-morphism rounded-3xl p-8 card-hover cursor-pointer border border-white/20 relative overflow-hidden group ${
          selectedSubject === subject
            ? "ring-2 ring-purple-400 shadow-glow-purple"
            : ""
        }`}
        onClick={() => setSelectedSubject(subject)}
      >
        {/* Background Gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-50 group-hover:opacity-70 transition-opacity duration-300`}
        />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-glow">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <Sparkles className="w-6 h-6 text-yellow-400 animate-bounce-gentle" />
          </div>

          <h3 className="text-2xl font-display font-bold text-white mb-3">
            {subject}
          </h3>
          <p className="text-white/80 mb-6 leading-relaxed">
            Test your knowledge with real questions from Quiz API
          </p>

          {selectedSubject === subject ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startQuiz(subject);
              }}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-4 px-6 rounded-2xl font-display font-semibold flex items-center justify-center gap-3 transition-all duration-300 shadow-glow hover:shadow-glow-lg hover:scale-105"
            >
              <Play className="w-5 h-5" />
              Start Quiz
            </button>
          ) : (
            <div className="text-white/50 text-sm font-medium">
              Click to select
            </div>
          )}
        </div>
      </div>
    ));
  }, [availableSubjects, selectedSubject, loading]);

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="glass-morphism rounded-2xl p-8 max-w-md mx-auto">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Error</h3>
          <p className="text-white/70 mb-4">{error}</p>
          <button
            onClick={() => {
              setError("");
              setSelectedSubject("");
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (quizCompleted && quizResult) {
    return (
      <div className="text-center animate-fade-in">
        <div className="glass-morphism rounded-3xl p-8 mb-6 border border-white/20 relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
            <div
              className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl animate-float"
              style={{ animationDelay: "2s" }}
            ></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Trophy className="w-10 h-10 text-yellow-400 animate-bounce-gentle" />
              <h2 className="text-4xl font-display font-bold text-white text-shadow-lg">
                Quiz Completed!
              </h2>
              <Sparkles className="w-8 h-8 text-yellow-400 animate-bounce-gentle" />
            </div>

            <div
              className={`w-32 h-32 bg-gradient-to-r ${getScoreColor(
                quizResult.score
              )} rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-lg animate-glow`}
            >
              <span className="text-4xl font-display font-bold text-white">
                {quizResult.score}%
              </span>
            </div>

            <p className="text-white/90 text-xl font-display font-semibold mb-2">
              {getPerformanceMessage(quizResult.score)}
            </p>
            <p className="text-white/70 text-lg mb-8">
              You got{" "}
              {Math.round((quizResult.score / 100) * quizResult.totalQuestions)}{" "}
              out of {quizResult.totalQuestions} questions correct
            </p>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="glass-morphism rounded-2xl p-4 border border-white/20">
                <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-white font-semibold">Accuracy</p>
                <p className="text-2xl font-display font-bold text-white">
                  {quizResult.score}%
                </p>
              </div>
              <div className="glass-morphism rounded-2xl p-4 border border-white/20">
                <Clock className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-white font-semibold">Time Used</p>
                <p className="text-2xl font-display font-bold text-white">
                  {formatTime(600 - timeLeft)}
                </p>
              </div>
              <div className="glass-morphism rounded-2xl p-4 border border-white/20">
                <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-white font-semibold">Grade</p>
                <p className="text-2xl font-display font-bold text-white">
                  {quizResult.score >= 90
                    ? "A+"
                    : quizResult.score >= 80
                    ? "A"
                    : quizResult.score >= 70
                    ? "B"
                    : quizResult.score >= 60
                    ? "C"
                    : "D"}
                </p>
              </div>
            </div>

            {/* AI Study Plan Generation Status */}
            {generatingStudyPlan && (
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Sparkles className="w-6 h-6 text-purple-400 animate-spin" />
                  <span className="text-white font-semibold">
                    Generating AI Study Plan...
                  </span>
                </div>
                <p className="text-white/70 text-sm">
                  Our AI is analyzing your performance and creating a
                  personalized study plan with Gemini AI.
                </p>
              </div>
            )}
            {aiPlanGenerated && !generatingStudyPlan && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <span className="text-white font-semibold">
                    Your AI Study Plan has been generated!
                  </span>
                </div>
                <p className="text-white/70 text-sm">
                  You can view your personalized study plan in the Study Plans
                  section.
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setCurrentQuiz(null);
                  setSelectedSubject("");
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-2xl font-display font-semibold transition-all duration-300 shadow-glow hover:shadow-glow-lg hover:scale-105"
              >
                Take Another Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentQuiz) {
    const currentQuestion = currentQuiz[currentQuestionIndex];
    const hasAnswered = answers[currentQuestionIndex] !== undefined;

    return (
      <div className="animate-slide-up">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-display font-bold text-white text-shadow-lg">
              {selectedSubject} Quiz
            </h2>
            <p className="text-white/70 text-lg">
              Test your knowledge with real-world questions
            </p>
          </div>
          <div className="flex items-center gap-3 text-white glass-morphism px-6 py-3 rounded-2xl border border-white/20">
            <Clock className="w-6 h-6 text-red-400" />
            <span className="font-mono text-xl font-bold">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="glass-morphism rounded-3xl p-8 border border-white/20 shadow-glass">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <span className="text-white/70 font-medium">
                Question {currentQuestionIndex + 1} of {currentQuiz.length}
              </span>
              <div className="bg-white/20 rounded-full h-3 w-48">
                <div
                  className="bg-gradient-to-r from-purple-400 to-pink-400 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${
                      ((currentQuestionIndex + 1) / currentQuiz.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Back Button */}
            <div className="flex gap-4 mb-4">
              <button
                onClick={() =>
                  setCurrentQuestionIndex((idx) => Math.max(0, idx - 1))
                }
                disabled={currentQuestionIndex === 0}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Back
              </button>
            </div>

            {/* Question and Options */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                {currentQuestion.question}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 border-2 focus:outline-none
                      ${
                        answers[currentQuestionIndex] === idx
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 scale-105 shadow-glow"
                          : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:text-white"
                      }
                    `}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              {currentQuestionIndex < currentQuiz.length - 1 ? (
                <button
                  onClick={nextQuestion}
                  disabled={answers[currentQuestionIndex] === undefined}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-3 rounded-2xl font-display font-semibold transition-all duration-300 shadow-glow hover:shadow-glow-lg hover:scale-105"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => completeQuiz(answers)}
                  disabled={answers[currentQuestionIndex] === undefined}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-2xl font-display font-semibold transition-all duration-300 shadow-glow hover:shadow-glow-lg hover:scale-105"
                >
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loader text="Loading quizzes..." />;
  }

  if (!loading && availableSubjects.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="glass-morphism rounded-3xl p-12 max-w-md mx-auto">
          <h3 className="text-2xl font-display font-bold text-white mb-4">
            No quizzes available
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-white mb-3 text-shadow-lg">
          Select a Subject
        </h2>
        <p className="text-white/70 text-lg">
          Choose your subject and start your AI-powered quiz journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjectCards}
      </div>
    </div>
  );
};

export default QuizSection;
