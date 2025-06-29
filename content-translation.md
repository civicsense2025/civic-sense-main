# CivicSense Translation System
*Comprehensive documentation for multilingual civic education across web and mobile platforms*

## 🌍 Overview

CivicSense's translation system makes civic education accessible to US immigrants in their native languages while preserving American civic concepts. The system supports both web and mobile platforms with:

- **English ↔ Foreign Language Only**: Bidirectional translation for US immigrants learning American civics
- **Community Contributions**: User-submitted translations with admin review
- **DeepL Integration**: AI-powered translation suggestions and improvements
- **Database Storage**: JSONB translations in `questions` and `question_topics` tables
- **Mobile Audio**: Text-to-speech in multiple languages with translation caching

## 🏗️ System Architecture

### Database Structure

Translations are stored in JSONB columns across multiple tables:
- `question_topics` - Topic titles, descriptions, why_this_matters
- `questions` - Question text and explanations
- `pending_translations` - User contributions awaiting review

### JSONB Translation Format
```json
{
  "field_name": {
    "language_code": {
      "text": "Translated content",
      "lastUpdated": "2024-01-15T10:30:00Z",
      "autoTranslated": true,
      "contributor": "user@example.com"
    }
  }
}
```

### Supported Languages (30+)
```javascript
// Core languages for US immigrants
['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ru', 'ar', 'pl', 'nl']
```

## 🌐 Web Platform Implementation

### Frontend Components

#### TopicLanguageSwitcher
```tsx
<TopicLanguageSwitcher 
  availableLanguages={availableLanguages}
  contentType="topic"
  contentId={topicData.topic_id}
  contentData={topicData}
/>
```

#### Translation Hook
```tsx
const { 
  getTranslatedField, 
  getAvailableLanguages,
  needsTranslation,
  canContribute 
} = useTranslatedContent(topicData)

const translatedTopic = getTranslatedField('topic_title', topicData.topic_title)
```

#### Contribution Modal
```tsx
<TranslationContributionModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  contentType="topic"
  contentId={topicData.topic_id}
  targetLanguage="es"
  fields={[
    { key: 'topic_title', label: 'Title', originalText: topicData.topic_title },
    { key: 'description', label: 'Description', originalText: topicData.description }
  ]}
/>
```

### API Endpoints

#### Get Available Languages
```
GET /api/topics/[topicId]/languages
```

#### Submit Translation Contribution
```
POST /api/translations/contribute
{
  contentType: 'topic',
  contentId: 'constitutional-rights',
  targetLanguage: 'es',
  translations: { topic_title: 'Derechos Constitucionales' },
  contributor: { name: 'María García', email: 'maria@example.com' }
}
```

#### Admin Review
```
POST /api/admin/translation-contributions/review
{
  contributionId: 'uuid',
  action: 'approve',
  qualityScore: 5,
  reviewNotes: 'Excellent translation'
}
```

#### DeepL Suggestions
```
POST /api/translations/deepl-suggest
{
  texts: ['Constitutional Rights', 'Learn about fundamental rights'],
  targetLanguage: 'es',
  sourceLanguage: 'en'
}
```

## 📱 Mobile Platform Implementation

### Mobile Translation Service
```typescript
import { deepLTranslationService } from '@/lib/translation/deepl-service';

// Initialize service
await deepLTranslationService.initialize();

// Translate civic content
const translated = await deepLTranslationService.translateText(
  'The First Amendment protects freedom of speech',
  'es',
  { preserveCivicTerms: true, formality: 'more' }
);
```

### Audio Translation Integration
```tsx
import { PageTranslationControls } from '@/components/audio/PageTranslationControls';

<PageTranslationControls
  contentSections={[
    {
      id: 'title',
      label: 'Topic Title',
      content: topicData.topic_title,
      emoji: '📚'
    },
    {
      id: 'description', 
      label: 'Description',
      content: topicData.description,
      emoji: '📖'
    }
  ]}
  onTranslationStart={(language) => {
    analytics.track('mobile_translation_started', { language });
  }}
/>
```

### Mobile Audio Controls
```tsx
<MobileAudioControls
  isPlayingTTS={isPlayingTTS}
  translationEnabled={translationStatus.isEnabled}
  availableLanguages={availableLanguages}
  currentLanguage={translationStatus.currentLanguage}
  onTranslationToggle={toggleTranslation}
  onLanguageChange={setTranslationLanguage}
/>
```

## 🤝 User Contribution System

### Database Schema
```sql
CREATE TABLE public.pending_translations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type TEXT NOT NULL CHECK (content_type IN ('question', 'topic')),
    content_id TEXT NOT NULL,
    target_language TEXT NOT NULL,
    translations JSONB NOT NULL,
    contributor_name TEXT NOT NULL,
    contributor_email TEXT,
    deepl_metadata JSONB, -- Track DeepL usage
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'integrated')),
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### Review Workflow
1. **User Submission**: Translation contributed via modal
2. **DeepL Pre-fill**: AI suggestions help users get started
3. **Admin Review**: Quality scoring and approval process
4. **Integration**: Approved translations merged into main content tables
5. **Notification**: Contributors notified of review status

### Quality Standards
- **Accuracy (20%)**: Factually correct civic concepts
- **Fluency (20%)**: Natural language flow
- **Completeness (20%)**: All fields translated
- **Consistency (20%)**: Terminology alignment
- **Cultural sensitivity (20%)**: Appropriate civic context

## 🤖 DeepL Integration

### Environment Setup
```env
# Required for DeepL API access
DEEPL_API_KEY=your_deepl_api_key_here

# Web app endpoint (for mobile)
EXPO_PUBLIC_API_URL=https://civicsense.com
```

### Civic Terms Glossary
```typescript
const CIVIC_TERMS_GLOSSARY = {
  'Constitution': {
    es: 'Constitución',
    fr: 'Constitution', 
    de: 'Verfassung',
    zh: '宪法'
  },
  'First Amendment': {
    es: 'Primera Enmienda',
    fr: 'Premier Amendement',
    de: 'Erste Verfassungsänderung',
    zh: '第一修正案'
  }
};
```

### Translation with Context
```typescript
// Web API call with civic context
await fetch('/api/translations/deepl-suggest', {
  method: 'POST',
  body: JSON.stringify({
    texts: ['Congress has the power to declare war'],
    targetLanguage: 'es',
    sourceLanguage: 'en',
    context: 'civic_education'
  })
});
```

### Mobile Caching Strategy
```typescript
// 7-day cache for offline access
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

// Fallback hierarchy:
// 1. DeepL API (online)
// 2. Civic terms glossary
// 3. Cached translations
// 4. Original English text
```

## 🛠️ Development Guide

### Setup Steps

1. **Database Migration**
```bash
# Apply translation schema
npx supabase migration up
```

2. **Environment Variables**
```bash
# Add to .env.local
DEEPL_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

3. **Mobile Setup**
```bash
# Install dependencies (if not already installed)
npm install deepl-node expo-speech @react-native-async-storage/async-storage
```

### Testing Checklist

#### Web Platform
- [ ] Language switcher appears when multiple languages available
- [ ] Missing translation shows "Help Translate" button
- [ ] Contribution modal submits successfully
- [ ] Admin can review and approve translations
- [ ] DeepL suggestions pre-fill forms

#### Mobile Platform  
- [ ] Audio translation works in all supported languages
- [ ] Civic terms preserved in translations
- [ ] Offline cached translations work
- [ ] Language switching doesn't interrupt audio
- [ ] Translation cache can be cleared

### Database Helper Functions
```sql
-- Get translation
SELECT get_translation(translations, 'topic_title', 'es') 
FROM question_topics WHERE topic_id = 'constitutional-rights';

-- Set translation
UPDATE question_topics 
SET translations = set_translation(translations, 'topic_title', 'es', 'Derechos Constitucionales', true)
WHERE topic_id = 'constitutional-rights';

-- Validate structure
SELECT validate_translation_structure(translations) FROM question_topics;
```

## 📊 Monitoring & Analytics

### Key Metrics
- **Translation coverage**: Percentage of content available per language
- **User contributions**: Submissions per language/time period  
- **Quality scores**: Average quality by language/contributor
- **Mobile usage**: Audio translation sessions by language
- **DeepL usage**: API calls and character consumption

### Performance Benchmarks
- **Web translation**: Instant display (cached in JSONB)
- **Mobile translation**: ~200ms for DeepL API calls
- **Cache hit rate**: ~85% for repeated civic terms
- **Offline capability**: 100% with cached translations

## 🔒 Security & Privacy

### Data Protection
- **User contributions**: Optional email collection only
- **DeepL API**: No persistent storage of translations
- **Local caching**: Device-only storage for mobile
- **Admin access**: Role-based permissions for reviews

### Content Validation
```typescript
// Input sanitization
const sanitized = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
  ALLOWED_ATTR: []
});

// Civic content validation  
const isCivicRelevant = text => containsCivicTerms(text);
const isAppropriate = text => !containsInappropriateContent(text);
```

## 🚨 Troubleshooting

### Common Issues

#### Translation Not Appearing
```typescript
// Check if translation exists
const hasTranslation = useTranslatedContent(content).hasTranslation('topic_title');

// Verify language code format
const validLanguage = supportedLanguages.includes(currentLanguage);

// Check JSONB structure
console.log('Translations:', content.translations);
```

#### Mobile Audio Not Working
```typescript
// Verify translation service
const status = deepLTranslationService.getStatus();
console.log('Service status:', status);

// Check language setting
const currentLang = translationStatus.currentLanguage;
console.log('Current language:', currentLang);

// Clear cache if needed
await deepLTranslationService.clearCache();
```

#### DeepL API Errors
```bash
# Check API key format
echo $DEEPL_API_KEY | grep -E '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}:fx$'

# Verify usage limits
curl -X GET 'https://api-free.deepl.com/v2/usage' \
  --header 'Authorization: DeepL-Auth-Key YOUR_API_KEY'
```

### Debug Mode
```typescript
// Enable verbose logging
const DEBUG_TRANSLATION = process.env.NODE_ENV === 'development';

if (DEBUG_TRANSLATION) {
  console.log('🌍 Translation request:', { text, targetLanguage });
  console.log('🌍 Translation result:', translatedText);
  console.log('🌍 Cache status:', cacheHit ? 'HIT' : 'MISS');
}
```

## 🚀 Future Enhancements

### Planned Features
- **Voice input**: Accept questions in multiple languages
- **Live video translation**: Real-time subtitles for civic education videos
- **Community glossary**: User-contributed civic term translations
- **Regional dialects**: Support for regional language variations
- **Collaborative editing**: Multiple contributors per translation

### API Improvements
- **Batch translation**: Optimize for multiple paragraphs
- **Translation memory**: Reuse approved translations across content
- **Quality feedback**: User rating system for translation quality
- **Auto-integration**: Approved translations automatically integrated

---

## 📚 Quick Reference

### Essential Commands
```bash
# Database
npx supabase migration up
npx supabase gen types typescript > lib/database.types.ts

# Development
npm run dev          # Start web app
npm run mobile       # Start mobile app  
npm run type-check   # Verify TypeScript

# Testing
npm run test         # Run all tests
npm run test:mobile  # Mobile-specific tests
```

### Key File Locations
```
Translation System Files:
├── components/ui/language-switcher-topic.tsx
├── components/ui/translation-contribution-modal.tsx
├── hooks/use-translated-content.ts
├── app/api/translations/contribute/route.ts
├── app/api/translations/deepl-suggest/route.ts
├── apps/mobile/lib/translation/deepl-service.ts
├── apps/mobile/components/audio/PageTranslationControls.tsx
└── supabase/migrations/044_add_translation_contributions.sql
```

### Support Contacts
- **Technical Issues**: Check GitHub issues or create new ones
- **Translation Quality**: Contact community moderators
- **DeepL API**: Visit [DeepL Developer Documentation](https://developers.deepl.com/docs/)

---

**🏛️ Making democracy accessible in every language - because civic education should never be limited by language barriers.** 