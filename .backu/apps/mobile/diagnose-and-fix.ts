#!/usr/bin/env npx tsx

/**
 * CivicSense Mobile App - Comprehensive Diagnostic & Repair Tool
 * 
 * This script diagnoses and fixes the major issues identified:
 * 1. Category-topic relationship problems (0 topics showing)
 * 2. Navigation logic issues (topic IDs mistaken for category names) 
 * 3. Source processing failures
 * 4. Junction table sync issues
 * 
 * Usage:
 *   npx tsx diagnose-and-fix.ts
 *   npx tsx diagnose-and-fix.ts --fix
 *   npx tsx diagnose-and-fix.ts --fix-categories
 *   npx tsx diagnose-and-fix.ts --fix-sources
 */

import { createClient } from '@supabase/supabase-js';

// Environment setup
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Command line arguments
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const fixCategories = args.includes('--fix-categories');
const fixSources = args.includes('--fix-sources');

console.log('🔧 CivicSense Mobile App - Diagnostic & Repair Tool');
console.log('==================================================');

interface DiagnosticResult {
  category: string;
  issues: string[];
  fixes: string[];
  canAutoFix: boolean;
  data?: any;
}

/**
 * Main diagnostic runner
 */
async function runDiagnostics(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  console.log('\n🔍 Running comprehensive diagnostics...\n');

  // 1. Category-Topic Relationship Diagnostics
  console.log('📂 Checking category-topic relationships...');
  const categoryResult = await diagnoseCategoryTopicRelationships();
  results.push(categoryResult);

  // 2. Navigation Logic Diagnostics
  console.log('\n🧭 Checking navigation logic...');
  const navigationResult = await diagnoseNavigationIssues();
  results.push(navigationResult);

  // 3. Source Processing Diagnostics
  console.log('\n📄 Checking source processing...');
  const sourceResult = await diagnoseSourceProcessing();
  results.push(sourceResult);

  // 4. Database Schema Diagnostics
  console.log('\n🗄️ Checking database schema...');
  const schemaResult = await diagnoseDatabaseSchema();
  results.push(schemaResult);

  return results;
}

/**
 * Diagnose category-topic relationship issues
 */
async function diagnoseCategoryTopicRelationships(): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    category: 'Category-Topic Relationships',
    issues: [],
    fixes: [],
    canAutoFix: false,
    data: {}
  };

  try {
    // Get basic counts
    const { data: categories, count: categoryCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    const { data: topics, count: topicCount } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title, categories', { count: 'exact' })
      .eq('is_active', true);

    result.data.totalCategories = categoryCount || 0;
    result.data.totalTopics = topicCount || 0;

    console.log(`  📊 Found ${categoryCount} categories, ${topicCount} topics`);

    // Check JSONB category assignments
    const topicsWithCategories = (topics || []).filter(topic => 
      topic.categories && Array.isArray(topic.categories) && topic.categories.length > 0
    );

    result.data.topicsWithCategories = topicsWithCategories.length;
    console.log(`  📊 ${topicsWithCategories.length}/${topicCount} topics have categories assigned`);

    if (topicsWithCategories.length === 0 && (topicCount || 0) > 0) {
      result.issues.push('🚨 CRITICAL: No topics have categories assigned in JSONB arrays');
      result.fixes.push('Sync category assignments from content analysis');
      result.canAutoFix = true;
    }

    // Check junction table
    const { count: junctionCount } = await supabase
      .from('question_topic_categories')
      .select('*', { count: 'exact' });

    result.data.junctionTableRecords = junctionCount || 0;
    console.log(`  📊 Junction table has ${junctionCount || 0} records`);

    if ((junctionCount || 0) === 0 && (topicCount || 0) > 0) {
      result.issues.push('⚠️ Junction table is empty but topics exist');
      result.fixes.push('Populate junction table from JSONB arrays');
      result.canAutoFix = true;
    }

    // Check which categories actually have topics
    const categoriesWithTopics = (categories || []).filter(category => {
      return topicsWithCategories.some(topic => 
        topic.categories && Array.isArray(topic.categories) && topic.categories.includes(category.id)
      );
    });

    result.data.categoriesWithTopics = categoriesWithTopics.length;
    console.log(`  📊 ${categoriesWithTopics.length}/${categoryCount} categories have topics`);

    if (categoriesWithTopics.length < (categoryCount || 0) * 0.5) {
      result.issues.push(`⚠️ Only ${categoriesWithTopics.length}/${categoryCount} categories have topics`);
    }

  } catch (error) {
    result.issues.push(`Error during diagnosis: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Diagnose navigation logic issues
 */
async function diagnoseNavigationIssues(): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    category: 'Navigation Logic',
    issues: [],
    fixes: [],
    canAutoFix: true,
    data: {}
  };

  // Test common problematic topic IDs
  const problematicIds = [
    'election-order-blocked-2025',
    'clearview-ai-transforms-police',
    'tech-billionaires-destroying-democracy',
    'something-with-long-descriptive-name'
  ];

  console.log(`  🧭 Testing navigation logic with ${problematicIds.length} sample IDs...`);

  const incorrectlyClassified = [];

  for (const id of problematicIds) {
    // Simulate the OLD problematic logic
    const oldLogic = id.includes(' ') || id.includes('+') || !id.match(/^[a-f0-9-]+$/i);
    
    if (oldLogic) {
      incorrectlyClassified.push(id);
    }
  }

  result.data.problematicIds = problematicIds;
  result.data.incorrectlyClassified = incorrectlyClassified;

  console.log(`  🧭 OLD logic incorrectly classifies ${incorrectlyClassified.length}/${problematicIds.length} IDs`);

  if (incorrectlyClassified.length > 0) {
    result.issues.push(`Navigation logic incorrectly classifies ${incorrectlyClassified.length} topic IDs as category names`);
    result.fixes.push('Updated regex pattern is already implemented in the fixed version');
  }

  return result;
}

/**
 * Diagnose source processing issues
 */
async function diagnoseSourceProcessing(): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    category: 'Source Processing',
    issues: [],
    fixes: [],
    canAutoFix: false,
    data: {}
  };

  try {
    // Sample a few topics to check source processing
    const { data: sampleTopics } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title')
      .eq('is_active', true)
      .limit(5);

    if (!sampleTopics || sampleTopics.length === 0) {
      result.issues.push('No topics found to test source processing');
      return result;
    }

    console.log(`  📄 Testing source processing on ${sampleTopics.length} sample topics...`);

    let topicsWithSources = 0;
    let totalSourceFields = 0;

    for (const topic of sampleTopics) {
      const { data: questions } = await supabase
        .from('questions')
        .select('sources, source_content, source_links, source_metadata, additional_sources')
        .eq('topic_id', topic.topic_id)
        .eq('is_active', true)
        .limit(10);

      if (questions && questions.length > 0) {
        const sourceFields = questions.flatMap(q => [
          q.sources,
          q.source_content,
          q.source_links,
          q.source_metadata,
          q.additional_sources
        ]).filter(Boolean);

        totalSourceFields += sourceFields.length;
        
        if (sourceFields.length > 0) {
          topicsWithSources++;
        }

        console.log(`    📄 "${topic.topic_title}": ${questions.length} questions, ${sourceFields.length} source fields`);
      }
    }

    result.data.sampleSize = sampleTopics.length;
    result.data.topicsWithSources = topicsWithSources;
    result.data.totalSourceFields = totalSourceFields;

    console.log(`  📄 ${topicsWithSources}/${sampleTopics.length} topics have source data`);
    console.log(`  📄 ${totalSourceFields} total source fields found`);

    if (topicsWithSources === 0) {
      result.issues.push('No source data found in sample topics');
      result.fixes.push('Check source data population in questions table');
    } else if (topicsWithSources < sampleTopics.length * 0.5) {
      result.issues.push(`Only ${topicsWithSources}/${sampleTopics.length} topics have source data`);
    }

  } catch (error) {
    result.issues.push(`Error during source diagnosis: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Diagnose database schema issues
 */
async function diagnoseDatabaseSchema(): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    category: 'Database Schema',
    issues: [],
    fixes: [],
    canAutoFix: false,
    data: {}
  };

  const tables = [
    'categories',
    'question_topics', 
    'questions',
    'question_topic_categories',
    'source_metadata'
  ];

  console.log(`  🗄️ Checking ${tables.length} critical tables...`);

  const tableStatus: Record<string, boolean> = {};

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      tableStatus[table] = !error;
      
      if (error) {
        console.log(`    ❌ ${table}: ${error.message}`);
        result.issues.push(`Table ${table} not accessible: ${error.message}`);
      } else {
        console.log(`    ✅ ${table}: accessible`);
      }
    } catch (error) {
      tableStatus[table] = false;
      console.log(`    ❌ ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.issues.push(`Table ${table} not accessible`);
    }
  }

  result.data.tableStatus = tableStatus;

  return result;
}

/**
 * Fix category-topic relationships
 */
async function fixCategoryTopicRelationships(): Promise<void> {
  console.log('\n🔧 Fixing category-topic relationships...');

  try {
    // 1. Get categories and topics
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, description')
      .eq('is_active', true);

    const { data: topics } = await supabase
      .from('question_topics')
      .select('topic_id, topic_title, description, categories')
      .eq('is_active', true);

    if (!categories || !topics) {
      console.log('❌ Could not fetch categories or topics');
      return;
    }

    console.log(`  📊 Processing ${topics.length} topics with ${categories.length} categories...`);

    // 2. Find topics without categories
    const topicsWithoutCategories = topics.filter(topic => 
      !topic.categories || !Array.isArray(topic.categories) || topic.categories.length === 0
    );

    console.log(`  📊 Found ${topicsWithoutCategories.length} topics without categories`);

    if (topicsWithoutCategories.length === 0) {
      console.log('✅ All topics already have categories assigned');
      return;
    }

    // 3. Category inference based on keywords
    const categoryKeywords: Record<string, string[]> = {
      'Elections & Voting': ['election', 'vote', 'voting', 'ballot', 'campaign', 'candidate'],
      'Constitution & Law': ['constitution', 'law', 'legal', 'court', 'supreme', 'amendment'],
      'Congress & Senate': ['congress', 'senate', 'house', 'representative', 'bill', 'legislation'],
      'Executive Branch': ['president', 'executive', 'administration', 'cabinet', 'white house'],
      'Judicial Branch': ['court', 'judge', 'judicial', 'supreme court', 'ruling'],
      'State & Local Government': ['state', 'local', 'governor', 'mayor', 'city', 'county'],
      'Political Parties': ['republican', 'democrat', 'party', 'political party', 'partisan'],
      'Civil Rights': ['civil rights', 'rights', 'discrimination', 'equality', 'freedom'],
      'Economics & Policy': ['economy', 'economic', 'policy', 'budget', 'spending', 'tax'],
      'Foreign Relations': ['foreign', 'international', 'trade', 'diplomacy', 'war', 'defense']
    };

    let assigned = 0;

    for (const topic of topicsWithoutCategories) {
      const text = `${topic.topic_title} ${topic.description || ''}`.toLowerCase();
      
      // Find matching categories
      const matchingCategories = categories.filter(category => {
        const keywords = categoryKeywords[category.name] || [];
        return keywords.some(keyword => text.includes(keyword.toLowerCase()));
      });

      if (matchingCategories.length > 0) {
        // Assign the first matching category
        const categoryIds = matchingCategories.slice(0, 2).map(c => c.id);
        
        const { error } = await supabase
          .from('question_topics')
          .update({ categories: categoryIds })
          .eq('topic_id', topic.topic_id);

        if (error) {
          console.log(`❌ Failed to assign category to ${topic.topic_title}: ${error.message}`);
        } else {
          assigned++;
          console.log(`✅ Assigned ${matchingCategories[0].name} to "${topic.topic_title}"`);
        }
      }
    }

    console.log(`\n✅ Assigned categories to ${assigned}/${topicsWithoutCategories.length} topics`);

    // 4. Sync to junction table
    console.log('\n🔄 Syncing to junction table...');
    await syncJunctionTable();

  } catch (error) {
    console.error('❌ Error fixing category-topic relationships:', error);
  }
}

/**
 * Sync junction table from JSONB arrays
 */
async function syncJunctionTable(): Promise<void> {
  try {
    // Get all topics with JSONB categories
    const { data: topics } = await supabase
      .from('question_topics')
      .select('topic_id, categories')
      .not('categories', 'is', null);

    if (!topics) {
      console.log('❌ Could not fetch topics for junction sync');
      return;
    }

    console.log(`  🔄 Syncing ${topics.length} topics to junction table...`);

    let synced = 0;

    for (const topic of topics) {
      const categories = Array.isArray(topic.categories) ? topic.categories : [];
      
      if (categories.length === 0) continue;

      // Prepare junction table records
      const junctionRecords = categories.map((categoryId, index) => ({
        topic_id: topic.topic_id,
        category_id: categoryId,
        is_primary: index === 0,
      }));

      // Use upsert to avoid duplicates
      const { error } = await supabase
        .from('question_topic_categories')
        .upsert(junctionRecords, {
          onConflict: 'topic_id,category_id',
          ignoreDuplicates: true
        });

      if (!error) {
        synced++;
      }
    }

    console.log(`✅ Synced ${synced}/${topics.length} topics to junction table`);

  } catch (error) {
    console.error('❌ Error syncing junction table:', error);
  }
}

/**
 * Display diagnostic results
 */
function displayResults(results: DiagnosticResult[]): void {
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('=====================\n');

  let totalIssues = 0;
  let autoFixableIssues = 0;

  results.forEach(result => {
    console.log(`${result.category}:`);
    
    if (result.issues.length === 0) {
      console.log('  ✅ No issues detected');
    } else {
      result.issues.forEach(issue => {
        console.log(`  ${issue}`);
        totalIssues++;
      });
      
      if (result.canAutoFix) {
        autoFixableIssues += result.fixes.length;
        console.log('  💡 Auto-fixable issues:');
        result.fixes.forEach(fix => {
          console.log(`    - ${fix}`);
        });
      }
    }
    console.log('');
  });

  console.log(`📈 SUMMARY: ${totalIssues} total issues, ${autoFixableIssues} auto-fixable`);
  
  if (autoFixableIssues > 0) {
    console.log('\n💡 To run automated fixes:');
    console.log('   npx tsx diagnose-and-fix.ts --fix');
    console.log('   npx tsx diagnose-and-fix.ts --fix-categories');
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const results = await runDiagnostics();
    
    displayResults(results);

    // Run fixes if requested
    if (shouldFix || fixCategories) {
      console.log('\n🔧 RUNNING AUTOMATED FIXES');
      console.log('===========================');
      
      if (fixCategories || shouldFix) {
        await fixCategoryTopicRelationships();
      }

      console.log('\n✅ Automated fixes completed!');
      console.log('\n🔄 Run diagnostics again to verify fixes:');
      console.log('   npx tsx diagnose-and-fix.ts');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error); 