// Debug Category Name Mismatch Issue
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client directly
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface CategoryAnalysis {
  actualCategories: Array<{ id: string; name: string; emoji?: string }>;
  topicCategoryNames: string[];
  unmatchedNames: string[];
  suggestedMappings: Record<string, string>;
}

async function analyzeCategoryMismatch(): Promise<CategoryAnalysis> {
  console.log('🔍 Analyzing category name mismatch...');

  // Get actual categories from the database
  const { data: actualCategories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, emoji')
    .eq('is_active', true)
    .order('name');

  if (categoriesError) {
    throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
  }

  console.log(`📋 Found ${actualCategories?.length || 0} actual categories:`);
  actualCategories?.forEach(cat => {
    console.log(`  - "${cat.name}" ${cat.emoji || ''}`);
  });

  // Get all unique category names from topics JSONB field
  const { data: topics, error: topicsError } = await supabase
    .from('question_topics')
    .select('categories')
    .eq('is_active', true);

  if (topicsError) {
    throw new Error(`Failed to fetch topics: ${topicsError.message}`);
  }

  // Extract all unique category names from JSONB arrays
  const topicCategoryNames = new Set<string>();
  topics?.forEach(topic => {
    if (topic.categories && Array.isArray(topic.categories)) {
      topic.categories.forEach(catName => {
        if (typeof catName === 'string') {
          topicCategoryNames.add(catName);
        }
      });
    }
  });

  const topicNamesArray = Array.from(topicCategoryNames).sort();
  console.log(`\n📝 Found ${topicNamesArray.length} unique category names in topics:`);
  topicNamesArray.forEach(name => {
    console.log(`  - "${name}"`);
  });

  // Find unmatched names
  const actualCategoryNames = new Set(actualCategories?.map(cat => cat.name) || []);
  const unmatchedNames = topicNamesArray.filter(name => !actualCategoryNames.has(name));

  console.log(`\n❌ ${unmatchedNames.length} category names in topics don't match actual categories:`);
  unmatchedNames.forEach(name => {
    console.log(`  - "${name}"`);
  });

  // Suggest mappings based on keyword similarity  
  const suggestedMappings: Record<string, string> = {};
  const actualCategoriesArray = actualCategories || [];

  unmatchedNames.forEach(unmatchedName => {
    const lowerUnmatched = unmatchedName.toLowerCase();
    
    // Simple keyword matching
    const bestMatch = actualCategoriesArray.find(category => {
      const lowerCategory = category.name.toLowerCase();
      
      // Direct substring match
      if (lowerCategory.includes(lowerUnmatched) || lowerUnmatched.includes(lowerCategory)) {
        return true;
      }
      
      // Keyword-based matching
      const unmatchedWords = lowerUnmatched.split(/\s+/);
      const categoryWords = lowerCategory.split(/\s+/);
      
      return unmatchedWords.some(word => 
        categoryWords.some((catWord: string) => 
          catWord.includes(word) || word.includes(catWord)
        )
      );
    });

    if (bestMatch) {
      suggestedMappings[unmatchedName] = bestMatch.name;
    }
  });

  console.log(`\n💡 Suggested mappings:`);
  Object.entries(suggestedMappings).forEach(([from, to]) => {
    console.log(`  "${from}" → "${to}"`);
  });

  return {
    actualCategories: actualCategoriesArray,
    topicCategoryNames: topicNamesArray,
    unmatchedNames,
    suggestedMappings
  };
}

async function fixCategoryMappings(mappings: Record<string, string>): Promise<void> {
  console.log('\n🔧 Applying category name fixes...');

  // Get category name to ID mapping
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true);

  const nameToIdMap = new Map(categories?.map(cat => [cat.name, cat.id]) || []);

  let updatedCount = 0;
  let errorCount = 0;

  for (const [oldName, newName] of Object.entries(mappings)) {
    const categoryId = nameToIdMap.get(newName);
    
    if (!categoryId) {
      console.error(`❌ Category "${newName}" not found in database`);
      errorCount++;
      continue;
    }

    console.log(`🔄 Updating topics: "${oldName}" → "${newName}" (${categoryId})`);

    // Update all topics that have the old name
    const { data: topicsToUpdate } = await supabase
      .from('question_topics')  
      .select('topic_id, categories')
      .contains('categories', JSON.stringify([oldName]));

    if (!topicsToUpdate || topicsToUpdate.length === 0) {
      console.log(`  No topics found with category "${oldName}"`);
      continue;
    }

    // Update each topic's categories array
    for (const topic of topicsToUpdate) {
      if (topic.categories && Array.isArray(topic.categories)) {
        const updatedCategories = topic.categories.map(catName => 
          catName === oldName ? categoryId : catName
        );

        const { error: updateError } = await supabase
          .from('question_topics')
          .update({ categories: updatedCategories })
          .eq('topic_id', topic.topic_id);

        if (updateError) {
          console.error(`❌ Failed to update topic ${topic.topic_id}:`, updateError.message);
          errorCount++;
        } else {
          updatedCount++;
        }
      }
    }
  }

  console.log(`\n✅ Updated ${updatedCount} topics with ${errorCount} errors`);
}

// Main execution function
async function main() {
  try {
    const analysis = await analyzeCategoryMismatch();
    
    if (analysis.unmatchedNames.length === 0) {
      console.log('\n🎉 No category mismatches found! All topic categories match actual categories.');
      return;
    }

    if (Object.keys(analysis.suggestedMappings).length > 0) {
      console.log('\n❓ Would you like to apply the suggested mappings? (This will update the database)');
      console.log('   Run with --apply to automatically apply the fixes');
      
      // Check if --apply flag is provided
      const shouldApply = process.argv.includes('--apply');
      
      if (shouldApply) {
        await fixCategoryMappings(analysis.suggestedMappings);
        console.log('\n🎯 Category fixes applied! The warnings should be resolved now.');
      } else {
        console.log('\n💡 To apply these fixes, run: npm run debug-categories --apply');
      }
    } else {
      console.log('\n⚠️  No automatic mappings could be suggested. Manual review required.');
      console.log('Unmatched categories may need to be created or manually mapped.');
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { analyzeCategoryMismatch, fixCategoryMappings }; 