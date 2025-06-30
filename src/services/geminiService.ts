import { GoogleGenerativeAI } from '@google/generative-ai';

// Use environment variable for API key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('VITE_GEMINI_API_KEY not found in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey || 'fallback-key');

export interface QuizResultData {
  score: number;
  totalQuestions: number;
  course: string;
  answers: Array<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

export interface StudyPlanResponse {
  courses: Array<{
    course: string;
    focusAreas: Array<{
      category: string;
      strength: string;
      weakness: string;
    }>;
    recommendations: string[];
    dailySchedule: Array<{
      day: string;
      tasks: Array<{
        title: string;
        duration: string;
        priority: string;
      }>;
    }>;
    resources: Array<{
      category: string;
      links: Array<{
        title: string;
        url: string;
        type: string;
        summary: string;
      }>;
    }>;
  }>;
}

export const generateStudyPlanWithGemini = async (quizResults: QuizResultData): Promise<StudyPlanResponse> => {
  try {
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
You are an AI tutor creating a personalized study plan. Based on the quiz results, generate a comprehensive study plan with REAL, WORKING links to educational resources.

Quiz Results:
- Score: ${quizResults.score}/${quizResults.totalQuestions} (${Math.round((quizResults.score / quizResults.totalQuestions) * 100)}%)
- Course: ${quizResults.course}
- Incorrect Answers: ${quizResults.answers.filter(a => !a.isCorrect).length}

IMPORTANT: Provide ONLY real, accessible URLs. For each resource, if possible, include high-quality PDF resources (such as lecture notes, textbooks, or guides) from trusted educational platforms. For every PDF link, also provide a 1-2 sentence summary of what the PDF covers. Use these trusted educational platforms:
- Khan Academy: https://www.khanacademy.org/
- Coursera: https://www.coursera.org/
- edX: https://www.edx.org/
- MIT OpenCourseWare: https://ocw.mit.edu/
- YouTube Educational Channels
- W3Schools: https://www.w3schools.com/
- MDN Web Docs: https://developer.mozilla.org/
- FreeCodeCamp: https://www.freecodecamp.org/
- Codecademy: https://www.codecademy.com/
- GeeksforGeeks: https://www.geeksforgeeks.org/

For ${quizResults.course}, provide specific URLs that actually exist and work. Do NOT create fake or placeholder URLs.

Generate a study plan in this EXACT JSON format:
{
  "courses": [
    {
      "course": "${quizResults.course}",
      "focusAreas": [
        {
          "category": "Specific topic name",
          "strength": "X%",
          "weakness": "Y%"
        }
      ],
      "recommendations": [
        "Specific actionable recommendation 1",
        "Specific actionable recommendation 2",
        "Specific actionable recommendation 3"
      ],
      "dailySchedule": [
        {
          "day": "Day 1",
          "tasks": [
            {
              "title": "Specific task title",
              "duration": "X minutes",
              "priority": "High/Medium/Low"
            }
          ]
        }
      ],
      "resources": [
        {
          "category": "Topic Category",
          "links": [
            {
              "title": "Resource Title",
              "url": "https://actual-working-url.com",
              "type": "pdf" or "video" or "article",
              "summary": "Brief summary of the resource (especially for PDFs)"
            }
          ]
        }
      ]
    }
  ]
}

Focus on the student's weak areas based on incorrect answers. Provide 5-7 real educational links for each resource category, and prioritize including PDF resources with summaries when available.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON from the response
    try {
      // Extract JSON from the response (remove any markdown formatting)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const studyPlan = JSON.parse(jsonStr);
        
        // Validate and ensure all URLs are real
        const validatedPlan = validateAndFixUrls(studyPlan, quizResults);
        return validatedPlan;
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
    }

    // Fallback: create a structured response with real URLs
    return createFallbackStudyPlan(quizResults, text);

  } catch (error) {
    console.error('Error generating study plan with Gemini:', error);
    throw new Error('Failed to generate study plan. Please try again.');
  }
};

const validateAndFixUrls = (studyPlan: StudyPlanResponse, quizResults: QuizResultData): StudyPlanResponse => {
  const realUrls = getRealEducationalUrls(quizResults.course);
  
  studyPlan.courses.forEach(course => {
    course.resources.forEach(resource => {
      resource.links.forEach((link, index) => {
        // Check if URL looks fake or placeholder
        if (!link.url.startsWith('http') || 
            link.url.includes('example.com') || 
            link.url.includes('placeholder') ||
            link.url.includes('fake')) {
          // Replace with real URL
          const realUrlIndex = index % realUrls.length;
          link.url = realUrls[realUrlIndex].url;
          if (!link.title || link.title.includes('placeholder')) {
            link.title = realUrls[realUrlIndex].title;
          }
        }
      });
    });
  });
  
  return studyPlan;
};

const getRealEducationalUrls = (subject: string) => {
  const urlMappings: Record<string, Array<{title: string, url: string}>> = {
    'Linux': [
      { title: 'Linux Command Line Basics', url: 'https://www.codecademy.com/learn/learn-the-command-line' },
      { title: 'Linux Tutorial for Beginners', url: 'https://www.guru99.com/unix-linux-tutorial.html' },
      { title: 'Introduction to Linux', url: 'https://www.edx.org/course/introduction-to-linux' },
      { title: 'Linux Fundamentals', url: 'https://www.cybrary.it/course/linux-fundamentals/' },
      { title: 'Linux Documentation', url: 'https://www.kernel.org/doc/html/latest/' }
    ],
    'DevOps': [
      { title: 'DevOps Fundamentals', url: 'https://www.coursera.org/learn/devops-culture-and-mindset' },
      { title: 'Introduction to DevOps', url: 'https://www.edx.org/course/introduction-to-devops' },
      { title: 'DevOps Tutorial', url: 'https://www.guru99.com/devops-tutorial.html' },
      { title: 'AWS DevOps', url: 'https://aws.amazon.com/devops/' },
      { title: 'DevOps Roadmap', url: 'https://roadmap.sh/devops' }
    ],
    'Docker': [
      { title: 'Docker Official Tutorial', url: 'https://docs.docker.com/get-started/' },
      { title: 'Docker for Beginners', url: 'https://docker-curriculum.com/' },
      { title: 'Docker Fundamentals', url: 'https://www.pluralsight.com/courses/docker-fundamentals' },
      { title: 'Learn Docker', url: 'https://www.katacoda.com/courses/docker' },
      { title: 'Docker Hub', url: 'https://hub.docker.com/' }
    ],
    'SQL': [
      { title: 'SQL Tutorial', url: 'https://www.w3schools.com/sql/' },
      { title: 'Learn SQL', url: 'https://www.codecademy.com/learn/learn-sql' },
      { title: 'SQL Fundamentals', url: 'https://www.khanacademy.org/computing/computer-programming/sql' },
      { title: 'SQLBolt Interactive Tutorial', url: 'https://sqlbolt.com/' },
      { title: 'SQL Course', url: 'https://www.coursera.org/learn/intro-sql' }
    ],
    'Code': [
      { title: 'FreeCodeCamp', url: 'https://www.freecodecamp.org/' },
      { title: 'Codecademy', url: 'https://www.codecademy.com/' },
      { title: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/' },
      { title: 'W3Schools', url: 'https://www.w3schools.com/' },
      { title: 'GeeksforGeeks', url: 'https://www.geeksforgeeks.org/' }
    ],
    'WordPress': [
      { title: 'WordPress.org Learn', url: 'https://learn.wordpress.org/' },
      { title: 'WordPress Codex', url: 'https://codex.wordpress.org/' },
      { title: 'WordPress Tutorial', url: 'https://www.w3schools.com/wordpress/' },
      { title: 'WordPress for Beginners', url: 'https://www.wpbeginner.com/' },
      { title: 'WordPress Developer Resources', url: 'https://developer.wordpress.org/' }
    ],
    'Laravel': [
      { title: 'Laravel Documentation', url: 'https://laravel.com/docs' },
      { title: 'Laracasts', url: 'https://laracasts.com/' },
      { title: 'Laravel Tutorial', url: 'https://www.tutorialspoint.com/laravel/' },
      { title: 'Laravel Bootcamp', url: 'https://bootcamp.laravel.com/' },
      { title: 'Laravel News', url: 'https://laravel-news.com/' }
    ],
    'Bash': [
      { title: 'Bash Scripting Tutorial', url: 'https://www.tutorialspoint.com/unix/shell_scripting.htm' },
      { title: 'Learn Shell', url: 'https://www.learnshell.org/' },
      { title: 'Bash Guide', url: 'https://mywiki.wooledge.org/BashGuide' },
      { title: 'Shell Scripting', url: 'https://www.shellscript.sh/' },
      { title: 'Bash Manual', url: 'https://www.gnu.org/software/bash/manual/' }
    ]
  };

  return urlMappings[subject] || urlMappings['Code'];
};

const createFallbackStudyPlan = (quizResults: QuizResultData, aiText: string): StudyPlanResponse => {
  const scorePercentage = Math.round((quizResults.score / quizResults.totalQuestions) * 100);
  const incorrectCount = quizResults.totalQuestions - quizResults.score;
  const realUrls = getRealEducationalUrls(quizResults.course);
  
  return {
    courses: [
      {
        course: quizResults.course,
        focusAreas: [
          {
            category: "Core Concepts",
            strength: `${scorePercentage}%`,
            weakness: `${100 - scorePercentage}%`
          },
          {
            category: "Problem Solving",
            strength: `${Math.max(0, scorePercentage - 10)}%`,
            weakness: `${Math.min(100, 110 - scorePercentage)}%`
          }
        ],
        recommendations: [
          `Review the ${incorrectCount} questions you got wrong`,
          `Focus on fundamental concepts in ${quizResults.course}`,
          "Practice with hands-on exercises daily",
          "Join online communities and forums for help",
          "Take additional practice quizzes"
        ],
        dailySchedule: [
          {
            day: "Day 1",
            tasks: [
              {
                title: `Review ${quizResults.course} fundamentals`,
                duration: "45 minutes",
                priority: "High"
              },
              {
                title: "Practice exercises",
                duration: "30 minutes", 
                priority: "Medium"
              }
            ]
          },
          {
            day: "Day 2",
            tasks: [
              {
                title: "Focus on weak areas",
                duration: "60 minutes",
                priority: "High"
              },
              {
                title: "Watch tutorial videos",
                duration: "30 minutes",
                priority: "Medium"
              }
            ]
          },
          {
            day: "Day 3",
            tasks: [
              {
                title: "Take practice tests",
                duration: "45 minutes",
                priority: "High"
              },
              {
                title: "Review documentation",
                duration: "30 minutes",
                priority: "Low"
              }
            ]
          }
        ],
        resources: [
          {
            category: quizResults.course,
            links: realUrls
          }
        ]
      }
    ]
  };
};

export const generateChatResponse = async (
  message: string,
  userContext: {
    recentQuizzes?: any[];
    studyPlans?: any[];
    performance?: any;
  }
): Promise<string> => {
  try {
    if (!apiKey) {
      return "I'm having trouble accessing my AI capabilities right now. Please make sure the Gemini API key is configured properly. 🤖";
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const contextInfo = `
User Context:
- Recent Quiz Performance: ${userContext.recentQuizzes?.map(q => `${q.subject}: ${q.score}%`).join(', ') || 'No recent quizzes'}
- Study Plans Available: ${userContext.studyPlans?.length || 0}
- Overall Performance: ${userContext.performance ? `Average: ${userContext.performance.average}%` : 'No data'}
`;

    const prompt = `
You are Gemini, an AI learning assistant for the EduAI platform. A student is asking: "${message}"

${contextInfo}

Provide a helpful, encouraging response that:
1. Addresses their question directly
2. Relates to their performance data if relevant
3. Offers specific study advice
4. Maintains a supportive and motivational tone
5. Suggests actionable next steps

Keep the response conversational and under 200 words. Use emojis appropriately to make it engaging.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Error generating chat response:', error);
    return "I'm having trouble processing your request right now. Please try again later! 🤖";
  }
};