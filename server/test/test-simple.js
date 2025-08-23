const http = require('http');

// Test basic endpoints
const endpoints = [
  { path: '/health', method: 'GET', name: 'Health Check' },
  { path: '/api-docs', method: 'GET', name: 'API Documentation' },
  { path: '/api/blogs', method: 'GET', name: 'Get Blogs' },
  { path: '/api/badges', method: 'GET', name: 'Get Badges' },
  { path: '/api/series', method: 'GET', name: 'Get Series' }
];

function testEndpoint(path, method, name) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`✅ ${name}: ${res.statusCode} - ${res.statusMessage}`);
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${name}: ${error.message}`);
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing server endpoints...\n');
  
  for (const endpoint of endpoints) {
    try {
      await testEndpoint(endpoint.path, endpoint.method, endpoint.name);
    } catch (error) {
      console.log(`❌ ${endpoint.name} failed:`, error.message);
    }
  }
  
  console.log('\n🎉 Basic endpoint testing completed!');
}

runTests(); 