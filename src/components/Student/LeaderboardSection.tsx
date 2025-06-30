import React, { useState, useEffect } from "react";
import { Trophy, Medal, Award } from "lucide-react";
// import { SUBJECTS } from "../../utils/mockData";
import axios from "axios";
import { externalQuizAPI } from "../../services/api";

interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar: string;
  bestScore: number;
  averageScore: number;
  totalQuizzes: number;
  lastQuiz: string;
}

const LeaderboardSection: React.FC = () => {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      const subs = await externalQuizAPI.getAvailableSubjects();
      setSubjects(subs);
      setSelectedSubject(subs[0] || "");
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.get(`/api/leaderboards/${selectedSubject}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLeaderboard(res.data.data.leaderboard);
      } catch (err: any) {
        setError("Failed to load leaderboard.");
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [selectedSubject]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-400" />;
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center text-white/70 font-bold">
            {rank}
          </div>
        );
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">
        Subject Leaderboards
      </h2>

      {/* Subject Selector */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedSubject === subject
                  ? "bg-blue-500 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              }`}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-6">
          {selectedSubject} Leaderboard
        </h3>

        {loading ? (
          <div className="text-center py-8 text-white/70">Loading...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">{error}</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-white/50 mx-auto mb-4" />
            <p className="text-white/70">No scores yet for this subject</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 ${
                  index < 3 ? "bg-white/15" : "bg-white/5"
                }`}
              >
                {/* Rank Number */}
                <div className="flex-shrink-0 w-8 text-center text-xl font-bold text-white/80">
                  {index + 1}
                </div>
                <div className="flex-shrink-0">{getRankIcon(index + 1)}</div>

                <img
                  src={entry.avatar}
                  alt={entry.userName}
                  className="w-10 h-10 rounded-full border-2 border-white/30"
                />

                <div className="flex-1">
                  <p className="text-white font-semibold">{entry.userName}</p>
                  <p className="text-white/60 text-sm">
                    {entry.totalQuizzes} quiz
                    {entry.totalQuizzes !== 1 ? "zes" : ""} taken
                  </p>
                  <p className="text-white/50 text-xs">
                    Avg: {entry.averageScore}%
                  </p>
                  <p className="text-white/50 text-xs">
                    Last:{" "}
                    {entry.lastQuiz
                      ? new Date(entry.lastQuiz).toLocaleDateString()
                      : "-"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {entry.bestScore}%
                  </p>
                  <p className="text-white/60 text-sm">Best Score</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardSection;
