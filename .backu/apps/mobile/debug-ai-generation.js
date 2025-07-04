#!/usr/bin/env node

/**
 * Standalone AI Generation Debugging Script
 * 
 * This script tests AI content generation without importing TypeScript modules
 * to avoid Node.js module resolution issues.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// ============================================================================
// ENVIRONMENT CHECKING
// ============================================================================

function checkEnvironment() {
  console.log('🔍 Environment Check');
  console.log('='.repeat(50));
  
  // Check for .env file
  const envPath = path.join(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);
  console.log(`📄 .env file: ${envExists ? '✅ Found' : '❌ Missing'}`);
  
  if (envExists) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log(`📄 .env size: ${envContent.length} bytes`);
    
    // Check for API keys (without revealing them)
    const hasOpenAI = envContent.includes('EXPO_PUBLIC_OPENAI_API_KEY=');
    const hasAnthropic = envContent.includes('EXPO_PUBLIC_ANTHROPIC_API_KEY=');
    
    console.log(`🔑 OpenAI API Key in .env: ${hasOpenAI ? '✅ Present' : '❌ Missing'}`);
    console.log(`🔑 Anthropic API Key in .env: ${hasAnthropic ? '✅ Present' : '❌ Missing'}`);
    
    if (hasOpenAI) {
      const openAIMatch = envContent.match(/EXPO_PUBLIC_OPENAI_API_KEY=(.+)/);
      if (openAIMatch) {
        const key = openAIMatch[1].trim();
        console.log(`🔑 OpenAI Key format: ${key.substring(0, 8)}...${key.substring(key.length - 4)} (${key.length} chars)`);
      }
    }
    
    if (hasAnthropic) {
      const anthropicMatch = envContent.match(/EXPO_PUBLIC_ANTHROPIC_API_KEY=(.+)/);
      if (anthropicMatch) {
        const key = anthropicMatch[1].trim();
        console.log(`🔑 Anthropic Key format: ${key.substring(0, 8)}...${key.substring(key.length - 4)} (${key.length} chars)`);
      }
    }
  }
  
  console.log('\n🌍 Process Environment Variables');
  console.log('='.repeat(50));
  
  const processOpenAI = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  const processAnthropic = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  
  console.log(`🔑 Process OpenAI: ${processOpenAI ? '✅ Available' : '❌ Not Available'}`);
  console.log(`🔑 Process Anthropic: ${processAnthropic ? '✅ Available' : '❌ Not Available'}`);
  
  if (processOpenAI) {
    console.log(`🔑 Process OpenAI format: ${processOpenAI.substring(0, 8)}...${processOpenAI.substring(processOpenAI.length - 4)} (${processOpenAI.length} chars)`);
  }
  
  if (processAnthropic) {
    console.log(`🔑 Process Anthropic format: ${processAnthropic.substring(0, 8)}...${processAnthropic.substring(processAnthropic.length - 4)} (${processAnthropic.length} chars)`);
  }
  
  return {
    envExists,
    hasOpenAI: !!processOpenAI,
    hasAnthropic: !!processAnthropic,
    openAIKey: processOpenAI,
    anthropicKey: processAnthropic
  };
}

// ============================================================================
// API TESTING
// ============================================================================

async function testOpenAI(apiKey) {
  console.log('\n🤖 Testing OpenAI API');
  console.log('='.repeat(50));
  
  try {
    // Using fetch instead of importing the OpenAI library
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Generate 1 simple civic education quiz question about voting rights with 4 options and explanation. Format as JSON with fields: question, options (array), correct_answer, explanation.'
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ OpenAI API Error: ${response.status} ${response.statusText}`);
      console.log(`❌ Error details: ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    
    const data = await response.json();
    console.log('✅ OpenAI API Response received');
    console.log(`📝 Content: ${data.choices[0].message.content.substring(0, 200)}...`);
    console.log(`💰 Usage: ${data.usage.total_tokens} tokens`);
    
    return { success: true, data };
    
  } catch (error) {
    console.log(`❌ OpenAI Test Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAnthropic(apiKey) {
  console.log('\n🧠 Testing Anthropic API');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: 'Generate 1 simple civic education quiz question about voting rights with 4 options and explanation. Format as JSON with fields: question, options (array), correct_answer, explanation.'
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Anthropic API Error: ${response.status} ${response.statusText}`);
      console.log(`❌ Error details: ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    
    const data = await response.json();
    console.log('✅ Anthropic API Response received');
    console.log(`📝 Content: ${data.content[0].text.substring(0, 200)}...`);
    console.log(`💰 Usage: ${data.usage.input_tokens + data.usage.output_tokens} tokens`);
    
    return { success: true, data };
    
  } catch (error) {
    console.log(`❌ Anthropic Test Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// CONTENT QUALITY DETECTION
// ============================================================================

function detectContentQuality(text) {
  console.log('\n🔍 Content Quality Analysis');
  console.log('='.repeat(50));
  
  // Common fallback/mock content indicators
  const fallbackIndicators = [
    'sample question',
    'example question',
    'placeholder',
    'lorem ipsum',
    'test question',
    'this is a sample',
    'this is an example',
    'mock data',
    'fallback content',
    'default content'
  ];
  
  // AI-generated content indicators
  const realContentIndicators = [
    'according to',
    'constitutional',
    'amendment',
    'legislation',
    'supreme court',
    'congress',
    'senate',
    'house of representatives',
    'federal',
    'democracy',
    'voting rights',
    'civil rights'
  ];
  
  const lowerText = text.toLowerCase();
  
  const fallbackCount = fallbackIndicators.filter(indicator => 
    lowerText.includes(indicator)
  ).length;
  
  const realContentCount = realContentIndicators.filter(indicator => 
    lowerText.includes(indicator)
  ).length;
  
  console.log(`🔍 Fallback indicators found: ${fallbackCount}`);
  console.log(`✅ Real content indicators found: ${realContentCount}`);
  
  const isLikelyReal = realContentCount > 2 && fallbackCount === 0;
  console.log(`📊 Content appears to be: ${isLikelyReal ? '✅ AI-Generated' : '❌ Fallback/Mock'}`);
  
  return {
    isLikelyReal,
    fallbackCount,
    realContentCount,
    confidence: isLikelyReal ? 'high' : 'low'
  };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🎯 CivicSense AI Generation Debug Tool');
  console.log('='.repeat(50));
  console.log('This tool tests AI generation without importing TypeScript modules\n');
  
  // Step 1: Check environment
  const env = checkEnvironment();
  
  if (!env.envExists) {
    console.log('\n❌ CRITICAL: No .env file found');
    console.log('Please create a .env file with your API keys');
    process.exit(1);
  }
  
  if (!env.hasOpenAI && !env.hasAnthropic) {
    console.log('\n❌ CRITICAL: No API keys available in process.env');
    console.log('This means environment variables are not being loaded properly');
    console.log('\n💡 Solutions:');
    console.log('1. Restart your Expo development server: npx expo start --clear');
    console.log('2. Check that your .env file is in the correct location');
    console.log('3. Verify API key formats are correct');
    process.exit(1);
  }
  
  // Step 2: Test APIs
  const results = [];
  
  if (env.hasOpenAI) {
    const openAIResult = await testOpenAI(env.openAIKey);
    results.push({ api: 'OpenAI', ...openAIResult });
    
    if (openAIResult.success) {
      const quality = detectContentQuality(openAIResult.data.choices[0].message.content);
      console.log(`🎯 OpenAI Content Quality: ${quality.confidence} confidence`);
    }
  }
  
  if (env.hasAnthropic) {
    const anthropicResult = await testAnthropic(env.anthropicKey);
    results.push({ api: 'Anthropic', ...anthropicResult });
    
    if (anthropicResult.success) {
      const quality = detectContentQuality(anthropicResult.data.content[0].text);
      console.log(`🎯 Anthropic Content Quality: ${quality.confidence} confidence`);
    }
  }
  
  // Step 3: Summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    console.log(`${result.api}: ${result.success ? '✅ Working' : '❌ Failed'}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const workingAPIs = results.filter(r => r.success).length;
  console.log(`\n🎯 Result: ${workingAPIs}/${results.length} APIs working`);
  
  if (workingAPIs === 0) {
    console.log('\n❌ NO APIs are working. This explains why the app shows fallback content.');
    console.log('\n💡 Next steps:');
    console.log('1. Check API key validity');
    console.log('2. Verify network connectivity');
    console.log('3. Check API rate limits');
  } else {
    console.log('\n✅ APIs are working. If you still see fallback content in the app:');
    console.log('1. The React Native environment might not have access to these variables');
    console.log('2. Check the app console for specific error messages');
    console.log('3. Try restarting the Expo development server');
  }
}

// Run the script
main().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
}); 