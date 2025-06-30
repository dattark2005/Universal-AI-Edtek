import express from 'express';
import Assignment from '../models/Assignment';
import Submission from '../models/Submission';
import Classroom from '../models/Classroom';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// @desc    Get assignments
// @route   GET /api/assignments
// @access  Private
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { classroomId, subject, page = 1, limit = 10 } = req.query;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let query: any = { isActive: true };

    if (userRole === 'teacher') {
      query.teacherId = userId;
    } else {
      // For students, get assignments from their classrooms
      const userClassrooms = await Classroom.find({ students: userId }).select('_id');
      const classroomIds = userClassrooms.map(c => c._id);
      
      query.$or = [
        { classroomId: { $in: classroomIds } },
        { classroomId: { $exists: false } } // Public assignments
      ];
    }

    if (classroomId) query.classroomId = classroomId;
    if (subject) query.subject = subject;

    const assignments = await Assignment.find(query)
      .populate('teacherId', 'name email')
      .populate('classroomId', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Assignment.countDocuments(query);

    res.json({
      success: true,
      data: {
        assignments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting assignments'
    });
  }
});

// @desc    Create assignment
// @route   POST /api/assignments
// @access  Private (Teacher only)
router.post('/', authenticateToken, requireRole(['teacher']), validateRequest(schemas.createAssignment), async (req: AuthenticatedRequest, res) => {
  try {
    const assignment = await Assignment.create({
      ...req.body,
      teacherId: req.user!.id
    });

    await assignment.populate('teacherId', 'name email');
    await assignment.populate('classroomId', 'name');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: { assignment }
    });
  } catch (error: any) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating assignment'
    });
  }
});

// @desc    Submit assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student only)
router.post('/:id/submit', authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res) => {
  try {
    const { content } = req.body;
    const assignmentId = req.params.id;
    const studentId = req.user!.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if assignment is still open
    if (new Date() > assignment.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Assignment deadline has passed'
      });
    }

    // Check if student already submitted
    const existingSubmission = await Submission.findOne({
      assignmentId,
      studentId
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this assignment'
      });
    }

    const submission = await Submission.create({
      assignmentId,
      studentId,
      content: content.trim()
    });

    await submission.populate('studentId', 'name email');
    await submission.populate('assignmentId', 'title');

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: { submission }
    });
  } catch (error: any) {
    console.error('Submit assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting assignment'
    });
  }
});

export default router;