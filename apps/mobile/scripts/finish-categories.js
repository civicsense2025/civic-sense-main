#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// DeepL API configuration
const DEEPL_API_KEY = '61b6eda2-087e-4041-b807-b2325b81a37d';
const DEEPL_BASE_URL = 'https://api.deepl.com';

// Language configurations
const LANGUAGES = [
  { code: 'fr', name: 'French', flag: '🇫🇷', deeplCode: 'FR' },
  { code: 'de', name: 'German', flag: '🇩🇪', deeplCode: 'DE' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', deeplCode: 'IT' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', deeplCode: 'PT' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', deeplCode: 'RU' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', deeplCode: 'JA' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', deeplCode: 'KO' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', deeplCode: 'ZH' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', deeplCode: 'AR' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', deeplCode: 'HI' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', deeplCode: 'VI' }
];

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

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
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: text,
        target_lang: targetLangCode,
        source_lang: 'EN'
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.translations[0].text;
  } catch (error) {
    console.error(`Translation error for "${text}": ${error.message}`);
    return text; // Return original text if translation fails
  }
}

// Add delay between API calls
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get categories that need translation for a specific language
async function getCategoriesNeedingTranslation(langCode) {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, description, translations')
    .order('id');

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return data.filter(category => {
    const translations = category.translations || {};
    return !translations[langCode] || 
           !translations[langCode].name || 
           !translations[langCode].description ||
           translations[langCode].name === '[TRANSLATE]' ||
           translations[langCode].description === '[TRANSLATE]';
  });
}

// Translate and update a single category
async function translateCategory(category, langCode, deeplCode) {
  const translations = category.translations || {};
  const langTranslations = translations[langCode] || {};

  // Translate name if needed
  let translatedName = langTranslations.name;
  if (!translatedName || translatedName === '[TRANSLATE]') {
    translatedName = await translateText(category.name, deeplCode);
    await delay(100); // Rate limiting
  }

  // Translate description if needed
  let translatedDescription = langTranslations.description;
  if (!translatedDescription || translatedDescription === '[TRANSLATE]') {
    translatedDescription = await translateText(category.description, deeplCode);
    await delay(100); // Rate limiting
  }

  // Update the translations object
  const updatedTranslations = {
    ...translations,
    [langCode]: {
      ...langTranslations,
      name: translatedName,
      description: translatedDescription
    }
  };

  // Update the database
  const { error } = await supabase
    .from('categories')
    .update({ translations: updatedTranslations })
    .eq('id', category.id);

  if (error) {
    throw new Error(`Failed to update category ${category.id}: ${error.message}`);
  }

  return { name: translatedName, description: translatedDescription };
}

// Main function to complete all category translations
async function finishCategoryTranslations() {
  console.log('🌍 Finishing Category Translations\n');

  for (const lang of LANGUAGES) {
    console.log(`${lang.flag} Processing ${lang.name}...`);
    
    try {
      const categories = await getCategoriesNeedingTranslation(lang.code);
      
      if (categories.length === 0) {
        console.log(`  ✅ All categories already translated for ${lang.name}\n`);
        continue;
      }

      console.log(`  📝 Found ${categories.length} categories needing translation`);
      
      let completed = 0;
      for (const category of categories) {
        try {
          const result = await translateCategory(category, lang.code, lang.deeplCode);
          completed++;
          console.log(`  ✅ ${completed}/${categories.length}: "${category.name}" → "${result.name}"`);
        } catch (error) {
          console.error(`  ❌ Failed to translate category ${category.id}: ${error.message}`);
        }
      }
      
      console.log(`  🎉 Completed ${completed}/${categories.length} translations for ${lang.name}\n`);
      
    } catch (error) {
      console.error(`❌ Error processing ${lang.name}: ${error.message}\n`);
    }
  }

  console.log('🎊 Category translation process completed!');
}

// Run the script
if (require.main === module) {
  finishCategoryTranslations().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
} 