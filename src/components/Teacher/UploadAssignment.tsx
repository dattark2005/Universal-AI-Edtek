import React, { useState } from "react";
import { Upload, Send, Users } from "lucide-react";
import { SUBJECTS } from "../../utils/mockData";
import { Assignment } from "../../types";
import {
  saveAssignment,
  getCurrentUser,
  getUserClassrooms,
} from "../../utils/storage";
import { eduAPI, externalQuizAPI } from "../../services/api";
import axios from "axios";

const UploadAssignment: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [maxPoints, setMaxPoints] = useState(100);

  const user = getCurrentUser();

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [subs, cls, asns] = await Promise.all([
          externalQuizAPI.getAvailableSubjects(),
          eduAPI.getTeacherClassrooms(),
          axios.get("/api/assignments", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }),
        ]);
        setSubjects(subs);
        setSubject(subs[0] || "");
        setClassrooms(cls);
        console.log("Fetched classrooms:", cls);
        setAssignments(asns.data.data.assignments || []);
      } catch (err) {
        setSubjects([]);
        setClassrooms([]);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !description.trim() || !dueDate) return;
    setIsSubmitting(true);
    try {
      const res = await axios.post(
        "/api/assignments",
        {
          title: title.trim(),
          description: description.trim(),
          subject,
          classroomId: classroomId || undefined,
          dueDate: new Date(dueDate),
          maxPoints,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      setAssignments([res.data.data.assignment, ...assignments]);
      setTitle("");
      setDescription("");
      setClassroomId("");
      setDueDate("");
      setMaxPoints(100);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      // handle error (optional)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!window.confirm("Are you sure you want to delete this assignment?"))
      return;
    try {
      await axios.delete(`/api/assignments/${assignmentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      setAssignments(
        assignments.filter(
          (a) => a._id !== assignmentId && a.id !== assignmentId
        )
      );
    } catch (err) {
      // handle error (optional)
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-8 mb-6 max-w-md mx-auto">
          <div className="w-16 h-16 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-300" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Assignment Posted!
          </h3>
          <p className="text-white/70">
            Your assignment has been successfully posted and is now visible to
            students
            {classroomId ? " in the selected classroom" : " in all classrooms"}.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-white/70 py-12">Loading form...</div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">
        Upload New Assignment
      </h2>

      {classrooms.length === 0 && (
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-300" />
            <span className="text-blue-300 font-medium">No Classrooms</span>
          </div>
          <p className="text-white/70 text-sm">
            Create a classroom first to organize your assignments and connect
            with students.
          </p>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-white font-medium mb-2"
            >
              Assignment Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Enter assignment title..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="subject"
                className="block text-white font-medium mb-2"
              >
                Subject
              </label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {subjects.map((subj) => (
                  <option key={subj} value={subj} className="bg-gray-800">
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="classroom"
                className="block text-white font-medium mb-2"
              >
                Classroom
              </label>
              <select
                id="classroom"
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="" className="bg-gray-800">
                  All Classrooms
                </option>
                {classrooms.map((classroom) => (
                  <option
                    key={classroom.id || classroom._id}
                    value={classroom.id || classroom._id}
                    className="bg-gray-800"
                  >
                    {classroom.name} ({classroom.students.length} students)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="dueDate"
              className="block text-white font-medium mb-2"
            >
              Due Date
            </label>
            <input
              type="datetime-local"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-white font-medium mb-2"
            >
              Assignment Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Provide detailed instructions for the assignment..."
              required
            />
          </div>

          <div>
            <label
              htmlFor="maxPoints"
              className="block text-white font-medium mb-2"
            >
              Maximum Points
            </label>
            <input
              type="number"
              id="maxPoints"
              value={maxPoints}
              min={1}
              max={1000}
              onChange={(e) => setMaxPoints(Number(e.target.value))}
              className="w-full bg-white/10 border border-white/30 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting || !title.trim() || !description.trim() || !dueDate
            }
            className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-semibold transition-colors ${
              isSubmitting || !title.trim() || !description.trim() || !dueDate
                ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            <Upload className="w-5 h-5" />
            {isSubmitting ? "Posting Assignment..." : "Post Assignment"}
          </button>
        </form>
      </div>
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-white mb-4">
          Your Assignments
        </h3>
        {assignments.length === 0 ? (
          <p className="text-white/70">No assignments posted yet.</p>
        ) : (
          <ul className="space-y-4">
            {assignments.map((assignment) => (
              <li
                key={assignment._id || assignment.id}
                className="bg-white/10 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <div className="text-white font-medium">
                    {assignment.title}
                  </div>
                  <div className="text-white/60 text-sm">
                    Due: {new Date(assignment.dueDate).toLocaleString()}
                  </div>
                  <div className="text-white/60 text-sm">
                    Classroom:{" "}
                    {assignment.classroomId?.name || "All Classrooms"}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(assignment._id || assignment.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UploadAssignment;
