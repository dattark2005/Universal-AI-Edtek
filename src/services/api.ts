const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Set auth token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
};

// API request helper with authentication and better error handling
const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced timeout to 8 seconds
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...config,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    // Better error handling
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection.');
    }
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Unable to connect to server. Using offline mode.');
    }
    throw error;
  }
};

// Auth API with fallback mechanisms
export const authAPI = {
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'teacher';
  }) => {
    try {
      return await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (error: any) {
      // If server is unavailable, provide helpful error
      if (error.message.includes('offline mode') || error.message.includes('connect to server')) {
        throw new Error('Server is currently unavailable. Please try again later or check if the backend server is running.');
      }
      throw error;
    }
  },

  login: async (credentials: { email: string; password: string }) => {
    try {
      return await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    } catch (error: any) {
      if (error.message.includes('offline mode') || error.message.includes('connect to server')) {
        throw new Error('Server is currently unavailable. Please try again later or check if the backend server is running.');
      }
      throw error;
    }
  },

  googleAuth: async (googleData: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'student' | 'teacher';
  }) => {
    try {
      return await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify(googleData),
      });
    } catch (error: any) {
      if (error.message.includes('offline mode') || error.message.includes('connect to server')) {
        throw new Error('Server is currently unavailable. Google authentication requires server connection.');
      }
      throw error;
    }
  },

  getCurrentUser: async () => {
    return await apiRequest('/auth/me', {
      method: 'GET',
    });
  },
};

// External Quiz API with caching
const quizCache = new Map();

export const externalQuizAPI = {
  getAvailableSubjects: async (): Promise<string[]> => {
    // Cache subjects to avoid repeated API calls
    const cacheKey = 'subjects';
    if (quizCache.has(cacheKey)) {
      return quizCache.get(cacheKey);
    }
    
    const subjects = [
      'Linux',
      'DevOps', 
      'Docker',
      'WordPress',
      'Laravel',
      'Bash',
      'SQL',
      'CMS',
      'Code',
      'Random'
    ];
    
    quizCache.set(cacheKey, subjects);
    return subjects;
  },

  fetchQuizQuestions: async (subject: string, limit: number = 10): Promise<any> => {
    // Always fetch new questions, do not use cache

    const API_URL = 'https://quizapi.io/api/v1/questions';
    const API_KEY = 'E0ncEEJKUx9OB83tgUAWh0czgsba2QqYhaWdxJL5';
    const params = new URLSearchParams({
      apiKey: API_KEY,
      limit: limit.toString(),
      category: subject.toLowerCase(),
      difficulty: 'Easy'
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${API_URL}?${params.toString()}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Failed to fetch quiz questions: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Quiz API request timeout. Please try again.');
      }
      throw error;
    }
  }
};

export const eduAPI = {
  getSubjects: async () => {
    const res = await apiRequest('/quizzes/subjects');
    if (res.data.subjects && res.data.subjects.length > 0) {
      return res.data.subjects;
    }
    // Fallback to default/mock subjects
    return [
      'Mathematics',
      'Science',
      'English',
      'History',
      'Geography',
      'Computer Science'
    ];
  },
  getTeacherClassrooms: async () => {
    const res = await apiRequest('/classrooms');
    return res.data.classrooms;
  },
  getStudentClassrooms: async () => {
    const res = await apiRequest('/classrooms/student');
    return res.data.classrooms || [];
  },
  getQuizResults: async () => {
    const res = await apiRequest('/quiz-results');
    return res.data.quizResults || [];
  },
  getSubmissions: async () => {
    const res = await apiRequest('/submissions');
    return res.data.submissions || res.data.data?.submissions || [];
  },
  gradeSubmission: async (submissionId: string, grade: number, feedback: string) => {
    const res = await apiRequest(`/submissions/${submissionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ grade, feedback }),
    });
    return res.data.submission || res.data.data?.submission;
  },
};