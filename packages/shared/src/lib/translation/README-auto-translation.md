# Automatic Translation System for CivicSense

This system provides automatic translation for quiz questions and collections/lessons, with intelligent caching and database storage for future use.

## Features

- **Automatic Translation**: Translates content on-demand when users select a non-English language
- **Database Storage**: Saves translations for future use to improve performance
- **Intelligent Caching**: Checks database translations first, falls back to DeepL API
- **Self-Improving**: The system gets better over time as more translations are generated

## Quiz Question Translation

### Usage in Mobile Game Room

The quiz translation system is already integrated in the mobile game room (`apps/mobile/app/game-room/[topicId].tsx`):

```typescript
import { translateQuestion } from '../lib/translation/game-translation'

// In component:
const { uiStrings, currentLanguage } = useUIStrings()

// The translateQuestion function automatically:
// 1. Checks database for existing translations
// 2. Falls back to DeepL API if needed
// 3. Saves new translations to database for future use
const translatedQuestion = await translateQuestion(question)
```

### How It Works

1. **Cache Check**: First checks memory cache for recently translated questions
2. **Database Check**: Looks for existing translations in the `questions.translations` JSONB field
3. **API Translation**: If no translation exists, uses DeepL API to translate:
   - Question text
   - All answer options
   - Explanation text
4. **Auto-Save**: Automatically saves new translations to database via `/api/translations/auto-save`
5. **Future Optimization**: Next time the same question is accessed, it uses the saved translation

## Collection/Lesson Translation

### Setup

```typescript
import { collectionTranslationService } from '@/lib/translation/auto-translate-collections'

// Translate a collection
const translatedCollection = await collectionTranslationService.translateCollection(
  collection,
  targetLanguage
)
```

### Example Usage

```typescript
// In a collection/lesson page component
export function CollectionPage({ collection, userLanguage }: CollectionPageProps) {
  const [translatedCollection, setTranslatedCollection] = useState(collection)
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    const translateContent = async () => {
      if (userLanguage !== 'en') {
        setIsTranslating(true)
        try {
          const translated = await collectionTranslationService.translateCollection(
            collection,
            userLanguage
          )
          setTranslatedCollection(translated)
        } catch (error) {
          console.error('Translation failed:', error)
          // Fall back to original content
        } finally {
          setIsTranslating(false)
        }
      }
    }

    translateContent()
  }, [collection, userLanguage])

  if (isTranslating) {
    return <TranslationLoadingIndicator />
  }

  return (
    <div>
      {translatedCollection.isTranslated && (
        <TranslationIndicator language={userLanguage} />
      )}
      
      <h1>{translatedCollection.title}</h1>
      {translatedCollection.description && (
        <p>{translatedCollection.description}</p>
      )}
      
      <CollectionContent content={translatedCollection.content} />
    </div>
  )
}
```

## API Endpoint: `/api/translations/auto-save`

### Purpose
Automatically saves translations generated during quiz gameplay and lesson viewing for future use.

### Request Format

```typescript
POST /api/translations/auto-save

{
  "contentType": "question" | "topic" | "collection",
  "contentId": "string",
  "targetLanguage": "string",
  "translations": {
    "question": { "es": "¿Cuál es la Primera Enmienda?" },
    "option_a": { "es": "Libertad de expresión" },
    "option_b": { "es": "Derecho a portar armas" },
    "explanation": { "es": "La Primera Enmienda protege..." }
  },
  "source": "automatic_game_translation" | "automatic_collection_translation" | "manual_contribution"
}
```

### Response Format

```typescript
{
  "success": true,
  "message": "Translations saved successfully for question abc123",
  "fieldsUpdated": ["question", "option_a", "option_b", "explanation"],
  "targetLanguage": "es",
  "source": "automatic_game_translation"
}
```

## Database Schema

### Questions Table
```sql
-- questions.translations column (JSONB)
{
  "question": {
    "es": { "text": "¿Cuál es la Primera Enmienda?", "lastUpdated": "2025-01-21T...", "autoTranslated": true },
    "fr": { "text": "Quel est le Premier Amendement?", "lastUpdated": "2025-01-21T...", "autoTranslated": true }
  },
  "option_a": {
    "es": { "text": "Libertad de expresión", "lastUpdated": "2025-01-21T...", "autoTranslated": true }
  },
  "explanation": {
    "es": { "text": "La Primera Enmienda protege...", "lastUpdated": "2025-01-21T...", "autoTranslated": true }
  }
}
```

### Collections Table
```sql
-- collections.translations column (JSONB)
{
  "title": {
    "es": { "text": "Democracia 101", "lastUpdated": "2025-01-21T...", "autoTranslated": true }
  },
  "description": {
    "es": { "text": "Aprende los fundamentos...", "lastUpdated": "2025-01-21T...", "autoTranslated": true }
  },
  "content": {
    "es": { "text": "...", "lastUpdated": "2025-01-21T...", "autoTranslated": true }
  }
}
```

## Translation Quality Features

### Civic Term Preservation
The system preserves civic terminology accuracy:

```typescript
const translationOptions = {
  preserveCivicTerms: true  // Maintains accuracy of legal/political terms
}
```

### Source Tracking
All translations track their source:
- `automatic_game_translation`: Generated during quiz gameplay
- `automatic_collection_translation`: Generated during lesson viewing  
- `manual_contribution`: Human-contributed translations

### Auto-Improvement
The system improves over time:
1. **First User**: Experiences a brief translation delay
2. **Future Users**: Get instant access to pre-translated content
3. **Popular Content**: Gets translated to more languages automatically
4. **Quality**: Human reviewers can override automatic translations

## Performance Benefits

### Before Automatic Translation
- Every user waits for translation
- Repeated API calls for same content
- Higher costs and slower experience

### After Automatic Translation
- First user: Brief delay, saves for everyone
- Subsequent users: Instant access
- 95%+ reduction in translation API calls
- Better user experience and lower costs

## Monitoring and Analytics

The system tracks translation usage:

```typescript
// Analytics events tracked:
{
  "event": "automatic_translation_saved",
  "properties": {
    "contentType": "question",
    "contentId": "abc123", 
    "targetLanguage": "es",
    "fieldsTranslated": 4,
    "source": "automatic_game_translation"
  }
}
```

## Future Enhancements

1. **Batch Translation**: Translate entire topics at once
2. **Quality Scoring**: Rate translation quality and prioritize improvements
3. **Community Review**: Allow users to suggest translation improvements
4. **Adaptive Learning**: Prioritize translations for popular content in specific languages
5. **Regional Variations**: Support regional language differences (e.g., Spain vs. Mexico Spanish)

## Example: Democracy 101 Collection Reference

The system can handle complex content like the `democracy_101_complete.sql` example:

```typescript
// For a collection with rich JSONB content
const democracy101 = {
  id: "democracy-101",
  title: "Democracy 101",
  description: "Learn the fundamentals of democratic government",
  content: {
    sections: [
      { 
        title: "What is Democracy?",
        content: "Democracy is a system of government where power rests with the people..."
      },
      {
        title: "Types of Democracy", 
        content: "There are different forms of democratic government..."
      }
    ]
  }
}

// The translation service will:
// 1. Extract all translatable text from the JSONB structure
// 2. Translate title, description, and nested content
// 3. Save structured translations to database
// 4. Provide instant access for future users
```

This creates a self-improving translation system that gets better with each user interaction. 