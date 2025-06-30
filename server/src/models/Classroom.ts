import mongoose, { Schema, Document } from 'mongoose';

export interface IClassroom extends Document {
  name: string;
  description: string;
  subject: string;
  teacherId: mongoose.Types.ObjectId;
  code: string;
  students: mongoose.Types.ObjectId[];
  isActive: boolean;
  settings: {
    allowStudentChat: boolean;
    autoApproveStudents: boolean;
    maxStudents: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const classroomSchema = new Schema<IClassroom>({
  name: {
    type: String,
    required: [true, 'Classroom name is required'],
    trim: true,
    maxlength: [100, 'Classroom name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    enum: ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science']
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required']
  },
  code: {
    type: String,
    required: [true, 'Classroom code is required'],
    unique: true,
    uppercase: true,
    length: 8
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowStudentChat: {
      type: Boolean,
      default: true
    },
    autoApproveStudents: {
      type: Boolean,
      default: true
    },
    maxStudents: {
      type: Number,
      min: 1,
      max: 1000,
      default: 100
    }
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

// Indexes - removed duplicate code index since unique: true already creates it
classroomSchema.index({ teacherId: 1, isActive: 1 });
classroomSchema.index({ students: 1 });
classroomSchema.index({ subject: 1, isActive: 1 });

// Generate unique classroom code
classroomSchema.statics.generateCode = async function(): Promise<string> {
  let code: string;
  let exists: boolean;
  
  do {
    code = Math.random().toString(36).substr(2, 8).toUpperCase();
    exists = await this.exists({ code });
  } while (exists);
  
  return code;
};

export default mongoose.model<IClassroom>('Classroom', classroomSchema);