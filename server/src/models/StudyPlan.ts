import mongoose, { Schema, Document } from 'mongoose';

export interface IStudyPlan extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  score: number;
  plan: {
    videos: Array<{
      title: string;
      url: string;
      duration: string;
      thumbnail?: string;
    }>;
    notes: Array<{
      title: string;
      content: string;
      type: string;
      url?: string;
    }>;
    documents: Array<{
      title: string;
      url: string;
      type: string;
      size?: number;
    }>;
    textPlan: string;
  };
  isCustomized: boolean;
  customizedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const studyPlanSchema = new Schema<IStudyPlan>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
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
  plan: {
    videos: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      url: {
        type: String,
        required: true,
        trim: true
      },
      duration: {
        type: String,
        required: true,
        trim: true
      },
      thumbnail: {
        type: String,
        trim: true
      }
    }],
    notes: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      content: {
        type: String,
        required: true,
        trim: true
      },
      type: {
        type: String,
        required: true,
        trim: true
      },
      url: {
        type: String,
        trim: true
      }
    }],
    documents: [{
      title: {
        type: String,
        required: true,
        trim: true
      },
      url: {
        type: String,
        required: true,
        trim: true
      },
      type: {
        type: String,
        required: true,
        trim: true
      },
      size: {
        type: Number,
        min: 0
      }
    }],
    textPlan: {
      type: String,
      required: [true, 'Text plan is required'],
      trim: true,
      maxlength: [2000, 'Text plan cannot exceed 2000 characters']
    }
  },
  isCustomized: {
    type: Boolean,
    default: false
  },
  customizedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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
studyPlanSchema.index({ userId: 1, subject: 1 });
studyPlanSchema.index({ customizedBy: 1 });
studyPlanSchema.index({ createdAt: -1 });

export default mongoose.model<IStudyPlan>('StudyPlan', studyPlanSchema);