const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Blog Series Management API Tests...\n');

// Required dependencies for testing
const TEST_DEPENDENCIES = [
  'supertest',
  'mongodb-memory-server',
  'jest',
  '@types/jest'
];

// Function to install dependencies
function installDependencies() {
  return new Promise((resolve, reject) => {
    console.log('📦 Installing test dependencies...');
    
    const installCommand = `npm install ${TEST_DEPENDENCIES.join(' ')} --save-dev`;
    
    const child = exec(installCommand, {
      cwd: path.join(__dirname),
      maxBuffer: 1024 * 1024 * 10
    });

    child.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    child.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Dependencies installed successfully');
        resolve();
      } else {
        console.log(`❌ Failed to install dependencies (exit code: ${code})`);
        reject(new Error(`Installation failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error('❌ Error installing dependencies:', error.message);
      reject(error);
    });
  });
}

// Function to check if Jest config exists
function checkJestConfig() {
  const jestConfigPath = path.join(__dirname, 'jest.config.js');
  
  if (!fs.existsSync(jestConfigPath)) {
    console.log('📝 Creating Jest configuration...');
    
    const jestConfig = `module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testTimeout: 30000
};`;
    
    fs.writeFileSync(jestConfigPath, jestConfig);
    console.log('✅ Jest configuration created');
  } else {
    console.log('✅ Jest configuration already exists');
  }
}

// Function to create test setup file
function createTestSetup() {
  const setupPath = path.join(__dirname, 'test', 'setup.js');
  
  if (!fs.existsSync(setupPath)) {
    console.log('📝 Creating test setup file...');
    
    const setupContent = `// Test setup file
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
};`;
    
    // Ensure test directory exists
    const testDir = path.join(__dirname, 'test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    fs.writeFileSync(setupPath, setupContent);
    console.log('✅ Test setup file created');
  } else {
    console.log('✅ Test setup file already exists');
  }
}

// Function to run tests
function runTests() {
  return new Promise((resolve, reject) => {
    console.log('\n🧪 Running tests...\n');
    
    const testCommand = 'npm test -- --testPathPattern=series.test.js --verbose --detectOpenHandles';
    
    const child = exec(testCommand, {
      cwd: path.join(__dirname),
      maxBuffer: 1024 * 1024 * 10
    });

    child.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    child.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ All tests passed successfully!');
        resolve();
      } else {
        console.log(`\n❌ Tests failed with exit code ${code}`);
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error('❌ Error running tests:', error.message);
      reject(error);
    });
  });
}

// Function to run manual tests
function runManualTests() {
  return new Promise((resolve, reject) => {
    console.log('\n🔧 Running manual tests...\n');
    
    const manualTestCommand = 'node manual-test.js';
    
    const child = exec(manualTestCommand, {
      cwd: path.join(__dirname),
      maxBuffer: 1024 * 1024 * 10
    });

    child.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    child.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Manual tests completed successfully!');
        resolve();
      } else {
        console.log(`\n❌ Manual tests failed with exit code ${code}`);
        reject(new Error(`Manual tests failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error('❌ Error running manual tests:', error.message);
      reject(error);
    });
  });
}

// Main execution
async function main() {
  try {
    console.log('🚀 Blog Series Management API Test Setup');
    console.log('========================================\n');
    
    // Step 1: Install dependencies
    await installDependencies();
    
    // Step 2: Check/create Jest config
    checkJestConfig();
    
    // Step 3: Create test setup
    createTestSetup();
    
    console.log('\n✅ Test setup completed successfully!');
    
    // Ask user what to do next
    console.log('\n📋 Available test options:');
    console.log('1. Run automated tests (Jest)');
    console.log('2. Run manual tests');
    console.log('3. Run both');
    console.log('4. Exit');
    
    // For now, run both tests
    console.log('\n🔄 Running both automated and manual tests...\n');
    
    // Run automated tests
    await runTests();
    
    // Run manual tests
    await runManualTests();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('- ✅ Automated tests (Jest)');
    console.log('- ✅ Manual tests');
    console.log('- ✅ Series Management API');
    console.log('- ✅ Episode Management');
    console.log('- ✅ Progress Tracking');
    console.log('- ✅ Bookmark Management');
    console.log('- ✅ Analytics & Discovery');
    
  } catch (error) {
    console.error('\n💥 Test setup failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  installDependencies,
  checkJestConfig,
  createTestSetup,
  runTests,
  runManualTests
}; 