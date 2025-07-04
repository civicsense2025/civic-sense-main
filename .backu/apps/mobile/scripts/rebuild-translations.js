#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// DeepL API configuration
const DEEPL_API_KEY = '61b6eda2-087e-4041-b807-b2325b81a37d';
const DEEPL_BASE_URL = 'https://api.deepl.com';

// Language configurations
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
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', deeplCode: 'HI' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', deeplCode: 'VI' }
];

// Parse command line arguments
const args = process.argv.slice(2);
const translateOnlyMode = args.includes('--translate-only');
const auditMode = args.includes('--audit');
const helpMode = args.includes('--help') || args.includes('-h');

if (helpMode) {
  console.log(`
🌍 CivicSense Translation Rebuild Script

Usage: node rebuild-translations.js [options]

Options:
  --audit           Show translation completion status for all languages
  --translate-only  Only process keys containing [TRANSLATE] placeholders
  --help, -h        Show this help message

Examples:
  node rebuild-translations.js --audit
  node rebuild-translations.js --translate-only
  node rebuild-translations.js es fr de
  `);
  process.exit(0);
}

// Utility functions
function flattenObject(obj, prefix = '', result = {}) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], newKey, result);
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  return result;
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

function protectInterpolationPlaceholders(text) {
  if (typeof text !== 'string') return text;
  
  const placeholderMap = new Map();
  let counter = 0;
  
  // Replace {{variable}} patterns with temporary markers
  const protectedText = text.replace(/\{\{[^}]+\}\}/g, (match) => {
    const marker = `__PLACEHOLDER_${counter}__`;
    placeholderMap.set(marker, match);
    counter++;
    return marker;
  });
  
  return { protectedText, placeholderMap };
}

function restoreInterpolationPlaceholders(text, placeholderMap) {
  if (typeof text !== 'string' || !placeholderMap) return text;
  
  let restoredText = text;
  for (const [marker, original] of placeholderMap) {
    restoredText = restoredText.replace(marker, original);
  }
  
  return restoredText;
}

function extractStringsFromMaster() {
  const masterFilePath = path.join(__dirname, '../lib/ui-strings.ts');
  
  if (!fs.existsSync(masterFilePath)) {
    throw new Error(`Master file not found: ${masterFilePath}`);
  }
  
  const content = fs.readFileSync(masterFilePath, 'utf-8');
  
  // Extract the uiStrings object
  const match = content.match(/export const uiStrings = ({[\s\S]*?});/);
  if (!match) {
    throw new Error('Could not find uiStrings export in master file');
  }
  
  // Create a temporary file to safely parse the object
  const tempFile = path.join(__dirname, 'temp-master.js');
  const tempContent = `module.exports = ${match[1]};`;
  
  try {
    fs.writeFileSync(tempFile, tempContent);
    const uiStrings = require(tempFile);
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    return flattenObject(uiStrings);
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    throw error;
  }
}

function parseExistingLanguageFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract the exported object
  const match = content.match(/export const uiStrings[A-Z]{2}: UIStrings = ({[\s\S]*?});/);
  if (!match) {
    return {};
  }
  
  // Create a temporary file to safely parse the object
  const tempFile = path.join(__dirname, 'temp-existing.js');
  const tempContent = `module.exports = ${match[1]};`;
  
  try {
    fs.writeFileSync(tempFile, tempContent);
    const existingStrings = require(tempFile);
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    return flattenObject(existingStrings);
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    console.warn(`Warning: Could not parse existing file ${filePath}:`, error.message);
    return {};
  }
}

async function translateWithDeepL(texts, targetLanguage) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }
  
  const deeplLangCode = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage)?.deeplCode;
  if (!deeplLangCode) {
    throw new Error(`Unsupported language: ${targetLanguage}`);
  }
  
  try {
    const response = await fetch(`${DEEPL_BASE_URL}/v2/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: texts,
        target_lang: deeplLangCode,
        preserve_formatting: true,
        split_sentences: '1'
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepL API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    return result.translations.map(t => t.text);
  } catch (error) {
    console.error(`Translation error for ${targetLanguage}:`, error.message);
    throw error;
  }
}

function countTranslateKeys(flatStrings) {
  return Object.values(flatStrings).filter(value => 
    typeof value === 'string' && value.includes('[TRANSLATE]')
  ).length;
}

function filterTranslateOnlyKeys(masterStrings, existingStrings) {
  const filteredMaster = {};
  const filteredExisting = {};
  
  for (const [key, value] of Object.entries(masterStrings)) {
    // Check if existing value contains [TRANSLATE] or if it doesn't exist
    const existingValue = existingStrings[key];
    const needsTranslation = !existingValue || 
                           (typeof existingValue === 'string' && existingValue.includes('[TRANSLATE]'));
    
    if (needsTranslation) {
      filteredMaster[key] = value;
      filteredExisting[key] = existingValue || value;
    }
  }
  
  return { filteredMaster, filteredExisting };
}

async function rebuildLanguageFile(languageCode, masterStrings, dryRun = false) {
  const langInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
  if (!langInfo) {
    throw new Error(`Unsupported language: ${languageCode}`);
  }
  
  const filePath = path.join(__dirname, `../lib/ui-strings-${languageCode}.ts`);
  const existingStrings = parseExistingLanguageFile(filePath);
  
  let stringsToProcess = masterStrings;
  let baseStrings = existingStrings;
  
  // If in translate-only mode, filter to only [TRANSLATE] keys
  if (translateOnlyMode) {
    const filtered = filterTranslateOnlyKeys(masterStrings, existingStrings);
    stringsToProcess = filtered.filteredMaster;
    baseStrings = filtered.filteredExisting;
    
    if (Object.keys(stringsToProcess).length === 0) {
      console.log(`✅ ${langInfo.flag} ${langInfo.name}: No [TRANSLATE] keys found, skipping`);
      return;
    }
    
    console.log(`🔄 ${langInfo.flag} ${langInfo.name}: Found ${Object.keys(stringsToProcess).length} keys with [TRANSLATE] to update`);
  }
  
  // Prepare strings for translation
  const stringsToTranslate = [];
  const stringKeys = [];
  const placeholderMaps = [];
  
  for (const [key, value] of Object.entries(stringsToProcess)) {
    if (typeof value === 'string') {
      // Check if we need to translate this string
      const existingValue = baseStrings[key];
      const needsTranslation = translateOnlyMode ? 
        (!existingValue || existingValue.includes('[TRANSLATE]')) :
        true;
      
      if (needsTranslation) {
        const { protectedText, placeholderMap } = protectInterpolationPlaceholders(value);
        stringsToTranslate.push(protectedText);
        stringKeys.push(key);
        placeholderMaps.push(placeholderMap);
      }
    }
  }
  
  if (stringsToTranslate.length === 0) {
    console.log(`✅ ${langInfo.flag} ${langInfo.name}: No strings to translate`);
    return;
  }
  
  console.log(`🔄 ${langInfo.flag} ${langInfo.name}: Translating ${stringsToTranslate.length} strings...`);
  
  if (dryRun) {
    console.log(`   [DRY RUN] Would translate ${stringsToTranslate.length} strings`);
    return;
  }
  
  // Translate in batches
  const batchSize = 50;
  const translatedStrings = [];
  
  for (let i = 0; i < stringsToTranslate.length; i += batchSize) {
    const batch = stringsToTranslate.slice(i, i + batchSize);
    const batchKeys = stringKeys.slice(i, i + batchSize);
    
    console.log(`   Translating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(stringsToTranslate.length / batchSize)} (${batch.length} strings)...`);
    
    try {
      const batchTranslations = await translateWithDeepL(batch, languageCode);
      translatedStrings.push(...batchTranslations);
      
      // Rate limiting
      if (i + batchSize < stringsToTranslate.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`   ❌ Failed to translate batch: ${error.message}`);
      throw error;
    }
  }
  
  // Restore placeholders and build final strings object
  const finalStrings = translateOnlyMode ? { ...existingStrings } : {};
  
  for (let i = 0; i < stringKeys.length; i++) {
    const key = stringKeys[i];
    const translatedText = translatedStrings[i];
    const placeholderMap = placeholderMaps[i];
    
    const restoredText = restoreInterpolationPlaceholders(translatedText, placeholderMap);
    finalStrings[key] = restoredText;
  }
  
  // If not in translate-only mode, copy over all master strings that weren't translated
  if (!translateOnlyMode) {
    for (const [key, value] of Object.entries(masterStrings)) {
      if (!(key in finalStrings)) {
        finalStrings[key] = value;
      }
    }
  }
  
  // Convert back to nested structure
  const nestedStrings = {};
  for (const [key, value] of Object.entries(finalStrings)) {
    setNestedValue(nestedStrings, key, value);
  }
  
  // Generate TypeScript file
  const langCodeUpper = languageCode.toUpperCase();
  const variableName = `uiStrings${langCodeUpper}`;
  
  const fileContent = `import type { UIStrings } from './ui-strings';

export const ${variableName}: UIStrings = ${JSON.stringify(nestedStrings, null, 2)};

export default ${variableName};
`;
  
  // Write file
  fs.writeFileSync(filePath, fileContent, 'utf-8');
  
  const totalKeys = Object.keys(finalStrings).length;
  const translatedCount = stringKeys.length;
  
  console.log(`✅ ${langInfo.flag} ${langInfo.name}: Updated ${translatedCount} strings (${totalKeys} total keys)`);
}

function auditTranslations() {
  console.log('\n🔍 Translation Completion Audit\n');
  
  const masterStrings = extractStringsFromMaster();
  const totalKeys = Object.keys(masterStrings).length;
  
  console.log(`📊 Master file contains ${totalKeys} translation keys\n`);
  
  const results = [];
  
  for (const lang of SUPPORTED_LANGUAGES) {
    const filePath = path.join(__dirname, `../lib/ui-strings-${lang.code}.ts`);
    
    if (!fs.existsSync(filePath)) {
      results.push({
        ...lang,
        exists: false,
        totalKeys: 0,
        translateKeys: 0,
        completionPercent: 0
      });
      continue;
    }
    
    try {
      const existingStrings = parseExistingLanguageFile(filePath);
      const existingKeys = Object.keys(existingStrings).length;
      const translateKeys = countTranslateKeys(existingStrings);
      const completionPercent = Math.round(((existingKeys - translateKeys) / totalKeys) * 100);
      
      results.push({
        ...lang,
        exists: true,
        totalKeys: existingKeys,
        translateKeys,
        completionPercent
      });
    } catch (error) {
      results.push({
        ...lang,
        exists: true,
        totalKeys: 0,
        translateKeys: 0,
        completionPercent: 0,
        error: error.message
      });
    }
  }
  
  // Sort by completion percentage
  results.sort((a, b) => b.completionPercent - a.completionPercent);
  
  for (const result of results) {
    if (!result.exists) {
      console.log(`${result.flag} ${result.name.padEnd(12)} ❌ File does not exist`);
    } else if (result.error) {
      console.log(`${result.flag} ${result.name.padEnd(12)} ⚠️  Error: ${result.error}`);
    } else {
      const status = result.completionPercent === 100 ? '✅' : 
                   result.completionPercent >= 80 ? '🟡' : '🔴';
      const translateInfo = result.translateKeys > 0 ? ` (${result.translateKeys} [TRANSLATE])` : '';
      console.log(`${result.flag} ${result.name.padEnd(12)} ${status} ${result.completionPercent}% (${result.totalKeys}/${totalKeys} keys)${translateInfo}`);
    }
  }
  
  console.log('\nLegend: ✅ Complete  🟡 80%+  🔴 <80%  ❌ Missing  ⚠️ Error');
}

async function selectLanguagesInteractively() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\n🌍 Select languages to rebuild:\n');
  
  SUPPORTED_LANGUAGES.forEach((lang, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${lang.flag} ${lang.name}`);
  });
  
  console.log('\nOptions:');
  console.log('  • Enter numbers (e.g., "1,3,5" or "1 3 5")');
  console.log('  • Enter language codes (e.g., "es,fr,de" or "es fr de")');
  console.log('  • Enter "all" for all languages');
  console.log('  • Press Enter to cancel\n');
  
  return new Promise((resolve) => {
    rl.question('Your selection: ', (answer) => {
      rl.close();
      
      if (!answer.trim()) {
        resolve([]);
        return;
      }
      
      if (answer.toLowerCase() === 'all') {
        resolve(SUPPORTED_LANGUAGES.map(lang => lang.code));
        return;
      }
      
      // Parse input
      const parts = answer.split(/[,\s]+/).filter(Boolean);
      const selectedCodes = [];
      
      for (const part of parts) {
        // Check if it's a number (1-based index)
        const num = parseInt(part);
        if (!isNaN(num) && num >= 1 && num <= SUPPORTED_LANGUAGES.length) {
          selectedCodes.push(SUPPORTED_LANGUAGES[num - 1].code);
        }
        // Check if it's a language code
        else if (SUPPORTED_LANGUAGES.find(lang => lang.code === part.toLowerCase())) {
          selectedCodes.push(part.toLowerCase());
        }
        else {
          console.log(`⚠️  Unknown selection: ${part}`);
        }
      }
      
      resolve([...new Set(selectedCodes)]); // Remove duplicates
    });
  });
}

async function main() {
  try {
    if (auditMode) {
      auditTranslations();
      return;
    }
    
    console.log('🌍 CivicSense Translation Rebuild Script');
    if (translateOnlyMode) {
      console.log('🎯 Mode: Translate-only (processing [TRANSLATE] keys only)');
    }
    console.log('');
    
    // Extract master strings
    console.log('📖 Extracting strings from master file...');
    const masterStrings = extractStringsFromMaster();
    console.log(`✅ Found ${Object.keys(masterStrings).length} translation keys\n`);
    
    // Determine which languages to process
    let selectedLanguages;
    
    if (args.length > 0 && !translateOnlyMode) {
      // Languages specified as command line arguments
      selectedLanguages = args.filter(arg => 
        SUPPORTED_LANGUAGES.find(lang => lang.code === arg)
      );
      
      if (selectedLanguages.length === 0) {
        console.log('❌ No valid language codes provided');
        process.exit(1);
      }
    } else {
      // Interactive selection
      selectedLanguages = await selectLanguagesInteractively();
      
      if (selectedLanguages.length === 0) {
        console.log('👋 No languages selected. Goodbye!');
        process.exit(0);
      }
    }
    
    console.log(`\n🚀 Processing ${selectedLanguages.length} language(s): ${selectedLanguages.join(', ')}\n`);
    
    // Process each language
    for (const langCode of selectedLanguages) {
      try {
        await rebuildLanguageFile(langCode, masterStrings);
      } catch (error) {
        console.error(`❌ Failed to process ${langCode}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Translation rebuild complete!');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 