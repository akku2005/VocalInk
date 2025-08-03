const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Set test environment
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  // Only create server if not already created
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
  }
  const mongoUri = mongoServer.getUri();
  
  // Disconnect from any existing connection first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Connect to test database
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Cleanup
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

afterEach(async () => {
  // Additional cleanup if needed
});

// Global test timeout
jest.setTimeout(30000);

// Suppress console logs during tests unless there's an error
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.info = originalConsoleInfo;
  console.warn = originalConsoleWarn;
});