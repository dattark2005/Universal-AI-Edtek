import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizResult extends Document {
  userId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  subject: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  userAnswers: number[];
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
    points: number;
  }[];
  completedAt: Date;
}

const quizResultSchema = new Schema<IQuizResult>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: false
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: 0,
    max: 100
  },
  totalQuestions: {
    type: Number,
    required: [true, 'Total questions is required'],
    min: 1
  },
  correctAnswers: {
    type: Number,
    required: [true, 'Correct answers count is required'],
    min: 0
  },
  timeSpent: {
    type: Number,
    required: [true, 'Time spent is required'],
    min: 0
  },
  userAnswers: [{
    type: Number,
    required: true
  }],
  questions: [{
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    points: { type: Number, default: 1 }
  }],
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      if (ret.userAnswers) ret.answers = ret.userAnswers;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
quizResultSchema.index({ userId: 1, completedAt: -1 });
quizResultSchema.index({ subject: 1, score: -1 });
quizResultSchema.index({ quizId: 1 });
quizResultSchema.index({ subject: 1, userId: 1, score: -1 });

export default mongoose.model<IQuizResult>('QuizResult', quizResultSchema);