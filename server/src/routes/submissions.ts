import express from 'express';
import Assignment from '../models/Assignment';
import Submission from '../models/Submission';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import mongoose from 'mongoose';
import { requireRole } from '../middleware/role';

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
      // Find all assignments created by this teacher (handle both string and ObjectId)
      const assignments = await Assignment.find({
        $or: [
          { teacherId: userId },
          { teacherId: new mongoose.Types.ObjectId(userId) }
        ]
      }).select('_id');
      const assignmentIds = assignments.map(a => a._id);
      submissions = await Submission.find({ assignmentId: { $in: assignmentIds } })
        .populate('studentId', 'name email avatar')
        .populate('assignmentId', 'title classroomId');
    } else {
      // Student: get their own submissions
      submissions = await Submission.find({ studentId: new mongoose.Types.ObjectId(userId) })
        .populate('assignmentId', 'title classroomId');
    }

    // Add status field to each submission
    submissions = submissions.map((sub) => {
      let status = 'submitted';
      if (sub.grade !== undefined && sub.grade !== null) {
        status = 'evaluated';
      }
      return { ...sub.toObject(), status };
    });

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

// TEMP: Delete all submissions (for testing/admin only)
router.delete('/all', async (req, res) => {
  await Submission.deleteMany({});
  res.json({ success: true, message: 'All submissions deleted' });
});

// @desc    Grade a submission
// @route   PATCH /api/submissions/:id
// @access  Private (Teacher only)
router.patch('/:id', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res) => {
  try {
    const { grade, feedback } = req.body;
    const submissionId = req.params.id;
    if (grade === undefined || feedback === undefined) {
      return res.status(400).json({ success: false, message: 'Grade and feedback are required' });
    }
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    submission.grade = grade;
    submission.feedback = feedback;
    submission.gradedBy = req.user!.id;
    submission.gradedAt = new Date();
    await submission.save();
    res.json({ success: true, message: 'Submission graded successfully', data: { submission } });
  } catch (error: any) {
    console.error('Grade submission error:', error);
    res.status(500).json({ success: false, message: 'Server error grading submission' });
  }
});

// @desc    Delete a submission
// @route   DELETE /api/submissions/:id
// @access  Private (Student only, or Teacher for admin/testing)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const submissionId = req.params.id;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Only allow students to delete their own submission, or teachers/admins for admin/testing
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    if (userRole === 'student' && submission.studentId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this submission' });
    }
    await submission.deleteOne();
    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting submission' });
  }
});

export default router; 