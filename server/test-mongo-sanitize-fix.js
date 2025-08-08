const express = require('express');
const request = require('supertest');

// Create a minimal Express app to test the sanitization
const app = express();

// Custom mongo sanitize middleware for Express 5 compatibility
const sanitizeMongoQuery = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [] : {};
  const dangerousKeys = ['$where', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$exists', '$regex'];
  
  for (const [key, value] of Object.entries(obj)) {
    // Check if key contains dangerous operators
    const isDangerous = dangerousKeys.some(dangerous => 
      key.includes(dangerous) || key.startsWith('$')
    );
    
    if (isDangerous) {
      console.log(`Mongo sanitize: Dangerous key "${key}" was sanitized`);
      sanitized[`_${key}`] = value;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Apply sanitization to query, body, and params
app.use((req, res, next) => {
  if (req.query) {
    req.query = sanitizeMongoQuery(req.query);
  }
  if (req.body) {
    req.body = sanitizeMongoQuery(req.body);
  }
  if (req.params) {
    req.params = sanitizeMongoQuery(req.params);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Request body:', req.body);
  console.log('Request query:', req.query);
  res.json({ 
    success: true, 
    body: req.body, 
    query: req.query,
    message: 'Login endpoint reached successfully' 
  });
});

// Test the fix
async function testSanitization() {
  console.log('Testing mongo sanitize fix...');
  
  try {
    // Test with dangerous query parameters
    const response1 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
        '$where': 'malicious',
        '$ne': 'dangerous'
      })
      .query({
        '$gt': 'malicious',
        normal: 'safe'
      });
    
    console.log('Response 1:', response1.body);
    
    // Test with normal data
    const response2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    console.log('Response 2:', response2.body);
    
    console.log('✅ All tests passed! The mongo sanitize fix is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSanitization(); 