import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  points: number;
}

export interface IQuiz extends Document {
  title: string;
  description: string;
  subject: string;
  questions: IQuizQuestion[];
  timeLimit: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const quizQuestionSchema = new Schema<IQuizQuestion>({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true
  },
  options: [{
    type: String,
    required: true,
    trim: true
  }],
  correctAnswer: {
    type: Number,
    required: [true, 'Correct answer index is required'],
    min: 0,
    validate: {
      validator: function(this: IQuizQuestion, value: number) {
        return value < this.options.length;
      },
      message: 'Correct answer index must be valid'
    }
  },
  explanation: {
    type: String,
    trim: true
  },
  points: {
    type: Number,
    default: 1,
    min: 1
  }
}, { _id: false });

const quizSchema = new Schema<IQuiz>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    enum: ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science']
  },
  questions: {
    type: [quizQuestionSchema],
    required: [true, 'Questions are required'],
    validate: {
      validator: function(questions: IQuizQuestion[]) {
        return questions.length >= 1 && questions.length <= 50;
      },
      message: 'Quiz must have between 1 and 50 questions'
    }
  },
  timeLimit: {
    type: Number,
    required: [true, 'Time limit is required'],
    min: [60, 'Time limit must be at least 60 seconds'],
    max: [7200, 'Time limit cannot exceed 2 hours']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
quizSchema.index({ subject: 1, isActive: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ difficulty: 1 });
quizSchema.index({ createdAt: -1 });

export default mongoose.model<IQuiz>('Quiz', quizSchema);