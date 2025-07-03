import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { validateRequest, schemas } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import passport from 'passport';
import '../config/passport'; // Ensure GoogleStrategy is registered
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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

// @desc    Set or create user password
// @route   POST /api/auth/set-password
// @access  Public
router.post('/set-password', async (req, res) => {
  try {
    const { email, name, role, password } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ success: false, message: 'Email, name, role, and password are required' });
    }
    let user = await User.findOne({ email }).select('+password +googleId');
    if (!user) {
      // Create new user
      user = await User.create({ email, name, role, password });
      return res.json({ success: true, message: 'User created and password set', data: { hasPassword: true } });
    }
    // For any user, always allow password overwrite without current password
    user.password = password;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully', data: { hasPassword: true } });
  } catch (error: any) {
    console.error('Set password error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error setting password' });
  }
});

// Google OAuth: Initiate login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth: Callback
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }), async (req, res) => {
  // @ts-ignore
  const user = req.user;
  console.log('Google callback user:', user); // Debug log
  if (!user) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
  }
  // Generate JWT
  const token = generateToken(user._id.toString(), user.role);
  // Redirect to frontend with token
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
});

// @desc    Get current user info
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
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error getting current user'
    });
  }
});

// @desc    Change user password securely
// @route   POST /api/auth/change-password
// @access  Private
router.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }
    const user = await User.findById(req.user?.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const isMatch = await user.comparePassword(currentPassword);
    console.log('[CHANGE PASSWORD] Comparing:', currentPassword, 'with hash:', user.password, 'Result:', isMatch);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error changing password' });
  }
});

export default router;