// Test setup file
const mongoose = require('mongoose');

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(async () => {
  // Clean up any remaining connections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// Global test utilities
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
};