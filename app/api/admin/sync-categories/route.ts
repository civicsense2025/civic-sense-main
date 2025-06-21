import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper function to sync categories for a specific topic
async function syncTopicCategories(
  topicId: string, 
  categoriesData?: any,
  categoryNameToId?: Map<string, string>
): Promise<boolean> {
  const supabase = await createClient();
  
  // If no category mapping provided, fetch it
  if (!categoryNameToId) {
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true);
    
    categoryNameToId = new Map<string, string>();
    categories?.forEach(cat => {
      categoryNameToId!.set(cat.name, cat.id);
    });
  }
  
  // If no categories data provided, fetch it
  if (!categoriesData) {
    const { data: topic } = await supabase
      .from('question_topics')
      .select('categories')
      .eq('id', topicId)
      .single();
    
    categoriesData = topic?.categories;
  }
  
  if (!categoriesData || !Array.isArray(categoriesData)) {
    return false;
  }
  
  // Clear existing entries for this topic
  await supabase
    .from('question_topic_categories')
    .delete()
    .eq('topic_id', topicId);
  
  // Insert new entries
  const insertData = [];
  
  for (let i = 0; i < categoriesData.length; i++) {
    const categoryName = categoriesData[i];
    const categoryId = categoryNameToId.get(categoryName);
    
    if (!categoryId) {
      console.warn(`⚠️ Category "${categoryName}" not found in categories table`);
      continue;
    }
    
    insertData.push({
      topic_id: topicId,
      category_id: categoryId,
      is_primary: i === 0 // First category is primary
    });
  }
  
  if (insertData.length > 0) {
    const { error: insertError } = await supabase
      .from('question_topic_categories')
      .insert(insertData);
    
    if (insertError) {
      throw new Error(`Failed to insert junction data: ${insertError.message}`);
    }
  }
  
  return true;
}

// Helper function to sync categories for all topics
async function syncAllCategories() {
  const supabase = await createClient();
  
  // First, get all categories to create name-to-id mapping
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true);
  
  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
  }
  
  // Create mapping from category name to UUID
  const categoryNameToId = new Map<string, string>();
  categories?.forEach(cat => {
    categoryNameToId.set(cat.name, cat.id);
  });
  
  console.log(`📋 Found ${categories?.length} categories:`, Array.from(categoryNameToId.keys()));
  
  // Get all topics with their JSONB categories
  const { data: topics, error: topicsError } = await supabase
    .from('question_topics')
    .select('id, topic_id, categories')
    .not('categories', 'is', null);
  
  if (topicsError) {
    console.error('Error fetching topics:', topicsError);
    throw new Error(`Failed to fetch topics: ${topicsError.message}`);
  }
  
  console.log(`📚 Processing ${topics?.length} topics...`);
  
  let processed = 0;
  let synced = 0;
  const errors: string[] = [];
  
  for (const topic of topics || []) {
    processed++;
    
    try {
      const success = await syncTopicCategories(topic.id, topic.categories, categoryNameToId);
      if (success) synced++;
    } catch (error) {
      const errorMsg = `Topic ${topic.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }
  
  return {
    mode: 'all' as const,
    success: errors.length === 0,
    message: `Processed ${processed} topics, synced ${synced}`,
    processed,
    synced,
    errors: errors.slice(0, 20) // Limit errors in response
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting category sync...');
    
    // For now, skip auth checks to debug the sync process
    // TODO: Re-enable auth checks after testing
    
    let body: any = {};
    try {
      const bodyText = await request.text();
      if (bodyText) {
        body = JSON.parse(bodyText);
      }
    } catch (parseError) {
      console.log('No body provided, using defaults');
    }

    const { topicId, mode = 'all' } = body;

    if (mode === 'single' && topicId) {
      // Sync a specific topic
      const success = await syncTopicCategories(topicId);
      const result = {
        mode: 'single' as const,
        topicId,
        success,
        message: success ? 'Topic categories synced successfully' : 'Failed to sync topic categories'
      };
      
      return NextResponse.json({ success, data: result });
    } else {
      // Sync all topics
      const result = await syncAllCategories();
      return NextResponse.json({ success: result.success, data: result });
    }
    
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 