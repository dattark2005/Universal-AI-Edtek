import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  teacherId: mongoose.Types.ObjectId;
  classroomId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  subject: string;
  dueDate: Date;
  maxPoints: number;
  attachments: Array<{
    filename: string;
    url: string;
    size: number;
    mimeType: string;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>({
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required']
  },
  classroomId: {
    type: Schema.Types.ObjectId,
    ref: 'Classroom'
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    enum: ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(date: Date) {
        return date > new Date();
      },
      message: 'Due date must be in the future'
    }
  },
  maxPoints: {
    type: Number,
    required: [true, 'Maximum points is required'],
    min: [1, 'Maximum points must be at least 1'],
    max: [1000, 'Maximum points cannot exceed 1000']
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
  isActive: {
    type: Boolean,
    default: true
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
assignmentSchema.index({ teacherId: 1, createdAt: -1 });
assignmentSchema.index({ classroomId: 1, dueDate: 1 });
assignmentSchema.index({ subject: 1, isActive: 1 });
assignmentSchema.index({ dueDate: 1, isActive: 1 });

export default mongoose.model<IAssignment>('Assignment', assignmentSchema);