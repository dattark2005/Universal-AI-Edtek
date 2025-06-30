import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  content: string;
  attachments: Array<{
    filename: string;
    url: string;
    size: number;
    mimeType: string;
  }>;
  grade?: number;
  feedback?: string;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
  submittedAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>({
  assignmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'Assignment ID is required']
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    }
  }],
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date
  },
  submittedAt: {
    type: Date,
    default: Date.now
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
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ studentId: 1, submittedAt: -1 });
submissionSchema.index({ gradedBy: 1, gradedAt: -1 });

export default mongoose.model<ISubmission>('Submission', submissionSchema);