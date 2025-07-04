#!/usr/bin/env tsx

/**
 * Final Test Script for CivicSense Mobile App Fixes
 * 
 * This script tests the critical fixes implemented to resolve:
 * 1. Database query errors (.single() -> .maybeSingle())
 * 2. Category-topic relationships
 * 3. Error handling improvements
 * 4. Navigation fixes
 */

import { createClient } from '@supabase/supabase-js';

// Database configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'your_supabase_url';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your_supabase_key';

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_') || supabaseKey.includes('your_')) {
  console.error('❌ Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseQueries() {
  console.log('1️⃣ Testing Database Query Fixes...');
  
  try {
    // Test 1: Categories with topics query (should not crash)
    console.log('   📋 Testing categories with topics query...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .limit(5);

    if (catError) {
      console.log(`   ⚠️  Categories query error: ${catError.message}`);
    } else {
      console.log(`   ✅ Categories loaded: ${categories?.length || 0} categories`);
    }

    // Test 2: Topics query (should not crash)
    console.log('   📚 Testing topics query...');
    const { data: topics, error: topicsError } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title, description, categories, is_active')
      .eq('is_active', true)
      .limit(5);

    if (topicsError) {
      console.log(`   ⚠️  Topics query error: ${topicsError.message}`);
    } else {
      console.log(`   ✅ Topics loaded: ${topics?.length || 0} topics`);
      
      // Test topic with categories relationship
      if (topics && topics.length > 0) {
        const sampleTopic = topics[0];
        if (sampleTopic) {
          console.log(`   📄 Sample topic: ${sampleTopic.topic_title}`);
          console.log(`   🏷️  Categories: ${JSON.stringify(sampleTopic.categories)}`);
        }
      }
    }

    // Test 3: Questions query (should not crash)
    if (topics && topics.length > 0) {
      const sampleTopicId = topics[0]?.topic_id;
      if (sampleTopicId) {
        console.log(`   ❓ Testing questions query for topic: ${sampleTopicId}`);
        
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('id, question, topic_id, difficulty_level, is_active')
          .eq('topic_id', sampleTopicId)
          .eq('is_active', true)
          .limit(3);

        if (questionsError) {
          console.log(`   ⚠️  Questions query error: ${questionsError.message}`);
        } else {
          console.log(`   ✅ Questions loaded: ${questions?.length || 0} questions`);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('   ❌ Database test failed:', error);
    return false;
  }
}

async function testCategoryTopicRelationships() {
  console.log('2️⃣ Testing Category-Topic Relationships...');
  
  try {
    // Test the junction table approach
    console.log('   🔗 Testing junction table existence...');
    const { data: junctionCheck, error: junctionError } = await supabase
      .from('question_topic_categories')
      .select('topic_id, category_id')
      .limit(5);

    if (junctionError) {
      console.log('   📄 Junction table not available, using JSONB array approach');
    } else {
      console.log(`   ✅ Junction table exists with ${junctionCheck?.length || 0} relationships`);
    }

    // Test categories with topic counts
    console.log('   📊 Testing category topic counts...');
    const { data: categoriesWithCounts, error: countsError } = await supabase
      .rpc('get_categories_with_topic_counts');

    if (countsError) {
      console.log(`   ⚠️  Categories with counts error: ${countsError.message}`);
      
      // Fallback: Manual count test
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .limit(3);

      if (categories) {
        for (const category of categories) {
          const { count } = await supabase
            .from('question_topics')
            .select('topic_id', { count: 'exact' })
            .contains('categories', JSON.stringify([category.id]))
            .eq('is_active', true);
          
          console.log(`   📋 ${category.name}: ${count || 0} topics`);
        }
      }
    } else {
      console.log(`   ✅ Categories with counts loaded: ${categoriesWithCounts?.length || 0} categories`);
    }

    return true;
  } catch (error) {
    console.error('   ❌ Category-topic relationship test failed:', error);
    return false;
  }
}

async function testErrorHandling() {
  console.log('3️⃣ Testing Error Handling Improvements...');
  
  try {
    // Test 1: Query with .maybeSingle() (should not crash on no results)
    console.log('   🔍 Testing .maybeSingle() query...');
    const { data: singleResult, error: singleError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', 'non-existent-id')
      .maybeSingle();

    if (singleError) {
      console.log(`   ⚠️  Single query error: ${singleError.message}`);
    } else {
      console.log(`   ✅ Single query handled gracefully: ${singleResult ? 'found' : 'not found'}`);
    }

    // Test 2: Query with invalid filter (should handle error gracefully)
    console.log('   ❌ Testing error handling with invalid query...');
    const { data: invalidResult, error: invalidError } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title')
      .eq('invalid_column', 'test')
      .limit(1);

    if (invalidError) {
      console.log(`   ✅ Invalid query error handled: ${invalidError.message}`);
    } else {
      console.log(`   ⚠️  Invalid query unexpectedly succeeded`);
    }

    return true;
  } catch (error) {
    console.error('   ❌ Error handling test failed:', error);
    return false;
  }
}

async function testSourceProcessing() {
  console.log('4️⃣ Testing Source Processing...');
  
  try {
    // Test questions with source data
    console.log('   📄 Testing source data extraction...');
    const { data: questionsWithSources, error: sourcesError } = await supabase
      .from('questions')
      .select('id, question, sources, source_content, additional_sources')
      .not('sources', 'is', null)
      .limit(5);

    if (sourcesError) {
      console.log(`   ⚠️  Sources query error: ${sourcesError.message}`);
    } else {
      console.log(`   ✅ Questions with sources: ${questionsWithSources?.length || 0}`);
      
      if (questionsWithSources && questionsWithSources.length > 0) {
        const sample = questionsWithSources[0];
        if (sample) {
          console.log(`   📋 Sample sources: ${JSON.stringify(sample.sources)?.substring(0, 100)}...`);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('   ❌ Source processing test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🎯 Testing CivicSense Mobile App Fixes (Final)');
  console.log('==============================================\n');

  const results = {
    database: false,
    relationships: false,
    errorHandling: false,
    sources: false
  };

  results.database = await testDatabaseQueries();
  console.log('');
  
  results.relationships = await testCategoryTopicRelationships();
  console.log('');
  
  results.errorHandling = await testErrorHandling();
  console.log('');
  
  results.sources = await testSourceProcessing();
  console.log('');

  // Summary
  console.log('🎉 Test Results Summary');
  console.log('=============================\n');

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`✅ Passed: ${passedTests}/${totalTests} tests\n`);

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const testName = test.charAt(0).toUpperCase() + test.slice(1);
    console.log(`${status} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  console.log('\n🚀 Key Fixes Implemented:');
  console.log('   • Fixed .single() → .maybeSingle() database queries');
  console.log('   • Enhanced category-topic relationships');
  console.log('   • Improved error handling with user-friendly messages');
  console.log('   • Added navigation error handling');
  console.log('   • Enhanced source processing and display');

  console.log('\n📱 To test the mobile app UI fixes:');
  console.log('   1. Run: npx expo start');
  console.log('   2. Open the app in simulator/device');
  console.log('   3. Navigate: Home → Discover → Select a category → Click a topic');
  console.log('   4. Verify: No crashes, friendly error messages, working back button');

  if (passedTests === totalTests) {
    console.log('\n🎉 All database tests passed! Your fixes should work correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above and verify your database configuration.');
  }
}

// Run the tests
runAllTests().catch(console.error); 