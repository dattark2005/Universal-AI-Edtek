import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

// Test data for signup
const testUsers = [
  {
    name: "Dattatray Kshirsagar",
    email: "dattatray@example.com",
    password: "password123",
    role: "student"
  },
  {
    name: "Test Teacher",
    email: "teacher@example.com", 
    password: "password123",
    role: "teacher"
  }
];

async function testSignup() {
  console.log('🧪 Testing Signup API...\n');

  for (const userData of testUsers) {
    try {
      console.log(`📝 Testing signup for: ${userData.name} (${userData.role})`);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Signup successful!');
        console.log('📊 Response:', {
          success: result.success,
          message: result.message,
          user: {
            id: result.data.user.id,
            name: result.data.user.name,
            email: result.data.user.email,
            role: result.data.user.role,
            avatar: result.data.user.avatar
          },
          tokenReceived: !!result.data.token
        });
      } else {
        console.log('❌ Signup failed!');
        console.log('📊 Error:', result);
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.log('❌ Network error:', error.message);
      console.log('---\n');
    }
  }
}

// Test login after signup
async function testLogin() {
  console.log('🔐 Testing Login API...\n');
  
  const loginData = {
    email: "dattatray@example.com",
    password: "password123"
  };

  try {
    console.log(`🔑 Testing login for: ${loginData.email}`);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('📊 Response:', {
        success: result.success,
        message: result.message,
        user: {
          id: result.data.user.id,
          name: result.data.user.name,
          email: result.data.user.email,
          role: result.data.user.role
        },
        tokenReceived: !!result.data.token
      });
    } else {
      console.log('❌ Login failed!');
      console.log('📊 Error:', result);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Test health endpoint first
async function testHealth() {
  console.log('🏥 Testing Health Endpoint...\n');
  
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Server is healthy!');
      console.log('📊 Health Status:', result);
    } else {
      console.log('❌ Server health check failed!');
      console.log('📊 Error:', result);
    }
    
    console.log('---\n');
    
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    console.log('Make sure the server is running on http://localhost:5000');
    console.log('---\n');
    return false;
  }
  
  return true;
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  // Test server health first
  const serverHealthy = await testHealth();
  
  if (!serverHealthy) {
    console.log('❌ Server is not responding. Please start the server first.');
    return;
  }
  
  // Test signup
  await testSignup();
  
  // Wait a bit then test login
  await new Promise(resolve => setTimeout(resolve, 1000));
  await testLogin();
  
  console.log('🎉 All tests completed!');
}

// Run the tests
runTests().catch(console.error);