import express from 'express';
import QuizResult from '../models/QuizResult';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// @desc    Get leaderboard for a subject
// @route   GET /api/leaderboards/:subject
// @access  Private
router.get('/:subject', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { subject } = req.params;
    const { limit = 10 } = req.query;

    const leaderboard = await QuizResult.aggregate([
      { $match: { subject } },
      { $sort: { userId: 1, completedAt: -1 } },
      {
        $group: {
          _id: '$userId',
          latestScore: { $first: '$score' },
          latestCompletedAt: { $first: '$completedAt' },
          quizId: { $first: '$quizId' },
          averageScore: { $avg: '$score' },
          bestScore: { $max: '$score' },
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          avatar: '$user.avatar',
          latestScore: 1,
          latestCompletedAt: 1,
          quizId: 1,
          averageScore: { $round: ['$averageScore', 1] },
          bestScore: 1
        }
      },
      { $sort: { latestScore: -1, latestCompletedAt: -1 } },
      { $limit: Number(limit) }
    ]);

    res.json({
      success: true,
      data: { leaderboard }
    });
  } catch (error: any) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting leaderboard'
    });
  }
});

// @desc    Get overall leaderboard
// @route   GET /api/leaderboards
// @access  Private
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { limit = 10 } = req.query;

    const leaderboard = await QuizResult.aggregate([
      {
        $group: {
          _id: '$userId',
          totalScore: { $sum: '$score' },
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: '$score' },
          lastQuiz: { $max: '$completedAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          avatar: '$user.avatar',
          totalScore: 1,
          totalQuizzes: 1,
          averageScore: { $round: ['$averageScore', 1] },
          lastQuiz: 1
        }
      },
      { $sort: { averageScore: -1, totalQuizzes: -1 } },
      { $limit: Number(limit) }
    ]);

    res.json({
      success: true,
      data: { leaderboard }
    });
  } catch (error: any) {
    console.error('Get overall leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting leaderboard'
    });
  }
});

export default router;