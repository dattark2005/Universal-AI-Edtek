import express from 'express';
import Assignment from '../models/Assignment';
import Submission from '../models/Submission';
import Classroom from '../models/Classroom';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';
import { AuthenticatedRequest } from '../types';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import cloudinary from '../config/cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// Replace disk storage with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname); // e.g., .pdf
    const name = path.basename(file.originalname, ext); // e.g., Assignment1

    let resourceType = 'auto';
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/vnd.ms-powerpoint' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'text/plain' ||
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-rar-compressed'
    ) {
      resourceType = 'raw';
      return {
        folder: 'assignments',
        resource_type: resourceType,
        public_id: name, // Use original filename (without extension)
        format: ext.replace('.', '') // Preserve extension
      };
    } else if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
      return {
        folder: 'assignments',
        resource_type: resourceType,
        public_id: name,
        format: ext.replace('.', ''),
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
      };
    }
    return {
      folder: 'assignments',
      resource_type: resourceType,
      public_id: name,
      format: ext.replace('.', ''),
    };
  },
});
const upload = multer({ storage });

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
      console.log('Student', userId, 'classrooms:', classroomIds);
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
router.post('/:id/submit', authenticateToken, requireRole(['student']), upload.array('attachments', 5), async (req: AuthenticatedRequest, res) => {
  try {
    console.log('REQ.BODY:', req.body);
    console.log('REQ.FILES:', req.files);
    const { content } = req.body;
    const assignmentId = req.params.id;
    const studentId = req.user!.id;
    const files = req.files as Express.Multer.File[];

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // If assignment is for a specific classroom, check student membership
    if (assignment.classroomId) {
      const classroom = await Classroom.findById(assignment.classroomId);
      if (!classroom || !classroom.students.map(id => id.toString()).includes(studentId.toString())) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to submit this assignment'
        });
      }
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

    let attachments: any[] = [];
    if (files && files.length > 0) {
      attachments = files.map(file => ({
        filename: file.originalname,
        url: file.secure_url || file.path || file.url, // Always prefer secure_url
        public_id: file.filename, // Cloudinary public_id
        size: file.size,
        mimeType: file.mimetype
      }));
    }

    const submission = await Submission.create({
      assignmentId,
      studentId,
      content: content ? content.trim() : '',
      attachments
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

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Teacher only)
router.delete('/:id', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res) => {
  try {
    const assignmentId = req.params.id;
    const userId = req.user!.id;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    if (assignment.teacherId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this assignment' });
    }
    await assignment.deleteOne();
    res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting assignment' });
  }
});

// @desc    Update assignment
// @route   PATCH /api/assignments/:id
// @access  Private (Teacher only)
router.patch('/:id', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res) => {
  try {
    const assignmentId = req.params.id;
    const userId = req.user!.id;
    const { dueDate, description, maxPoints } = req.body;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    if (assignment.teacherId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this assignment' });
    }
    if (dueDate !== undefined) assignment.dueDate = dueDate;
    if (description !== undefined) assignment.description = description;
    if (maxPoints !== undefined) assignment.maxPoints = maxPoints;
    await assignment.save();
    res.json({ success: true, message: 'Assignment updated successfully', data: { assignment } });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ success: false, message: 'Server error updating assignment' });
  }
});

export default router;