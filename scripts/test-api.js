const fetch = require('node-fetch');

async function testAPI() {
  console.log('🧪 Testing onboarding complete API...');

  try {
    const response = await fetch('http://localhost:3000/api/onboarding/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This won't work without proper auth cookies
      },
    });

    console.log('📡 Response status:', response.status);
    const data = await response.json();
    console.log('📡 Response data:', data);

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testAPI();