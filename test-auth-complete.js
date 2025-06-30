import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  name: "Dattatray Kshirsagar",
  email: "dattatray@example.com",
  password: "password123",
  role: "student"
};

async function testHealth() {
  console.log('🏥 Testing Server Health...\n');
  
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Server is healthy!');
      console.log('📊 Health Status:', JSON.stringify(result, null, 2));
      return true;
    } else {
      console.log('❌ Server health check failed!');
      console.log('📊 Error:', result);
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    console.log('💡 Make sure the server is running: cd server && npm run dev');
    return false;
  }
}

async function testSignup() {
  console.log('\n📝 Testing Signup (POST /api/auth/register)...\n');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    const result = await response.json();
    
    console.log(`📡 Response Status: ${response.status}`);
    console.log('📊 Response Body:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('✅ Signup successful!');
      return result.data.token;
    } else {
      console.log('❌ Signup failed!');
      if (result.message && result.message.includes('already exists')) {
        console.log('💡 User already exists, will try login instead');
        return null;
      }
      return null;
    }
  } catch (error) {
    console.log('❌ Signup error:', error.message);
    return null;
  }
}

async function testLogin() {
  console.log('\n🔐 Testing Login (POST /api/auth/login)...\n');
  
  const loginData = {
    email: testUser.email,
    password: testUser.password
  };

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });

    const result = await response.json();
    
    console.log(`📡 Response Status: ${response.status}`);
    console.log('📊 Response Body:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('✅ Login successful!');
      return result.data.token;
    } else {
      console.log('❌ Login failed!');
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return null;
  }
}

async function testAuthenticatedEndpoint(token) {
  console.log('\n🔒 Testing Authenticated Endpoint (GET /api/auth/me)...\n');
  
  if (!token) {
    console.log('❌ No token available, skipping authenticated test');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    
    console.log(`📡 Response Status: ${response.status}`);
    console.log('📊 Response Body:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('✅ Authenticated request successful!');
    } else {
      console.log('❌ Authenticated request failed!');
    }
  } catch (error) {
    console.log('❌ Authenticated request error:', error.message);
  }
}

async function checkMongoDBConnection() {
  console.log('\n🗄️  Checking MongoDB Connection...\n');
  
  // We'll check this by trying to create a user and see if we get a database-related error
  const testData = {
    name: "MongoDB Test User",
    email: `test-${Date.now()}@example.com`,
    password: "password123",
    role: "student"
  };

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ MongoDB connection working - user created successfully');
      console.log('📊 Created user:', {
        id: result.data?.user?.id,
        email: result.data?.user?.email,
        name: result.data?.user?.name
      });
    } else {
      console.log('❌ Possible MongoDB issue:');
      console.log('📊 Error:', result);
    }
  } catch (error) {
    console.log('❌ MongoDB connection test failed:', error.message);
  }
}

async function runCompleteTest() {
  console.log('🚀 Starting Complete Authentication Test...\n');
  console.log('=' * 50);
  
  // 1. Test server health
  const serverHealthy = await testHealth();
  if (!serverHealthy) {
    console.log('\n❌ Server is not responding. Please start the server first:');
    console.log('   cd server && npm run dev');
    return;
  }
  
  // 2. Check MongoDB connection
  await checkMongoDBConnection();
  
  // 3. Test signup
  let token = await testSignup();
  
  // 4. Test login (whether signup worked or not)
  if (!token) {
    token = await testLogin();
  }
  
  // 5. Test authenticated endpoint
  await testAuthenticatedEndpoint(token);
  
  console.log('\n' + '=' * 50);
  console.log('🎉 Complete test finished!');
  
  if (token) {
    console.log('✅ All authentication flows working correctly');
    console.log('💡 You can now check your MongoDB Atlas dashboard to see the users');
  } else {
    console.log('❌ Authentication issues detected');
    console.log('💡 Check server logs for more details');
  }
}

// Run the complete test
runCompleteTest().catch(console.error);