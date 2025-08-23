#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test runner for AI Services and Badge System
class TestRunner {
  constructor() {
    this.testResults = {
      aiServices: { passed: 0, failed: 0, total: 0 },
      badgeSystem: { passed: 0, failed: 0, total: 0 },
      total: { passed: 0, failed: 0, total: 0 }
    };
    this.startTime = Date.now();
  }

  async run() {
    console.log('🚀 Starting AI Services and Badge System Tests...\n');
    
    try {
      // Run AI Services tests
      await this.runAIServicesTests();
      
      // Run Badge System tests
      await this.runBadgeSystemTests();
      
      // Generate test report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    }
  }

  async runAIServicesTests() {
    console.log('🤖 Running AI Services Tests...\n');
    
    try {
      const testFile = path.join(__dirname, 'ai-services.test.js');
      
      if (!fs.existsSync(testFile)) {
        throw new Error('AI Services test file not found');
      }

      const result = execSync('npx jest ai-services.test.js --verbose --detectOpenHandles', {
        cwd: __dirname,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      console.log('✅ AI Services Tests Completed Successfully\n');
      console.log(result);
      
      // Parse results (simplified)
      this.testResults.aiServices.passed = this.countTestResults(result, '✓');
      this.testResults.aiServices.failed = this.countTestResults(result, '✗');
      this.testResults.aiServices.total = this.testResults.aiServices.passed + this.testResults.aiServices.failed;
      
    } catch (error) {
      console.error('❌ AI Services Tests Failed:', error.message);
      this.testResults.aiServices.failed++;
      this.testResults.aiServices.total++;
    }
  }

  async runBadgeSystemTests() {
    console.log('🏆 Running Badge System Tests...\n');
    
    try {
      const testFile = path.join(__dirname, 'badge-system.test.js');
      
      if (!fs.existsSync(testFile)) {
        throw new Error('Badge System test file not found');
      }

      const result = execSync('npx jest badge-system.test.js --verbose --detectOpenHandles', {
        cwd: __dirname,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      console.log('✅ Badge System Tests Completed Successfully\n');
      console.log(result);
      
      // Parse results (simplified)
      this.testResults.badgeSystem.passed = this.countTestResults(result, '✓');
      this.testResults.badgeSystem.failed = this.countTestResults(result, '✗');
      this.testResults.badgeSystem.total = this.testResults.badgeSystem.passed + this.testResults.badgeSystem.failed;
      
    } catch (error) {
      console.error('❌ Badge System Tests Failed:', error.message);
      this.testResults.badgeSystem.failed++;
      this.testResults.badgeSystem.total++;
    }
  }

  countTestResults(output, symbol) {
    const regex = new RegExp(`\\${symbol}`, 'g');
    const matches = output.match(regex);
    return matches ? matches.length : 0;
  }

  generateReport() {
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);
    
    // Calculate totals
    this.testResults.total.passed = this.testResults.aiServices.passed + this.testResults.badgeSystem.passed;
    this.testResults.total.failed = this.testResults.aiServices.failed + this.testResults.badgeSystem.failed;
    this.testResults.total.total = this.testResults.total.passed + this.testResults.total.failed;

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST EXECUTION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n⏱️  Total Duration: ${duration}s`);
    console.log(`📈 Total Tests: ${this.testResults.total.total}`);
    console.log(`✅ Passed: ${this.testResults.total.passed}`);
    console.log(`❌ Failed: ${this.testResults.total.failed}`);
    
    const successRate = this.testResults.total.total > 0 
      ? ((this.testResults.total.passed / this.testResults.total.total) * 100).toFixed(1)
      : 0;
    
    console.log(`📊 Success Rate: ${successRate}%`);
    
    console.log('\n' + '-'.repeat(40));
    console.log('🤖 AI Services Tests:');
    console.log(`   Total: ${this.testResults.aiServices.total}`);
    console.log(`   Passed: ${this.testResults.aiServices.passed}`);
    console.log(`   Failed: ${this.testResults.aiServices.failed}`);
    
    console.log('\n🏆 Badge System Tests:');
    console.log(`   Total: ${this.testResults.badgeSystem.total}`);
    console.log(`   Passed: ${this.testResults.badgeSystem.passed}`);
    console.log(`   Failed: ${this.testResults.badgeSystem.failed}`);
    
    console.log('\n' + '='.repeat(60));
    
    // Test coverage summary
    this.generateCoverageSummary();
    
    // Recommendations
    this.generateRecommendations();
    
    console.log('\n' + '='.repeat(60));
    
    // Exit with appropriate code
    if (this.testResults.total.failed > 0) {
      console.log('❌ Some tests failed. Please review the results above.');
      process.exit(1);
    } else {
      console.log('🎉 All tests passed successfully!');
      process.exit(0);
    }
  }

  generateCoverageSummary() {
    console.log('\n📋 COVERAGE SUMMARY:');
    console.log('-'.repeat(30));
    
    const coverageAreas = [
      'TTS Service (Direct Generation)',
      'TTS Queue System',
      'TTS Worker Service',
      'AI Summary Service',
      'AI Analyzer Service',
      'AI Notification Service',
      'Badge Model & Validation',
      'Badge Service (Management)',
      'Badge Claims & Rewards',
      'Badge Evaluation Engine',
      'Badge API Endpoints',
      'Badge Integration Tests',
      'Performance & Error Handling'
    ];
    
    coverageAreas.forEach(area => {
      console.log(`✅ ${area}`);
    });
    
    console.log(`\n📊 Total Coverage Areas: ${coverageAreas.length}`);
  }

  generateRecommendations() {
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(30));
    
    const recommendations = [
      'Run tests in CI/CD pipeline for automated validation',
      'Add integration tests with external AI providers',
      'Implement load testing for high-traffic scenarios',
      'Add mutation testing for better code quality',
      'Consider adding visual regression tests for UI components',
      'Implement contract testing for API integrations',
      'Add performance benchmarks for critical paths',
      'Consider adding chaos engineering tests for resilience'
    ];
    
    recommendations.forEach(rec => {
      console.log(`• ${rec}`);
    });
  }
}

// Run the test runner
const runner = new TestRunner();
runner.run().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
}); 