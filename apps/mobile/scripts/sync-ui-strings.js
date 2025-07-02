#!/usr/bin/env node

/**
 * UI Strings Synchronization Script for CivicSense
 * 
 * This script:
 * 1. Reads the main ui-strings.ts file as the source of truth
 * 2. Flattens all nested keys to dot notation
 * 3. Compares all language-specific files 
 * 4. Identifies missing translations
 * 5. Uses DeepL API to auto-translate missing strings
 * 6. Updates language files with proper structure
 */

const fs = require('fs');
const path = require('path');

// Language files to sync
const LANGUAGE_FILES = [
  'lib/ui-strings-ar.ts',
  'lib/ui-strings-de.ts', 
  'lib/ui-strings-es.ts',
  'lib/ui-strings-fr.ts',
  'lib/ui-strings-hi.ts',
  'lib/ui-strings-it.ts',
  'lib/ui-strings-ja.ts',
  'lib/ui-strings-ko.ts',
  'lib/ui-strings-pt.ts',
  'lib/ui-strings-ru.ts',
  'lib/ui-strings-vi.ts',
  'lib/ui-strings-zh.ts'
];

// Language code mapping for DeepL API
const LANGUAGE_CODES = {
  'ui-strings-ar.ts': 'AR',
  'ui-strings-de.ts': 'DE', 
  'ui-strings-es.ts': 'ES',
  'ui-strings-fr.ts': 'FR',
  'ui-strings-hi.ts': 'HI',
  'ui-strings-it.ts': 'IT',
  'ui-strings-ja.ts': 'JA',
  'ui-strings-ko.ts': 'KO',
  'ui-strings-pt.ts': 'PT-PT',
  'ui-strings-ru.ts': 'RU',
  'ui-strings-vi.ts': 'VI',
  'ui-strings-zh.ts': 'ZH'
};

/**
 * Flatten a nested object to dot notation
 */
function flattenObject(obj, prefix = '', result = {}) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], newKey, result);
      } else if (typeof obj[key] === 'string') {
        result[newKey] = obj[key];
      }
    }
  }
  return result;
}

/**
 * Parse TypeScript object from file content
 */
function parseUIStringsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Create a temporary JS file to require the TypeScript module
    const tempJsFile = filePath.replace('.ts', '.temp.js');
    
    // Convert TypeScript to JavaScript by removing type annotations
    let jsContent = content
      .replace(/import\s+type\s+{[^}]+}\s+from\s+[^;]+;/g, '') // Remove type imports
      .replace(/:\s*UIStrings/g, '') // Remove type annotations
      .replace(/export\s+interface\s+[\s\S]*?(?=export\s+const)/g, '') // Remove interfaces
      .replace(/\/\*\*[\s\S]*?\*\//g, '') // Remove JSDoc comments
      .replace(/\/\/.*$/gm, ''); // Remove single line comments
    
    // Write temporary file
    fs.writeFileSync(tempJsFile, jsContent);
    
    // Clear require cache and require the temp file
    delete require.cache[path.resolve(tempJsFile)];
    const moduleExports = require(path.resolve(tempJsFile));
    
    // Clean up temp file
    fs.unlinkSync(tempJsFile);
    
    // Extract uiStrings object - try different export names
    const uiStringsObject = moduleExports.uiStrings || 
                           moduleExports.uiStringsAR || 
                           moduleExports.uiStringsDE || 
                           moduleExports.uiStringsES || 
                           moduleExports.uiStringsFR || 
                           moduleExports.uiStringsIT || 
                           moduleExports.uiStringsJA || 
                           moduleExports.uiStringsKO || 
                           moduleExports.uiStringsPT || 
                           moduleExports.uiStringsRU || 
                           moduleExports.uiStringsVI || 
                           moduleExports.uiStringsZH || 
                           moduleExports.uiStringsHI || 
                           moduleExports.default;
    
    if (!uiStringsObject) {
      console.warn(`Could not find uiStrings export in ${filePath}. Available exports:`, Object.keys(moduleExports));
      return {};
    }
    
    return flattenObject(uiStringsObject);
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    
    // Fallback: try to parse with regex
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract string values using regex
      const strings = {};
      const stringMatches = content.matchAll(/(\w+):\s*['"`]([^'"`]*?)['"`]/g);
      
      for (const match of stringMatches) {
        const key = match[1];
        const value = match[2];
        // Only include valid translations (skip placeholders)
        if (value && value.trim() && !value.startsWith('[TRANSLATE]') && !value.startsWith('[UNTRANSLATED]')) {
          strings[key] = value;
        }
      }
      
      return strings;
    } catch (fallbackError) {
      console.error(`Fallback parsing also failed for ${filePath}:`, fallbackError.message);
      return {};
    }
  }
}

/**
 * Parse existing translations from a language file
 */
function parseExistingTranslations(filePath) {
  try {
    // Use the same parsing logic as the master file
    const existingStrings = parseUIStringsFromFile(filePath);
    
    // Filter out [TRANSLATE] placeholders
    const cleanExisting = {};
    for (const [key, value] of Object.entries(existingStrings)) {
      if (value && typeof value === 'string' && value.trim() && 
          !value.startsWith('[TRANSLATE]') && !value.startsWith('[UNTRANSLATED]')) {
        cleanExisting[key] = value;
      }
    }
    
    return cleanExisting;
  } catch (error) {
    console.warn(`Could not parse existing translations from ${filePath}:`, error.message);
    return {};
  }
}

/**
 * Clean text by removing [TRANSLATE] placeholders and other markers
 */
function cleanTextForTranslation(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/\[TRANSLATE\]\s*/g, '') // Remove [TRANSLATE] placeholders
    .replace(/\[UNTRANSLATED\]\s*/g, '') // Remove [UNTRANSLATED] placeholders
    .replace(/\[TODO\]\s*/g, '') // Remove [TODO] markers
    .replace(/\[MISSING\]\s*/g, '') // Remove [MISSING] markers
    .trim();
}

/**
 * Auto-translate using DeepL API with fallbacks
 */
async function translateString(text, targetLangCode) {
  // Clean the text first
  const cleanText = cleanTextForTranslation(text);
  
  if (!cleanText) {
    console.warn(`Empty text after cleaning: "${text}"`);
    return text;
  }
  
  const apiKey = process.env.EXPO_PUBLIC_DEEPL_API_KEY || process.env.DEEPL_AUTH_KEY;

  // Comprehensive fallback translations
  const staticTranslations = {
    'AR': {
      'Back': 'رجوع',
      'Close': 'إغلاق',
      'Menu': 'القائمة',
      'Home': 'الرئيسية',
      'Topics': 'المواضيع',
      'Explore': 'استكشاف',
      'Profile': 'الملف الشخصي',
      'Settings': 'الإعدادات',
      'Loading...': 'جارٍ التحميل...',
      'Error': 'خطأ',
      'Success': 'نجح',
      'Question': 'سؤال',
      'Questions': 'أسئلة',
      'Start Quiz': 'بدء الاختبار',
      'Sign In to Play': 'تسجيل الدخول للعب',
      'Sign In to Save Progress': 'تسجيل الدخول لحفظ التقدم',
      'Analyzing content...': 'تحليل المحتوى...',
      'Translating to {{language}}...': 'الترجمة إلى {{language}}...',
      'Optimizing layout...': 'تحسين التخطيط...',
      '{{count}} elements translated': 'تم ترجمة {{count}} عنصر'
    },
    'DE': {
      'Back': 'Zurück',
      'Close': 'Schließen',
      'Menu': 'Menü',
      'Home': 'Startseite',
      'Topics': 'Themen',
      'Explore': 'Erkunden',
      'Profile': 'Profil',
      'Settings': 'Einstellungen',
      'Loading...': 'Lädt...',
      'Error': 'Fehler',
      'Success': 'Erfolg',
      'Question': 'Frage',
      'Questions': 'Fragen',
      'Start Quiz': 'Quiz starten',
      'Sign In to Play': 'Anmelden zum Spielen',
      'Sign In to Save Progress': 'Anmelden um Fortschritt zu speichern',
      'Analyzing content...': 'Inhalt wird analysiert...',
      'Translating to {{language}}...': 'Übersetzung ins {{language}}...',
      'Optimizing layout...': 'Layout wird optimiert...',
      '{{count}} elements translated': '{{count}} Elemente übersetzt'
    },
    'ES': {
      'Back': 'Atrás',
      'Close': 'Cerrar',
      'Menu': 'Menú',
      'Home': 'Inicio',
      'Topics': 'Temas',
      'Explore': 'Explorar',
      'Profile': 'Perfil',
      'Settings': 'Configuración',
      'Loading...': 'Cargando...',
      'Error': 'Error',
      'Success': 'Éxito',
      'Question': 'Pregunta',
      'Questions': 'Preguntas',
      'Start Quiz': 'Iniciar Quiz',
      'Sign In to Play': 'Iniciar Sesión para Jugar',
      'Sign In to Save Progress': 'Iniciar Sesión para Guardar Progreso',
      'Analyzing content...': 'Analizando contenido...',
      'Translating to {{language}}...': 'Traduciendo a {{language}}...',
      'Optimizing layout...': 'Optimizando diseño...',
      '{{count}} elements translated': '{{count}} elementos traducidos'
    },
    'FR': {
      'Back': 'Retour',
      'Close': 'Fermer',
      'Menu': 'Menu',
      'Home': 'Accueil',
      'Topics': 'Sujets',
      'Explore': 'Explorer',
      'Profile': 'Profil',
      'Settings': 'Paramètres',
      'Loading...': 'Chargement...',
      'Error': 'Erreur',
      'Success': 'Succès',
      'Question': 'Question',
      'Questions': 'Questions',
      'Start Quiz': 'Commencer le Quiz',
      'Sign In to Play': 'Se connecter pour jouer',
      'Sign In to Save Progress': 'Se connecter pour sauvegarder',
      'Analyzing content...': 'Analyse du contenu...',
      'Translating to {{language}}...': 'Traduction vers {{language}}...',
      'Optimizing layout...': 'Optimisation de la mise en page...',
      '{{count}} elements translated': '{{count}} éléments traduits'
    },
    'IT': {
      'Back': 'Indietro',
      'Close': 'Chiudi',
      'Menu': 'Menu',
      'Home': 'Home',
      'Topics': 'Argomenti',
      'Explore': 'Esplora',
      'Profile': 'Profilo',
      'Settings': 'Impostazioni',
      'Loading...': 'Caricamento...',
      'Error': 'Errore',
      'Success': 'Successo',
      'Question': 'Domanda',
      'Questions': 'Domande',
      'Start Quiz': 'Inizia Quiz',
      'Sign In to Play': 'Accedi per giocare',
      'Sign In to Save Progress': 'Accedi per salvare i progressi',
      'Analyzing content...': 'Analisi del contenuto...',
      'Translating to {{language}}...': 'Traduzione in {{language}}...',
      'Optimizing layout...': 'Ottimizzazione del layout...',
      '{{count}} elements translated': '{{count}} elementi tradotti'
    },
    'PT-PT': {
      'Back': 'Voltar',
      'Close': 'Fechar',
      'Menu': 'Menu',
      'Home': 'Início',
      'Topics': 'Tópicos',
      'Explore': 'Explorar',
      'Profile': 'Perfil',
      'Settings': 'Configurações',
      'Loading...': 'Carregando...',
      'Error': 'Erro',
      'Success': 'Sucesso',
      'Question': 'Pergunta',
      'Questions': 'Perguntas',
      'Start Quiz': 'Iniciar Quiz',
      'Sign In to Play': 'Entrar para Jogar',
      'Sign In to Save Progress': 'Entrar para Salvar Progresso',
      'Analyzing content...': 'Analisando conteúdo...',
      'Translating to {{language}}...': 'Traduzindo para {{language}}...',
      'Optimizing layout...': 'Otimizando layout...',
      '{{count}} elements translated': '{{count}} elementos traduzidos'
    }
  };

  // Try DeepL API first if key is available
  if (apiKey) {
    try {
      const deeplTarget = targetLangCode;
      const baseUrl = apiKey.endsWith(':fx') 
        ? 'https://api-free.deepl.com' 
        : 'https://api.deepl.com';

      const response = await fetch(`${baseUrl}/v2/translate`, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: [cleanText],
          target_lang: deeplTarget,
          preserve_formatting: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.translations && result.translations[0] && result.translations[0].text) {
          return result.translations[0].text;
        }
      } else {
        console.warn(`DeepL API error ${response.status} for ${targetLangCode}`);
      }
    } catch (err) {
      console.warn(`DeepL translation failed for ${targetLangCode}:`, err.message);
    }
  }

  // Fall back to static translations (try both cleaned and original text)
  const fallback = staticTranslations[targetLangCode]?.[cleanText] || staticTranslations[targetLangCode]?.[text];
  if (fallback) {
    return fallback;
  }

  // Last resort: return cleaned text with [TRANSLATE] marker
  return `[TRANSLATE] ${cleanText}`;
}

/**
 * Find missing keys by comparing flattened objects
 */
function findMissingKeys(masterKeys, existingKeys) {
  const missing = {};
  
  for (const [key, value] of Object.entries(masterKeys)) {
    // Check if this exact key path exists in the existing translations
    if (!existingKeys.hasOwnProperty(key)) {
      missing[key] = value;
    }
  }
  
  return missing;
}

/**
 * Clean up [TRANSLATE] placeholders from a file
 */
function cleanupTranslatePlaceholders(filePath, dryRun = false) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;
    
    // Replace [TRANSLATE] placeholders with empty strings or remove the lines
    const originalContent = content;
    
    // Pattern to match lines with [TRANSLATE] placeholders
    content = content.replace(/(\s*)(\w+):\s*['"`]\[TRANSLATE\][^'"`]*['"`],?\s*\n/g, '');
    content = content.replace(/(\s*)(\w+):\s*['"`]\[UNTRANSLATED\][^'"`]*['"`],?\s*\n/g, '');
    
    if (content !== originalContent) {
      if (!dryRun) {
        fs.writeFileSync(filePath, content, 'utf-8');
      }
      hasChanges = true;
      console.log(`  🧹 ${dryRun ? 'Would clean up' : 'Cleaned up'} [TRANSLATE] placeholders in ${path.basename(filePath)}`);
    }
    
    return hasChanges;
  } catch (error) {
    console.warn(`Could not clean up placeholders in ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Update a language file with missing translations
 */
async function updateLanguageFile(filePath, masterKeys, dryRun = false) {
  const fileName = path.basename(filePath);
  const langCode = LANGUAGE_CODES[fileName];
  
  if (!langCode) {
    console.log(`❌ Unknown language code for ${fileName}`);
    return;
  }
  
  console.log(`🌍 Checking ${fileName} (${langCode})...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  // Clean up any existing [TRANSLATE] placeholders first
  cleanupTranslatePlaceholders(filePath, dryRun);
  
  const existingTranslations = parseExistingTranslations(filePath);
  const missingKeys = findMissingKeys(masterKeys, existingTranslations);
  
  if (Object.keys(missingKeys).length === 0) {
    console.log(`  ✨ ${fileName} is up to date`);
    return;
  }
  
  console.log(`  📝 Found ${Object.keys(missingKeys).length} missing keys`);
  
  // Translate missing keys
  const translations = {};
  for (const [key, englishText] of Object.entries(missingKeys)) {
    try {
      const translatedText = await translateString(englishText, langCode);
      translations[key] = translatedText;
      console.log(`    ✅ ${key.split('.').pop()}: "${translatedText}"`);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn(`    ⚠️  Failed to translate ${key}:`, error.message);
      translations[key] = `[TRANSLATE] ${englishText}`;
    }
  }
  
  // Update the file content
  let content = fs.readFileSync(filePath, 'utf-8');
  let hasUpdates = false;
  
  // Add missing translations to appropriate sections
  for (const [fullKey, translatedText] of Object.entries(translations)) {
    const keyParts = fullKey.split('.');
    
    if (keyParts.length === 1) {
      // Top-level key
      const key = keyParts[0];
      const keyRegex = new RegExp(`(\\s*)(${key}:\\s*)(['"\`])[^'"\`]*['"\`]`, 'g');
      if (!content.includes(`${key}: '`) && !content.includes(`${key}: "`)) {
        // Add new top-level key before the closing brace
        const insertPoint = content.lastIndexOf('};');
        if (insertPoint > -1) {
          const newLine = `  ${key}: '${translatedText.replace(/'/g, "\\'")}',\n`;
          content = content.slice(0, insertPoint) + newLine + content.slice(insertPoint);
          hasUpdates = true;
        }
      }
    } else if (keyParts.length === 2) {
      // Nested key (section.key)
      const section = keyParts[0];
      const finalKey = keyParts[1];
      
      // Look for the section and add the missing key
      const sectionRegex = new RegExp(`(${section}:\\s*{[\\s\\S]*?)(\\s*}(?=,?\\s*\\n))`, 'g');
      const matches = [...content.matchAll(sectionRegex)];
      
      if (matches.length > 0) {
        const match = matches[0];
        const beforeClosing = match[1];
        const closing = match[2];
        
        // Check if key already exists in this section
        const keyExists = beforeClosing.includes(`${finalKey}:`);
        
        if (!keyExists) {
          // Add the new key with proper indentation
          const indent = '    '; // 4 spaces for nested keys
          const escapedText = translatedText.replace(/'/g, "\\'").replace(/\n/g, '\\n');
          const newLine = `${indent}${finalKey}: '${escapedText}',`;
          
          // Insert before the closing brace
          const updated = beforeClosing + '\n' + newLine + closing;
          content = content.replace(match[0], updated);
          hasUpdates = true;
        }
      }
    }
  }
  
  if (hasUpdates && !dryRun) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  💾 Updated ${fileName} with ${Object.keys(translations).length} new translations`);
  } else if (hasUpdates && dryRun) {
    console.log(`  💾 Would update ${fileName} with ${Object.keys(translations).length} new translations`);
  } else {
    console.log(`  ℹ️  No updates needed for ${fileName}`);
  }
}

/**
 * Main sync function
 */
async function syncUIStrings(dryRun = false) {
  console.log(`🚀 Starting comprehensive UI Strings synchronization${dryRun ? ' (DRY RUN)' : ''}...\n`);
  
  // Parse the master ui-strings.ts file
  console.log('📖 Reading master ui-strings.ts...');
  const masterKeys = parseUIStringsFromFile('lib/ui-strings.ts');
  
  if (Object.keys(masterKeys).length === 0) {
    console.error('❌ Could not parse master ui-strings.ts file');
    return;
  }
  
  console.log(`📊 Found ${Object.keys(masterKeys).length} total string keys in master file\n`);
  
  // Process each language file
  for (const filePath of LANGUAGE_FILES) {
    await updateLanguageFile(filePath, masterKeys, dryRun);
  }
  
  console.log('\n✅ UI Strings synchronization complete!');
  console.log('💡 Run `npm run typecheck` to verify no TypeScript errors remain.');
}

// Run the script
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node sync-ui-strings.js [options]

Options:
  --dry-run, -d    Show what would be changed without making actual changes
  --help, -h       Show this help message

Examples:
  node sync-ui-strings.js               # Run the sync
  node sync-ui-strings.js --dry-run     # Preview changes without applying them
`);
    process.exit(0);
  }
  
  syncUIStrings(dryRun).catch(console.error);
}

module.exports = { syncUIStrings }; 