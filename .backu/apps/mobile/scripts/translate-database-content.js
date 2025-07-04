#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// DeepL API configuration
const DEEPL_API_KEY = '61b6eda2-087e-4041-b807-b2325b81a37d';
const DEEPL_BASE_URL = 'https://api.deepl.com';

// Supabase configuration - you'll need to set these environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// Language configurations (Hindi removed due to issues)
const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸', deeplCode: 'ES' },
  { code: 'fr', name: 'French', flag: '🇫🇷', deeplCode: 'FR' },
  { code: 'de', name: 'German', flag: '🇩🇪', deeplCode: 'DE' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', deeplCode: 'IT' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', deeplCode: 'PT-PT' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', deeplCode: 'RU' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', deeplCode: 'JA' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', deeplCode: 'KO' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', deeplCode: 'ZH' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', deeplCode: 'AR' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', deeplCode: 'VI' }
];

// Database table configurations
const TABLE_CONFIGS = {
  categories: {
    primaryKey: 'id',
    fields: [
      { column: 'name', jsonKey: 'name', displayName: 'Category Name' },
      { column: 'description', jsonKey: 'description', displayName: 'Description' }
    ]
  },
  question_topics: {
    primaryKey: 'id',
    fields: [
      { column: 'topic_title', jsonKey: 'title', displayName: 'Topic Title' },
      { column: 'description', jsonKey: 'description', displayName: 'Description' },
      { column: 'why_this_matters', jsonKey: 'why_this_matters', displayName: 'Why This Matters' }
    ]
  },
  questions: {
    primaryKey: 'id',
    fields: [
      { column: 'question', jsonKey: 'question', displayName: 'Question Text' },
      { column: 'option_a', jsonKey: 'option_a', displayName: 'Option A' },
      { column: 'option_b', jsonKey: 'option_b', displayName: 'Option B' },
      { column: 'option_c', jsonKey: 'option_c', displayName: 'Option C' },
      { column: 'option_d', jsonKey: 'option_d', displayName: 'Option D' },
      { column: 'correct_answer', jsonKey: 'correct_answer', displayName: 'Correct Answer' },
      { column: 'hint', jsonKey: 'hint', displayName: 'Hint' },
      { column: 'explanation', jsonKey: 'explanation', displayName: 'Explanation' }
    ]
  }
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Rate limiting
let lastRequestTime = 0;
const RATE_LIMIT_MS = 100; // 10 requests per second

async function rateLimitedDelay() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

// 30-second delay between batches
async function batchDelay() {
  console.log('   ⏳ Waiting 30 seconds before next batch...');
  await new Promise(resolve => setTimeout(resolve, 30000));
}

// Protect interpolation placeholders during translation
function protectPlaceholders(text) {
  const placeholderMap = new Map();
  let counter = 0;
  
  // Protect {{variable}} patterns
  const protectedText = text.replace(/\{\{[^}]+\}\}/g, (match) => {
    const placeholder = `__PLACEHOLDER_${counter}__`;
    placeholderMap.set(placeholder, match);
    counter++;
    return placeholder;
  });
  
  return { protectedText, placeholderMap };
}

function restorePlaceholders(text, placeholderMap) {
  let restoredText = text;
  for (const [placeholder, original] of placeholderMap) {
    restoredText = restoredText.replace(new RegExp(placeholder, 'g'), original);
  }
  return restoredText;
}

// Translate text using DeepL API
async function translateText(text, targetLangCode) {
  if (!text || text.trim() === '') return text;
  
  await rateLimitedDelay();
  
  const { protectedText, placeholderMap } = protectPlaceholders(text);
  
  try {
    const response = await fetch(`${DEEPL_BASE_URL}/v2/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [protectedText],
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

    const translatedText = result.translations[0].text;
    return restorePlaceholders(translatedText, placeholderMap);
    
  } catch (error) {
    console.error(`Translation error for "${text.substring(0, 50)}...": ${error.message}`);
    return text; // Return original text on error
  }
}

// Get records that need translation with offset support for pagination
async function getRecordsToTranslate(tableName, languageCode, translateOnlyMode = false, limit = 50, offset = 0) {
  const config = TABLE_CONFIGS[tableName];
  if (!config) return [];
  
  // Build the select query to get all needed fields
  const selectFields = [
    config.primaryKey,
    'translations',
    ...config.fields.map(f => f.column)
  ].join(', ');
  
  const { data: records, error } = await supabase
    .from(tableName)
    .select(selectFields)
    .range(offset, offset + limit - 1);
    
  if (error) {
    console.error(`Error fetching records: ${error.message}`);
    return [];
  }
  
  // Filter records based on translation needs
  const recordsNeedingTranslation = [];
  
  for (const record of records) {
    const translations = record.translations || {};
    const langTranslations = translations[languageCode] || {};
    
    let needsTranslation = false;
    
    if (translateOnlyMode) {
      // Only process fields that contain [TRANSLATE] placeholder
      for (const field of config.fields) {
        const existingTranslation = langTranslations[field.jsonKey];
        if (existingTranslation && existingTranslation.includes('[TRANSLATE]')) {
          needsTranslation = true;
          break;
        }
      }
    } else {
      // Process any missing translations
      for (const field of config.fields) {
        const originalText = record[field.column];
        const existingTranslation = langTranslations[field.jsonKey];
        
        if (originalText && !existingTranslation) {
          needsTranslation = true;
          break;
        }
      }
    }
    
    if (needsTranslation) {
      recordsNeedingTranslation.push(record);
    }
  }
  
  return recordsNeedingTranslation;
}

// Update translations in the database
async function updateTranslations(tableName, recordId, languageCode, newTranslations) {
  const config = TABLE_CONFIGS[tableName];
  if (!config) return false;
  
  // First, get the current translations
  const { data: currentRecord, error: fetchError } = await supabase
    .from(tableName)
    .select('translations')
    .eq(config.primaryKey, recordId)
    .single();
    
  if (fetchError) {
    console.error(`Error fetching current translations: ${fetchError.message}`);
    return false;
  }
  
  // Merge new translations with existing ones
  const currentTranslations = currentRecord.translations || {};
  const updatedTranslations = {
    ...currentTranslations,
    [languageCode]: {
      ...(currentTranslations[languageCode] || {}),
      ...newTranslations
    }
  };
  
  // Update the record
  const { error: updateError } = await supabase
    .from(tableName)
    .update({ 
      translations: updatedTranslations,
      updated_at: new Date().toISOString()
    })
    .eq(config.primaryKey, recordId);
    
  if (updateError) {
    console.error(`Error updating translations: ${updateError.message}`);
    return false;
  }
  
  return true;
}

// Translate a single record
async function translateRecord(tableName, record, languageCode, deeplCode, translateOnlyMode = false) {
  const config = TABLE_CONFIGS[tableName];
  const recordId = record[config.primaryKey];
  const currentTranslations = record.translations || {};
  const langTranslations = currentTranslations[languageCode] || {};
  const newTranslations = {};
  
  console.log(`   Translating ${tableName} record ${recordId}...`);
  
  let hasNewTranslations = false;
  
  for (const field of config.fields) {
    const originalText = record[field.column];
    const existingTranslation = langTranslations[field.jsonKey];
    
    let shouldTranslate = false;
    let textToTranslate = originalText;
    
    if (translateOnlyMode) {
      // Only translate if existing translation contains [TRANSLATE]
      if (existingTranslation && existingTranslation.includes('[TRANSLATE]')) {
        shouldTranslate = true;
        // Remove [TRANSLATE] placeholder and translate the cleaned text
        textToTranslate = existingTranslation.replace(/\\[TRANSLATE\\]/g, '').trim();
        if (!textToTranslate) {
          textToTranslate = originalText; // Fallback to original if placeholder was the only content
        }
      }
    } else {
      // Translate if we have original text but no existing translation
      shouldTranslate = originalText && !existingTranslation;
    }
    
    if (shouldTranslate && textToTranslate) {
      console.log(`     Translating field: ${field.displayName}`);
      const translatedText = await translateText(textToTranslate, deeplCode);
      newTranslations[field.jsonKey] = translatedText;
      hasNewTranslations = true;
    }
  }
  
  if (!hasNewTranslations) {
    console.log(`   ⏭️  No new translations needed for ${recordId}`);
    return true;
  }
  
  // Save translations to database
  const saved = await updateTranslations(tableName, recordId, languageCode, newTranslations);
  
  if (saved) {
    console.log(`   ✅ Successfully saved translations for ${recordId}`);
  } else {
    console.log(`   ❌ Failed to save translations for ${recordId}`);
  }
  
  return saved;
}

// Translate all records for a table and language with continuous processing
async function translateTable(tableName, languageCode, deeplCode, translateOnlyMode = false, maxRecords = null) {
  const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
  const modeText = translateOnlyMode ? ' ([TRANSLATE] only)' : '';
  const limitText = maxRecords ? ` (max ${maxRecords} records)` : ' (all records)';
  console.log(`\n🔄 ${langInfo?.flag} Translating ${tableName} to ${languageCode}${modeText}${limitText}...`);
  
  let totalTranslated = 0;
  let offset = 0;
  const batchSize = 50; // Updated to 50 as requested
  let batchCount = 0;
  
  while (true) {
    // Check if we've hit the limit
    if (maxRecords && totalTranslated >= maxRecords) {
      console.log(`   🎯 Reached limit of ${maxRecords} records`);
      break;
    }
    
    // Adjust batch size if approaching limit
    let currentBatchSize = batchSize;
    if (maxRecords && totalTranslated + batchSize > maxRecords) {
      currentBatchSize = maxRecords - totalTranslated;
    }
    
    const records = await getRecordsToTranslate(tableName, languageCode, translateOnlyMode, currentBatchSize, offset);
    
    if (records.length === 0) {
      console.log(`   ✅ No more records need translation for ${tableName} in ${languageCode}`);
      break;
    }
    
    batchCount++;
    console.log(`   📦 Processing batch ${batchCount} (${records.length} records, offset ${offset})...`);
    
    for (const record of records) {
      const success = await translateRecord(tableName, record, languageCode, deeplCode, translateOnlyMode);
      if (success) totalTranslated++;
      
      // Check if we've hit the limit
      if (maxRecords && totalTranslated >= maxRecords) {
        break;
      }
    }
    
    offset += batchSize;
    
    // If we got fewer records than batch size, we're done
    if (records.length < currentBatchSize) {
      console.log(`   ✅ Reached end of records for ${tableName} in ${languageCode}`);
      break;
    }
    
    // Add delay between batches (30 seconds)
    if (records.length === batchSize) {
      await batchDelay();
    }
  }
  
  console.log(`   ✅ Completed ${tableName}: ${totalTranslated} records translated in ${batchCount} batches`);
  return totalTranslated;
}

// Get translation statistics
async function getTranslationStats() {
  console.log('\n📊 Translation Statistics:\n');
  
  for (const [tableName, config] of Object.entries(TABLE_CONFIGS)) {
    console.log(`${tableName.toUpperCase()}:`);
    
    // Get total records
    const { count: totalRecords } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    console.log(`  Total records: ${totalRecords}`);
    
    // Get translation stats per language
    for (const lang of SUPPORTED_LANGUAGES) {
      const { data: records } = await supabase
        .from(tableName)
        .select('translations');
      
      let translatedCount = 0;
      let translatePlaceholderCount = 0;
      
      records?.forEach(record => {
        const translations = record.translations || {};
        const langTranslations = translations[lang.code] || {};
        
        // Check if all fields are translated
        const hasAllTranslations = config.fields.every(field => {
          const translation = langTranslations[field.jsonKey];
          return translation && translation.trim() !== '';
        });
        
        if (hasAllTranslations) {
          // Check if any contain [TRANSLATE] placeholders
          const hasPlaceholders = config.fields.some(field => {
            const translation = langTranslations[field.jsonKey];
            return translation && translation.includes('[TRANSLATE]');
          });
          
          if (hasPlaceholders) {
            translatePlaceholderCount++;
          } else {
            translatedCount++;
          }
        }
      });
      
      const percentage = totalRecords > 0 ? Math.round((translatedCount / totalRecords) * 100) : 0;
      const placeholderText = translatePlaceholderCount > 0 ? ` (${translatePlaceholderCount} with [TRANSLATE])` : '';
      console.log(`  ${lang.flag} ${lang.name}: ${translatedCount}/${totalRecords} (${percentage}%)${placeholderText}`);
    }
    console.log('');
  }
}

// Interactive language selection
async function selectLanguages() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    console.log('\n🌍 Available languages:');
    SUPPORTED_LANGUAGES.forEach((lang, index) => {
      console.log(`  ${index + 1}. ${lang.flag} ${lang.name} (${lang.code})`);
    });
    
    rl.question('\nEnter language numbers (comma-separated) or "all" for all languages: ', (answer) => {
      rl.close();
      
      if (answer.toLowerCase().trim() === 'all') {
        resolve(SUPPORTED_LANGUAGES);
      } else {
        const indices = answer.split(',').map(s => parseInt(s.trim()) - 1);
        const selectedLanguages = indices
          .filter(i => i >= 0 && i < SUPPORTED_LANGUAGES.length)
          .map(i => SUPPORTED_LANGUAGES[i]);
        resolve(selectedLanguages);
      }
    });
  });
}

// Interactive table selection
async function selectTables() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    console.log('\n📋 Available tables:');
    const tableNames = Object.keys(TABLE_CONFIGS);
    tableNames.forEach((table, index) => {
      const config = TABLE_CONFIGS[table];
      const fieldNames = config.fields.map(f => f.displayName).join(', ');
      console.log(`  ${index + 1}. ${table} (${fieldNames})`);
    });
    
    rl.question('\nEnter table numbers (comma-separated) or "all" for all tables: ', (answer) => {
      rl.close();
      
      if (answer.toLowerCase().trim() === 'all') {
        resolve(tableNames);
      } else {
        const indices = answer.split(',').map(s => parseInt(s.trim()) - 1);
        const selectedTables = indices
          .filter(i => i >= 0 && i < tableNames.length)
          .map(i => tableNames[i]);
        resolve(selectedTables);
      }
    });
  });
}

// Parse limit argument
function parseLimit(args) {
  const limitIndex = args.findIndex(arg => arg.startsWith('--limit'));
  if (limitIndex === -1) return null;
  
  const limitArg = args[limitIndex];
  if (limitArg.includes('=')) {
    return parseInt(limitArg.split('=')[1]);
  } else if (limitIndex + 1 < args.length) {
    return parseInt(args[limitIndex + 1]);
  }
  return null;
}

// Main function
async function main() {
  console.log('🌍 CivicSense Database Content Translation Tool\n');
  
  // Check command line arguments
  const args = process.argv.slice(2);
  const translateOnlyMode = args.includes('--translate-only');
  const maxRecords = parseLimit(args);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node translate-database-content.js [options]');
    console.log('\nOptions:');
    console.log('  --stats, -s              Show translation statistics only');
    console.log('  --translate-only         Only translate fields containing [TRANSLATE] placeholders');
    console.log('  --limit=N, --limit N     Limit translation to N records per table/language');
    console.log('  --help, -h               Show this help message');
    console.log('\nFeatures:');
    console.log('  • Continuous translation until all content is translated');
    console.log('  • Processes 50 records per batch with 30-second delays');
    console.log('  • Automatically resumes from where it left off');
    console.log('  • Hindi language removed due to translation issues');
    console.log('\nEnvironment variables required:');
    console.log('  SUPABASE_URL              Your Supabase project URL');
    console.log('  SUPABASE_SERVICE_ROLE_KEY Your Supabase service role key');
    console.log('\nExamples:');
    console.log('  node translate-database-content.js --stats');
    console.log('  node translate-database-content.js --translate-only');
    console.log('  node translate-database-content.js --limit=100');
    console.log('  node translate-database-content.js');
    return;
  }
  
  // Validate environment variables
  if (!SUPABASE_URL || SUPABASE_URL === 'your-supabase-url') {
    console.error('❌ SUPABASE_URL environment variable is required');
    process.exit(1);
  }
  
  if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key') {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
  }
  
  // Show stats only
  if (args.includes('--stats') || args.includes('-s')) {
    await getTranslationStats();
    return;
  }
  
  try {
    // Test database connection
    const { data, error } = await supabase.from('categories').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Database connection successful\n');
    
    // Show current stats
    await getTranslationStats();
    
    // Interactive selection
    const selectedTables = await selectTables();
    if (selectedTables.length === 0) {
      console.log('No tables selected. Exiting.');
      return;
    }
    
    const selectedLanguages = await selectLanguages();
    if (selectedLanguages.length === 0) {
      console.log('No languages selected. Exiting.');
      return;
    }
    
    const modeText = translateOnlyMode ? ' (targeting [TRANSLATE] placeholders only)' : '';
    const limitText = maxRecords ? ` (limited to ${maxRecords} records per table/language)` : ' (translating all records)';
    console.log(`\n🚀 Starting continuous translation for ${selectedTables.length} table(s) and ${selectedLanguages.length} language(s)${modeText}${limitText}...\n`);
    console.log('⚙️  Translation will process in batches of 50 records with 30-second delays between batches\n');
    
    let totalTranslated = 0;
    
    // Process each table and language combination
    for (const tableName of selectedTables) {
      for (const language of selectedLanguages) {
        const count = await translateTable(tableName, language.code, language.deeplCode, translateOnlyMode, maxRecords);
        totalTranslated += count;
      }
    }
    
    console.log(`\n🎉 Translation complete! Total records translated: ${totalTranslated}`);
    
    // Show final stats
    await getTranslationStats();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Translation interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Translation terminated');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  translateText,
  translateTable,
  getTranslationStats,
  TABLE_CONFIGS,
  SUPPORTED_LANGUAGES
}; 