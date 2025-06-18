# JSONB Translation System for CivicSense

This document explains how to use the JSONB translation system for storing and managing translations in the CivicSense database.

## Overview

The JSONB translation system provides:
- Database-stored translations for all content
- Automatic fallback to runtime translation (DeepL API)
- Efficient caching and batch processing
- Support for multiple languages
- Easy integration with existing components

## Database Structure

### Translation Column

Each translatable table now has a `translations` JSONB column with the following structure:

```json
{
  "field_name": {
    "language_code": {
      "text": "Translated text",
      "lastUpdated": "2024-01-15T10:30:00Z",
      "autoTranslated": true,
      "reviewedBy": "admin@example.com",
      "reviewedAt": "2024-01-16T14:00:00Z"
    }
  }
}
```

Example for a question:
```json
{
  "question": {
    "es": {
      "text": "¿Cuál es la capital de Francia?",
      "lastUpdated": "2024-01-15T10:30:00Z",
      "autoTranslated": true
    },
    "fr": {
      "text": "Quelle est la capitale de la France?",
      "lastUpdated": "2024-01-15T10:30:00Z",
      "autoTranslated": false,
      "reviewedBy": "editor@example.com",
      "reviewedAt": "2024-01-16T14:00:00Z"
    }
  },
  "explanation": {
    "es": {
      "text": "París es la capital de Francia desde 987 d.C.",
      "lastUpdated": "2024-01-15T10:30:00Z",
      "autoTranslated": true
    }
  }
}
```

## Using the Translation Hooks

### Basic Quiz Translation

```typescript
import { useTranslatedQuiz } from '@/hooks/useQuizTranslation'

function QuizComponent({ questions }) {
  // Automatically translates questions based on current language
  const { questions: translatedQuestions, isTranslating } = useTranslatedQuiz(questions)
  
  if (isTranslating) {
    return <div>Translating...</div>
  }
  
  return (
    <div>
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

### Manual Translation with Save

```typescript
import { useQuizTranslation } from '@/hooks/useQuizTranslation'

function TranslationEditor() {
  const { translateQuestion, saveQuestionTranslation } = useQuizTranslation()
  
  const handleTranslateAndSave = async (question, targetLanguage) => {
    // Translate the question
    const translated = await translateQuestion(question, targetLanguage)
    
    // Save to database
    await saveQuestionTranslation(
      question.id,
      'question',
      targetLanguage,
      translated.question
    )
  }
}
```

### Batch Translation

```typescript
const { translateQuestions, saveQuestionTranslations } = useQuizTranslation()

// Translate multiple questions
const translatedQuestions = await translateQuestions(questions, 'es')

// Save all translations
for (const [index, question] of questions.entries()) {
  const translated = translatedQuestions[index]
  
  await saveQuestionTranslations(question.id, {
    question: { es: translated.question },
    explanation: { es: translated.explanation },
    hint: { es: translated.hint }
  })
}
```

## Database Functions

The migration provides PostgreSQL functions for working with translations:

### get_translation

Get a translation for a specific field and language:

```sql
SELECT get_translation(translations, 'question', 'es', 'en') 
FROM questions 
WHERE id = 'some-id';
```

### set_translation

Set or update a translation:

```sql
UPDATE questions 
SET translations = set_translation(
  translations,
  'question',
  'es',
  '¿Cuál es la capital de Francia?',
  true, -- auto_translated
  'admin@example.com' -- reviewed_by
)
WHERE id = 'some-id';
```

### validate_translation_structure

Validate that translations follow the correct structure:

```sql
SELECT validate_translation_structure(translations) 
FROM questions;
```

## API Integration

### Fetching Translated Content

When fetching content from the API, translations are automatically included:

```typescript
const { data: questions } = await supabase
  .from('questions')
  .select('*, translations')
  .eq('topic_id', topicId)
```

### Using Translations in Components

The translation hooks automatically handle:
1. Checking for JSONB translations
2. Falling back to runtime translation if needed
3. Caching results
4. Updating UI when language changes

```typescript
function QuizQuestion({ question }) {
  const { entity: translatedQuestion } = useTranslatedEntity(question, {
    tableName: 'questions',
    fields: [
      { fieldName: 'question' },
      { fieldName: 'explanation' },
      { fieldName: 'hint' }
    ]
  })
  
  return (
    <div>
      <h3>{translatedQuestion?.question}</h3>
      <p>{translatedQuestion?.explanation}</p>
    </div>
  )
}
```

## Migration Guide

### Adding Translations to Existing Tables

1. Run the migration to add translation columns:
```bash
supabase migration up
```

2. Generate translations for existing content:
```typescript
const { generateAndSaveTranslations } = useJSONBTranslation({
  tableName: 'questions'
})

// Generate translations for Spanish and French
await generateAndSaveTranslations(
  question,
  ['es', 'fr'],
  ['question', 'explanation', 'hint']
)
```

### Converting from Runtime to JSONB

If you're currently using runtime translation:

1. Keep runtime translation as fallback
2. Gradually save translations to database
3. Monitor performance improvements
4. Remove runtime translation once all content is translated

## Best Practices

### 1. Always Use Hooks

Use the provided hooks instead of manual translation:
```typescript
// Good ✅
const { questions } = useTranslatedQuiz(questions)

// Avoid ❌
const translated = questions.map(q => manuallyTranslate(q))
```

### 2. Cache Translations

Enable caching to reduce API calls:
```typescript
const { translateQuestion } = useQuizTranslation({
  cacheResults: true,
  cacheTimeout: 24 * 60 * 60 * 1000 // 24 hours
})
```

### 3. Batch Operations

Translate multiple items together:
```typescript
// Good ✅
const translations = await translateBatch(texts, 'es')

// Avoid ❌
for (const text of texts) {
  await translate(text, 'es')
}
```

### 4. Validate Translations

Use the validation function to ensure data integrity:
```sql
ALTER TABLE questions
ADD CONSTRAINT check_valid_translations
CHECK (validate_translation_structure(translations));
```

## Language Support

The system supports all languages from the DeepL API:
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Dutch (nl)
- Polish (pl)
- Russian (ru)
- Japanese (ja)
- Chinese Simplified (zh)
- And many more...

## Performance Considerations

### Database Indexes

GIN indexes are created for efficient JSONB queries:
```sql
CREATE INDEX idx_questions_translations ON questions USING gin(translations);
```

### Query Optimization

When querying specific translations:
```sql
-- Efficient: Uses index
SELECT * FROM questions 
WHERE translations->'question'->>'es' IS NOT NULL;

-- Less efficient: Full scan
SELECT * FROM questions 
WHERE translations::text LIKE '%español%';
```

### Caching Strategy

1. **Database Level**: JSONB storage eliminates repeated API calls
2. **Application Level**: In-memory caching for current session
3. **CDN Level**: Cache translated pages at edge locations

## Troubleshooting

### Common Issues

1. **Missing Translations**
   - Check if field is included in translation configuration
   - Verify language code is correct
   - Ensure fallback is enabled

2. **Performance Issues**
   - Enable caching
   - Use batch translation
   - Check database indexes

3. **Type Errors**
   - Ensure entity has `id` field
   - Check field names match database schema
   - Verify translation structure

### Debug Mode

Enable debug logging:
```typescript
const { translateQuestion } = useQuizTranslation({
  debug: true // Logs translation process
})
```

## Future Enhancements

1. **Translation Management UI**
   - Review and approve translations
   - Track translation coverage
   - Export/import translations

2. **Machine Translation Improvements**
   - Custom glossaries for civic terms
   - Context-aware translation
   - Translation memory

3. **Performance Optimizations**
   - Preload common translations
   - Progressive translation loading
   - Edge translation caching

## Support

For questions or issues with the translation system:
1. Check this documentation
2. Review the example implementations
3. Contact the development team

Remember: The goal is to make civic education accessible to everyone, regardless of language! 