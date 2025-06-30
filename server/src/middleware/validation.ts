import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        details: error.details.map(detail => detail.message)
      });
    }
    
    next();
  };
};

// Common validation schemas
export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).required(),
    role: Joi.string().valid('student', 'teacher').required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  createQuiz: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().optional(),
    subject: Joi.string().valid('Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science').required(),
    questions: Joi.array().items(
      Joi.object({
        question: Joi.string().required(),
        options: Joi.array().items(Joi.string()).min(2).required(),
        correctAnswer: Joi.number().min(0).required(),
        explanation: Joi.string().optional(),
        points: Joi.number().min(1).default(1)
      })
    ).min(1).required(),
    timeLimit: Joi.number().min(60).max(7200).required(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium')
  }),

  createClassroom: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().min(1).max(500).required(),
    subject: Joi.string().valid('Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science').required(),
    settings: Joi.object({
      allowStudentChat: Joi.boolean().default(true),
      autoApproveStudents: Joi.boolean().default(true),
      maxStudents: Joi.number().min(1).max(1000).default(100)
    }).optional()
  }),

  createAssignment: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().min(1).max(2000).required(),
    subject: Joi.string().valid('Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science').required(),
    dueDate: Joi.date().greater('now').required(),
    classroomId: Joi.string().optional(),
    maxPoints: Joi.number().min(1).max(1000).required()
  }),

  joinClassroom: Joi.object({
    code: Joi.string().length(8).uppercase().required()
  })
};