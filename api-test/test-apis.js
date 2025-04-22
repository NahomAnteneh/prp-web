// API Testing Script
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:3000';

// Helper function to format JSON responses
const formatJson = (data) => {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return data;
  }
};

// Separate test for each API endpoint
const testRegisterApi = async (testUser) => {
  console.log('\n1️⃣ Testing /api/auth/register');
  try {
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const registerData = await registerResponse.json();
    console.log(`Status: ${registerResponse.status}`);
    console.log('Response:', formatJson(registerData));
    
    if (registerResponse.ok) {
      console.log('✅ Register API test passed');
    } else {
      console.log('❌ Register API test failed');
    }
    
    return registerData;
  } catch (error) {
    console.log('❌ Register API test error:', error.message);
    return null;
  }
};

const testDirectLoginApi = async (testUser) => {
  console.log('\n2️⃣ Testing /api/auth/login (direct login)');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: testUser.username,
        password: testUser.password
      })
    });
    
    console.log(`Status: ${loginResponse.status}`);
    
    // Get the response data
    let responseData = null;
    try {
      responseData = await loginResponse.json();
      console.log('Response:', formatJson(responseData));
    } catch {
      console.log('Could not parse response as JSON');
    }
    
    // Check if we have cookies
    const cookies = loginResponse.headers.get('set-cookie');
    if (cookies) {
      console.log('✅ Session cookie received');
    }
    
    if (loginResponse.ok) {
      console.log('✅ Login API test passed');
      return { cookies: cookies || '', token: responseData?.token };
    } else {
      console.log('❌ Login API test failed');
      return { cookies: '', token: null };
    }
  } catch (error) {
    console.log('❌ Login API test error:', error.message);
    return { cookies: '', token: null };
  }
};

// Test NextAuth credentials endpoint
const testNextAuthCredentials = async (testUser) => {
  console.log('\n3️⃣ Testing /api/auth/callback/credentials (NextAuth)');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: testUser.username,
        password: testUser.password,
        redirect: false,
        json: true
      })
    });
    
    console.log(`Status: ${loginResponse.status}`);
    
    // Get the response data if possible
    try {
      const text = await loginResponse.text();
      if (text) {
        console.log('Response text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      }
    } catch {
      console.log('Could not read response text');
    }
    
    // Check if we have cookies
    const cookies = loginResponse.headers.get('set-cookie');
    if (cookies) {
      console.log('✅ Session cookie received');
    } else {
      console.log('⚠️ No session cookie received');
    }
    
    if (loginResponse.status === 200 || loginResponse.status === 302) {
      console.log('✅ NextAuth credentials test passed');
      return cookies || '';
    } else {
      console.log('❌ NextAuth credentials test failed');
      return '';
    }
  } catch (error) {
    console.log('❌ NextAuth credentials test error:', error.message);
    return '';
  }
};

const testSessionApi = async (authData) => {
  console.log('\n4️⃣ Testing /api/auth/session');
  try {
    const headers = {};
    if (authData.cookies) {
      headers['Cookie'] = authData.cookies;
    }
    if (authData.token) {
      headers['Authorization'] = `Bearer ${authData.token}`;
    }
    
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, { headers });
    
    const sessionData = await sessionResponse.json();
    console.log(`Status: ${sessionResponse.status}`);
    console.log('Response:', formatJson(sessionData));
    
    if (sessionResponse.ok) {
      console.log('✅ Session API test passed');
    } else {
      console.log('❌ Session API test failed');
    }
    
    return sessionData;
  } catch (error) {
    console.log('❌ Session API test error:', error.message);
    return null;
  }
};

const testDebugApi = async (authData) => {
  console.log('\n5️⃣ Testing /api/auth/debug');
  try {
    const headers = {};
    if (authData.cookies) {
      headers['Cookie'] = authData.cookies;
    }
    if (authData.token) {
      headers['Authorization'] = `Bearer ${authData.token}`;
    }
    
    const debugResponse = await fetch(`${baseUrl}/api/auth/debug`, { headers });
    
    const debugData = await debugResponse.json();
    console.log(`Status: ${debugResponse.status}`);
    console.log('Response:', formatJson(debugData));
    
    if (debugResponse.ok) {
      console.log('✅ Debug API test passed');
    } else {
      console.log('❌ Debug API test failed');
    }
    
    return debugData;
  } catch (error) {
    console.log('❌ Debug API test error:', error.message);
    return null;
  }
};

// Main test function
const runApiTests = async () => {
  try {
    console.log('🔍 Starting API Tests 🔍');
    console.log('======================');
    
    // Test variables
    const testUser = {
      username: `test_user_${Date.now()}`,
      idNumber: "123456",
      email: `test_${Date.now()}@example.com`,
      password: "password123",
      department: "Computer Science",
      batchYear: "2023"
    };
    
    // 1. Register API Test
    await testRegisterApi(testUser);
    
    // 2. Login API Test
    const authData = await testDirectLoginApi(testUser);
    
    // 3. NextAuth Credentials Test
    const nextAuthCookies = await testNextAuthCredentials(testUser);
    if (nextAuthCookies) {
      authData.nextAuthCookies = nextAuthCookies;
    }
    
    // 4. Session API Test
    await testSessionApi(authData);
    
    // 5. Debug API Test
    await testDebugApi(authData);
    
    console.log('\n======================');
    console.log('🏁 API Tests Completed 🏁');
  } catch (error) {
    console.error('Test suite error:', error);
  }
};

// Execute the tests
runApiTests(); 