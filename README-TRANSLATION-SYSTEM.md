# CivicSense Translation System

## Overview

CivicSense now features a comprehensive translation system that supports both UI strings and dynamic content using DeepL API. The system provides:

- **UI String Translations**: Static interface text stored in database with JSONB
- **Content Translations**: Dynamic quiz questions, topics, and other content
- **Runtime Translation**: Real-time page translation with caching
- **Admin Management**: Complete translation management dashboard

## 🚀 Quick Start

### 1. Database Setup

Run the migrations to set up translation tables:

```bash
# Add JSONB translation columns to existing tables
supabase migration up 043_add_jsonb_translations.sql

# Add UI string translations table
supabase migration up 044_add_ui_string_translations.sql
```

### 2. Environment Configuration

Add DeepL API configuration to your `.env.local`:

```env
DEEPL_API_KEY=your_deepl_api_key_here
DEEPL_API_URL=https://api-free.deepl.com/v2/translate
```

### 3. Language Provider Setup

Wrap your app with the enhanced language provider (already done in your layout):

```tsx
import { LanguageProvider } from '@/components/providers/language-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
```

## 📖 Usage Guide

### UI String Translations

#### Basic Usage

```tsx
import { useUIString, useUISection } from '@/hooks/useUIStrings'

function MyComponent() {
  // Single string
  const welcomeText = useUIString('messages.welcome')
  
  // Section of strings
  const authStrings = useUISection('auth')
  
  return (
    <div>
      <h1>{welcomeText}</h1>
      <button>{authStrings.signIn.title}</button>
    </div>
  )
}
```

#### Typed UI Helpers

For better IDE support and type safety:

```tsx
import { ui } from '@/hooks/useUIStrings'

function ActionButtons() {
  return (
    <div>
      <button>{ui.actions.continue()}</button>
      <button>{ui.actions.save()}</button>
      <button>{ui.quiz.startQuiz()}</button>
    </div>
  )
}
```

#### UI Text Component

For simple cases:

```tsx
import { UIText } from '@/hooks/useUIStrings'

function SimpleComponent() {
  return <UIText path="messages.success" className="text-green-600" />
}
```

### Content Translations

#### Quiz Questions

```tsx
import { useTranslatedQuiz } from '@/hooks/useQuizTranslation'

function QuizComponent({ questions }) {
  const { questions: translatedQuestions, isTranslating } = useTranslatedQuiz(questions)
  
  return (
    <div>
      {isTranslating && <div>Translating...</div>}
      {translatedQuestions.map(q => (
        <div key={q.id}>
          <h3>{q.question}</h3>
          <p>{q.explanation}</p>
        </div>
      ))}
    </div>
  )
}
```

#### Individual Entities with JSONB

```tsx
import { useTranslatedEntity } from '@/hooks/useJSONBTranslation'

function QuestionCard({ question }) {
  const { entity, isTranslating } = useTranslatedEntity(question, {
    tableName: 'questions',
    fields: [
      { fieldName: 'question' },
      { fieldName: 'explanation' },
      { fieldName: 'hint' }
    ]
  })
  
  if (!entity) return <div>Loading...</div>
  
  return (
    <div>
      <h3>{entity.question}</h3>
      <p>{entity.explanation}</p>
      {entity.hint && <p>💡 {entity.hint}</p>}
    </div>
  )
}
```

### Language Switching

#### Basic Switcher

```tsx
import { LanguageSwitcher } from '@/components/language-switcher'

function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  )
}
```

#### Variants

```tsx
// Compact version for limited space
<LanguageSwitcher variant="compact" />

// Minimal version
<LanguageSwitcher variant="minimal" />

// Flag buttons only
<LanguageFlags />

// Status indicator
<LanguageStatus />
```

## 🔧 Administration

### Translation Management Dashboard

Access the admin dashboard to manage translations:

```tsx
import { TranslationManager } from '@/components/admin/translation-manager'

function AdminTranslationPage() {
  return <TranslationManager />
}
```

Features:
- **Overview**: Translation progress across all languages
- **Batch Generation**: Generate missing translations for all languages
- **Statistics**: Track completion rates and usage
- **Manual Management**: Update specific translations

### Generating UI Translations

#### Programmatic Generation

```tsx
import { useUITranslationAdmin } from '@/hooks/useUIStrings'

function AdminComponent() {
  const { generateTranslations, getStats } = useUITranslationAdmin()
  
  const handleGenerateSpanish = async () => {
    const success = await generateTranslations('es')
    if (success) {
      console.log('Spanish translations generated!')
    }
  }
  
  return <button onClick={handleGenerateSpanish}>Generate Spanish</button>
}
```

#### API Endpoints

```bash
# Generate UI translations for Spanish
POST /api/translation/ui-strings
{
  "action": "generate",
  "language_code": "es"
}

# Get translation statistics
GET /api/translation/ui-strings

# Update specific translations
POST /api/translation/ui-strings
{
  "action": "update", 
  "language_code": "es",
  "translations": {...}
}
```

### Content Translation Management

#### Generate JSONB Translations

```tsx
import { useJSONBTranslation } from '@/hooks/useJSONBTranslation'

function ContentAdmin() {
  const { generateAndSaveTranslations } = useJSONBTranslation({
    tableName: 'questions'
  })
  
  const translateQuestions = async () => {
    const success = await generateAndSaveTranslations(
      question,
      ['es', 'fr', 'de'], // target languages
      ['question', 'explanation', 'hint'] // fields to translate
    )
  }
}
```

## 📊 Supported Languages

The system supports all DeepL languages:

- **Popular**: English, Spanish, French, German, Italian, Portuguese
- **European**: Dutch, Polish, Russian, Czech, Slovak, etc.
- **Asian**: Japanese, Korean, Chinese (Simplified & Traditional)
- **And more**: Arabic, Turkish, Ukrainian, etc.

## 🎯 Performance Features

### Caching Strategy

1. **JSONB Storage**: Translations stored in database for fast access
2. **Runtime Cache**: In-memory caching for current session
3. **API Optimization**: Batch translations to reduce API calls
4. **Smart Loading**: Only load translations when language changes

### Rate Limiting

- **Built-in delays**: Automatic delays between API calls
- **Batch processing**: Up to 50 texts per DeepL API call
- **Error handling**: Graceful fallbacks for failed translations

## 🛠 Advanced Configuration

### Custom Translation Fields

Add new translatable fields to your content:

```typescript
// In your migration
ALTER TABLE your_table 
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

// In your component
const { entity } = useTranslatedEntity(item, {
  tableName: 'your_table',
  fields: [
    { fieldName: 'title' },
    { fieldName: 'description' },
    { fieldName: 'custom_field' }
  ]
})
```

### Translation Quality Control

#### Validation Functions

```sql
-- Check translation structure
SELECT validate_translation_structure(translations) FROM questions;

-- Get translation stats
SELECT * FROM get_ui_translation_stats();
```

#### Manual Review Workflow

```tsx
import { useJSONBTranslation } from '@/hooks/useJSONBTranslation'

function TranslationReview() {
  const { saveTranslations } = useJSONBTranslation()
  
  const approveTranslation = async (entityId, translations) => {
    // Add review metadata
    const reviewedTranslations = {
      ...translations,
      reviewedBy: 'admin@example.com',
      reviewedAt: new Date().toISOString()
    }
    
    await saveTranslations(entityId, reviewedTranslations)
  }
}
```

## 🔍 Testing

### Translation Test Page

Visit `/test-translation` to test the translation system:

1. **UI String Tests**: See interface text change with language
2. **Content Tests**: Test quiz question translations
3. **JSONB Tests**: Test database-stored translations
4. **Page Translation**: Test full page runtime translation

### Debugging

Enable debug mode for translation tracking:

```tsx
const { translateQuestion } = useQuizTranslation({
  debug: true // Logs translation process
})
```

## 📈 Monitoring

### Translation Analytics

Track translation usage and effectiveness:

```typescript
// Get translation statistics
const stats = await uiTranslationService.getTranslationStats()

// Monitor API usage
const costs = await getTranslationCosts({
  start: new Date('2024-01-01'),
  end: new Date()
})
```

### Error Tracking

Monitor translation failures:

```typescript
// Translation errors are automatically logged
// Check browser console and server logs for:
// - API rate limiting
// - Failed translations
// - Cache misses
// - Invalid language codes
```

## 🚨 Troubleshooting

### Common Issues

1. **Missing Translations**
   - Check if language code is supported
   - Verify DeepL API key is configured
   - Check database migration status

2. **Performance Issues**
   - Enable caching in translation hooks
   - Use batch translation for multiple items
   - Check database indexes on translation columns

3. **Type Errors**
   - Ensure entity has required fields
   - Check translation structure in database
   - Verify field names match schema

### Debug Commands

```bash
# Check translation table structure
psql -d your_db -c "SELECT * FROM ui_string_translations LIMIT 1;"

# Test DeepL API connection
curl -X POST 'https://api-free.deepl.com/v2/translate' \
  --header 'Authorization: DeepL-Auth-Key YOUR_KEY' \
  --data '{"text":["Hello"],"target_lang":"ES"}'

# Check translation statistics
psql -d your_db -c "SELECT * FROM get_ui_translation_stats();"
```

## 🔮 Future Enhancements

- **Translation Memory**: Reuse previous translations
- **Custom Glossaries**: Civic-specific term translations
- **Quality Scoring**: Automatic quality assessment
- **A/B Testing**: Test translation effectiveness
- **Offline Support**: Cache translations for offline use

## 🤝 Contributing

When adding new UI strings:

1. Add to `lib/ui-strings.ts`
2. Update type definitions
3. Generate translations for new strings
4. Test with multiple languages

When adding translatable content:

1. Add `translations` JSONB column to table
2. Update translation hooks to include new fields
3. Create migration for existing data
4. Add to admin translation dashboard

---

**Questions?** Check the existing implementation in the test page or admin dashboard for examples! 