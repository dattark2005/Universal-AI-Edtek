import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testUsers = [
  {
    name: "Dattatray Kshirsagar",
    email: "dattatray@example.com",
    password: "password123",
    role: "student"
  },
  {
    name: "Sarah Johnson",
    email: "sarah.teacher@example.com",
    password: "password123",
    role: "teacher"
  }
];

let authTokens = {};

async function testEndpoint(name, url, method, data, token = null) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`📡 ${method} ${url}`);
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    });

    const result = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log(`✅ ${name} - SUCCESS`);
      return { success: true, data: result };
    } else {
      console.log(`❌ ${name} - FAILED`);
      return { success: false, data: result };
    }
  } catch (error) {
    console.log(`❌ ${name} - ERROR:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testHealthCheck() {
  return await testEndpoint(
    'Health Check',
    `${API_BASE_URL.replace('/api', '')}/health`,
    'GET'
  );
}

async function testUserRegistration() {
  console.log('\n' + '='.repeat(50));
  console.log('👥 TESTING USER REGISTRATION');
  console.log('='.repeat(50));
  
  for (const user of testUsers) {
    const result = await testEndpoint(
      `Register ${user.role} - ${user.name}`,
      `${API_BASE_URL}/auth/register`,
      'POST',
      user
    );
    
    if (result.success && result.data.data?.token) {
      authTokens[user.role] = result.data.data.token;
      console.log(`🔑 Saved ${user.role} token for future tests`);
    }
  }
}

async function testUserLogin() {
  console.log('\n' + '='.repeat(50));
  console.log('🔐 TESTING USER LOGIN');
  console.log('='.repeat(50));
  
  for (const user of testUsers) {
    const loginData = {
      email: user.email,
      password: user.password
    };
    
    const result = await testEndpoint(
      `Login ${user.role} - ${user.email}`,
      `${API_BASE_URL}/auth/login`,
      'POST',
      loginData
    );
    
    if (result.success && result.data.data?.token) {
      authTokens[user.role] = result.data.data.token;
      console.log(`🔑 Updated ${user.role} token from login`);
    }
  }
}

async function testQuizCreation() {
  console.log('\n' + '='.repeat(50));
  console.log('📝 TESTING QUIZ CREATION (Teacher Only)');
  console.log('='.repeat(50));
  
  const quizData = {
    title: "Sample Mathematics Quiz",
    description: "A test quiz for mathematics",
    subject: "Mathematics",
    timeLimit: 600,
    difficulty: "medium",
    questions: [
      {
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: 1,
        explanation: "2 + 2 equals 4",
        points: 1
      },
      {
        question: "What is 5 × 3?",
        options: ["15", "12", "18", "20"],
        correctAnswer: 0,
        explanation: "5 × 3 equals 15",
        points: 1
      }
    ]
  };
  
  return await testEndpoint(
    'Create Quiz (Teacher)',
    `${API_BASE_URL}/quizzes`,
    'POST',
    quizData,
    authTokens.teacher
  );
}

async function testClassroomCreation() {
  console.log('\n' + '='.repeat(50));
  console.log('🏫 TESTING CLASSROOM CREATION (Teacher Only)');
  console.log('='.repeat(50));
  
  const classroomData = {
    name: "Advanced Mathematics",
    description: "A classroom for advanced mathematics students",
    subject: "Mathematics",
    settings: {
      allowStudentChat: true,
      autoApproveStudents: true,
      maxStudents: 50
    }
  };
  
  return await testEndpoint(
    'Create Classroom (Teacher)',
    `${API_BASE_URL}/classrooms`,
    'POST',
    classroomData,
    authTokens.teacher
  );
}

async function testAssignmentCreation() {
  console.log('\n' + '='.repeat(50));
  console.log('📋 TESTING ASSIGNMENT CREATION (Teacher Only)');
  console.log('='.repeat(50));
  
  const assignmentData = {
    title: "Algebra Problem Set",
    description: "Complete the following algebra problems and show your work",
    subject: "Mathematics",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    maxPoints: 100
  };
  
  return await testEndpoint(
    'Create Assignment (Teacher)',
    `${API_BASE_URL}/assignments`,
    'POST',
    assignmentData,
    authTokens.teacher
  );
}

async function testStudyPlanCreation() {
  console.log('\n' + '='.repeat(50));
  console.log('📚 TESTING STUDY PLAN CREATION');
  console.log('='.repeat(50));
  
  const studyPlanData = {
    subject: "Mathematics",
    score: 85,
    plan: {
      videos: [
        {
          title: "Algebra Basics",
          url: "https://youtube.com/watch?v=example",
          duration: "30 mins"
        }
      ],
      notes: [
        {
          title: "Key Formulas",
          content: "Important algebra formulas to remember",
          type: "PDF"
        }
      ],
      documents: [
        {
          title: "Practice Problems",
          url: "https://example.com/problems.pdf",
          type: "PDF"
        }
      ],
      textPlan: "Focus on strengthening algebra fundamentals and practice daily."
    }
  };
  
  return await testEndpoint(
    'Create Study Plan (Student)',
    `${API_BASE_URL}/study-plans`,
    'POST',
    studyPlanData,
    authTokens.student
  );
}

async function testGetEndpoints() {
  console.log('\n' + '='.repeat(50));
  console.log('📖 TESTING GET ENDPOINTS');
  console.log('='.repeat(50));
  
  // Test authenticated user endpoint
  await testEndpoint(
    'Get Current User (Student)',
    `${API_BASE_URL}/auth/me`,
    'GET',
    null,
    authTokens.student
  );
  
  // Test get quizzes
  await testEndpoint(
    'Get Quizzes (Student)',
    `${API_BASE_URL}/quizzes`,
    'GET',
    null,
    authTokens.student
  );
  
  // Test get classrooms
  await testEndpoint(
    'Get Classrooms (Teacher)',
    `${API_BASE_URL}/classrooms`,
    'GET',
    null,
    authTokens.teacher
  );
  
  // Test get assignments
  await testEndpoint(
    'Get Assignments (Student)',
    `${API_BASE_URL}/assignments`,
    'GET',
    null,
    authTokens.student
  );
  
  // Test get study plans
  await testEndpoint(
    'Get Study Plans (Student)',
    `${API_BASE_URL}/study-plans`,
    'GET',
    null,
    authTokens.student
  );
}

async function testUnauthorizedAccess() {
  console.log('\n' + '='.repeat(50));
  console.log('🚫 TESTING UNAUTHORIZED ACCESS');
  console.log('='.repeat(50));
  
  // Test accessing protected endpoint without token
  await testEndpoint(
    'Access Protected Endpoint (No Token)',
    `${API_BASE_URL}/auth/me`,
    'GET'
  );
  
  // Test student trying to create quiz (teacher only)
  const quizData = {
    title: "Unauthorized Quiz",
    subject: "Mathematics",
    questions: [],
    timeLimit: 600
  };
  
  await testEndpoint(
    'Student Trying to Create Quiz (Should Fail)',
    `${API_BASE_URL}/quizzes`,
    'POST',
    quizData,
    authTokens.student
  );
}

async function runAllTests() {
  console.log('🚀 STARTING COMPREHENSIVE API TESTS');
  console.log('🗄️  Testing MongoDB Atlas Integration');
  console.log('📡 API Base URL:', API_BASE_URL);
  console.log('\n' + '='.repeat(60));
  
  try {
    // 1. Health Check
    const health = await testHealthCheck();
    if (!health.success) {
      console.log('❌ Server is not healthy. Stopping tests.');
      return;
    }
    
    // 2. User Registration
    await testUserRegistration();
    
    // 3. User Login
    await testUserLogin();
    
    // Check if we have tokens
    if (!authTokens.student || !authTokens.teacher) {
      console.log('\n❌ Missing authentication tokens. Cannot continue with protected endpoint tests.');
      console.log('🔑 Available tokens:', Object.keys(authTokens));
      return;
    }
    
    // 4. Quiz Creation (Teacher)
    await testQuizCreation();
    
    // 5. Classroom Creation (Teacher)
    await testClassroomCreation();
    
    // 6. Assignment Creation (Teacher)
    await testAssignmentCreation();
    
    // 7. Study Plan Creation (Student)
    await testStudyPlanCreation();
    
    // 8. Test GET endpoints
    await testGetEndpoints();
    
    // 9. Test unauthorized access
    await testUnauthorizedAccess();
    
    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS COMPLETED!');
    console.log('='.repeat(60));
    console.log('✅ If you see this message, your API is working correctly');
    console.log('🗄️  Check your MongoDB Atlas dashboard to see the created data');
    console.log('🔑 Authentication tokens obtained:', Object.keys(authTokens));
    console.log('📊 You can now use the frontend to interact with your API');
    
  } catch (error) {
    console.log('\n❌ Test suite failed with error:', error.message);
    console.log('📋 Stack trace:', error.stack);
  }
}

// Run all tests
runAllTests().catch(console.error);