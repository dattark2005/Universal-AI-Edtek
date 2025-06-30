import express from 'express';
import Classroom from '../models/Classroom';
import User from '../models/User';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// @desc    Get user's classrooms
// @route   GET /api/classrooms
// @access  Private
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let classrooms;
    if (userRole === 'teacher') {
      classrooms = await Classroom.find({ teacherId: userId, isActive: true })
        .populate('students', 'name email avatar')
        .sort({ createdAt: -1 });
    } else {
      classrooms = await Classroom.find({ students: userId, isActive: true })
        .populate('teacherId', 'name email')
        .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: { classrooms }
    });
  } catch (error: any) {
    console.error('Get classrooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting classrooms'
    });
  }
});

// @desc    Get classroom by ID
// @route   GET /api/classrooms/:id
// @access  Private
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('teacherId', 'name email avatar')
      .populate('students', 'name email avatar');

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check if user has access to this classroom
    const userId = req.user!.id;
    const isTeacher = classroom.teacherId._id.toString() === userId;
    const isStudent = classroom.students.some((student: any) => student._id.toString() === userId);

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this classroom'
      });
    }

    res.json({
      success: true,
      data: { classroom }
    });
  } catch (error: any) {
    console.error('Get classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting classroom'
    });
  }
});

// @desc    Create classroom
// @route   POST /api/classrooms
// @access  Private (Teacher only)
router.post('/', authenticateToken, requireRole(['teacher']), validateRequest(schemas.createClassroom), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description, subject, settings } = req.body;

    // Generate unique classroom code
    const code = await (Classroom as any).generateCode();

    const classroom = await Classroom.create({
      name,
      description,
      subject,
      teacherId: req.user!.id,
      code,
      settings: settings || {}
    });

    await classroom.populate('teacherId', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Classroom created successfully',
      data: { classroom }
    });
  } catch (error: any) {
    console.error('Create classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating classroom'
    });
  }
});

// @desc    Join classroom
// @route   POST /api/classrooms/join
// @access  Private (Student only)
router.post('/join', authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res) => {
  try {
    const { code } = req.body;
    const userId = req.user!.id;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Classroom code is required'
      });
    }

    const classroom = await Classroom.findOne({ code: code.toUpperCase(), isActive: true });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Invalid classroom code'
      });
    }

    // Check if student is already in the classroom
    if (classroom.students.includes(userId as any)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this classroom'
      });
    }

    // Check classroom capacity
    if (classroom.settings.maxStudents && classroom.students.length >= classroom.settings.maxStudents) {
      return res.status(400).json({
        success: false,
        message: 'Classroom is at maximum capacity'
      });
    }

    // Add student to classroom
    classroom.students.push(userId as any);
    await classroom.save();

    await classroom.populate('teacherId', 'name email avatar');
    await classroom.populate('students', 'name email avatar');

    res.json({
      success: true,
      message: 'Successfully joined classroom',
      data: { classroom }
    });
  } catch (error: any) {
    console.error('Join classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error joining classroom'
    });
  }
});

// @desc    Delete classroom
// @route   DELETE /api/classrooms/:id
// @access  Private (Teacher only)
router.delete('/:id', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found' });
    }
    if (classroom.teacherId.toString() !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this classroom' });
    }
    await classroom.deleteOne();
    res.json({ success: true, message: 'Classroom deleted successfully' });
  } catch (error) {
    console.error('Delete classroom error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting classroom' });
  }
});

export default router;