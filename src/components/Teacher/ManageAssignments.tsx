import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  CheckSquare,
  User,
  Users,
  Sparkles,
  BookOpen,
} from "lucide-react";

const sections = [
  {
    id: "upload",
    name: "Upload Assignment",
    icon: Upload,
    color: "from-primary-500 to-primary-600",
    onClick: (navigate: any) => navigate("/teacher/upload-assignment"),
  },
  {
    id: "evaluate",
    name: "Evaluate Submissions",
    icon: CheckSquare,
    color: "from-success-500 to-success-600",
    onClick: (navigate: any) =>
      navigate("/teacher/dashboard", { state: { section: "evaluate" } }),
  },
  {
    id: "study-plans",
    name: "Study Plans",
    icon: BookOpen,
    color: "from-purple-500 to-pink-600",
    onClick: (navigate: any) =>
      navigate("/teacher/dashboard", { state: { section: "study-plans" } }),
  },
  {
    id: "classrooms",
    name: "Classrooms",
    icon: Users,
    color: "from-secondary-500 to-secondary-600",
    onClick: (navigate: any) =>
      navigate("/teacher/dashboard", { state: { section: "classrooms" } }),
  },
  {
    id: "profile",
    name: "Profile",
    icon: User,
    color: "from-accent-500 to-accent-600",
    onClick: (navigate: any) =>
      navigate("/teacher/dashboard", { state: { section: "profile" } }),
  },
];

const ManageAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.get("/api/assignments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAssignments(res.data.data.assignments || []);
      } catch (err) {
        setError("Failed to load assignments.");
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const handleDelete = async (assignmentId: string) => {
    if (!window.confirm("Are you sure you want to delete this assignment?"))
      return;
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`/api/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssignments(
        assignments.filter(
          (a) => a._id !== assignmentId && a.id !== assignmentId
        )
      );
    } catch (err) {
      alert("Failed to delete assignment.");
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
                  const isActive = false;
                  return (
                    <button
                      key={section.id}
                      onClick={() => section.onClick(navigate)}
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group text-white/70 hover:text-white hover:bg-white/10 hover:scale-105`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white/10 group-hover:bg-white/20`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-display font-semibold">
                          {section.name}
                        </div>
                      </div>
                    </button>
                  );
                })}
                <button
                  onClick={() => navigate("/teacher/manage-assignments")}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-glow scale-105"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 shadow-card transition-all duration-300">
                    <span role="img" aria-label="manage">
                      🗂️
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="font-display font-semibold">
                      Manage Assignments
                    </div>
                    <div className="text-xs text-white/80">Active</div>
                  </div>
                </button>
              </nav>
            </div>
            {/* Main Content */}
            <div className="flex-1 p-8 animate-slide-up overflow-hidden">
              <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                <div className="max-w-4xl mx-auto py-10 px-4">
                  <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">
                      Manage Assignments
                    </h1>
                    <button
                      onClick={() => navigate("/teacher/upload-assignment")}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                      + Create Assignment
                    </button>
                  </div>
                  {loading ? (
                    <div className="text-white/70">Loading assignments...</div>
                  ) : error ? (
                    <div className="text-red-400">{error}</div>
                  ) : assignments.length === 0 ? (
                    <div className="text-white/70">No assignments found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white/10 rounded-lg">
                        <thead>
                          <tr className="text-white text-left">
                            <th className="py-3 px-4">Title</th>
                            <th className="py-3 px-4">Subject</th>
                            <th className="py-3 px-4">Classroom</th>
                            <th className="py-3 px-4">Due Date</th>
                            <th className="py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignments.map((assignment) => (
                            <tr
                              key={assignment._id || assignment.id}
                              className="border-b border-white/10"
                            >
                              <td className="py-3 px-4 text-white font-medium">
                                {assignment.title}
                              </td>
                              <td className="py-3 px-4 text-white/80">
                                {assignment.subject}
                              </td>
                              <td className="py-3 px-4 text-white/80">
                                {assignment.classroomId?.name ||
                                  "All Classrooms"}
                              </td>
                              <td className="py-3 px-4 text-white/80">
                                {new Date(assignment.dueDate).toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <button
                                  onClick={() =>
                                    handleDelete(
                                      assignment._id || assignment.id
                                    )
                                  }
                                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold mr-2"
                                >
                                  Delete
                                </button>
                                {/* Optionally add a View Details or View Submissions button here */}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAssignments;
