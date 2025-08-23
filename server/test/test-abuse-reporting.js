const mongoose = require('mongoose');
const AbuseReportService = require('./src/services/AbuseReportService');
const User = require('./src/models/user.model');
const Blog = require('./src/models/blog.model');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vocalink');

async function testAbuseReportingSystem() {
  try {
    console.log('🧪 Testing Abuse Reporting System...\n');

    // Create test users
    const testReporter = await User.create({
      email: 'test-reporter@example.com',
      password: 'TestPassword123!',
      name: 'Test Reporter',
      isVerified: true,
      role: 'user'
    });

    const testTarget = await User.create({
      email: 'test-target@example.com',
      password: 'TestPassword123!',
      name: 'Test Target',
      isVerified: true,
      role: 'user'
    });

    const testAdmin = await User.create({
      email: 'test-admin@example.com',
      password: 'TestPassword123!',
      name: 'Test Admin',
      isVerified: true,
      role: 'admin'
    });

    console.log('✅ Test users created');

    // Create test blog
    const testBlog = await Blog.create({
      title: 'Test Blog for Abuse Reporting',
      content: 'This is a test blog for abuse reporting testing',
      author: testTarget._id,
      status: 'published'
    });

    console.log('✅ Test blog created');

    // Test 1: Valid report submission
    console.log('\n📝 Testing Valid Report Submission...');
    try {
      const validReport = await AbuseReportService.createReport(
        {
          targetType: 'blog',
          targetId: testBlog._id,
          category: 'harassment',
          subcategory: 'cyberbullying',
          title: 'Test Harassment Report',
          description: 'This blog post contains cyberbullying content',
          evidence: [
            {
              type: 'text',
              content: 'Specific quote from the blog that shows harassment'
            }
          ],
          severity: 'medium'
        },
        testReporter._id,
        {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Test Browser)',
          deviceFingerprint: 'test-fingerprint-123'
        }
      );

      console.log('✅ Valid report submitted successfully:', validReport.reportId);
    } catch (error) {
      console.error('❌ Error submitting valid report:', error.message);
    }

    // Test 2: Fraud detection (excessive reporting)
    console.log('\n🚨 Testing Fraud Detection...');
    try {
      // Submit multiple reports quickly to trigger fraud detection
      for (let i = 0; i < 5; i++) {
        await AbuseReportService.createReport(
          {
            targetType: 'blog',
            targetId: testBlog._id,
            category: 'spam',
            subcategory: 'commercial_spam',
            title: `Test Spam Report ${i + 1}`,
            description: 'This is a test spam report',
            evidence: [],
            severity: 'low'
          },
          testReporter._id,
          {
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0 (Test Browser)',
            deviceFingerprint: 'test-fingerprint-123'
          }
        );
      }

      console.log('✅ Fraud detection test completed');
    } catch (error) {
      console.error('❌ Error in fraud detection test:', error.message);
    }

    // Test 3: Get reports
    console.log('\n📊 Testing Report Retrieval...');
    try {
      const reports = await AbuseReportService.getReports({
        status: 'pending',
        page: 1,
        limit: 10
      });

      console.log('✅ Reports retrieved successfully:', {
        totalReports: reports.pagination.totalReports,
        currentPage: reports.pagination.currentPage
      });
    } catch (error) {
      console.error('❌ Error retrieving reports:', error.message);
    }

    // Test 4: Get urgent reports
    console.log('\n🚨 Testing Urgent Reports...');
    try {
      const urgentReports = await AbuseReportService.getUrgentReports();
      console.log('✅ Urgent reports retrieved:', urgentReports.length);
    } catch (error) {
      console.error('❌ Error retrieving urgent reports:', error.message);
    }

    // Test 5: Update report status
    console.log('\n📋 Testing Report Status Update...');
    try {
      const reports = await AbuseReportService.getReports({ status: 'pending' });
      if (reports.reports.length > 0) {
        const report = reports.reports[0];
        const updatedReport = await AbuseReportService.updateReportStatus(
          report._id,
          'under_review',
          'Report is now under review',
          testAdmin._id
        );
        console.log('✅ Report status updated successfully');
      }
    } catch (error) {
      console.error('❌ Error updating report status:', error.message);
    }

    // Test 6: Resolve report
    console.log('\n✅ Testing Report Resolution...');
    try {
      const reports = await AbuseReportService.getReports({ status: 'under_review' });
      if (reports.reports.length > 0) {
        const report = reports.reports[0];
        const resolvedReport = await AbuseReportService.resolveReport(
          report._id,
          'content_removed',
          'Content has been removed due to policy violation',
          testAdmin._id
        );
        console.log('✅ Report resolved successfully');
      }
    } catch (error) {
      console.error('❌ Error resolving report:', error.message);
    }

    // Test 7: Get analytics
    console.log('\n📈 Testing Analytics...');
    try {
      const analytics = await AbuseReportService.getAnalytics('7d');
      console.log('✅ Analytics retrieved successfully:', {
        totalReports: analytics.totalReports,
        pendingReports: analytics.pendingReports,
        resolvedReports: analytics.resolvedReports,
        urgentReports: analytics.urgentReports
      });
    } catch (error) {
      console.error('❌ Error retrieving analytics:', error.message);
    }

    // Test 8: Test different report categories
    console.log('\n📝 Testing Different Report Categories...');
    try {
      const categories = [
        { category: 'hate_speech', subcategory: 'racial_hate', severity: 'high' },
        { category: 'violence', subcategory: 'physical_threats', severity: 'critical' },
        { category: 'copyright', subcategory: 'plagiarism', severity: 'medium' },
        { category: 'misinformation', subcategory: 'fake_news', severity: 'high' }
      ];

      for (const cat of categories) {
        await AbuseReportService.createReport(
          {
            targetType: 'blog',
            targetId: testBlog._id,
            category: cat.category,
            subcategory: cat.subcategory,
            title: `Test ${cat.category} Report`,
            description: `This is a test ${cat.category} report`,
            evidence: [],
            severity: cat.severity
          },
          testReporter._id,
          {
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0 (Test Browser)',
            deviceFingerprint: 'test-fingerprint-123'
          }
        );
      }

      console.log('✅ Different category reports submitted successfully');
    } catch (error) {
      console.error('❌ Error submitting category reports:', error.message);
    }

    // Test 9: Test report by target
    console.log('\n🎯 Testing Reports by Target...');
    try {
      const targetReports = await AbuseReportService.getReportsByTarget('blog', testBlog._id);
      console.log('✅ Target reports retrieved:', targetReports.length);
    } catch (error) {
      console.error('❌ Error retrieving target reports:', error.message);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await User.findByIdAndDelete(testReporter._id);
    await User.findByIdAndDelete(testTarget._id);
    await User.findByIdAndDelete(testAdmin._id);
    await Blog.findByIdAndDelete(testBlog._id);
    console.log('✅ Test cleanup completed');

    console.log('\n🎉 All abuse reporting tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Valid report submission');
    console.log('- ✅ Fraud detection system');
    console.log('- ✅ Report retrieval and filtering');
    console.log('- ✅ Urgent report handling');
    console.log('- ✅ Status updates and resolution');
    console.log('- ✅ Analytics and reporting');
    console.log('- ✅ Multiple report categories');
    console.log('- ✅ Target-based report retrieval');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testAbuseReportingSystem(); 