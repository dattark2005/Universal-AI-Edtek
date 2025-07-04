import express from 'express';
import User from '../models/User';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import cloudinary from '../config/cloudinary';

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
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
      data: { user }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting profile'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, bio, avatar } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { name, bio, avatar },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// @desc    Remove user avatar
// @route   DELETE /api/users/avatar
// @access  Private
router.delete('/avatar', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.avatar && user.avatar.includes('res.cloudinary.com')) {
      // Extract public_id from the URL
      const matches = user.avatar.match(/\/avatars\/([^\.\/]+)\./);
      if (matches && matches[1]) {
        const publicId = `avatars/${matches[1]}`;
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        } catch (e) {
          console.warn('Failed to delete Cloudinary avatar:', e);
        }
      }
    }
    user.avatar = undefined;
    await user.save();
    res.json({ success: true, message: 'Avatar removed' });
  } catch (error: any) {
    console.error('Remove avatar error:', error);
    res.status(500).json({ success: false, message: 'Server error removing avatar' });
  }
});

export default router;