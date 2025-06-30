import React, { useState, useEffect } from "react";
import {
  Plus,
  Users,
  MessageCircle,
  BookOpen,
  Code,
  Search,
} from "lucide-react";
import {
  getCurrentUser,
  saveClassroom,
  getClassroomByCode,
  joinClassroom,
  getUserClassrooms,
} from "../../utils/storage";
import { Classroom } from "../../types";
import ClassroomDetail from "./ClassroomDetail";
import axios from "axios";

const ClassroomSection: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(
    null
  );
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    subject: "Mathematics",
  });
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  const user = getCurrentUser();
  if (!user) return null;

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.get("/api/classrooms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClassrooms(res.data.data.classrooms || []);
      } catch (err) {
        setClassrooms([]);
      }
    };
    fetchClassrooms();
  }, [user.id, user.role]);

  const generateClassCode = (): string => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const getRandomColor = (): string => {
    const colors = [
      "from-blue-500/20 to-cyan-500/20",
      "from-purple-500/20 to-pink-500/20",
      "from-green-500/20 to-emerald-500/20",
      "from-orange-500/20 to-red-500/20",
      "from-indigo-500/20 to-purple-500/20",
      "from-teal-500/20 to-blue-500/20",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleCreateClassroom = async () => {
    if (!createForm.name.trim() || !createForm.description.trim()) return;
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.post(
        "/api/classrooms",
        {
          name: createForm.name.trim(),
          description: createForm.description.trim(),
          subject: createForm.subject,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Refresh classroom list
      const res2 = await axios.get("/api/classrooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClassrooms(res2.data.data.classrooms || []);
      setCreateForm({ name: "", description: "", subject: "Mathematics" });
      setShowCreateForm(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create classroom");
    }
  };

  const handleJoinClassroom = async () => {
    if (!joinCode.trim()) return;
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        "/api/classrooms/join",
        {
          code: joinCode.trim().toUpperCase(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Refresh classroom list
      const res2 = await axios.get("/api/classrooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClassrooms(res2.data.data.classrooms || []);
      setJoinCode("");
      setJoinError("");
      setShowJoinForm(false);
    } catch (err: any) {
      setJoinError(err?.response?.data?.message || "Failed to join classroom");
    }
  };

  if (selectedClassroom) {
    return (
      <ClassroomDetail
        classroomId={selectedClassroom}
        onBack={() => setSelectedClassroom(null)}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Classrooms</h2>
        <div className="flex gap-3">
          {user.role === "student" && (
            <button
              onClick={() => setShowJoinForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Join Class
            </button>
          )}
          {user.role === "teacher" && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Class
            </button>
          )}
        </div>
      </div>

      {/* Create Classroom Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">
              Create New Classroom
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Classroom Name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <select
                value={createForm.subject}
                onChange={(e) =>
                  setCreateForm({ ...createForm, subject: e.target.value })
                }
                className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="Mathematics" className="bg-gray-800">
                  Mathematics
                </option>
                <option value="Science" className="bg-gray-800">
                  Science
                </option>
                <option value="English" className="bg-gray-800">
                  English
                </option>
                <option value="History" className="bg-gray-800">
                  History
                </option>
                <option value="Geography" className="bg-gray-800">
                  Geography
                </option>
                <option value="Computer Science" className="bg-gray-800">
                  Computer Science
                </option>
              </select>
              <textarea
                placeholder="Classroom Description"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                rows={3}
                className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCreateClassroom}
                  disabled={
                    !createForm.name.trim() || !createForm.description.trim()
                  }
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    createForm.name.trim() && createForm.description.trim()
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-500 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Classroom Modal */}
      {showJoinForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">
              Join Classroom
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Code className="w-5 h-5 text-white/70" />
                <span className="text-white/70">
                  Enter the class code provided by your teacher
                </span>
              </div>
              <input
                type="text"
                placeholder="Enter Class Code"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError("");
                }}
                className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 text-center text-lg font-mono"
              />
              {joinError && <p className="text-red-300 text-sm">{joinError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleJoinClassroom}
                  disabled={!joinCode.trim()}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    joinCode.trim()
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-gray-500 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  Join
                </button>
                <button
                  onClick={() => {
                    setShowJoinForm(false);
                    setJoinError("");
                    setJoinCode("");
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classrooms Grid */}
      {classrooms.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-white/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Classrooms
          </h3>
          <p className="text-white/70">
            {user.role === "teacher"
              ? "Create your first classroom to start teaching"
              : "Join a classroom using the class code from your teacher"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom) => (
            <div
              key={classroom.id}
              onClick={() => setSelectedClassroom(classroom.id)}
              className={`bg-gradient-to-r ${classroom.color} backdrop-blur-sm rounded-2xl p-6 border border-white/20 cursor-pointer hover:scale-105 transition-all duration-200`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {classroom.name}
                  </h3>
                  <p className="text-white/70 text-sm">{classroom.subject}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              </div>

              <p className="text-white/80 text-sm mb-4 line-clamp-2">
                {classroom.description}
              </p>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-white/70" />
                  <span className="text-white/70 text-sm">
                    {classroom.students.length} student
                    {classroom.students.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Only show classroom code for teachers */}
                {user.role === "teacher" && classroom.code && (
                  <div className="bg-white/20 px-2 py-1 rounded text-white/80 text-xs font-mono">
                    {classroom.code}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-white/70" />
                  <span className="text-white/70 text-sm">
                    {user.role === "teacher"
                      ? "Manage classroom"
                      : "View classroom"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassroomSection;
