import React, { useState } from "react";
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

const AssignmentsSection: React.FC = () => {
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(
    null
  );
  const [submissionContent, setSubmissionContent] = useState("");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    ? submissions.filter((sub) => sub.studentId === user.id)
    : [];

  const handleSubmit = async (assignmentId: string) => {
    if (!user || !submissionContent.trim()) return;
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        `/api/assignments/${assignmentId}/submit`,
        {
          content: submissionContent.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Refresh submissions
      const submissionsRes = await axios.get("/api/submissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions(submissionsRes.data.data.submissions || []);
      setSubmissionContent("");
      setSelectedAssignment(null);
    } catch (err) {
      // handle error (optional)
    }
  };

  const isAssignmentSubmitted = (assignmentId: string) => {
    return userSubmissions.some((sub) => sub.assignmentId === assignmentId);
  };

  const getSubmissionForAssignment = (assignmentId: string) => {
    return userSubmissions.find((sub) => sub.assignmentId === assignmentId);
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
                    By {assignment.teacherName}
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

                  {isSubmitted && submission && (
                    <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                      Submitted
                      {submission.grade !== undefined && (
                        <span className="ml-2">
                          • Grade: {submission.grade}%
                        </span>
                      )}
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
                      </div>
                      <p className="text-white/60 text-sm mt-2">
                        Submitted on{" "}
                        {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>

                    {submission.feedback && (
                      <div>
                        <h4 className="text-white font-medium mb-2">
                          Teacher Feedback:
                        </h4>
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                          <p className="text-white/80">{submission.feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {selectedAssignment === assignment.id ? (
                      <div className="space-y-4">
                        <textarea
                          value={submissionContent}
                          onChange={(e) => setSubmissionContent(e.target.value)}
                          placeholder="Write your assignment response here..."
                          className="w-full h-40 bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />

                        <div className="flex gap-4">
                          <button
                            onClick={() => handleSubmit(assignment.id)}
                            disabled={!submissionContent.trim()}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                              submissionContent.trim()
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
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignmentsSection;
