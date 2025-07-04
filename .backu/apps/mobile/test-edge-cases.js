#!/usr/bin/env node

/**
 * Focused test for the two edge cases that previously failed
 */

// Smart JSON completion logic (extracted from the enhanced parser)
function intelligentJSONCompletion(rawContent) {
  try {
    // First try normal parse
    return { success: true, content: JSON.parse(rawContent) };
  } catch (error) {
    console.log('🔧 Initial parse failed, trying intelligent completion...');
    
    try {
      let smartFixed = rawContent
        .replace(/[`]+/g, '') // Remove all backticks
        .replace(/^[^{]*\{/, '{') // Everything before first {
        .replace(/\}[^}]*$/g, '}') // Everything after last }
        .trim();
      
      // Smart completion for common truncated patterns
      
      // 1. Fix incomplete string values (missing closing quotes)
      smartFixed = smartFixed.replace(/: *"([^"]*?)(?!")[^",}\]]*$/, ': "$1"');
      smartFixed = smartFixed.replace(/: *"([^"]*?)(?!")[^",}\]]*,/g, ': "$1",');
      
      // 2. Fix incomplete arrays (missing closing brackets)
      if (smartFixed.includes('[') && !smartFixed.includes(']')) {
        const lastOpenBracket = smartFixed.lastIndexOf('[');
        if (lastOpenBracket !== -1) {
          // If we have an incomplete array, close it properly
          smartFixed = smartFixed.substring(0, lastOpenBracket + 1) + ']';
        }
      }
      
      // 3. Balance braces and brackets with intelligent closing
      const openBraces = (smartFixed.match(/\{/g) || []).length;
      const closeBraces = (smartFixed.match(/\}/g) || []).length;
      const openBrackets = (smartFixed.match(/\[/g) || []).length;
      const closeBrackets = (smartFixed.match(/\]/g) || []).length;
      
      if (openBrackets > closeBrackets) {
        smartFixed += ']'.repeat(openBrackets - closeBrackets);
      }
      if (openBraces > closeBraces) {
        smartFixed += '}'.repeat(openBraces - closeBraces);
      }
      
      // 4. Fix trailing commas and malformed structures
      smartFixed = smartFixed
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/,+/g, ',') // Multiple commas to single
        .replace(/,(\s*$)/g, '') // Trailing comma at end
        .replace(/:\s*,/g, ': null,') // Missing values
        .replace(/:\s*}/g, ': null}') // Missing values at end
        .replace(/:\s*]/g, ': null]'); // Missing values in arrays
      
      console.log('🔧 Smart-fixed attempt:', smartFixed.substring(0, 200));
      
      const smartParsed = JSON.parse(smartFixed);
      console.log('✅ Intelligent completion succeeded!');
      
      return { success: true, content: smartParsed, repaired: true };
      
    } catch (smartError) {
      console.error('❌ Intelligent completion failed:', smartError.message);
      return { success: false, error: smartError.message };
    }
  }
}

// The two previously failing test cases
const edgeCases = [
  {
    name: "Incomplete JSON with backticks (Previously Failed)",
    input: '```json\n{"topic": "Healthcare", "description": "Quiz about healthcare", "questions": [{"id": "q1", "question": "What is Medicare?", "options": ["A) Federal program", "B) State program"]```',
    expectedToPass: true
  },
  {
    name: "JSON with unbalanced braces (Previously Failed)", 
    input: '{"topic": "Test", "questions": [{"id": "q1", "question": "Test?"',
    expectedToPass: true
  },
  {
    name: "Even more severe truncation",
    input: '{"topic": "Complex", "questions": [{"id": "q1", "question": "What is',
    expectedToPass: true
  },
  {
    name: "Multiple incomplete arrays",
    input: '{"topic": "Test", "questions": [{"options": ["A", "B"}, {"options": ["C"',
    expectedToPass: true
  }
];

async function runEdgeCaseTests() {
  console.log('🧪 Testing Enhanced JSON Parsing - Edge Cases\n');
  
  let passed = 0;
  let failed = 0;
  
  for (let i = 0; i < edgeCases.length; i++) {
    const testCase = edgeCases[i];
    console.log(`\n📋 Test ${i + 1}: ${testCase.name}`);
    console.log(`📥 Input: ${testCase.input.substring(0, 100)}${testCase.input.length > 100 ? '...' : ''}`);
    
    const result = intelligentJSONCompletion(testCase.input);
    
    if (result.success === testCase.expectedToPass) {
      console.log(`✅ PASSED - Expected: ${testCase.expectedToPass ? 'success' : 'failure'}, Got: ${result.success ? 'success' : 'failure'}`);
      if (result.success) {
        console.log(`📊 Content type: ${typeof result.content}, topic: "${result.content?.topic || 'none'}"`);
        if (result.repaired) {
          console.log(`🔧 Content was intelligently repaired`);
        }
      }
      passed++;
    } else {
      console.log(`❌ FAILED - Expected: ${testCase.expectedToPass ? 'success' : 'failure'}, Got: ${result.success ? 'success' : 'failure'}`);
      if (!result.success) {
        console.log(`🔍 Error: ${result.error}`);
      }
      failed++;
    }
  }
  
  console.log(`\n📊 Edge Case Test Results:`);
  console.log(`✅ Passed: ${passed}/${edgeCases.length}`);
  console.log(`❌ Failed: ${failed}/${edgeCases.length}`);
  console.log(`📈 Success Rate: ${((passed / edgeCases.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log(`\n🎉 All edge cases now pass! The intelligent completion logic is working.`);
  } else {
    console.log(`\n⚠️  Some edge cases still need work.`);
  }
}

runEdgeCaseTests().catch(console.error); 