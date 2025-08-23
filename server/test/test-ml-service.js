// Test file for AI Machine Learning Service
const AIMachineLearningService = require('./src/services/AIMachineLearningService');

async function testMLService() {
  try {
    console.log('🧪 Testing AI Machine Learning Service...\n');
    
    // Test service loading
    console.log('✅ Service loaded successfully');
    
    // Test initialization
    console.log('🔄 Initializing service...');
    await AIMachineLearningService.initialize();
    console.log('✅ Service initialized');
    
    // Test sentiment analysis
    console.log('\n🔍 Testing sentiment analysis...');
    const sentimentResult = await AIMachineLearningService.analyzeSentimentAdvanced(
      "I absolutely love this amazing product! It's fantastic and wonderful!"
    );
    console.log('Sentiment Result:', JSON.stringify(sentimentResult, null, 2));
    
    // Test topic classification
    console.log('\n🏷️ Testing topic classification...');
    const topicResult = await AIMachineLearningService.classifyTopicsAdvanced(
      "This software development project uses modern programming techniques and advanced algorithms"
    );
    console.log('Topic Result:', JSON.stringify(topicResult, null, 2));
    
    // Test content quality
    console.log('\n📊 Testing content quality assessment...');
    const qualityResult = await AIMachineLearningService.assessContentQualityAdvanced(
      "This is a well-structured article with clear headings, good examples, and comprehensive coverage of the topic."
    );
    console.log('Quality Result:', JSON.stringify(qualityResult, null, 2));
    
    // Test model metrics
    console.log('\n📈 Getting model metrics...');
    const metrics = await AIMachineLearningService.getModelMetrics();
    console.log('Model Metrics:', JSON.stringify(metrics, null, 2));
    
    console.log('\n🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testMLService(); 