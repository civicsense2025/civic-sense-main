#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// DeepL API configuration
const DEEPL_API_KEY = process.env.EXPO_PUBLIC_DEEPL_API_KEY || '61b6eda2-087e-4041-b807-b2325b81a37d';
const DEEPL_API_URL = 'https://api.deepl.com/v2/translate';

// Language mappings - file names to target language info
const LANGUAGE_FILES = {
  'ui-strings-ar.ts': { code: 'AR', name: 'Arabic', deeplCode: 'AR', flag: '🇸🇦' },
  'ui-strings-de.ts': { code: 'DE', name: 'German', deeplCode: 'DE', flag: '🇩🇪' }, 
  'ui-strings-es.ts': { code: 'ES', name: 'Spanish', deeplCode: 'ES', flag: '🇪🇸' },
  'ui-strings-fr.ts': { code: 'FR', name: 'French', deeplCode: 'FR', flag: '🇫🇷' },
  'ui-strings-hi.ts': { code: 'HI', name: 'Hindi', deeplCode: 'HI', flag: '🇮🇳' },
  'ui-strings-it.ts': { code: 'IT', name: 'Italian', deeplCode: 'IT', flag: '🇮🇹' },
  'ui-strings-ja.ts': { code: 'JA', name: 'Japanese', deeplCode: 'JA', flag: '🇯🇵' },
  'ui-strings-ko.ts': { code: 'KO', name: 'Korean', deeplCode: 'KO', flag: '🇰🇷' },
  'ui-strings-pt.ts': { code: 'PT', name: 'Portuguese', deeplCode: 'PT', flag: '🇵🇹' },
  'ui-strings-ru.ts': { code: 'RU', name: 'Russian', deeplCode: 'RU', flag: '🇷🇺' },
  'ui-strings-vi.ts': { code: 'VI', name: 'Vietnamese', deeplCode: 'VI', flag: '🇻🇳' },
  'ui-strings-zh.ts': { code: 'ZH', name: 'Chinese', deeplCode: 'ZH', flag: '🇨🇳' }
};

// Colors for CLI output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Helper function to colorize text
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Helper function to extract strings from master file
function extractStringsFromMaster() {
  const masterPath = path.join(__dirname, '..', 'lib', 'ui-strings.ts');
  
  try {
    const tsContent = fs.readFileSync(masterPath, 'utf8');
    const uiStringsMatch = tsContent.match(/export const uiStrings = ({[\s\S]*?});[\s\S]*?$/m);
    if (!uiStringsMatch) {
      throw new Error('Could not find uiStrings object in master file');
    }
    
    const objectString = uiStringsMatch[1];
    const jsContent = `const uiStrings = ${objectString};\nmodule.exports = uiStrings;`;
    
    const tempPath = path.join(__dirname, 'temp-master.js');
    fs.writeFileSync(tempPath, jsContent);
    
    delete require.cache[require.resolve(tempPath)];
    const masterStrings = require(tempPath);
    
    fs.unlinkSync(tempPath);
    
    return flattenObject(masterStrings);
  } catch (error) {
    console.error(colorize('❌ Error extracting master strings:', 'red'), error.message);
    return {};
  }
}

// Helper function to flatten nested objects
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

// Helper function to count [TRANSLATE] placeholders
function countTranslatePlaceholders(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/\[TRANSLATE\]/g);
    return matches ? matches.length : 0;
  } catch (error) {
    return -1; // File doesn't exist or can't be read
  }
}

// Helper function to protect interpolation placeholders
function protectInterpolation(text) {
  const placeholders = [];
  const placeholderRegex = /\{\{[^}]+\}\}/g;
  let match;
  let index = 0;
  
  while ((match = placeholderRegex.exec(text)) !== null) {
    placeholders.push(match[0]);
  }
  
  let protectedText = text;
  placeholders.forEach((placeholder, i) => {
    protectedText = protectedText.replace(placeholder, `__PLACEHOLDER_${i}__`);
  });
  
  return { protectedText, placeholders };
}

// Helper function to restore interpolation placeholders
function restoreInterpolation(text, placeholders) {
  let restoredText = text;
  placeholders.forEach((placeholder, i) => {
    restoredText = restoredText.replace(`__PLACEHOLDER_${i}__`, placeholder);
  });
  return restoredText;
}

// Helper function to translate with DeepL
async function translateWithDeepL(text, targetLangCode) {
  if (!DEEPL_API_KEY) {
    throw new Error('DeepL API key not configured');
  }

  const { protectedText, placeholders } = protectInterpolation(text);

  try {
    const response = await fetch(DEEPL_API_URL, {
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
      throw new Error('No translation returned from DeepL');
    }

    const translatedText = result.translations[0].text;
    return restoreInterpolation(translatedText, placeholders);
  } catch (error) {
    console.error(colorize(`❌ Translation failed for "${text.substring(0, 50)}...":`, 'red'), error.message);
    return text; // Return original text if translation fails
  }
}

// Helper function to generate language file content
function generateLanguageFileContent(masterStrings, languageInfo, translations) {
  const { code, name } = languageInfo;
  
  let content = `import type { UIStrings } from './ui-strings';\n\n`;
  content += `export const uiStrings${code}: UIStrings = {\n`;
  
  function buildObjectStructure(obj, indent = '  ') {
    let result = '';
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        result += `${indent}${key}: {\n`;
        result += buildObjectStructure(value, indent + '  ');
        result += `${indent}},\n`;
      } else {
        const flatKey = getFlatKey(obj, key, '');
        const translation = translations[flatKey] || value || `[TRANSLATE] ${value}`;
        result += `${indent}${key}: '${translation.replace(/'/g, "\\'")}',\n`;
      }
    }
    return result;
  }
  
  function getFlatKey(obj, key, prefix) {
    // This is a simplified version - in practice you'd need to track the full path
    return prefix ? `${prefix}.${key}` : key;
  }
  
  // For now, let's use a simpler approach and reconstruct from master
  content += buildObjectStructure(unflattenObject(masterStrings));
  content += `};\n\nexport default uiStrings${code};\n`;
  
  return content;
}

// Helper function to unflatten object
function unflattenObject(flattened) {
  const result = {};
  for (const [key, value] of Object.entries(flattened)) {
    const keys = key.split('.');
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }
  return result;
}

// Audit function to check translation status
async function auditTranslations() {
  console.log(colorize('\n🔍 TRANSLATION AUDIT REPORT', 'cyan'));
  console.log(colorize('=' .repeat(50), 'cyan'));
  
  const masterStrings = extractStringsFromMaster();
  const totalKeys = Object.keys(masterStrings).length;
  
  console.log(colorize(`📊 Master file contains ${totalKeys} translation keys\n`, 'blue'));
  
  const auditResults = [];
  
  for (const [fileName, langInfo] of Object.entries(LANGUAGE_FILES)) {
    const filePath = path.join(__dirname, '..', 'lib', fileName);
    const placeholderCount = countTranslatePlaceholders(filePath);
    
    let status, percentage;
    if (placeholderCount === -1) {
      status = colorize('❌ FILE MISSING', 'red');
      percentage = 0;
    } else if (placeholderCount === 0) {
      status = colorize('✅ COMPLETE', 'green');
      percentage = 100;
    } else {
      const translatedKeys = totalKeys - placeholderCount;
      percentage = Math.round((translatedKeys / totalKeys) * 100);
      
      if (percentage >= 90) {
        status = colorize(`🟡 ${percentage}% (${placeholderCount} missing)`, 'yellow');
      } else if (percentage >= 50) {
        status = colorize(`🟠 ${percentage}% (${placeholderCount} missing)`, 'yellow');
      } else {
        status = colorize(`🔴 ${percentage}% (${placeholderCount} missing)`, 'red');
      }
    }
    
    auditResults.push({
      fileName,
      langInfo,
      status,
      percentage,
      missing: placeholderCount === -1 ? totalKeys : placeholderCount
    });
    
    console.log(`${langInfo.flag} ${colorize(langInfo.name.padEnd(12), 'white')} ${status}`);
  }
  
  // Summary
  console.log(colorize('\n📈 SUMMARY', 'cyan'));
  console.log(colorize('-'.repeat(30), 'cyan'));
  
  const completed = auditResults.filter(r => r.percentage === 100).length;
  const inProgress = auditResults.filter(r => r.percentage > 0 && r.percentage < 100).length;
  const notStarted = auditResults.filter(r => r.percentage === 0).length;
  
  console.log(`${colorize('✅ Completed:', 'green')} ${completed}/${auditResults.length} languages`);
  console.log(`${colorize('🟡 In Progress:', 'yellow')} ${inProgress}/${auditResults.length} languages`);
  console.log(`${colorize('❌ Not Started:', 'red')} ${notStarted}/${auditResults.length} languages`);
  
  const avgCompletion = Math.round(auditResults.reduce((sum, r) => sum + r.percentage, 0) / auditResults.length);
  console.log(`${colorize('📊 Average Completion:', 'blue')} ${avgCompletion}%`);
  
  return auditResults;
}

// Interactive language selection
async function selectLanguages(auditResults) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));
  
  console.log(colorize('\n🌍 SELECT LANGUAGES TO TRANSLATE', 'cyan'));
  console.log(colorize('=' .repeat(40), 'cyan'));
  
  // Show incomplete languages
  const incompleteLanguages = auditResults.filter(r => r.percentage < 100);
  
  if (incompleteLanguages.length === 0) {
    console.log(colorize('🎉 All languages are complete!', 'green'));
    rl.close();
    return [];
  }
  
  console.log(colorize('Languages that need translation:\n', 'white'));
  
  incompleteLanguages.forEach((lang, index) => {
    const statusText = lang.missing === lang.missing ? `${lang.missing} keys missing` : 'File missing';
    console.log(`${colorize((index + 1).toString().padStart(2), 'yellow')}. ${lang.langInfo.flag} ${colorize(lang.langInfo.name.padEnd(12), 'white')} (${statusText})`);
  });
  
  console.log(`${colorize('a', 'yellow')}. ${colorize('All incomplete languages', 'white')}`);
  console.log(`${colorize('0', 'yellow')}. ${colorize('Cancel', 'white')}\n`);
  
  const answer = await question(colorize('Select languages (e.g., 1,3,5 or "a" for all): ', 'cyan'));
  rl.close();
  
  if (answer.trim() === '0') {
    return [];
  }
  
  if (answer.trim().toLowerCase() === 'a') {
    return incompleteLanguages.map(lang => lang.fileName);
  }
  
  const indices = answer.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  const selectedFiles = indices
    .filter(i => i >= 1 && i <= incompleteLanguages.length)
    .map(i => incompleteLanguages[i - 1].fileName);
  
  return selectedFiles;
}

// Main translation function
async function translateLanguages(selectedFiles, dryRun = false) {
  if (selectedFiles.length === 0) {
    console.log(colorize('\n👋 No languages selected. Goodbye!', 'yellow'));
    return;
  }
  
  console.log(colorize(`\n🚀 STARTING TRANSLATION${dryRun ? ' (DRY RUN)' : ''}`, 'cyan'));
  console.log(colorize('=' .repeat(40), 'cyan'));
  
  const masterStrings = extractStringsFromMaster();
  console.log(colorize(`📚 Loaded ${Object.keys(masterStrings).length} strings from master file\n`, 'blue'));
  
  for (const fileName of selectedFiles) {
    const langInfo = LANGUAGE_FILES[fileName];
    const filePath = path.join(__dirname, '..', 'lib', fileName);
    
    console.log(colorize(`🌍 Processing ${fileName} (English -> ${langInfo.name})...`, 'cyan'));
    
    // Count missing translations
    const placeholderCount = countTranslatePlaceholders(filePath);
    if (placeholderCount === 0) {
      console.log(colorize(`✅ ${langInfo.name} is already complete!`, 'green'));
      continue;
    }
    
    if (placeholderCount === -1) {
      console.log(colorize(`📝 Creating new ${langInfo.name} file...`, 'yellow'));
    } else {
      console.log(colorize(`🔄 Updating ${placeholderCount} missing translations...`, 'yellow'));
    }
    
    if (!dryRun) {
      // Translate all strings
      const translations = {};
      let translatedCount = 0;
      
      for (const [key, englishText] of Object.entries(masterStrings)) {
        if (typeof englishText === 'string' && englishText.length > 0) {
          try {
            const translated = await translateWithDeepL(englishText, langInfo.deeplCode);
            translations[key] = translated;
            translatedCount++;
            
            // Show progress every 50 translations
            if (translatedCount % 50 === 0) {
              console.log(colorize(`   📊 Progress: ${translatedCount}/${Object.keys(masterStrings).length} translations completed`, 'blue'));
            }
          } catch (error) {
            console.error(colorize(`   ❌ Failed to translate "${key}": ${error.message}`, 'red'));
            translations[key] = englishText; // Fallback to English
          }
        }
      }
      
      // Generate and write file content
      const newContent = generateLanguageFileContent(masterStrings, langInfo, translations);
      fs.writeFileSync(filePath, newContent, 'utf8');
      
      console.log(colorize(`✅ ${langInfo.name} translation completed! (${translatedCount} strings)`, 'green'));
    } else {
      console.log(colorize(`   📋 Would translate ${Object.keys(masterStrings).length} strings`, 'blue'));
    }
    
    // Clean up temp files
    const tempFile = path.join(__dirname, `${fileName}.temp.js`);
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      console.log(colorize(`🧹 Cleaned up ${tempFile}`, 'gray'));
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log(colorize('🎉 Translation process completed!', 'green'));
}

// Main CLI function
async function main() {
  console.log(colorize('🌍 CivicSense Translation Manager', 'cyan'));
  console.log(colorize('=' .repeat(35), 'cyan'));
  
  const args = process.argv.slice(2);
  const isAuditOnly = args.includes('--audit');
  const isDryRun = args.includes('--dry-run');
  
  if (isAuditOnly) {
    await auditTranslations();
    return;
  }
  
  // Run audit first
  const auditResults = await auditTranslations();
  
  // Select languages to translate
  const selectedFiles = await selectLanguages(auditResults);
  
  // Translate selected languages
  await translateLanguages(selectedFiles, isDryRun);
}

// Handle CLI arguments
if (require.main === module) {
  main().catch(error => {
    console.error(colorize('\n💥 Fatal error:', 'red'), error.message);
    process.exit(1);
  });
}

module.exports = {
  auditTranslations,
  translateLanguages,
  extractStringsFromMaster,
  LANGUAGE_FILES
}; 