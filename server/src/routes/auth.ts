import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { validateRequest, schemas } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Generate JWT Token (include role)
const generateToken = (userId: string, role: string): string => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateRequest(schemas.register), async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      role
    });

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateRequest(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findById(req.user?.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error getting user data'
    });
  }
});

export default router;