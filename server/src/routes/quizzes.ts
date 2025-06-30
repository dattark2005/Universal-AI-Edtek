import express from 'express';
import Quiz from '../models/Quiz';
import QuizResult from '../models/QuizResult';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Private
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { subject, difficulty, page = 1, limit = 10 } = req.query;
    
    const query: any = { isActive: true };
    
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;

    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Quiz.countDocuments(query);

    res.json({
      success: true,
      data: {
        quizzes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting quizzes'
    });
  }
});

// @desc    Get user's quiz results
// @route   GET /api/quizzes/results
// @access  Private
router.get('/results', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { subject, page = 1, limit = 10 } = req.query;
    
    const query: any = { userId: req.user!.id };
    if (subject) query.subject = subject;

    let results;
    try {
      results = await QuizResult.find(query)
        .populate('quizId', 'title subject')
        .sort({ completedAt: -1 })
        .limit(Number(limit) * 1)
        .skip((Number(page) - 1) * Number(limit));
    } catch (popErr) {
      console.error('Population error in GET /api/quizzes/results:', popErr);
      // Fallback: fetch without population
      results = await QuizResult.find(query)
        .sort({ completedAt: -1 })
        .limit(Number(limit) * 1)
        .skip((Number(page) - 1) * Number(limit));
    }

    const total = await QuizResult.countDocuments(query);

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    console.error('Get quiz results error:', error);
    console.error('Request user:', req.user);
    console.error('Request query:', req.query);
    if (error && error.stack) console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error getting quiz results',
      error: error && error.message ? error.message : error
    });
  }
});

// @desc    Save quiz result (external quiz)
// @route   POST /api/quizzes/results
// @access  Private (Student only)
router.post('/results', authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res) => {
  console.log('POST /api/quizzes/results req.user:', req.user); // Debug log
  console.log('POST /api/quizzes/results req.headers:', req.headers); // Log headers
  if (!req.user) {
    console.log('403: No user found in token');
  } else if (req.user.role !== 'student') {
    console.log('403: User role is not student:', req.user.role);
  }
  try {
    const { subject, score, totalQuestions, correctAnswers, timeSpent, answers, completedAt } = req.body;
    // Save result without quizId (for external quizzes)
    const result = await QuizResult.create({
      userId: req.user!.id,
      subject,
      score,
      totalQuestions,
      correctAnswers,
      timeSpent,
      answers,
      completedAt: completedAt ? new Date(completedAt) : new Date()
    });
    res.status(201).json({
      success: true,
      message: 'Quiz result saved successfully',
      data: { result }
    });
  } catch (error: any) {
    console.error('Save quiz result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error saving quiz result'
    });
  }
});

// @desc    Get quiz by ID
// @route   GET /api/quizzes/:id
// @access  Private
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'name');
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.json({
      success: true,
      data: { quiz }
    });
  } catch (error: any) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting quiz'
    });
  }
});

// @desc    Create quiz
// @route   POST /api/quizzes
// @access  Private (Teacher only)
router.post('/', authenticateToken, requireRole(['teacher']), validateRequest(schemas.createQuiz), async (req: AuthenticatedRequest, res) => {
  try {
    const quiz = await Quiz.create({
      ...req.body,
      createdBy: req.user!.id
    });

    await quiz.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: { quiz }
    });
  } catch (error: any) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating quiz'
    });
  }
});

// @desc    Submit quiz
// @route   POST /api/quizzes/:id/submit
// @access  Private (Student only)
router.post('/:id/submit', authenticateToken, requireRole(['student']), async (req: AuthenticatedRequest, res) => {
  try {
    const { answers, timeSpent } = req.body;
    
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user already submitted this quiz
    const existingResult = await QuizResult.findOne({
      userId: req.user!.id,
      quizId: quiz._id
    });

    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this quiz'
      });
    }

    // Calculate score
    let correctAnswers = 0;
    answers.forEach((answer: number, index: number) => {
      if (answer === quiz.questions[index]?.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);

    // Save result
    const result = await QuizResult.create({
      userId: req.user!.id,
      quizId: quiz._id,
      subject: quiz.subject,
      score,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      timeSpent,
      answers
    });

    res.status(201).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: { result }
    });
  } catch (error: any) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting quiz'
    });
  }
});

// @desc    Get all unique subjects
// @route   GET /api/subjects
// @access  Private
router.get('/subjects', authenticateToken, async (req, res) => {
  try {
    const subjects = await Quiz.distinct('subject');
    res.json({ success: true, data: { subjects } });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ success: false, message: 'Server error getting subjects' });
  }
});

export default router;