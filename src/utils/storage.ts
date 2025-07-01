import { User, QuizResult, StudyPlan, Assignment, Submission, LeaderboardEntry, Classroom, ClassroomMessage } from '../types';

// User Management
export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

export const clearCurrentUser = (): void => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
};

export const updateUserProfile = (updates: Partial<User>): void => {
  const user = getCurrentUser();
  if (user) {
    const updatedUser = { ...user, ...updates };
    setCurrentUser(updatedUser);
    
    // Also update in mock users storage
    const users = getMockUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      saveMockUsers(users);
    }
  }
};

// Helper functions for mock users
const getMockUsers = (): any[] => {
  const users = localStorage.getItem('mockUsers');
  return users ? JSON.parse(users) : [];
};

const saveMockUsers = (users: any[]): void => {
  localStorage.setItem('mockUsers', JSON.stringify(users));
};

// Quiz Results
export const saveQuizResult = (result: QuizResult): void => {
  const results = getQuizResults();
  results.push(result);
  localStorage.setItem('quizResults', JSON.stringify(results));
  updateLeaderboard(result);
};

export const getQuizResults = (): QuizResult[] => {
  const results = localStorage.getItem('quizResults');
  return results ? JSON.parse(results) : [];
};

export const getUserQuizResults = (userId: string): QuizResult[] => {
  const results = getQuizResults();
  return results.filter(result => result.userId === userId);
};

// Study Plans
export const saveStudyPlan = (plan: StudyPlan): void => {
  const plans = getStudyPlans();
  plans.push(plan);
  localStorage.setItem('studyPlans', JSON.stringify(plans));
};

export const getStudyPlans = (): StudyPlan[] => {
  const plans = localStorage.getItem('studyPlans');
  return plans ? JSON.parse(plans) : [];
};

export const getUserStudyPlans = (userId: string): StudyPlan[] => {
  const plans = getStudyPlans();
  return plans.filter(plan => plan.userId === userId);
};

export const updateStudyPlan = (updatedPlan: StudyPlan): void => {
  const plans = getStudyPlans();
  const index = plans.findIndex(plan => plan.id === updatedPlan.id);
  if (index !== -1) {
    plans[index] = updatedPlan;
    localStorage.setItem('studyPlans', JSON.stringify(plans));
  }
};

// Assignments
export const saveAssignment = (assignment: Assignment): void => {
  const assignments = getAssignments();
  assignments.push(assignment);
  localStorage.setItem('assignments', JSON.stringify(assignments));
};

export const getAssignments = (): Assignment[] => {
  const assignments = localStorage.getItem('assignments');
  return assignments ? JSON.parse(assignments) : [];
};

export const clearAssignments = () => {
  localStorage.removeItem('assignments');
};

// Submissions
export const saveSubmission = (submission: Submission): void => {
  const submissions = getSubmissions();
  submissions.push(submission);
  localStorage.setItem('submissions', JSON.stringify(submissions));
};

export const getSubmissions = (): Submission[] => {
  const submissions = localStorage.getItem('submissions');
  return submissions ? JSON.parse(submissions) : [];
};

export const getAssignmentSubmissions = (assignmentId: string): Submission[] => {
  const submissions = getSubmissions();
  return submissions.filter(sub => sub.assignmentId === assignmentId);
};

export const updateSubmissionGrade = (submissionId: string, grade: number, feedback: string): void => {
  const submissions = getSubmissions();
  const index = submissions.findIndex(sub => sub.id === submissionId);
  if (index !== -1) {
    submissions[index].grade = grade;
    submissions[index].feedback = feedback;
    localStorage.setItem('submissions', JSON.stringify(submissions));
  }
};

// Leaderboard
export const updateLeaderboard = (result: QuizResult): void => {
  const leaderboards = getLeaderboards();
  const subjectBoard = leaderboards[result.subject] || [];
  
  const userIndex = subjectBoard.findIndex(entry => entry.userId === result.userId);
  const user = getCurrentUser();
  
  if (userIndex !== -1) {
    subjectBoard[userIndex].score = Math.max(subjectBoard[userIndex].score, result.score);
    subjectBoard[userIndex].quizzesTaken += 1;
  } else if (user) {
    subjectBoard.push({
      userId: user.id,
      userName: user.name,
      avatar: user.avatar,
      score: result.score,
      quizzesTaken: 1
    });
  }
  
  subjectBoard.sort((a, b) => b.score - a.score);
  leaderboards[result.subject] = subjectBoard;
  localStorage.setItem('leaderboards', JSON.stringify(leaderboards));
};

export const getLeaderboards = (): Record<string, LeaderboardEntry[]> => {
  const leaderboards = localStorage.getItem('leaderboards');
  return leaderboards ? JSON.parse(leaderboards) : {};
};

export const getSubjectLeaderboard = (subject: string): LeaderboardEntry[] => {
  const leaderboards = getLeaderboards();
  return leaderboards[subject] || [];
};

// Classrooms
export const saveClassroom = (classroom: Classroom): void => {
  const classrooms = getClassrooms();
  classrooms.push(classroom);
  localStorage.setItem('classrooms', JSON.stringify(classrooms));
};

export const getClassrooms = (): Classroom[] => {
  const classrooms = localStorage.getItem('classrooms');
  return classrooms ? JSON.parse(classrooms) : [];
};

export const getClassroomByCode = (code: string): Classroom | null => {
  const classrooms = getClassrooms();
  return classrooms.find(c => c.code === code) || null;
};

export const joinClassroom = (classroomId: string, studentId: string): boolean => {
  const classrooms = getClassrooms();
  const index = classrooms.findIndex(c => c.id === classroomId);
  if (index !== -1 && !classrooms[index].students.includes(studentId)) {
    classrooms[index].students.push(studentId);
    localStorage.setItem('classrooms', JSON.stringify(classrooms));
    
    // Update user's classrooms
    const user = getCurrentUser();
    if (user) {
      const userClassrooms = user.classrooms || [];
      if (!userClassrooms.includes(classroomId)) {
        userClassrooms.push(classroomId);
        updateUserProfile({ classrooms: userClassrooms });
      }
    }
    return true;
  }
  return false;
};

export const getUserClassrooms = (userId: string, role: 'student' | 'teacher'): Classroom[] => {
  const classrooms = getClassrooms();
  if (role === 'teacher') {
    return classrooms.filter(c => c.teacherId === userId);
  } else {
    return classrooms.filter(c => c.students.includes(userId));
  }
};

// Classroom Messages
export const saveClassroomMessage = (message: ClassroomMessage): void => {
  const messages = getClassroomMessages();
  messages.push(message);
  localStorage.setItem('classroomMessages', JSON.stringify(messages));
};

export const getClassroomMessages = (): ClassroomMessage[] => {
  const messages = localStorage.getItem('classroomMessages');
  return messages ? JSON.parse(messages) : [];
};

export const getMessagesForClassroom = (classroomId: string): ClassroomMessage[] => {
  const messages = getClassroomMessages();
  return messages.filter(m => m.classroomId === classroomId).sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
};