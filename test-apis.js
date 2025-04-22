// API Testing Script
const baseUrl = 'http://localhost:3000';

const testApis = async () => {
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
    
    let sessionCookie = '';
    
    // 1. Test Register Endpoint
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
      console.log('Response:', registerData);
      
      if (registerResponse.ok) {
        console.log('✅ Register API test passed');
      } else {
        console.log('❌ Register API test failed');
      }
    } catch (error) {
      console.log('❌ Register API test error:', error.message);
    }
    
    // 2. Test Login Endpoint
    console.log('\n2️⃣ Testing /api/auth/callback/credentials (login)');
    try {
      const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password,
          redirect: false,
          json: true
        }),
        redirect: 'manual'
      });
      
      // Check if we have cookies (session)
      const cookies = loginResponse.headers.get('set-cookie');
      if (cookies) {
        sessionCookie = cookies;
        console.log('Session cookie received');
      }
      
      console.log(`Status: ${loginResponse.status}`);
      console.log('Headers:', Object.fromEntries(loginResponse.headers.entries()));
      
      if (loginResponse.status === 200 || loginResponse.status === 302) {
        console.log('✅ Login API test passed');
      } else {
        console.log('❌ Login API test failed');
      }
    } catch (error) {
      console.log('❌ Login API test error:', error.message);
    }
    
    // 3. Test Session Endpoint
    console.log('\n3️⃣ Testing /api/auth/session');
    try {
      const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
        headers: sessionCookie ? {
          'Cookie': sessionCookie
        } : {}
      });
      
      const sessionData = await sessionResponse.json();
      console.log(`Status: ${sessionResponse.status}`);
      console.log('Response:', sessionData);
      
      if (sessionResponse.ok) {
        console.log('✅ Session API test passed');
      } else {
        console.log('❌ Session API test failed');
      }
    } catch (error) {
      console.log('❌ Session API test error:', error.message);
    }
    
    // 4. Test Debug Endpoint
    console.log('\n4️⃣ Testing /api/auth/debug');
    try {
      const debugResponse = await fetch(`${baseUrl}/api/auth/debug`, {
        headers: sessionCookie ? {
          'Cookie': sessionCookie
        } : {}
      });
      
      const debugData = await debugResponse.json();
      console.log(`Status: ${debugResponse.status}`);
      console.log('Response:', debugData);
      
      if (debugResponse.ok) {
        console.log('✅ Debug API test passed');
      } else {
        console.log('❌ Debug API test failed');
      }
    } catch (error) {
      console.log('❌ Debug API test error:', error.message);
    }
    
    console.log('\n======================');
    console.log('🏁 API Tests Completed 🏁');
  } catch (error) {
    console.error('Test suite error:', error);
  }
};

// Execute the tests
testApis(); 