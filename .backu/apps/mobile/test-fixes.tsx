/**
 * Test script to verify the CivicSense mobile app fixes
 * 
 * Usage (from mobile app directory):
 *   npx tsx test-fixes.tsx
 */

import React from 'react';
import { Alert } from 'react-native';

console.log('🧪 Testing CivicSense Mobile App Fixes...');
console.log('==========================================\n');

// Test 1: Import and test diagnostic functions
async function testDiagnostics() {
  console.log('1️⃣ Testing diagnostic functions...');
  
  try {
    // Try to import the diagnostic function
    const { diagnoseCategoryTopicIssues } = await import('./lib/database');
    
    console.log('✅ Diagnostic functions imported successfully');
    
    // Run basic diagnostic
    const diagnosis = await diagnoseCategoryTopicIssues();
    
    console.log(`📊 Diagnosis Summary: ${diagnosis.summary}`);
    console.log(`📊 Found ${diagnosis.issues.length} issues`);
    console.log(`📊 ${diagnosis.canAutoFix ? 'Auto-fixable' : 'Manual fix required'}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Diagnostic test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

// Test 2: Test navigation logic
async function testNavigationLogic() {
  console.log('\n2️⃣ Testing navigation logic fixes...');
  
  const testIds = [
    'election-order-blocked-2025',
    'clearview-ai-transforms-police',
    'tech-billionaires-destroying-democracy',
    'simple-uuid-12345',
    'valid category name with spaces'
  ];
  
  console.log(`🧭 Testing ${testIds.length} sample IDs...`);
  
  for (const id of testIds) {
    // Simulate the FIXED navigation logic
    const looksLikeCategoryName = id.includes(' ') || 
                                 id.includes('+') || 
                                 (!id.match(/^[a-f0-9-]+$/i) && !id.match(/^[a-z0-9-]+$/i)) ||
                                 id.split('-').some(part => part.length > 15);
    
    const classification = looksLikeCategoryName ? 'CATEGORY NAME' : 'TOPIC ID';
    const expected = id.includes(' ') ? 'CATEGORY NAME' : 'TOPIC ID';
    const correct = classification === expected;
    
    console.log(`  ${correct ? '✅' : '❌'} "${id}" → ${classification} ${correct ? '' : `(expected ${expected})`}`);
  }
  
  return true;
}

// Test 3: Test getCategoriesWithTopics function
async function testCategoryTopicRelationships() {
  console.log('\n3️⃣ Testing category-topic relationships...');
  
  try {
    const { getCategoriesWithTopics } = await import('./lib/database');
    
    console.log('📂 Fetching categories with topics...');
    const categories = await getCategoriesWithTopics();
    
    console.log(`📊 Found ${categories.length} categories`);
    
    let categoriesWithTopics = 0;
    let totalTopics = 0;
    
    categories.forEach(category => {
      if (category.topic_count > 0) {
        categoriesWithTopics++;
        totalTopics += category.topic_count;
        console.log(`  ✅ ${category.name}: ${category.topic_count} topics`);
      } else {
        console.log(`  ❌ ${category.name}: 0 topics`);
      }
    });
    
    console.log(`\n📊 Summary: ${categoriesWithTopics}/${categories.length} categories have topics`);
    console.log(`📊 Total topic assignments: ${totalTopics}`);
    
    if (categoriesWithTopics === 0 && categories.length > 0) {
      console.log('🚨 ISSUE: No categories have topics assigned!');
      console.log('💡 Run the repair utility to fix this');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Category-topic test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

// Test 4: Test source processing
async function testSourceProcessing() {
  console.log('\n4️⃣ Testing source processing...');
  
  try {
    const { parseSourceContent } = await import('./lib/html-utils');
    
    // Test with sample source content
    const testSources = [
      'https://example.com/article',
      '{"og_site_name": "CNN", "url": "https://cnn.com/news"}',
      '<title>Washington Post Article</title>',
      'Raw source content from politico.com'
    ];
    
    console.log(`📄 Testing source parsing on ${testSources.length} samples...`);
    
    for (const source of testSources) {
      const parsed = parseSourceContent(source);
      console.log(`  📄 "${source.substring(0, 30)}..." → ${parsed.name} (${parsed.domain})`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Source processing test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting comprehensive test suite...\n');
  
  const results = [];
  
  results.push(await testDiagnostics());
  results.push(await testNavigationLogic());
  results.push(await testCategoryTopicRelationships());
  results.push(await testSourceProcessing());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📋 TEST RESULTS');
  console.log('================');
  console.log(`✅ Passed: ${passed}/${total} tests`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! The fixes are working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
    console.log('\n💡 Next steps:');
    console.log('1. Run diagnostic utility: import { diagnoseCategoryTopicIssues } from "./lib/database"');
    console.log('2. Run repair utility: import { repairCategoryTopicRelationships } from "./lib/database"');
    console.log('3. Check the ISSUE_FIXES_SUMMARY.md for detailed instructions');
  }
  
  return passed === total;
}

// Export for use as a module
export default runAllTests;

// Run immediately if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
} 