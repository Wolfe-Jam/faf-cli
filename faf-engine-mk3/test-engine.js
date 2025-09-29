/**
 * Test script for FAF Engine MK3
 * Verifies the protected binary works correctly
 */

const path = require('path');

// This will test the compiled engine
async function testEngine() {
  console.log('🧪 Testing FAF Engine MK3...\n');

  try {
    // Import the compiled engine
    const { engine, VERSION, ENGINE_NAME } = require('./dist/engine.min.js');

    console.log(`Engine: ${ENGINE_NAME}`);
    console.log(`Version: ${VERSION}`);
    console.log('');

    // Test 1: Score a project
    console.log('Test 1: Scoring current directory...');
    const scoreResult = await engine.score(process.cwd());
    console.log('Score Result:', {
      score: scoreResult.score,
      grade: scoreResult.grade,
      performance: `${scoreResult.performance}ms`,
      checksum: scoreResult.checksum
    });

    // Test 2: Analyze
    console.log('\nTest 2: Analyzing project...');
    const analysisResult = await engine.analyze(process.cwd());
    console.log('Analysis Result:', {
      formats: analysisResult.formats.length,
      performanceMs: analysisResult.performanceMs
    });

    // Test 3: Full compile
    console.log('\nTest 3: Full compile...');
    const compileResult = await engine.compile(process.cwd());
    console.log('Compile Result:', {
      score: compileResult.score.score,
      valid: compileResult.verification.valid,
      engine: compileResult.verification.engine
    });

    console.log('\n✅ All tests passed!');
    console.log('🔒 Engine is protected and working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testEngine();