import StudyPlan from '../models/StudyPlan';
import QuizResult from '../models/QuizResult';

export const generateStudyPlan = async (userId: string, subject: string, score: number) => {
  try {
    // Get user's quiz history for context
    const recentResults = await QuizResult.find({ userId, subject })
      .sort({ completedAt: -1 })
      .limit(5);

    const averageScore = recentResults.length > 0 
      ? recentResults.reduce((sum, result) => sum + result.score, 0) / recentResults.length
      : score;

    // Create a template-based study plan since we're not using OpenAI
    const plan = generateFallbackPlan(subject, score);
    
    // Save study plan
    const studyPlan = await StudyPlan.create({
      userId,
      subject,
      score,
      plan,
      isCustomized: false
    });

    return studyPlan;
  } catch (error) {
    console.error('Study plan generation error:', error);
    
    // Fallback to template-based plan
    const fallbackPlan = generateFallbackPlan(subject, score);
    
    const studyPlan = await StudyPlan.create({
      userId,
      subject,
      score,
      plan: fallbackPlan,
      isCustomized: false
    });

    return studyPlan;
  }
};

const generateFallbackTextPlan = (subject: string, score: number): string => {
  if (score >= 90) {
    return `Excellent work in ${subject}! You're performing at an advanced level. Focus on challenging problems and real-world applications to maintain your expertise. Consider exploring interdisciplinary connections and advanced topics.`;
  } else if (score >= 80) {
    return `Great job in ${subject}! You have a solid understanding. Focus on strengthening any weak areas and practicing more complex problems. Regular review will help maintain your strong performance.`;
  } else if (score >= 70) {
    return `Good progress in ${subject}! You're on the right track. Focus on reviewing fundamental concepts and practicing regularly. Identify specific areas that need improvement and dedicate extra time to them.`;
  } else {
    return `Keep working hard in ${subject}! Focus on building strong foundations with the basics. Break down complex topics into smaller parts and practice regularly. Don't hesitate to ask for help when needed.`;
  }
};

const generateVideoRecommendations = (subject: string, score: number) => {
  const videoLibrary: Record<string, any[]> = {
    'Mathematics': [
      { title: 'Algebra Fundamentals', url: 'https://youtube.com/watch?v=example1', duration: '45 mins' },
      { title: 'Calculus Basics', url: 'https://youtube.com/watch?v=example2', duration: '60 mins' },
      { title: 'Geometry Principles', url: 'https://youtube.com/watch?v=example3', duration: '35 mins' },
      { title: 'Advanced Problem Solving', url: 'https://youtube.com/watch?v=example4', duration: '50 mins' }
    ],
    'Science': [
      { title: 'Chemistry Basics', url: 'https://youtube.com/watch?v=example1', duration: '40 mins' },
      { title: 'Physics Principles', url: 'https://youtube.com/watch?v=example2', duration: '55 mins' },
      { title: 'Biology Overview', url: 'https://youtube.com/watch?v=example3', duration: '45 mins' },
      { title: 'Scientific Method', url: 'https://youtube.com/watch?v=example4', duration: '30 mins' }
    ]
  };

  const videos = videoLibrary[subject] || videoLibrary['Mathematics'];
  return score >= 80 ? videos.slice(2) : videos.slice(0, 3);
};

const generateNoteRecommendations = (subject: string, score: number) => {
  const noteLibrary: Record<string, any[]> = {
    'Mathematics': [
      { title: 'Formula Reference Sheet', content: 'Key formulas and equations', type: 'PDF' },
      { title: 'Problem-Solving Strategies', content: 'Step-by-step approaches', type: 'Notes' },
      { title: 'Common Mistakes Guide', content: 'Avoid these pitfalls', type: 'Guide' }
    ],
    'Science': [
      { title: 'Scientific Concepts Summary', content: 'Core principles explained', type: 'PDF' },
      { title: 'Lab Procedures Guide', content: 'Experimental methods', type: 'Manual' },
      { title: 'Key Terms Glossary', content: 'Important vocabulary', type: 'Reference' }
    ]
  };

  const notes = noteLibrary[subject] || noteLibrary['Mathematics'];
  return score >= 80 ? notes.slice(1) : notes;
};

const generateDocumentRecommendations = (subject: string, score: number) => {
  const docLibrary: Record<string, any[]> = {
    'Mathematics': [
      { title: 'Practice Problem Set', url: 'https://example.com/math-problems.pdf', type: 'Worksheet' },
      { title: 'Advanced Exercises', url: 'https://example.com/advanced-math.pdf', type: 'PDF' },
      { title: 'Study Guide', url: 'https://example.com/math-guide.pdf', type: 'Guide' }
    ],
    'Science': [
      { title: 'Lab Experiments', url: 'https://example.com/lab-experiments.pdf', type: 'Manual' },
      { title: 'Research Papers', url: 'https://example.com/science-papers.pdf', type: 'PDF' },
      { title: 'Study Materials', url: 'https://example.com/science-study.pdf', type: 'Guide' }
    ]
  };

  const docs = docLibrary[subject] || docLibrary['Mathematics'];
  return score >= 80 ? docs.slice(1) : docs.slice(0, 2);
};

const generateFallbackPlan = (subject: string, score: number) => {
  return {
    textPlan: generateFallbackTextPlan(subject, score),
    videos: generateVideoRecommendations(subject, score),
    notes: generateNoteRecommendations(subject, score),
    documents: generateDocumentRecommendations(subject, score)
  };
};

export const generateAIChatResponse = async (message: string, context: any) => {
  try {
    // Since we're not using OpenAI, provide a simple template-based response
    const responses = [
      'I\'m here to help with your learning journey! Could you please be more specific about what you\'d like to know?',
      'That\'s a great question! Based on your recent performance, I recommend focusing on the fundamentals first.',
      'Keep up the great work! Regular practice is key to improving your skills.',
      'I can help you with study strategies. What subject are you working on?',
      'Remember, learning is a journey. Take it one step at a time and don\'t hesitate to ask for help!'
    ];
    
    // Simple keyword-based responses
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('stuck')) {
      return 'I understand you need help! Break down the problem into smaller parts and tackle them one by one. Don\'t hesitate to review the fundamentals if needed.';
    }
    
    if (lowerMessage.includes('study') || lowerMessage.includes('learn')) {
      return 'Great attitude towards learning! I recommend creating a study schedule, practicing regularly, and reviewing your quiz results to identify areas for improvement.';
    }
    
    if (lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
      return 'Quizzes are excellent for testing your knowledge! After taking a quiz, make sure to review the questions you got wrong and understand the explanations.';
    }
    
    if (lowerMessage.includes('score') || lowerMessage.includes('grade')) {
      return 'Your scores show your progress over time. Focus on understanding concepts rather than just memorizing, and you\'ll see improvement!';
    }
    
    // Default response
    return responses[Math.floor(Math.random() * responses.length)];
    
  } catch (error) {
    console.error('AI chat response error:', error);
    return 'I\'m having trouble processing your request right now. Please try again later or contact support if the issue persists.';
  }
};