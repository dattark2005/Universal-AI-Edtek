import mongoose, { Schema } from 'mongoose';
import { IClassroomMessage } from '../types';

const classroomMessageSchema = new Schema<IClassroomMessage>({
  classroomId: {
    type: Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'announcement'],
    default: 'text'
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
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
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
classroomMessageSchema.index({ classroomId: 1, createdAt: -1 });
classroomMessageSchema.index({ senderId: 1, createdAt: -1 });
classroomMessageSchema.index({ messageType: 1 });

export default mongoose.model<IClassroomMessage>('ClassroomMessage', classroomMessageSchema);