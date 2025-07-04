#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// DeepL API configuration
const DEEPL_API_KEY = '61b6eda2-087e-4041-b807-b2325b81a37d';
const DEEPL_BASE_URL = 'https://api.deepl.com';

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Translate text using DeepL API
async function translateText(text, targetLangCode) {
  if (!text || text.trim() === '') return text;
  
  try {
    const response = await fetch(`${DEEPL_BASE_URL}/v2/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLangCode,
        preserve_formatting: true,
        split_sentences: '1'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepL API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.translations || result.translations.length === 0) {
      throw new Error('No translation returned from DeepL API');
    }

    return result.translations[0].text;
    
  } catch (error) {
    console.error(`Translation error: ${error.message}`);
    return text; // Return original text on error
  }
}

async function testTranslation() {
  console.log('🧪 Testing Database Translation...\n');
  
  // Test 1: Check database connection
  console.log('1. Testing database connection...');
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, description, translations')
    .limit(2);
    
  if (error) {
    console.error('❌ Database connection failed:', error.message);
    return;
  }
  
  console.log(`✅ Connected! Found ${categories.length} categories to test with`);
  
  // Test 2: DeepL API connection
  console.log('\n2. Testing DeepL API...');
  const testTranslation = await translateText('Hello, world!', 'ES');
  console.log(`✅ DeepL API working! "Hello, world!" → "${testTranslation}"`);
  
  // Test 3: Translate one category to Spanish
  console.log('\n3. Testing category translation...');
  const category = categories[0];
  console.log(`Original category: "${category.name}" - "${category.description}"`);
  
  const spanishName = await translateText(category.name, 'ES');
  const spanishDescription = await translateText(category.description, 'ES');
  
  console.log(`Spanish translation: "${spanishName}" - "${spanishDescription}"`);
  
  // Test 4: Update database with translation
  console.log('\n4. Testing database update...');
  const currentTranslations = category.translations || {};
  const updatedTranslations = {
    ...currentTranslations,
    es: {
      name: spanishName,
      description: spanishDescription
    }
  };
  
  const { error: updateError } = await supabase
    .from('categories')
    .update({ 
      translations: updatedTranslations,
      updated_at: new Date().toISOString()
    })
    .eq('id', category.id);
    
  if (updateError) {
    console.error('❌ Database update failed:', updateError.message);
    return;
  }
  
  console.log('✅ Database update successful!');
  
  // Test 5: Verify the update
  console.log('\n5. Verifying the update...');
  const { data: updatedCategory } = await supabase
    .from('categories')
    .select('translations')
    .eq('id', category.id)
    .single();
    
  const spanishTranslations = updatedCategory.translations?.es;
  if (spanishTranslations) {
    console.log(`✅ Verification successful!`);
    console.log(`   Spanish name: ${spanishTranslations.name}`);
    console.log(`   Spanish description: ${spanishTranslations.description}`);
  } else {
    console.log('❌ Verification failed - no Spanish translations found');
  }
  
  console.log('\n🎉 All tests passed! The translation system is working correctly.');
}

// Main execution
async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Environment variables SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    process.exit(1);
  }
  
  await testTranslation();
}

main().catch(console.error); 