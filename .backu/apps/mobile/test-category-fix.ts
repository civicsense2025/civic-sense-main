#!/usr/bin/env npx tsx

/**
 * Test script to verify that the category-topic relationship fixes are working
 * Specifically tests that the difficulty_level column issue is resolved
 */

import { createClient } from '@supabase/supabase-js';

// Environment setup
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCategoryTopicFix() {
  console.log('🧪 Testing category-topic relationship fixes...');
  console.log('==========================================\n');

  try {
    // Test 1: Check if junction table exists and can be queried
    console.log('1️⃣ Testing junction table query (should not fail with difficulty_level error)...');
    
    const { data: junctionTest, error: junctionError } = await supabase
      .from('question_topic_categories')
      .select(`
        topic_id,
        is_primary,
        question_topics!inner(
          topic_id,
          topic_title,
          description,
          is_active,
          categories
        )
      `)
      .limit(5);

    if (junctionError) {
      console.error('❌ Junction table query failed:', junctionError.message);
      console.log('💡 This suggests the junction table fix did not resolve the schema issue');
    } else {
      console.log(`✅ Junction table query successful! Found ${junctionTest?.length || 0} relationships`);
      if (junctionTest && junctionTest.length > 0) {
        console.log('📋 Sample junction table record:', JSON.stringify(junctionTest[0], null, 2));
      }
    }

    // Test 2: Check basic categories query
    console.log('\n2️⃣ Testing basic categories query...');
    
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .limit(5);

    if (categoriesError) {
      console.error('❌ Categories query failed:', categoriesError.message);
    } else {
      console.log(`✅ Categories query successful! Found ${categories?.length || 0} categories`);
      if (categories && categories.length > 0) {
        console.log('📋 Sample categories:', categories.map(c => c?.name || 'Unknown').join(', '));
      }
    }

    // Test 3: Check basic topics query
    console.log('\n3️⃣ Testing question topics query...');
    
    const { data: topics, error: topicsError } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title, categories')
      .eq('is_active', true)
      .limit(5);

    if (topicsError) {
      console.error('❌ Topics query failed:', topicsError.message);
    } else {
      console.log(`✅ Topics query successful! Found ${topics?.length || 0} topics`);
      if (topics && topics.length > 0) {
        const topicsWithCategories = topics.filter(t => t.categories && Array.isArray(t.categories) && t.categories.length > 0);
        console.log(`📋 Topics with categories: ${topicsWithCategories.length}/${topics.length}`);
        
        if (topicsWithCategories.length > 0 && topicsWithCategories[0]) {
          console.log('📋 Sample topic with categories:', {
            title: topicsWithCategories[0]?.topic_title || 'Unknown',
            categories: topicsWithCategories[0]?.categories || []
          });
        }
      }
    }

    // Test 4: Try the enhanced getCategoriesWithTopics function (if available)
    console.log('\n4️⃣ Testing enhanced getCategoriesWithTopics function...');
    
    try {
      // Try to import and test our fixed function
      const { getCategoriesWithTopics } = await import('./lib/database');
      
      const categoriesWithTopics = await getCategoriesWithTopics();
      console.log(`✅ getCategoriesWithTopics successful! Found ${categoriesWithTopics.length} categories`);
      
      const categoriesWithActualTopics = categoriesWithTopics.filter(c => c.topic_count > 0);
      console.log(`📊 Categories with topics: ${categoriesWithActualTopics.length}/${categoriesWithTopics.length}`);
      
             if (categoriesWithActualTopics.length > 0 && categoriesWithActualTopics[0]) {
         console.log('📋 Sample category with topics:', {
           name: categoriesWithActualTopics[0]?.name || 'Unknown',
           topic_count: categoriesWithActualTopics[0]?.topic_count || 0
         });
       } else {
        console.log('⚠️ All categories showing 0 topics - this indicates the core issue persists');
      }
      
    } catch (importError) {
      console.error('❌ Could not import getCategoriesWithTopics function:', importError);
      console.log('💡 This suggests there might be compilation issues in lib/database.ts');
    }

    console.log('\n🎯 Test Summary:');
    console.log('================');
    
    if (junctionError?.message.includes('difficulty_level')) {
      console.log('❌ MAIN ISSUE PERSISTS: difficulty_level column error still occurring');
      console.log('💡 The junction table query still tries to access non-existent difficulty_level column');
    } else {
      console.log('✅ MAIN ISSUE RESOLVED: No difficulty_level column errors detected');
    }

    if (categoriesError || topicsError) {
      console.log('⚠️ Basic database queries have issues - check connection and permissions');
    } else {
      console.log('✅ Basic database connectivity is working');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testCategoryTopicFix()
  .then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }); 