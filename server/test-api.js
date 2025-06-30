import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
  role: "student"
};

async function testAPI() {
  console.log('🧪 Testing API Endpoints...\n');
  
  try {
    // Test health
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const health = await healthResponse.json();
    console.log('✅ Health:', health);
    
    // Test registration
    console.log('\n2. Testing registration...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const registerResult = await registerResponse.json();
    console.log('📝 Register:', registerResult.success ? '✅ Success' : '❌ Failed', registerResult.message);
    
    // Test login
    console.log('\n3. Testing login...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    const loginResult = await loginResponse.json();
    console.log('🔐 Login:', loginResult.success ? '✅ Success' : '❌ Failed', loginResult.message);
    
    if (loginResult.success) {
      const token = loginResult.data.token;
      
      // Test authenticated endpoint
      console.log('\n4. Testing authenticated endpoint...');
      const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const meResult = await meResponse.json();
      console.log('👤 Get Me:', meResult.success ? '✅ Success' : '❌ Failed');

      // Test saving quiz result
      console.log('\n5. Testing save quiz result...');
      const quizResultResponse = await fetch(`${API_BASE_URL}/quizzes/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: 'Linux',
          score: 80,
          totalQuestions: 10,
          correctAnswers: 8,
          timeSpent: 300,
          answers: [0,1,2,3,0,1,2,3,0,1],
          completedAt: new Date()
        })
      });
      const quizResult = await quizResultResponse.json();
      console.log('📝 Save Quiz Result:', quizResult.success ? '✅ Success' : '❌ Failed', quizResult.message);

      // Test saving study plan
      console.log('\n6. Testing save study plan...');
      const studyPlanResponse = await fetch(`${API_BASE_URL}/study-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: 'Linux',
          score: 80,
          plan: {
            videos: [{ title: 'Linux Basics', url: 'https://example.com', duration: '30 mins' }],
            notes: [{ title: 'Intro', content: 'Linux basics', type: 'Study Notes' }],
            documents: [{ title: 'Linux Guide', url: 'https://example.com/guide.pdf', type: 'PDF' }],
            textPlan: 'Study Linux fundamentals.'
          }
        })
      });
      const studyPlan = await studyPlanResponse.json();
      console.log('📚 Save Study Plan:', studyPlan.success ? '✅ Success' : '❌ Failed', studyPlan.message);
    }
    
    console.log('\n🎉 API test completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();