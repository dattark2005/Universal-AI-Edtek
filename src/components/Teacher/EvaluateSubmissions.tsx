import React, { useState } from "react";
import { FileText, Star, MessageCircle, Users } from "lucide-react";
import { eduAPI } from "../../services/api";
import axios from "axios";
import { Assignment, Submission } from "../../types";

const API_BASE_URL = "http://localhost:5000"; // Change if your backend runs elsewhere

const EvaluateSubmissions: React.FC = () => {
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(
    null
  );
  const [gradingSubmission, setGradingSubmission] = useState<string | null>(
    null
  );
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
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
        setError("Failed to load assignments or submissions.");
        setAssignments([]);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGradeSubmission = async (submissionId: string) => {
    const gradeNum = parseFloat(grade);
    if (gradeNum >= 0 && gradeNum <= 100 && feedback.trim()) {
      try {
        await eduAPI.gradeSubmission(submissionId, gradeNum, feedback.trim());
        // Optimistically update the local submissions state for immediate feedback
        setSubmissions((prevSubs) =>
          prevSubs.map((sub) =>
            (sub.id || sub._id) === submissionId
              ? { ...sub, grade: gradeNum, feedback: feedback.trim() }
              : sub
          )
        );
        setGradingSubmission(null);
        setGrade("");
        setFeedback("");
      } catch (err) {
        // handle error
      }
    }
  };

  const getSubmissionsForAssignment = (
    assignmentId: string | { id?: string; _id?: string }
  ) => {
    // Normalize assignmentId to string
    const aid =
      typeof assignmentId === "object"
        ? assignmentId.id || assignmentId._id
        : assignmentId;
    return submissions.filter((s: any) => {
      const sid =
        typeof s.assignmentId === "object"
          ? s.assignmentId.id || s.assignmentId._id
          : s.assignmentId;
      return sid === aid;
    });
  };

  // Filter assignments created by this teacher
  const teacherAssignments = assignments.filter((a) => {
    // Handle both string and object forms for teacherId
    const teacherId = a.teacherId?._id || a.teacherId?.id || a.teacherId;
    return (
      teacherId === undefined ||
      teacherId === null ||
      teacherId === "" ||
      teacherId === (a.teacherId?._id || a.teacherId?.id || a.teacherId)
    );
  });

  const getClassroomName = (classroomId?: string) => {
    if (!classroomId) return "All Students";
    const assignment = assignments.find(
      (a) => a.classroomId === classroomId || a.classroomId?._id === classroomId
    );
    return assignment
      ? assignment.classroomId?.name ||
          assignment.classroomId ||
          "Unknown Classroom"
      : "Unknown Classroom";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 shadow-lg shadow-blue-400/40 mb-6"></div>
        <div className="text-2xl font-bold text-blue-300 drop-shadow-glow mb-2 animate-pulse">
          Loading submissions and assignments...
        </div>
        <div className="text-blue-100 text-lg font-medium opacity-80">
          Please wait while we fetch your data.
        </div>
      </div>
    );
  }

  if (teacherAssignments.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-white/50 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          No Assignments
        </h3>
        <p className="text-white/70 mb-4">
          Upload some assignments first to see student submissions.
        </p>
        {teacherAssignments.length === 0 && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-300" />
              <span className="text-blue-300 font-medium">
                Create a Classroom
              </span>
            </div>
            <p className="text-white/70 text-sm">
              Create classrooms to organize your students and assignments
              better.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">
        Evaluate Student Submissions
      </h2>

      {!selectedAssignment ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            Select an Assignment
          </h3>
          {teacherAssignments.map((assignment) => {
            const submissions = getSubmissionsForAssignment(assignment.id);
            const gradedSubmissions = submissions.filter(
              (s) => s.grade !== undefined
            );

            return (
              <div
                key={assignment.id}
                onClick={() => setSelectedAssignment(assignment.id)}
                className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20 cursor-pointer hover:scale-105 transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-2">
                      {assignment.title}
                    </h4>
                    <p className="text-white/70 mb-2">{assignment.subject}</p>
                    <p className="text-white/60 text-sm mb-1">
                      Classroom: {getClassroomName(assignment.classroomId)}
                    </p>
                    <p className="text-white/60 text-sm">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium mb-2">
                      {submissions.length} submission
                      {submissions.length !== 1 ? "s" : ""}
                    </div>
                    {submissions.length > 0 && (
                      <div className="text-white/60 text-sm">
                        {gradedSubmissions.length} graded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setSelectedAssignment(null)}
              className="text-white/70 hover:text-white transition-colors"
            >
              ← Back to Assignments
            </button>
            <h3 className="text-xl font-semibold text-white">
              {
                teacherAssignments.find((a) => a.id === selectedAssignment)
                  ?.title
              }
            </h3>
          </div>

          <div className="space-y-6">
            {getSubmissionsForAssignment(selectedAssignment).map(
              (submission) => (
                <div
                  key={submission.id}
                  className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {submission.studentId?.name ||
                          submission.studentId?.email ||
                          submission.studentId?._id ||
                          submission.studentId ||
                          "Unknown Student"}
                      </h4>
                      {submission.studentId?.email && (
                        <p className="text-white/50 text-xs mb-1">
                          {submission.studentId.email}
                        </p>
                      )}
                      <p className="text-white/60 text-sm">
                        Submitted:{" "}
                        {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      {submission.grade !== undefined ? (
                        <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                          Graded: {submission.grade}%
                        </div>
                      ) : (
                        <div className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm font-medium">
                          Pending Review
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 mb-4">
                    <h5 className="text-white font-medium mb-2">
                      Student Response:
                    </h5>
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
                              (file: any, idx: number) => {
                                const isImage =
                                  file.mimeType &&
                                  file.mimeType.startsWith("image/");
                                const isPDF =
                                  file.mimeType === "application/pdf";
                                const isDoc =
                                  file.mimeType &&
                                  (file.mimeType.includes("msword") ||
                                    file.mimeType.includes("officedocument"));
                                return (
                                  <li
                                    key={
                                      file.public_id ||
                                      file.url ||
                                      file.filename ||
                                      idx
                                    }
                                    className="mb-4 flex items-center gap-4"
                                  >
                                    {isImage ? (
                                      <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <img
                                          src={file.url}
                                          alt={file.filename}
                                          className="w-12 h-12 object-cover rounded shadow border border-white/20 hover:scale-105 transition-transform duration-200"
                                        />
                                      </a>
                                    ) : (
                                      <>
                                        <span className="font-semibold text-white/80 flex items-center gap-2">
                                          {isPDF ? (
                                            <span className="inline-block w-5 h-5 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">
                                              PDF
                                            </span>
                                          ) : isDoc ? (
                                            <span className="inline-block w-5 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">
                                              DOC
                                            </span>
                                          ) : (
                                            <FileText className="w-5 h-5 text-white/70" />
                                          )}
                                          {file.filename}
                                        </span>
                                        <button
                                          onClick={() =>
                                            window.open(
                                              file.url,
                                              "_blank",
                                              "noopener,noreferrer"
                                            )
                                          }
                                          className="ml-2 px-4 py-2 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white rounded-lg font-semibold shadow-glow flex items-center gap-2 transition-all duration-200"
                                        >
                                          <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              d="M15 10l4.553 4.553a.75.75 0 010 1.06L15 20M19.553 14.553H9a2 2 0 01-2-2V5.75A.75.75 0 017.75 5h8.5a.75.75 0 01.75.75V14.553z"
                                            />
                                          </svg>
                                          Preview
                                        </button>
                                      </>
                                    )}
                                  </li>
                                );
                              }
                            )}
                          </ul>
                        </div>
                      )}
                  </div>

                  {submission.feedback && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                      <h5 className="text-white font-medium mb-2">
                        Your Feedback:
                      </h5>
                      <p className="text-white/80">{submission.feedback}</p>
                    </div>
                  )}

                  {gradingSubmission === (submission.id || submission._id) ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white font-medium mb-2">
                            Grade (0-100)
                          </label>
                          <input
                            type="text"
                            min="0"
                            max="100"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            placeholder="Enter grade..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-white font-medium mb-2">
                          Feedback
                        </label>
                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          rows={3}
                          className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="Provide constructive feedback..."
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() =>
                            handleGradeSubmission(
                              submission.id || submission._id
                            )
                          }
                          disabled={
                            !grade ||
                            !feedback.trim() ||
                            parseFloat(grade) < 0 ||
                            parseFloat(grade) > 100
                          }
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                            grade &&
                            feedback.trim() &&
                            parseFloat(grade) >= 0 &&
                            parseFloat(grade) <= 100
                              ? "bg-green-500 hover:bg-green-600 text-white"
                              : "bg-gray-500 text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          <Star className="w-5 h-5" />
                          Submit Grade
                        </button>

                        <button
                          onClick={() => {
                            setGradingSubmission(null);
                            setGrade("");
                            setFeedback("");
                          }}
                          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setGradingSubmission(submission.id || submission._id)
                      }
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                        submission.grade !== undefined
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                    >
                      <MessageCircle className="w-5 h-5" />
                      {submission.grade !== undefined
                        ? "Update Grade"
                        : "Grade Submission"}
                    </button>
                  )}
                </div>
              )
            )}

            {getSubmissionsForAssignment(selectedAssignment).length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-white/50 mx-auto mb-4" />
                <p className="text-white/70">
                  No submissions yet for this assignment.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluateSubmissions;
