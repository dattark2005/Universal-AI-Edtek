import React, { useState, useRef } from "react";
import { FileText, Calendar, Clock, Send, Users } from "lucide-react";
import {
  getAssignments,
  getSubmissions,
  saveSubmission,
  getCurrentUser,
  getUserClassrooms,
} from "../../utils/storage";
import { mockAssignments } from "../../utils/mockData";
import { Submission } from "../../types";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000"; // Change if your backend runs elsewhere

const AssignmentsSection: React.FC = () => {
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(
    null
  );
  const [submissionContent, setSubmissionContent] = useState("");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showToast, setShowToast] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<any>(null);
  const [editContent, setEditContent] = useState("");
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const user = getCurrentUser();
  const userClassrooms = user ? getUserClassrooms(user.id, "student") : [];

  React.useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("authToken");
        const [assignmentsRes, submissionsRes] = await Promise.all([
          axios.get("/api/assignments", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/api/submissions", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setAssignments(assignmentsRes.data.data.assignments || []);
        setSubmissions(submissionsRes.data.data.submissions || []);
      } catch (err) {
        setError("Failed to load assignments.");
        setAssignments([]);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [user?.id]);

  // Filter assignments for classrooms the student is in or public assignments
  const studentAssignments = assignments.filter((assignment) => {
    if (!assignment.classroomId) return true; // Show to all if no classroomId (public assignment)
    // Handle both string and object forms
    return userClassrooms.some(
      (classroom) =>
        classroom.id === assignment.classroomId ||
        classroom.id === assignment.classroomId?._id
    );
  });

  // Get user's submissions
  const userSubmissions = user
    ? submissions.filter(
        (sub) => sub.studentId === user.id || sub.studentId?._id === user.id
      )
    : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (assignmentId: string) => {
    if (!user || (!submissionContent.trim() && selectedFiles.length === 0))
      return;
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("content", submissionContent.trim());
      selectedFiles.forEach((file) => {
        formData.append("attachments", file);
      });
      await axios.post(`/api/assignments/${assignmentId}/submit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      // Refresh submissions
      const submissionsRes = await axios.get("/api/submissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions(submissionsRes.data.data.submissions || []);
      setSubmissionContent("");
      setSelectedFiles([]);
      setSelectedAssignment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      // handle error (optional)
    }
  };

  const isAssignmentSubmitted = (assignmentId: string) => {
    return userSubmissions.some((sub) => {
      if (typeof sub.assignmentId === "object") {
        return (
          sub.assignmentId.id === assignmentId ||
          sub.assignmentId._id === assignmentId
        );
      }
      return sub.assignmentId === assignmentId;
    });
  };

  const getSubmissionForAssignment = (assignmentId: string) => {
    return userSubmissions.find((sub) => {
      if (typeof sub.assignmentId === "object") {
        return (
          sub.assignmentId.id === assignmentId ||
          sub.assignmentId._id === assignmentId
        );
      }
      return sub.assignmentId === assignmentId;
    });
  };

  const handleEdit = (submission: any) => {
    setEditingSubmission(submission);
    setEditContent(submission.content || "");
    setEditFiles([]); // Only allow new files to be uploaded, not re-download old ones
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditFiles(Array.from(e.target.files));
    }
  };

  const handleEditSubmit = async () => {
    if (!editingSubmission) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("content", editContent.trim());
      editFiles.forEach((file) => {
        formData.append("attachments", file);
      });
      // Delete previous submission first
      await axios.delete(
        `/api/submissions/${editingSubmission._id || editingSubmission.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Submit new
      await axios.post(
        `/api/assignments/${
          editingSubmission.assignmentId?._id || editingSubmission.assignmentId
        }/submit`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // Refresh submissions
      const submissionsRes = await axios.get("/api/submissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions(submissionsRes.data.data.submissions || []);
      setEditingSubmission(null);
      setEditContent("");
      setEditFiles([]);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err: any) {
      setEditError(
        err.response?.data?.message || "Failed to update submission."
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteSubmission = async (submission: any) => {
    if (!window.confirm("Are you sure you want to delete your submission?"))
      return;
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(
        `/api/submissions/${submission._id || submission.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Refresh submissions
      const submissionsRes = await axios.get("/api/submissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions(submissionsRes.data.data.submissions || []);
      setEditingSubmission(null);
      setEditContent("");
      setEditFiles([]);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      // handle error
    }
  };

  if (studentAssignments.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-white/50 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          No Assignments
        </h3>
        <p className="text-white/70 mb-4">
          {userClassrooms.length === 0
            ? "Join a classroom to see assignments from your teachers."
            : "Your teachers haven't assigned any work yet."}
        </p>
        {userClassrooms.length === 0 && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-300" />
              <span className="text-blue-300 font-medium">
                Join a Classroom
              </span>
            </div>
            <p className="text-white/70 text-sm">
              Go to the Classrooms section and use a class code to join your
              teacher's classroom.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Assignments</h2>

      <div className="space-y-6">
        {studentAssignments.map((assignment) => {
          const isSubmitted = isAssignmentSubmitted(assignment.id);
          const submission = getSubmissionForAssignment(assignment.id);
          const isOverdue = new Date() > new Date(assignment.dueDate);

          return (
            <div
              key={assignment.id}
              className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {assignment.title}
                  </h3>
                  <p className="text-white/70 mb-2">
                    By{" "}
                    {assignment.teacherId?.name ||
                      assignment.teacherId?.email ||
                      assignment.teacherId ||
                      "Unknown"}
                  </p>
                  <p className="text-white/80 leading-relaxed">
                    {assignment.description}
                  </p>
                </div>

                <div className="text-right">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                      isOverdue
                        ? "bg-red-500/20 text-red-300"
                        : "bg-blue-500/20 text-blue-300"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </div>

                  {/* Submission Status Badge */}
                  {submission ? (
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                        submission.status === "evaluated"
                          ? "bg-green-500/20 text-green-300"
                          : submission.status === "submitted"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-gray-500/20 text-gray-300"
                      }`}
                    >
                      {submission.status === "evaluated" && "Evaluated"}
                      {submission.status === "submitted" &&
                        "Submitted (Pending Evaluation)"}
                    </div>
                  ) : (
                    <div className="bg-gray-500/20 text-gray-300 px-3 py-1 rounded-full text-sm font-medium mb-2">
                      Not Submitted
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-white/20 pt-4">
                {isSubmitted && submission ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white font-medium mb-2">
                        Your Submission:
                      </h4>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-white/80 whitespace-pre-wrap">
                          {submission.content}
                        </p>
                        {submission.attachments &&
                          submission.attachments.length > 0 && (
                            <div className="mt-2">
                              <div className="text-white/70 font-semibold mb-1">
                                Attachments:
                              </div>
                              <ul className="list-disc list-inside">
                                {submission.attachments.map(
                                  (file: any, idx: number) => (
                                    <li key={idx}>
                                      <a
                                        href={
                                          file.url.startsWith("http")
                                            ? file.url
                                            : `${API_BASE_URL}${
                                                file.url.startsWith("/")
                                                  ? ""
                                                  : "/"
                                              }${file.url}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-300 underline hover:text-blue-400"
                                      >
                                        {file.filename}
                                      </a>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                      <p className="text-white/60 text-sm mt-2">
                        Submitted on{" "}
                        {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Show grade and feedback only if evaluated */}
                    {submission.status === "evaluated" && (
                      <>
                        <div>
                          <h4 className="text-white font-medium mb-2">
                            Grade:
                          </h4>
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <p className="text-green-300 text-lg font-bold">
                              {submission.grade}%
                            </p>
                          </div>
                        </div>
                        {submission.feedback && (
                          <div>
                            <h4 className="text-white font-medium mb-2">
                              Teacher Feedback:
                            </h4>
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                              <p className="text-white/80">
                                {submission.feedback}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {/* Edit/Delete options if not graded */}
                    {submission.grade === undefined && !editingSubmission && (
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => handleEdit(submission)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                          Edit Submission
                        </button>
                        <button
                          onClick={() => handleDeleteSubmission(submission)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                          Delete Submission
                        </button>
                      </div>
                    )}
                  </div>
                ) : selectedAssignment === assignment.id ? (
                  <div className="space-y-4">
                    <textarea
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      placeholder="Write your assignment response here..."
                      className="w-full h-40 bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <div>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.xls,.xlsx,.csv,.zip,.rar,.mp4,.mp3,.wav,.avi,.mov,.mkv"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="block w-full text-white mt-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {selectedFiles.length > 0 && (
                        <div className="mt-2 text-white/80 text-sm">
                          Selected files:{" "}
                          {selectedFiles.map((f) => f.name).join(", ")}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleSubmit(assignment.id)}
                        disabled={
                          !submissionContent.trim() &&
                          selectedFiles.length === 0
                        }
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                          submissionContent.trim() || selectedFiles.length > 0
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : "bg-gray-500 text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        <Send className="w-5 h-5" />
                        Submit Assignment
                      </button>
                      <button
                        onClick={() => setSelectedAssignment(null)}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedAssignment(assignment.id)}
                    disabled={isOverdue}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                      isOverdue
                        ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    {isOverdue ? "Overdue" : "Start Assignment"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Submission Modal */}
      {editingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative animate-fade-in">
            <button
              onClick={() => setEditingSubmission(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Edit Submission
            </h2>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Update your assignment response here..."
              className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 mb-4"
            />
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.xls,.xlsx,.csv,.zip,.rar,.mp4,.mp3,.wav,.avi,.mov,.mkv"
              onChange={handleEditFileChange}
              className="block w-full text-gray-700 mb-2 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {editFiles.length > 0 && (
              <div className="mb-2 text-gray-700 text-sm">
                Selected files: {editFiles.map((f) => f.name).join(", ")}
              </div>
            )}
            {editError && (
              <div className="text-red-500 text-sm mb-2">{editError}</div>
            )}
            <button
              onClick={handleEditSubmit}
              disabled={
                editLoading || (!editContent.trim() && editFiles.length === 0)
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg mt-2 disabled:opacity-60"
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-semibold animate-fade-in">
          Assignment submitted successfully!
        </div>
      )}
    </div>
  );
};

export default AssignmentsSection;
