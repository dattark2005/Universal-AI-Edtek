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
  Pencil,
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    dueDate: "",
    description: "",
    maxPoints: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  const openEditModal = (assignment: any) => {
    setEditAssignment(assignment);
    setEditForm({
      title: assignment.title || "",
      dueDate: assignment.dueDate
        ? new Date(assignment.dueDate).toISOString().slice(0, 16)
        : "",
      description: assignment.description || "",
      maxPoints: assignment.maxPoints?.toString() || "",
    });
    setEditError(null);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditAssignment(null);
    setEditError(null);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAssignment) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.patch(
        `/api/assignments/${editAssignment._id || editAssignment.id}`,
        {
          title: editForm.title,
          dueDate: editForm.dueDate,
          description: editForm.description,
          maxPoints: Number(editForm.maxPoints),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update assignment in state
      setAssignments((prev) =>
        prev.map((a) =>
          (a._id || a.id) === (editAssignment._id || editAssignment.id)
            ? { ...a, ...res.data.data.assignment }
            : a
        )
      );
      closeEditModal();
    } catch (err: any) {
      setEditError(
        err.response?.data?.message || "Failed to update assignment."
      );
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        <div className="glass-morphism rounded-3xl shadow-glass border border-white/20 overflow-hidden animate-fade-in">
          <div className="flex">
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
                                <button
                                  onClick={() => openEditModal(assignment)}
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold mr-2 flex items-center gap-1"
                                >
                                  <Pencil className="w-4 h-4" /> Edit
                                </button>
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
      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative animate-fade-in">
            <button
              onClick={closeEditModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Edit Assignment
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  name="dueDate"
                  value={editForm.dueDate}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Max Points
                </label>
                <input
                  type="number"
                  name="maxPoints"
                  value={editForm.maxPoints}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min={1}
                  max={1000}
                  required
                />
              </div>
              {editError && (
                <div className="text-red-500 text-sm">{editError}</div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg mt-2 disabled:opacity-60"
                disabled={editLoading}
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAssignments;
