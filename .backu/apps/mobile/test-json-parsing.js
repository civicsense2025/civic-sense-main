#!/usr/bin/env node

/**
 * Test script to verify enhanced JSON parsing handles problematic AI outputs
 * Tests various edge cases that commonly cause "Unexpected character: `" errors
 */

// Simulate the enhanced parseJSON method
function simulateEnhancedCleaning(rawContent) {
  let cleanedContent = rawContent
    .replace(/^```json\s*/gi, '') // Remove markdown code blocks
    .replace(/```\s*$/gi, '') // Remove closing markdown blocks
    .replace(/^```\s*/gi, '') // Remove any remaining opening blocks
    .replace(/`{3,}/g, '') // Remove any triple backticks or more
    .replace(/`+/g, '') // Remove ALL backticks (single, double, etc.)
    .replace(/^Here's.*?:/i, '') // Remove explanation prefixes
    .replace(/^The JSON.*?:/i, '') // Remove explanation prefixes
    .replace(/^I'll.*?:/i, '') // Remove "I'll generate..." prefixes
    .replace(/^Based on.*?:/i, '') // Remove "Based on..." prefixes
    .replace(/Here is the.*?:/i, '') // Remove "Here is the..." prefixes
    .replace(/This is the.*?:/i, '') // Remove "This is the..." prefixes
    .trim();

  // More aggressive content extraction
  const firstBraceIndex = cleanedContent.indexOf('{');
  if (firstBraceIndex > 0) {
    cleanedContent = cleanedContent.substring(firstBraceIndex);
  }

  const lastBraceIndex = cleanedContent.lastIndexOf('}');
  if (lastBraceIndex >= 0 && lastBraceIndex < cleanedContent.length - 1) {
    cleanedContent = cleanedContent.substring(0, lastBraceIndex + 1);
  }

  // Extract JSON from mixed content
  const jsonMatch = cleanedContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (jsonMatch) {
    cleanedContent = jsonMatch[0];
  }

  return cleanedContent;
}

function testJSONParsing(testName, problematicContent) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log(`📝 Original length: ${problematicContent.length}`);
  console.log(`📝 Has backticks: ${problematicContent.includes('`')}`);
  console.log(`📝 Has markdown: ${problematicContent.includes('```')}`);
  
  try {
    // Try original parsing
    JSON.parse(problematicContent);
    console.log('✅ Original content parses successfully (no cleaning needed)');
    return true;
  } catch (originalError) {
    console.log(`❌ Original parsing failed: ${originalError.message}`);
    
    try {
      // Try with enhanced cleaning
      const cleaned = simulateEnhancedCleaning(problematicContent);
      console.log(`🔧 Cleaned length: ${cleaned.length}`);
      console.log(`🔧 Cleaned preview: ${cleaned.substring(0, 100)}...`);
      
      const parsed = JSON.parse(cleaned);
      console.log('✅ Enhanced cleaning successful!');
      console.log(`📊 Parsed object has ${Object.keys(parsed).length} top-level properties`);
      
      if (parsed.questions && Array.isArray(parsed.questions)) {
        console.log(`📊 Found ${parsed.questions.length} questions`);
      }
      
      return true;
    } catch (cleanError) {
      console.log(`❌ Enhanced cleaning failed: ${cleanError.message}`);
      return false;
    }
  }
}

// Test cases that commonly cause JSON parsing errors
const testCases = [
  {
    name: 'Markdown Code Block Wrapper',
    content: `\`\`\`json
{
  "topic": "Supreme Court Rulings",
  "description": "Analysis of recent Supreme Court decisions",
  "questions": [
    {
      "id": "q1",
      "question": "What was the reasoning behind the Court's decision?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "The Court based its decision on precedent.",
      "difficulty": "medium",
      "sources": [],
      "fact_check_status": "verified",
      "civic_relevance_score": 85
    }
  ],
  "total_sources": 1,
  "average_credibility": 85,
  "fact_check_summary": "Content verified"
}
\`\`\``
  },
  
  {
    name: 'Backticks Inside JSON Strings',
    content: `{
  "topic": "Government \`Transparency\` Issues",
  "description": "How \`classified\` information affects democracy",
  "questions": [
    {
      "id": "q1",
      "question": "What \`role\` does transparency play?",
      "options": ["High \`impact\`", "Medium \`impact\`", "Low \`impact\`", "No \`impact\`"],
      "correct_answer": "High \`impact\`",
      "explanation": "Transparency is \`crucial\` for democracy.",
      "difficulty": "medium",
      "sources": [],
      "fact_check_status": "verified",
      "civic_relevance_score": 90
    }
  ],
  "total_sources": 1,
  "average_credibility": 90,
  "fact_check_summary": "All \`content\` verified"
}`
  },
  
  {
    name: 'AI Explanation Prefix',
    content: `Here's the JSON response for your civic education content:

{
  "topic": "Congressional Oversight",
  "description": "Understanding how Congress monitors executive branch",
  "questions": [
    {
      "id": "q1",
      "question": "What powers does Congress have for oversight?",
      "options": ["Subpoena power", "Funding control", "Impeachment", "All of the above"],
      "correct_answer": "All of the above",
      "explanation": "Congress has multiple oversight mechanisms.",
      "difficulty": "hard",
      "sources": [],
      "fact_check_status": "verified",
      "civic_relevance_score": 95
    }
  ],
  "total_sources": 1,
  "average_credibility": 95,
  "fact_check_summary": "Thoroughly fact-checked"
}`
  },
  
  {
    name: 'Multiple Backtick Types',
    content: `I'll generate the content for you:

\`\`\`json
{
  "topic": "Voting \`Rights\` and \`\`Access\`\`",
  "description": "Examining \`\`\`voting\`\`\` accessibility issues",
  "questions": [
    {
      "id": "q1", 
      "question": "How do \`voting laws\` affect \`\`participation\`\`?",
      "options": ["Increase \`access\`", "Limit \`access\`", "No \`\`effect\`\`", "Mixed \`\`\`results\`\`\`"],
      "correct_answer": "Mixed \`\`\`results\`\`\`",
      "explanation": "Voting laws have \`complex\` effects on \`\`participation rates\`\`.",
      "difficulty": "medium",
      "sources": [],
      "fact_check_status": "verified", 
      "civic_relevance_score": 88
    }
  ],
  "total_sources": 1,
  "average_credibility": 88,
  "fact_check_summary": "Content \`verified\` through multiple \`\`sources\`\`"
}
\`\`\`

This content meets CivicSense standards.`
  },
  
  {
    name: 'Incomplete JSON with Backticks',
    content: `\`\`\`json
{
  "topic": "Federal Budget Process",
  "description": "How \`Congress\` controls \`spending\`",
  "questions": [
    {
      "id": "q1",
      "question": "Who has \`power of the purse\`?",
      "options": ["President", "Congress", "Supreme Court", "Federal Reserve"],
      "correct_answer": "Congress",
      "explanation": "Article I gives Congress \`budget authority\`"
      // Missing closing structures`
  },
  
  {
    name: 'Extra Text After JSON',
    content: `{
  "topic": "Presidential Powers",
  "description": "Executive authority limits and scope",
  "questions": [
    {
      "id": "q1",
      "question": "What are executive orders?",
      "options": ["Laws", "Directives", "Suggestions", "Recommendations"],
      "correct_answer": "Directives",
      "explanation": "Executive orders are presidential directives with legal force.",
      "difficulty": "easy",
      "sources": [],
      "fact_check_status": "verified",
      "civic_relevance_score": 80
    }
  ],
  "total_sources": 1,
  "average_credibility": 80,
  "fact_check_summary": "Standard verification completed"
}

Additional context: This content was generated using verified sources and follows CivicSense guidelines.`
  }
];

console.log('🧪 Testing Enhanced JSON Parsing for UGC Content Generator');
console.log('=' * 60);

let passedTests = 0;
let totalTests = testCases.length;

for (const testCase of testCases) {
  if (testJSONParsing(testCase.name, testCase.content)) {
    passedTests++;
  }
}

console.log('\n📊 Test Results Summary');
console.log('=' * 30);
console.log(`✅ Passed: ${passedTests}/${totalTests}`);
console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

if (passedTests === totalTests) {
  console.log('\n🎉 All tests passed! Enhanced JSON parsing should resolve the backtick errors.');
} else {
  console.log('\n⚠️  Some tests failed. Additional edge cases may need handling.');
}

console.log('\n🔧 Next Steps:');
console.log('1. Try generating content again in the mobile app');
console.log('2. Check console logs for detailed parsing information');
console.log('3. The enhanced error handling should provide better debugging info'); 