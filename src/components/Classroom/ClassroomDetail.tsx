import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  MessageCircle,
  Send,
  BookOpen,
  Code,
} from "lucide-react";
import {
  getCurrentUser,
  getClassrooms,
  getMessagesForClassroom,
  saveClassroomMessage,
} from "../../utils/storage";
import { ClassroomMessage } from "../../types";
import axios from "axios";

interface ClassroomDetailProps {
  classroomId: string;
  onBack: () => void;
}

const ClassroomDetail: React.FC<ClassroomDetailProps> = ({
  classroomId,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<"stream" | "people">("stream");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<ClassroomMessage[]>([]);
  const [classroom, setClassroom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = getCurrentUser();
  if (!user) return null;

  useEffect(() => {
    const fetchClassroom = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.get(`/api/classrooms/${classroomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClassroom(res.data.data.classroom);
      } catch (err: any) {
        setError("Failed to load classroom.");
      } finally {
        setLoading(false);
      }
    };
    fetchClassroom();
  }, [classroomId]);

  useEffect(() => {
    const classroomMessages = getMessagesForClassroom(classroomId);
    setMessages(classroomMessages);
  }, [classroomId]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ClassroomMessage = {
      id: Math.random().toString(36).substr(2, 9),
      classroomId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      message: newMessage.trim(),
      timestamp: new Date(),
    };

    saveClassroomMessage(message);
    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteClassroom = async () => {
    if (!window.confirm("Are you sure you want to delete this classroom?"))
      return;
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`/api/classrooms/${classroomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onBack();
    } catch (err) {
      alert("Failed to delete classroom.");
    }
  };

  if (loading)
    return <div className="text-white p-8">Loading classroom...</div>;
  if (error || !classroom)
    return (
      <div className="text-red-400 p-8">{error || "Classroom not found."}</div>
    );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{classroom.name}</h2>
          <p className="text-white/70">
            {classroom.subject} • {classroom.teacherId?.name || ""}
          </p>
        </div>
        {user.role === "teacher" && (
          <>
            <div className="bg-white/10 px-3 py-1 rounded-lg">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-white/70" />
                <span className="text-white font-mono">{classroom.code}</span>
              </div>
            </div>
            <button
              onClick={handleDeleteClassroom}
              className="ml-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Delete Classroom
            </button>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/10 rounded-lg p-1 flex-shrink-0">
        <button
          onClick={() => setActiveTab("stream")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === "stream"
              ? "bg-white/20 text-white"
              : "text-white/70 hover:text-white"
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Chat Room
        </button>
        <button
          onClick={() => setActiveTab("people")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === "people"
              ? "bg-white/20 text-white"
              : "text-white/70 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          People ({classroom.students.length + 1})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === "stream" ? (
          <div className="flex flex-col h-full">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-white/50 mx-auto mb-4" />
                  <p className="text-white/70">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className="glass-morphism rounded-2xl p-4 border border-white/20 animate-fade-in"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.senderRole === "teacher"
                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                            : "bg-gradient-to-r from-blue-500 to-purple-500"
                        }`}
                      >
                        <span className="text-white text-sm font-bold">
                          {message.senderName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">
                            {message.senderName}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              message.senderRole === "teacher"
                                ? "bg-green-500/20 text-green-300"
                                : "bg-blue-500/20 text-blue-300"
                            }`}
                          >
                            {message.senderRole}
                          </span>
                          <span className="text-white/50 text-xs">
                            {new Date(message.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-white/80 whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="glass-morphism rounded-2xl p-4 border border-white/20 flex-shrink-0">
              <div className="flex gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-white/30 flex-shrink-0"
                />
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    rows={2}
                    className="w-full bg-white/10 border border-white/30 rounded-lg p-3 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        newMessage.trim()
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-glow hover:scale-105"
                          : "bg-gray-500 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {/* Teacher */}
            <div className="glass-morphism rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Teacher</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {classroom.teacherId?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">
                    {classroom.teacherId?.name}
                  </p>
                  <p className="text-white/60 text-sm">Class Teacher</p>
                </div>
              </div>
            </div>

            {/* Students */}
            <div className="glass-morphism rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">
                Students ({classroom.students.length})
              </h3>
              {classroom.students.length === 0 ? (
                <p className="text-white/70">No students have joined yet.</p>
              ) : (
                <div className="space-y-3">
                  {classroom.students.map((student: any, index: number) => (
                    <div
                      key={student._id || student.email || index}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                    >
                      <img
                        src={student.avatar || "/default-avatar.png"}
                        alt={student.name}
                        className="w-10 h-10 rounded-full border-2 border-white/30"
                      />
                      <div>
                        <p className="text-white font-medium">{student.name}</p>
                        <p className="text-white/60 text-sm">Student</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomDetail;
