import { Quiz, StudyPlan, Assignment } from '../types';

export const SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Computer Science'
];

export const mockQuizzes: Record<string, Quiz> = {
  Mathematics: {
    id: 'math-001',
    subject: 'Mathematics',
    timeLimit: 600,
    questions: [
      {
        id: 'q1',
        question: 'What is the derivative of x²?',
        options: ['2x', 'x²', 'x', '2'],
        correctAnswer: 0,
        explanation: 'The derivative of x² is 2x using the power rule.'
      },
      {
        id: 'q2',
        question: 'What is the integral of 2x?',
        options: ['x²', 'x² + C', '2x²', '2x² + C'],
        correctAnswer: 1,
        explanation: 'The integral of 2x is x² + C, where C is the constant of integration.'
      },
      {
        id: 'q3',
        question: 'What is sin(90°)?',
        options: ['0', '1', '-1', '∞'],
        correctAnswer: 1,
        explanation: 'sin(90°) = 1 in the unit circle.'
      },
      {
        id: 'q4',
        question: 'What is the area of a circle with radius 5?',
        options: ['25π', '10π', '5π', '50π'],
        correctAnswer: 0,
        explanation: 'Area = πr² = π(5)² = 25π'
      },
      {
        id: 'q5',
        question: 'What is the solution to 2x + 5 = 15?',
        options: ['x = 5', 'x = 10', 'x = 7.5', 'x = 20'],
        correctAnswer: 0,
        explanation: '2x + 5 = 15, so 2x = 10, therefore x = 5'
      }
    ]
  },
  Science: {
    id: 'sci-001',
    subject: 'Science',
    timeLimit: 600,
    questions: [
      {
        id: 'q1',
        question: 'What is the chemical symbol for water?',
        options: ['H2O', 'CO2', 'NaCl', 'O2'],
        correctAnswer: 0,
        explanation: 'Water is composed of two hydrogen atoms and one oxygen atom: H2O.'
      },
      {
        id: 'q2',
        question: 'What is the speed of light in vacuum?',
        options: ['3×10⁸ m/s', '3×10⁶ m/s', '3×10¹⁰ m/s', '3×10⁴ m/s'],
        correctAnswer: 0,
        explanation: 'The speed of light in vacuum is approximately 3×10⁸ meters per second.'
      },
      {
        id: 'q3',
        question: 'Which planet is closest to the Sun?',
        options: ['Venus', 'Mercury', 'Earth', 'Mars'],
        correctAnswer: 1,
        explanation: 'Mercury is the closest planet to the Sun in our solar system.'
      },
      {
        id: 'q4',
        question: 'What is the atomic number of carbon?',
        options: ['6', '12', '8', '14'],
        correctAnswer: 0,
        explanation: 'Carbon has 6 protons, giving it an atomic number of 6.'
      },
      {
        id: 'q5',
        question: 'What force keeps planets in orbit around the Sun?',
        options: ['Magnetic force', 'Nuclear force', 'Gravitational force', 'Electric force'],
        correctAnswer: 2,
        explanation: 'Gravitational force between the Sun and planets keeps them in orbit.'
      }
    ]
  }
};

export const generateStudyPlan = (subject: string, score: number): StudyPlan['plan'] => {
  const isGoodScore = score >= 80;
  
  const mathPlan = {
    videos: [
      { title: 'Calculus Fundamentals', url: 'https://youtube.com/watch?v=example1', duration: '45 mins' },
      { title: 'Algebra Review', url: 'https://youtube.com/watch?v=example2', duration: '30 mins' },
      { title: 'Trigonometry Basics', url: 'https://youtube.com/watch?v=example3', duration: '35 mins' }
    ],
    notes: [
      { title: 'Derivative Rules', content: 'Power rule, product rule, chain rule...', type: 'PDF' },
      { title: 'Integration Techniques', content: 'Basic integration formulas and methods...', type: 'Notes' }
    ],
    documents: [
      { title: 'Math Formula Sheet', url: 'https://example.com/formulas.pdf', type: 'PDF' },
      { title: 'Practice Problems', url: 'https://example.com/problems.pdf', type: 'Worksheet' }
    ],
    textPlan: isGoodScore 
      ? 'Excellent work! Focus on advanced topics like complex analysis and differential equations. Practice more challenging problems to maintain your level.'
      : 'Focus on strengthening your fundamentals. Start with basic algebra and work your way up to calculus. Practice daily for 30-45 minutes.'
  };

  const sciencePlan = {
    videos: [
      { title: 'Chemistry Basics', url: 'https://youtube.com/watch?v=example1', duration: '40 mins' },
      { title: 'Physics Principles', url: 'https://youtube.com/watch?v=example2', duration: '50 mins' },
      { title: 'Biology Overview', url: 'https://youtube.com/watch?v=example3', duration: '35 mins' }
    ],
    notes: [
      { title: 'Periodic Table Guide', content: 'Elements, properties, and trends...', type: 'PDF' },
      { title: 'Physics Formulas', content: 'Motion, energy, and force equations...', type: 'Notes' }
    ],
    documents: [
      { title: 'Lab Safety Manual', url: 'https://example.com/safety.pdf', type: 'PDF' },
      { title: 'Experiment Guide', url: 'https://example.com/experiments.pdf', type: 'Manual' }
    ],
    textPlan: isGoodScore
      ? 'Great performance! Explore advanced scientific concepts and consider laboratory work. Focus on interdisciplinary connections.'
      : 'Build a strong foundation in scientific method and basic concepts. Review fundamental principles in chemistry, physics, and biology.'
  };

  return subject === 'Mathematics' ? mathPlan : sciencePlan;
};

export const mockAssignments: Assignment[] = [
  {
    id: 'assign-001',
    teacherId: 'teacher-001',
    teacherName: 'Dr. Sarah Johnson',
    title: 'Calculus Problem Set',
    description: 'Solve the following derivative and integral problems. Show all work and explain your reasoning.',
    subject: 'Mathematics',
    dueDate: new Date('2024-02-15'),
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'assign-002',
    teacherId: 'teacher-002',
    teacherName: 'Prof. Michael Chen',
    title: 'Chemistry Lab Report',
    description: 'Write a comprehensive lab report on the acid-base titration experiment conducted in class.',
    subject: 'Science',
    dueDate: new Date('2024-02-20'),
    createdAt: new Date('2024-01-20')
  }
];