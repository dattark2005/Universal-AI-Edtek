import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'student' | 'teacher';
  };
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz {
  _id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizResult {
  _id: string;
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  answers: number[];
  timeSpent: number;
  completedAt: Date;
}

export interface Classroom {
  _id: string;
  name: string;
  description: string;
  teacherId: string;
  students: string[];
  subject: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  classroomId: string;
  teacherId: string;
  dueDate: Date;
  maxPoints: number;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Submission {
  _id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  attachments?: string[];
  grade?: number;
  feedback?: string;
  submittedAt: Date;
  gradedAt?: Date;
}

export interface StudyPlan {
  _id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  modules: StudyModule[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyModule {
  title: string;
  description: string;
  content: string;
  resources: string[];
  estimatedTime: number;
  order: number;
}

export interface Leaderboard {
  _id: string;
  name: string;
  type: 'quiz' | 'assignment' | 'overall';
  classroomId?: string;
  entries: LeaderboardEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  rank: number;
}