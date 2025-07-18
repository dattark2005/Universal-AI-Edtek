import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'teacher' | 'pending';
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  googleId?: string;
  emailVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  emailVerificationCode?: string;
  emailVerificationCodeExpires?: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: false,
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'pending'],
    required: [true, 'Role is required']
  },
  avatar: {
    type: String,
    default: function(this: IUser) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=8b5cf6&color=fff&size=150`;
    }
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  googleId: {
    type: String,
    required: false,
    index: true
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  emailVerificationCode: {
    type: String,
  },
  emailVerificationCodeExpires: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);