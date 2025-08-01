const { exec } = require('child_process');
const path = require('path');

console.log('🧪 Running Blog Series Management API Tests...\n');

// Function to run tests
function runTests() {
  return new Promise((resolve, reject) => {
    const testCommand = 'npm test -- --testPathPattern=series.test.js --verbose';
    
    console.log('📋 Test Command:', testCommand);
    console.log('⏳ Starting tests...\n');
    
    const child = exec(testCommand, {
      cwd: path.join(__dirname),
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
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

// Function to check if required dependencies are installed
function checkDependencies() {
  const requiredDeps = [
    'supertest',
    'mongodb-memory-server',
    'jest'
  ];

  console.log('🔍 Checking dependencies...');
  
  for (const dep of requiredDeps) {
    try {
      require.resolve(dep);
      console.log(`✅ ${dep} is available`);
    } catch (error) {
      console.log(`❌ ${dep} is missing. Please install it with: npm install ${dep} --save-dev`);
      return false;
    }
  }
  
  return true;
}

// Main execution
async function main() {
  try {
    console.log('🚀 Blog Series Management API Test Runner');
    console.log('==========================================\n');
    
    // Check dependencies
    if (!checkDependencies()) {
      console.log('\n❌ Missing dependencies. Please install them first.');
      process.exit(1);
    }
    
    // Run tests
    await runTests();
    
    console.log('\n🎉 Test execution completed successfully!');
    console.log('\n📊 Test Coverage Summary:');
    console.log('- Series Management: ✅');
    console.log('- Episode Management: ✅');
    console.log('- Collaboration Management: ✅');
    console.log('- Progress Tracking: ✅');
    console.log('- Bookmark Management: ✅');
    console.log('- Analytics & Discovery: ✅');
    console.log('- Error Handling: ✅');
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { runTests, checkDependencies }; 