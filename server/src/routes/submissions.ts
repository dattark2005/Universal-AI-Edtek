import express from 'express';
import Assignment from '../models/Assignment';
import Submission from '../models/Submission';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import mongoose from 'mongoose';

const router = express.Router();

// @desc    Get all submissions
// @route   GET /api/submissions
// @access  Private
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    let submissions;

    if (userRole === 'teacher') {
      // Find all assignments created by this teacher
      const assignments = await Assignment.find({ teacherId: new mongoose.Types.ObjectId(userId) }).select('_id');
      const assignmentIds = assignments.map(a => a._id);
      submissions = await Submission.find({ assignmentId: { $in: assignmentIds } })
        .populate('studentId', 'name email avatar')
        .populate('assignmentId', 'title classroomId');
    } else {
      // Student: get their own submissions
      submissions = await Submission.find({ studentId: new mongoose.Types.ObjectId(userId) })
        .populate('assignmentId', 'title classroomId');
    }

    res.json({
      success: true,
      data: { submissions }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting submissions'
    });
  }
});

export default router; 