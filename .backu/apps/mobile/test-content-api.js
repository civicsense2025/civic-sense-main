#!/usr/bin/env node

/**
 * CivicSense Content Generation API Test
 * 
 * Usage: node test-content-api.js "your topic here"
 * 
 * This script tests the UGC content generator directly to help debug
 * API responses and see detailed generation steps.
 */

const fs = require('fs');
const path = require('path');

// Mock environment for testing
global.process = global.process || {};
global.process.env = global.process.env || {};

// Set up required environment variables
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY environment variable is required');
  console.log('Set it with: export ANTHROPIC_API_KEY="your-api-key-here"');
  process.exit(1);
}

// Optional API keys for enhanced testing
const missingKeys = [];
if (!process.env.TAVILY_API_KEY) missingKeys.push('TAVILY_API_KEY');
if (!process.env.SERPAPI_KEY) missingKeys.push('SERPAPI_KEY');

if (missingKeys.length > 0) {
  console.log('⚠️  Optional API keys missing (will use fallback sources):');
  missingKeys.forEach(key => console.log(`   - ${key}`));
  console.log('');
}

// Import required modules
async function loadModules() {
  try {
    // Use dynamic imports to handle ES modules
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    
    // Try to import from the lib directory
    const UGCContentGenerator = require('./lib/ai/ugc-content-generator.js');
    return { UGCContentGenerator };
  } catch (error) {
    console.error('❌ Failed to load modules:', error.message);
    console.log('Make sure you\'re running this from the project root directory');
    process.exit(1);
  }
}

async function testContentGeneration(topic, questionCount = 5) {
  console.log('🚀 CivicSense Content Generation Test');
  console.log('=====================================');
  console.log(`📝 Topic: "${topic}"`);
  console.log(`🔢 Questions: ${questionCount}`);
  console.log(`⏰ Started: ${new Date().toLocaleString()}`);
  console.log('');

  try {
    const startTime = Date.now();
    
    // Initialize the content generator
    console.log('🔧 Initializing UGC Content Generator...');
    const { UGCContentGenerator } = await loadModules();
    const generator = new UGCContentGenerator();
    
    // Set up progress tracking
    let stepCount = 0;
    const progressCallback = (step, progress) => {
      stepCount++;
      console.log(`📊 Step ${stepCount}: ${step}`);
      if (progress && progress.sources) {
        console.log(`   📚 Sources found: ${progress.sources.length}`);
        progress.sources.slice(0, 3).forEach((source, i) => {
          console.log(`      ${i + 1}. ${source.title || source.url}`);
        });
      }
      if (progress && progress.message) {
        console.log(`   💡 ${progress.message}`);
      }
      console.log('');
    };

    // Generate content
    console.log('🎯 Starting content generation...');
    console.log('');
    
    const result = await generator.generateContent({
      topic: topic,
      questionCount: questionCount,
      difficulty: 'moderate',
      includeExplanations: true,
      onProgress: progressCallback
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('✅ Generation completed successfully!');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log('');

    // Display results
    console.log('📋 RESULTS SUMMARY');
    console.log('==================');
    console.log(`📚 Topic: ${result.topic_title || topic}`);
    console.log(`❓ Questions generated: ${result.questions?.length || 0}`);
    console.log(`🔍 Sources used: ${result.generation_metadata?.sources_used?.length || 0}`);
    console.log(`💯 Quality score: ${result.generation_metadata?.quality_score || 'N/A'}`);
    console.log('');

    // Show sources
    if (result.generation_metadata?.sources_used?.length > 0) {
      console.log('📖 SOURCES USED');
      console.log('===============');
      result.generation_metadata.sources_used.forEach((source, i) => {
        console.log(`${i + 1}. ${source.title}`);
        console.log(`   URL: ${source.url}`);
        console.log(`   Credibility: ${source.credibility_score || 'N/A'}`);
        console.log('');
      });
    }

    // Show sample questions
    if (result.questions?.length > 0) {
      console.log('❓ SAMPLE QUESTIONS');
      console.log('==================');
      result.questions.slice(0, 3).forEach((q, i) => {
        console.log(`${i + 1}. ${q.question}`);
        q.options?.forEach((option, oi) => {
          const marker = oi === q.correct_answer ? '✓' : ' ';
          console.log(`   ${String.fromCharCode(65 + oi)}. [${marker}] ${option}`);
        });
        if (q.explanation) {
          console.log(`   💡 ${q.explanation.substring(0, 100)}...`);
        }
        console.log('');
      });
    }

    // Show debug prompt if available
    if (result.generation_metadata?.debug_prompt) {
      console.log('🔍 DEBUG: AI PROMPT USED');
      console.log('========================');
      console.log(result.generation_metadata.debug_prompt.substring(0, 500) + '...');
      console.log('');
    }

    // Save results to file
    const outputFile = `test-results-${Date.now()}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`💾 Full results saved to: ${outputFile}`);

    return result;

  } catch (error) {
    console.error('❌ Content generation failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    
    if (error.message.includes('API key')) {
      console.log('');
      console.log('💡 Troubleshooting:');
      console.log('   - Check your ANTHROPIC_API_KEY is set correctly');
      console.log('   - Make sure the API key has web search permissions');
      console.log('   - Verify your Anthropic account has Claude access');
    }
    
    if (error.message.includes('web search')) {
      console.log('');
      console.log('💡 Web Search Issues:');
      console.log('   - Web search needs to be enabled in Anthropic Console');
      console.log('   - Some API keys don\'t have web search access yet');
      console.log('   - Try running with TAVILY_API_KEY or SERPAPI_KEY as fallback');
    }

    process.exit(1);
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🎯 CivicSense Content API Test Tool');
    console.log('');
    console.log('Usage:');
    console.log('  node test-content-api.js "your topic here"');
    console.log('  node test-content-api.js "your topic here" 10');
    console.log('');
    console.log('Examples:');
    console.log('  node test-content-api.js "How does gerrymandering affect elections?"');
    console.log('  node test-content-api.js "Supreme Court decision making process" 15');
    console.log('  node test-content-api.js "Congressional committee system"');
    console.log('');
    console.log('Environment Variables Required:');
    console.log('  ANTHROPIC_API_KEY - Your Anthropic API key');
    console.log('');
    console.log('Optional (for enhanced source gathering):');
    console.log('  TAVILY_API_KEY - Tavily search API key');
    console.log('  SERPAPI_KEY - SerpAPI key');
    console.log('');
    process.exit(0);
  }

  const topic = args[0];
  const questionCount = args[1] ? parseInt(args[1]) : 5;

  if (!topic || topic.trim().length < 3) {
    console.error('❌ Error: Topic must be at least 3 characters long');
    process.exit(1);
  }

  if (questionCount < 1 || questionCount > 25) {
    console.error('❌ Error: Question count must be between 1 and 25');
    process.exit(1);
  }

  await testContentGeneration(topic, questionCount);
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testContentGeneration }; 