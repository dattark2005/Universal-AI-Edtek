export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: 'student' | 'teacher';
  bio?: string;
  joinedAt: Date;
  classrooms?: string[];
}

export interface Quiz {
  id: string;
  subject: string;
  questions: Question[];
  timeLimit: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizResult {
  id: string;
  userId: string;
  quizId: string;
  subject: string;
  score: number;
  totalQuestions: number;
  completedAt: Date;
  answers: number[];
}

export interface StudyPlan {
  id: string;
  userId: string;
  subject: string;
  score: number;
  plan: {
    videos: { title: string; url: string; duration: string }[];
    notes: { title: string; content: string; type: string }[];
    documents: { title: string; url: string; type: string }[];
    textPlan: string;
  };
  createdAt: Date;
}

export interface Assignment {
  id: string;
  teacherId: string;
  teacherName: string;
  classroomId?: string;
  title: string;
  description: string;
  subject: string;
  dueDate: Date;
  createdAt: Date;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content: string;
  submittedAt: Date;
  grade?: number;
  feedback?: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar: string;
  score: number;
  quizzesTaken: number;
}

export interface Classroom {
  id: string;
  name: string;
  description: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  code: string;
  students: string[];
  createdAt: Date;
  color: string;
}

export interface ClassroomMessage {
  id: string;
  classroomId: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'teacher';
  message: string;
  timestamp: Date;
}