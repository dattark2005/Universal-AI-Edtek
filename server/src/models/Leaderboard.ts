import mongoose, { Schema } from 'mongoose';
import { ILeaderboard } from '../types';

const leaderboardSchema = new Schema<ILeaderboard>({
  subject: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    enum: ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science']
  },
  entries: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    quizzesTaken: {
      type: Number,
      required: true,
      min: 1
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }]
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
leaderboardSchema.index({ subject: 1 }, { unique: true });
leaderboardSchema.index({ 'entries.userId': 1 });
leaderboardSchema.index({ 'entries.score': -1 });

export default mongoose.model<ILeaderboard>('Leaderboard', leaderboardSchema);