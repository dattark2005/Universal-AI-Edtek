import express from 'express';
import StudyPlan from '../models/StudyPlan';
import { authenticateToken, requireRole } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// @desc    Get study plans
// @route   GET /api/study-plans
// @access  Private
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { subject, page = 1, limit = 10 } = req.query;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let query: any = {};

    if (userRole === 'student') {
      query.userId = userId;
    }
    // Teachers can see all study plans for management

    if (subject) query.subject = subject;

    console.log('GET /api/study-plans', { query, userId, userRole }); // Debug log

    const studyPlans = await StudyPlan.find(query)
      .populate('userId', 'name email role')
      .populate('customizedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await StudyPlan.countDocuments(query);

    res.json({
      success: true,
      data: {
        studyPlans,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('Get study plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting study plans',
      error: error?.message || error
    });
  }
});

// @desc    Create study plan
// @route   POST /api/study-plans
// @access  Private
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const studyPlan = await StudyPlan.create({
      ...req.body,
      userId: req.user!.id
    });

    await studyPlan.populate('userId', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Study plan created successfully',
      data: { studyPlan }
    });
  } catch (error: any) {
    console.error('Create study plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating study plan'
    });
  }
});

// @desc    Update study plan
// @route   PUT /api/study-plans/:id
// @access  Private (Teacher only)
router.put('/:id', authenticateToken, requireRole(['teacher']), async (req: AuthenticatedRequest, res) => {
  try {
    const studyPlan = await StudyPlan.findById(req.params.id);

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found'
      });
    }

    // Update the study plan
    const updatedPlan = await StudyPlan.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        isCustomized: true,
        customizedBy: req.user!.id
      },
      { new: true, runValidators: true }
    ).populate('userId', 'name email role')
     .populate('customizedBy', 'name email');

    res.json({
      success: true,
      message: 'Study plan updated successfully',
      data: { studyPlan: updatedPlan }
    });
  } catch (error: any) {
    console.error('Update study plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating study plan'
    });
  }
});

export default router;