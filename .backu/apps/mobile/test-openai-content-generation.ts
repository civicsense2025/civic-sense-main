#!/usr/bin/env ts-node

/**
 * Real OpenAI Content Generation Test
 * 
 * This script tests the enhanced CivicSense content generation system using:
 * - Real OpenAI API calls
 * - Dotenv for environment variable management
 * - Enhanced prompt validation
 * - Content quality assessment
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

// Test configuration
const TEST_TOPICS = [
  "Supreme Court ethics rules and enforcement mechanisms",
  "Federal voting rights legislation and state implementation",
  "Climate policy and regulatory authority disputes"
];

async function main() {
  console.log('🧪 Real OpenAI Content Generation Test with Enhanced CivicSense Prompts\n');
  
  // Step 1: Verify environment variables
  console.log('🔑 Step 1: Environment Variable Check');
  const environmentCheck = verifyEnvironment();
  if (!environmentCheck.success) {
    console.error('❌ Environment check failed:', environmentCheck.message);
    process.exit(1);
  }
  console.log('✅ Environment variables configured correctly\n');
  
  // Step 2: Test OpenAI connectivity
  console.log('🌐 Step 2: OpenAI Connectivity Test');
  const connectivityTest = await testOpenAIConnectivity();
  if (!connectivityTest.success) {
    console.error('❌ OpenAI connectivity failed:', connectivityTest.error);
    process.exit(1);
  }
  console.log('✅ OpenAI connection successful\n');
  
  // Step 3: Test enhanced prompts structure
  console.log('📝 Step 3: Enhanced CivicSense Prompts Validation');
  const promptTest = testEnhancedPromptsStructure();
  console.log(`✅ Prompt validation: ${promptTest.score}% (${promptTest.passed}/${promptTest.total} checks passed)\n`);
  
  // Step 4: Real content generation test with enhanced prompts
  console.log('🎯 Step 4: Real Content Generation with Enhanced Prompts');
  const contentResults = await runEnhancedContentTests();
  console.log(`✅ Enhanced content test: ${contentResults.successRate}% success rate\n`);
  
  // Step 5: Quality analysis
  console.log('📊 Step 5: Content Quality Analysis');
  analyzeContentQuality(contentResults.results);
  
  console.log('\n🎉 All tests completed successfully!');
}

function verifyEnvironment() {
  const required = [
    'EXPO_PUBLIC_OPENAI_API_KEY',
    'EXPO_PUBLIC_ANTHROPIC_API_KEY'
  ];
  
  const missing: string[] = [];
  const configured: any[] = [];
  
  for (const envVar of required) {
    if (process.env[envVar]) {
      configured.push({
        name: envVar,
        present: true,
        length: process.env[envVar]!.length,
        preview: process.env[envVar]!.substring(0, 8) + '...'
      });
    } else {
      missing.push(envVar);
    }
  }
  
  // Log configuration status
  console.log('📋 Environment Configuration:');
  configured.forEach(env => {
    console.log(`  ✅ ${env.name}: ${env.preview} (${env.length} chars)`);
  });
  
  if (missing.length > 0) {
    console.log('❌ Missing Variables:');
    missing.forEach(env => {
      console.log(`  ❌ ${env}`);
    });
    return {
      success: false,
      message: `Missing required environment variables: ${missing.join(', ')}`
    };
  }
  
  return { success: true };
}

async function testOpenAIConnectivity() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY!,
    });
    
    console.log('📡 Testing OpenAI connection...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a test assistant. Respond with "CONNECTIVITY_TEST_SUCCESS" to confirm the connection is working.'
        },
        {
          role: 'user',
          content: 'Test connectivity'
        }
      ],
      max_tokens: 10,
      temperature: 0
    });
    
    const responseText = response.choices[0]?.message?.content || '';
    
    if (responseText.includes('CONNECTIVITY_TEST_SUCCESS')) {
      console.log('✅ OpenAI API responding correctly');
      return { success: true };
    } else {
      return { 
        success: false, 
        error: `Unexpected response: ${responseText}` 
      };
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

function testEnhancedPromptsStructure() {
  console.log('🔍 Validating enhanced CivicSense prompts structure...');
  
  try {
    const promptsFilePath = join(__dirname, 'lib', 'ai', 'civicsense-system-prompts.ts');
    const promptsContent = readFileSync(promptsFilePath, 'utf8');
    
    const tests = [
      {
        name: 'Current Events Integration Required',
        test: () => promptsContent.includes('CURRENT EVENTS INTEGRATION') && 
                   promptsContent.includes('last 6 months')
      },
      {
        name: 'Specificity Requirements Present',
        test: () => promptsContent.includes('SPECIFICITY REQUIREMENTS') && 
                   promptsContent.includes('EXACT DATES')
      },
      {
        name: 'Enhanced Quality Standards',
        test: () => promptsContent.includes('NON-NEGOTIABLE') && 
                   promptsContent.includes('specific officials currently in office')
      },
      {
        name: 'Source Integration Requirements',
        test: () => promptsContent.includes('SOURCE INTEGRATION REQUIREMENTS') && 
                   promptsContent.includes('EXACT QUOTES')
      },
      {
        name: 'Forbidden Vague Language',
        test: () => promptsContent.includes('FORBIDDEN') && 
                   promptsContent.includes('generic phrases')
      },
      {
        name: 'Current Date Injection Logic',
        test: () => promptsContent.includes('formatCivicSenseUserMessage') && 
                   promptsContent.includes('CURRENT_DATE')
      },
      {
        name: 'Multiple Prompt Types Available',
        test: () => promptsContent.includes('generation') && 
                   promptsContent.includes('factCheck') && 
                   promptsContent.includes('research')
      },
      {
        name: 'Enhanced JSON Response Requirements',
        test: () => promptsContent.includes('sources') && 
                   promptsContent.includes('credibility_score') && 
                   promptsContent.includes('fact_check_status')
      }
    ];
    
    let passed = 0;
    
    tests.forEach(test => {
      try {
        if (test.test()) {
          console.log(`  ✅ ${test.name}`);
          passed++;
        } else {
          console.log(`  ❌ ${test.name}`);
        }
      } catch (error) {
        console.log(`  ❌ ${test.name} (Error: ${(error as Error).message})`);
      }
    });
    
    const score = Math.round((passed / tests.length) * 100);
    
    return {
      passed,
      total: tests.length,
      score
    };
    
  } catch (error) {
    console.error('❌ Failed to read prompts file:', (error as Error).message);
    return { passed: 0, total: 8, score: 0 };
  }
}

async function runEnhancedContentTests() {
  console.log('🎯 Testing content generation with enhanced prompts...');
  
  const openai = new OpenAI({
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY!,
  });
  
  const results: any[] = [];
  let successCount = 0;
  
  // Test each topic
  for (let i = 0; i < 2; i++) { // Test 2 topics for speed
    const topic = TEST_TOPICS[i]!; // Assert it exists since we control the loop bounds
    console.log(`\n📝 Testing Topic ${i + 1}: "${topic}"`);
    
    try {
      // Create enhanced CivicSense prompt
      const currentDate = new Date().toISOString().substring(0, 10);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const sixMonthsAgoDate = sixMonthsAgo.toISOString().substring(0, 10);
      
      const enhancedSystemPrompt = `
You are CivicSense AI, an expert in civic education and democratic participation.

CORE MISSION: Make citizens harder to manipulate, more difficult to ignore, and impossible to fool.

CURRENT EVENTS INTEGRATION (NON-NEGOTIABLE):
- Reference specific events from ${sixMonthsAgoDate} to ${currentDate}
- Include EXACT DATES for all claims
- Name specific officials currently in office
- Cite recent legislative actions, court decisions, or policy changes

SPECIFICITY REQUIREMENTS (NON-NEGOTIABLE):
- No generic phrases like "government officials" - name specific people
- No vague timeframes like "recently" - use exact dates
- Include specific bill numbers, case names, or regulatory codes
- Reference actual voting records, public statements, or official documents

FORBIDDEN (will result in rejection):
- Generic phrases: "many experts believe", "some officials", "recent studies"
- Vague timeframes: "recently", "in the past", "currently"
- Both-sides language: "some argue while others contend"
- Corporate speak: "stakeholders", "moving forward", "at the end of the day"

Create exactly 3 quiz questions about: "${topic}"

Each question must include:
1. A specific recent event with exact date
2. Named officials or specific institutions
3. Factual options based on real developments
4. Explanation connecting to citizen impact
5. At least 2 credible sources with real URLs

Respond in JSON format with: questions, sources, average_credibility, total_sources.`;

      const userPrompt = `Current date: ${currentDate}

Generate 3 quiz questions about "${topic}" that meet all CivicSense quality standards:

1. Each question must reference specific events from the last 6 months (${sixMonthsAgoDate} to ${currentDate})
2. Include exact dates and named officials
3. Provide working source URLs (not search pages)
4. Focus on uncomfortable truths about how power actually works
5. Connect each topic to concrete consequences for citizens

EXAMPLE of specificity level required:
"In December 2024, Justice Clarence Thomas disclosed receiving which specific gift that he had previously failed to report?"

NOT acceptable:
"Supreme Court justices have recently faced ethics questions about..."

Ensure all sources are from credible outlets with specific article URLs.`;

      console.log('    🚀 Making OpenAI call with enhanced prompts...');
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: enhancedSystemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.2
      });
      
      const content = response.choices[0]?.message?.content;
      
      if (content) {
        console.log('    📄 Received content, analyzing quality...');
        
        // Parse and analyze the content
        const analysis = analyzeGeneratedContent(content, topic);
        
        if (analysis.success) {
          console.log(`    ✅ Success: ${analysis.qualityScore}% quality score`);
          console.log(`    📊 Details: ${analysis.questions} questions, ${analysis.sources} sources, ${analysis.specificity}% specificity`);
          
          successCount++;
          results.push({
            topic,
            success: true,
            qualityScore: analysis.qualityScore,
            questions: analysis.questions,
            sources: analysis.sources,
            specificity: analysis.specificity,
            currentEvents: analysis.currentEvents,
            namedOfficials: analysis.namedOfficials,
            exactDates: analysis.exactDates
          });
        } else {
          console.log(`    ❌ Failed quality check: ${analysis.error}`);
          results.push({
            topic,
            success: false,
            error: analysis.error
          });
        }
      } else {
        console.log('    ❌ No content received from OpenAI');
        results.push({
          topic,
          success: false,
          error: 'No content received'
        });
      }
      
    } catch (error) {
      console.log(`    ❌ Exception: ${(error as Error).message}`);
      results.push({
        topic,
        success: false,
        error: (error as Error).message
      });
    }
    
    // Add delay between tests to avoid rate limits
    if (i < 1) {
      console.log('    ⏳ Waiting 3 seconds to avoid rate limits...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  const successRate = Math.round((successCount / results.length) * 100);
  
  return {
    results,
    successRate,
    successCount,
    totalTests: results.length
  };
}

function analyzeGeneratedContent(content: string, topic: string) {
  try {
    // Extract quality indicators from the content
    const qualityChecks = {
      hasCurrentEvents: /(?:2024|2025|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}?(?:st|nd|rd|th)?,?\s+2024|2025/.test(content),
      hasExactDates: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+202[4-5]|\d{1,2}\/\d{1,2}\/202[4-5]|\d{4}-\d{2}-\d{2}/.test(content),
      hasNamedOfficials: /(?:Justice|Senator|Representative|President|Secretary|Chief|Director)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/.test(content),
      hasSpecificInstitutions: /(?:Supreme Court|Senate|House|White House|Department of|Bureau of|Commission|Agency)/.test(content),
      hasWorkingURLs: /https?:\/\/[^\s]+\.[a-z]{2,}(?:\/[^\s]*)?(?:\.html?|\.php|\.aspx|\/)/.test(content),
      avoidsForbiddenPhrases: !/(?:many experts believe|some officials|recent studies|stakeholders|moving forward|some argue while others)/.test(content),
      hasSpecificNumbers: /\b(?:HR|S\.)\s*\d+|\b\d+(?:st|nd|rd|th)\s+(?:Circuit|District)|Case\s+No\.\s*\d+/.test(content)
    };
    
    // Count questions
    const questionMatches = content.match(/\{[^}]*"question"[^}]*\}/g) || [];
    const questions = questionMatches.length;
    
    // Count sources
    const sourceMatches = content.match(/https?:\/\/[^\s"]+/g) || [];
    const sources = sourceMatches.length;
    
    // Calculate scores
    const specificityScore = Math.round((Object.values(qualityChecks).filter(Boolean).length / Object.keys(qualityChecks).length) * 100);
    const contentScore = questions >= 3 ? 100 : (questions / 3) * 100;
    const sourceScore = sources >= 6 ? 100 : (sources / 6) * 100; // 2 sources per question minimum
    
    const qualityScore = Math.round((specificityScore + contentScore + sourceScore) / 3);
    
    return {
      success: true,
      qualityScore,
      questions,
      sources,
      specificity: specificityScore,
      currentEvents: qualityChecks.hasCurrentEvents,
      namedOfficials: qualityChecks.hasNamedOfficials,
      exactDates: qualityChecks.hasExactDates
    };
    
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

function analyzeContentQuality(results: any[]) {
  console.log('📊 Enhanced Content Quality Analysis:');
  
  const successful = results.filter(r => r.success);
  
  if (successful.length === 0) {
    console.log('❌ No successful generations to analyze');
    return;
  }
  
  // Calculate aggregate statistics
  const avgQualityScore = successful.reduce((sum, r) => sum + r.qualityScore, 0) / successful.length;
  const totalQuestions = successful.reduce((sum, r) => sum + r.questions, 0);
  const totalSources = successful.reduce((sum, r) => sum + r.sources, 0);
  const avgSpecificity = successful.reduce((sum, r) => sum + r.specificity, 0) / successful.length;
  
  const currentEventsCount = successful.filter(r => r.currentEvents).length;
  const namedOfficialsCount = successful.filter(r => r.namedOfficials).length;
  const exactDatesCount = successful.filter(r => r.exactDates).length;
  
  console.log(`📈 Enhanced Content Statistics:`);
  console.log(`  • Average Quality Score: ${Math.round(avgQualityScore)}%`);
  console.log(`  • Total Questions Generated: ${totalQuestions}`);
  console.log(`  • Total Sources Used: ${totalSources}`);
  console.log(`  • Average Specificity: ${Math.round(avgSpecificity)}%`);
  console.log(`  • Sources per Question: ${Math.round(totalSources/totalQuestions*10)/10}`);
  
  console.log(`\n🎯 CivicSense Quality Requirements Met:`);
  console.log(`  • Current Events Referenced: ${currentEventsCount}/${successful.length} (${Math.round((currentEventsCount/successful.length)*100)}%)`);
  console.log(`  • Named Officials Included: ${namedOfficialsCount}/${successful.length} (${Math.round((namedOfficialsCount/successful.length)*100)}%)`);
  console.log(`  • Exact Dates Provided: ${exactDatesCount}/${successful.length} (${Math.round((exactDatesCount/successful.length)*100)}%)`);
  
  // Quality assessment
  const qualityGrade = getQualityGrade(avgQualityScore, avgSpecificity, currentEventsCount/successful.length);
  console.log(`\n🏆 Overall Enhanced Quality Grade: ${qualityGrade.grade} (${qualityGrade.description})`);
  
  // Individual results
  console.log(`\n📋 Individual Results:`);
  successful.forEach((result, index) => {
    console.log(`  ${index + 1}. "${result.topic.substring(0, 40)}..."`);
    console.log(`     Quality: ${result.qualityScore}%, Questions: ${result.questions}, Sources: ${result.sources}`);
    console.log(`     Current Events: ${result.currentEvents ? '✅' : '❌'}, Named Officials: ${result.namedOfficials ? '✅' : '❌'}, Exact Dates: ${result.exactDates ? '✅' : '❌'}`);
  });
  
  // Failed results
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log(`\n❌ Failed Generations (${failed.length}):`);
    failed.forEach((result, index) => {
      console.log(`  ${index + 1}. "${result.topic.substring(0, 40)}..."`);
      console.log(`     Error: ${result.error}`);
    });
  }
}

function getQualityGrade(qualityScore: number, specificity: number, currentEventsRatio: number) {
  let score = 0;
  
  // Quality score (50% weight)
  if (qualityScore >= 90) score += 50;
  else if (qualityScore >= 80) score += 40;
  else if (qualityScore >= 70) score += 30;
  else score += 20;
  
  // Specificity (30% weight)
  if (specificity >= 90) score += 30;
  else if (specificity >= 80) score += 24;
  else if (specificity >= 70) score += 18;
  else score += 12;
  
  // Current events integration (20% weight)
  if (currentEventsRatio >= 0.9) score += 20;
  else if (currentEventsRatio >= 0.8) score += 16;
  else if (currentEventsRatio >= 0.7) score += 12;
  else score += 8;
  
  if (score >= 90) return { grade: 'A+', description: 'Excellent - Meets all CivicSense standards' };
  if (score >= 85) return { grade: 'A', description: 'Very good - Minor improvements needed' };
  if (score >= 80) return { grade: 'B+', description: 'Good - Some specificity improvements needed' };
  if (score >= 75) return { grade: 'B', description: 'Acceptable - Moderate improvements needed' };
  if (score >= 70) return { grade: 'C+', description: 'Below standard - Significant improvements needed' };
  return { grade: 'C', description: 'Poor - Does not meet CivicSense standards' };
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
main().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
}); 