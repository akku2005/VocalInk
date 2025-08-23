#!/usr/bin/env node

/**
 * Security Audit Script for Logging and Sensitive Data Exposure
 * 
 * This script checks for potential security vulnerabilities related to:
 * - Hardcoded credentials in code
 * - Sensitive data in console.log statements
 * - Debug logging in production
 * - Environment variable exposure
 * - Test files with real credentials
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Sensitive patterns to check for
const SENSITIVE_PATTERNS = [
  // Credentials and secrets
  /password\s*[:=]\s*['"`][^'"`]+['"`]/gi,
  /secret\s*[:=]\s*['"`][^'"`]+['"`]/gi,
  /token\s*[:=]\s*['"`][^'"`]+['"`]/gi,
  /key\s*[:=]\s*['"`][^'"`]+['"`]/gi,
  /api_key\s*[:=]\s*['"`][^'"`]+['"`]/gi,
  /apikey\s*[:=]\s*['"`][^'"`]+['"`]/gi,
  
  // Database URLs with credentials
  /mongodb:\/\/[^:]+:[^@]+@/gi,
  /redis:\/\/[^:]+:[^@]+@/gi,
  /postgresql:\/\/[^:]+:[^@]+@/gi,
  /mysql:\/\/[^:]+:[^@]+@/gi,
  
  // API keys and tokens
  /sk-[a-zA-Z0-9]{48}/g,
  /pk_[a-zA-Z0-9]{48}/g,
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  
  // Console.log with sensitive data
  /console\.(log|error|warn|info|debug).*\{.*password/gi,
  /console\.(log|error|warn|info|debug).*\{.*token/gi,
  /console\.(log|error|warn|info|debug).*\{.*secret/gi,
  /console\.(log|error|warn|info|debug).*\{.*key/gi,
  
  // Logger calls with sensitive data
  /logger\.(info|error|warn|debug).*\{.*password/gi,
  /logger\.(info|error|warn|debug).*\{.*token/gi,
  /logger\.(info|error|warn|debug).*\{.*secret/gi,
  /logger\.(info|error|warn|debug).*\{.*key/gi,
];

// Files to exclude from scanning
const EXCLUDED_FILES = [
  'node_modules',
  '.git',
  'logs',
  'dist',
  'build',
  'coverage',
  '.env',
  '.env.local',
  '.env.production',
  'package-lock.json',
  'yarn.lock'
];

// Test-specific patterns (should only be in test files)
const TEST_CREDENTIALS = [
  /testpassword/gi,
  /test-jwt-secret/gi,
  /test-badge-secret/gi,
  /password123/gi
];

let issues = [];
let warnings = [];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const fileName = path.basename(filePath);
    const isTestFile = filePath.includes('test') || fileName.includes('.test.') || fileName.includes('.spec.');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for sensitive patterns
      SENSITIVE_PATTERNS.forEach(pattern => {
        if (pattern.test(line)) {
          const match = line.match(pattern);
          if (match) {
            // Check if it's a test credential
            const isTestCredential = TEST_CREDENTIALS.some(testPattern => testPattern.test(line));
            
            if (isTestCredential && isTestFile) {
              warnings.push({
                file: filePath,
                line: lineNumber,
                content: line.trim(),
                type: 'TEST_CREDENTIAL',
                severity: 'WARNING'
              });
            } else if (!isTestCredential) {
              issues.push({
                file: filePath,
                line: lineNumber,
                content: line.trim(),
                type: 'SENSITIVE_DATA',
                severity: 'CRITICAL'
              });
            }
          }
        }
      });
      
      // Check for console.log in production code (exclude audit scripts)
      if (line.includes('console.log') && !isTestFile && !filePath.includes('scripts/security-audit')) {
        issues.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          type: 'CONSOLE_LOG',
          severity: 'WARNING'
        });
      }
      
      // Check for debug logging that might expose data
      if (line.includes('logger.debug') && !isTestFile) {
        warnings.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          type: 'DEBUG_LOGGING',
          severity: 'WARNING'
        });
      }
    });
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error.message);
  }
}

function scanDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!EXCLUDED_FILES.includes(item)) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile() && /\.(js|ts|json)$/.test(item)) {
        scanFile(fullPath);
      }
    });
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
}

function printReport() {
  console.log(chalk.bold.blue('\n🔒 Security Audit Report - Logging & Sensitive Data\n'));
  console.log(chalk.gray('='.repeat(80)));
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log(chalk.green.bold('\n✅ No security issues found!'));
    console.log(chalk.gray('Your codebase appears to be secure from logging-related vulnerabilities.'));
  } else {
    // Print critical issues
    if (issues.length > 0) {
      console.log(chalk.red.bold(`\n❌ Critical Issues Found: ${issues.length}`));
      console.log(chalk.gray('-'.repeat(40)));
      
      issues.forEach((issue, index) => {
        console.log(chalk.red.bold(`\n${index + 1}. ${issue.type} (${issue.severity})`));
        console.log(chalk.gray(`   File: ${issue.file}:${issue.line}`));
        console.log(chalk.yellow(`   Content: ${issue.content}`));
      });
    }
    
    // Print warnings
    if (warnings.length > 0) {
      console.log(chalk.yellow.bold(`\n⚠️  Warnings Found: ${warnings.length}`));
      console.log(chalk.gray('-'.repeat(40)));
      
      warnings.forEach((warning, index) => {
        console.log(chalk.yellow.bold(`\n${index + 1}. ${warning.type} (${warning.severity})`));
        console.log(chalk.gray(`   File: ${warning.file}:${warning.line}`));
        console.log(chalk.cyan(`   Content: ${warning.content}`));
      });
    }
    
    // Recommendations
    console.log(chalk.blue.bold('\n🔧 Recommendations:'));
    console.log(chalk.gray('-'.repeat(40)));
    
    if (issues.some(i => i.type === 'SENSITIVE_DATA')) {
      console.log(chalk.red('• Remove hardcoded credentials and secrets from code'));
      console.log(chalk.red('• Use environment variables for all sensitive data'));
      console.log(chalk.red('• Implement proper secret management'));
    }
    
    if (issues.some(i => i.type === 'CONSOLE_LOG')) {
      console.log(chalk.yellow('• Replace console.log with proper logging framework'));
      console.log(chalk.yellow('• Use production-safe logging methods'));
      console.log(chalk.yellow('• Implement structured logging'));
    }
    
    if (warnings.some(w => w.type === 'DEBUG_LOGGING')) {
      console.log(chalk.cyan('• Review debug logging for potential data exposure'));
      console.log(chalk.cyan('• Ensure debug logging is disabled in production'));
      console.log(chalk.cyan('• Use sanitized logging for sensitive operations'));
    }
  }
  
  console.log(chalk.gray('\n' + '='.repeat(80)));
  console.log(chalk.gray(`Scan completed at ${new Date().toISOString()}`));
}

// Main execution
console.log(chalk.blue.bold('🔒 Starting Security Audit - Logging & Sensitive Data...\n'));

const startTime = Date.now();
const projectRoot = path.resolve(__dirname, '..');

console.log(chalk.gray(`Scanning directory: ${projectRoot}`));
scanDirectory(projectRoot);

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

printReport();

console.log(chalk.gray(`\n⏱️  Scan completed in ${duration}s`));

// Exit with appropriate code
if (issues.length > 0) {
  console.log(chalk.red.bold('\n❌ Security audit failed! Please fix the issues above.'));
  process.exit(1);
} else if (warnings.length > 0) {
  console.log(chalk.yellow.bold('\n⚠️  Security audit passed with warnings.'));
  process.exit(0);
} else {
  console.log(chalk.green.bold('\n✅ Security audit passed!'));
  process.exit(0);
} 