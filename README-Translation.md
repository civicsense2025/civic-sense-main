# CivicSense Translation System

A comprehensive on-site language switcher and translator using DeepL API with country emojis for each language.

## Features

- **30+ Language Support**: All DeepL-supported languages with country flag emojis
- **Smart Caching**: Client-side translation caching for improved performance
- **Page Translation**: Automatic translation of page content
- **Batch Translation**: Efficient bulk text translation
- **Usage Tracking**: Monitor DeepL API usage and character limits
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support

## Setup

### 1. DeepL API Configuration

1. Sign up for a DeepL API account at [https://www.deepl.com/pro-api](https://www.deepl.com/pro-api)
2. Get your API key from the DeepL Pro dashboard
3. Add your API key to your environment variables:

```bash
# For DeepL Free API (ends with :fx)
DEEPL_API_KEY=your-free-api-key:fx

# For DeepL Pro API
DEEPL_API_KEY=your-pro-api-key
```

### 2. Environment Variables

Add these to your `.env.local` file:

```bash
# DeepL API Configuration
DEEPL_API_KEY=your-deepl-api-key

# Optional: Default language
DEFAULT_LANGUAGE=EN
```

## Components

### LanguageSwitcher

A flexible language selection component with two variants:

```tsx
import { LanguageSwitcher } from '@/components/language-switcher'

// Compact dropdown for headers
<LanguageSwitcher variant="compact" />

// Full grid layout for settings pages
<LanguageSwitcher variant="full" />
```

#### Props

- `currentLanguage?: string` - Current language code (default: 'EN')
- `onLanguageChange?: (language: Language) => void` - Callback when language changes
- `variant?: 'compact' | 'full'` - Display variant
- `className?: string` - Additional CSS classes

### PageTranslator

A floating widget that translates entire pages:

```tsx
import { PageTranslator } from '@/components/page-translator'

<PageTranslator 
  autoTranslate={false}
  showUsage={true}
  className="custom-positioning"
/>
```

#### Props

- `autoTranslate?: boolean` - Automatically translate on language change
- `showUsage?: boolean` - Display API usage statistics
- `className?: string` - Additional CSS classes

### useTranslation Hook

A React hook for programmatic translations:

```tsx
import { useTranslation } from '@/hooks/useTranslation'

function MyComponent() {
  const { 
    currentLanguage, 
    isTranslating, 
    translate, 
    translateBatch,
    changeLanguage 
  } = useTranslation()

  const handleTranslate = async () => {
    const result = await translate('Hello, world!')
    console.log(result.translatedText)
  }

  return (
    <div>
      <p>Current: {currentLanguage.name} {currentLanguage.emoji}</p>
      <button onClick={handleTranslate}>
        {isTranslating ? 'Translating...' : 'Translate'}
      </button>
    </div>
  )
}
```

## Supported Languages

The system supports all DeepL languages with country flag emojis:

| Code | Language | Emoji | Native Name |
|------|----------|-------|-------------|
| EN | English | 🇺🇸 | English |
| ES | Spanish | 🇪🇸 | Español |
| FR | French | 🇫🇷 | Français |
| DE | German | 🇩🇪 | Deutsch |
| IT | Italian | 🇮🇹 | Italiano |
| PT-PT | Portuguese | 🇵🇹 | Português |
| PT-BR | Portuguese (Brazil) | 🇧🇷 | Português (Brasil) |
| NL | Dutch | 🇳🇱 | Nederlands |
| PL | Polish | 🇵🇱 | Polski |
| RU | Russian | 🇷🇺 | Русский |
| JA | Japanese | 🇯🇵 | 日本語 |
| ZH | Chinese | 🇨🇳 | 中文 |
| KO | Korean | 🇰🇷 | 한국어 |
| AR | Arabic | 🇸🇦 | العربية |
| ... and 17 more languages |

## API Endpoints

### POST /api/translate

Translate text using DeepL API.

**Request:**
```json
{
  "text": "Hello, world!",
  "targetLanguage": "ES",
  "sourceLanguage": "EN", // optional
  "preserveFormatting": true,
  "formality": "default" // default, more, less, prefer_more, prefer_less
}
```

**Response:**
```json
{
  "success": true,
  "translatedText": "¡Hola, mundo!",
  "detectedLanguage": "EN",
  "usage": {
    "charactersProcessed": 13,
    "charactersRemaining": 487234
  }
}
```

### GET /api/translate

Get supported languages from DeepL API.

**Response:**
```json
{
  "success": true,
  "sourceLanguages": [...],
  "targetLanguages": [...]
}
```

## Translation Caching

The system includes smart client-side caching:

- **24-hour cache duration** (configurable)
- **Automatic cache cleanup** of expired entries
- **Cache statistics** for monitoring
- **Manual cache clearing** option

### Cache Management

```tsx
const { getCacheStats, clearCache } = useTranslation()

// Get cache statistics
const stats = getCacheStats()
console.log(`Cache size: ${stats.cacheSizeKB} KB`)

// Clear all cached translations
clearCache()
```

## Page Translation

The PageTranslator component automatically finds and translates text content:

### Translatable Elements

By default, these elements are translated:
- Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- Text: `p`, `span`
- Interactive: `button`, `label`, `a`
- Custom: `[data-translate]`, `[data-translatable]`

### Excluding Elements

To prevent translation of specific elements:

```html
<!-- Exclude single element -->
<button data-no-translate>Don't translate this</button>

<!-- Exclude element and children -->
<div data-no-translate>
  <p>This entire section won't be translated</p>
  <button>Including this button</button>
</div>
```

### Custom Translatable Elements

Mark elements for translation:

```html
<!-- Force translation -->
<div data-translate>This will be translated</div>

<!-- Mark container as translatable -->
<section data-translatable>
  <p>All text in this section will be translated</p>
</section>
```

## Performance Considerations

### Batch Translation

For multiple texts, use batch translation for efficiency:

```tsx
const texts = ['Hello', 'Goodbye', 'Thank you']
const results = await translateBatch(texts)
```

### Caching Strategy

- Translations are cached by text content hash
- Cache persists across browser sessions
- Expired entries are automatically cleaned up
- Cache size is monitored and displayed

### API Usage Optimization

- Batch requests reduce API calls
- Smart caching prevents duplicate translations
- Usage tracking helps monitor quotas
- Automatic fallback for API errors

## Integration Examples

### Header Integration

```tsx
import { LanguageSwitcher } from '@/components/language-switcher'

export function Header() {
  return (
    <header>
      <nav>
        {/* Other navigation items */}
        <LanguageSwitcher variant="compact" />
      </nav>
    </header>
  )
}
```

### Settings Page Integration

```tsx
import { LanguageSwitcher } from '@/components/language-switcher'

export function SettingsPage() {
  return (
    <div>
      <h2>Language Preferences</h2>
      <LanguageSwitcher variant="full" />
    </div>
  )
}
```

### Page-wide Translation

```tsx
import { PageTranslator } from '@/components/page-translator'

export function Layout({ children }) {
  return (
    <div>
      {children}
      <PageTranslator autoTranslate={false} showUsage={true} />
    </div>
  )
}
```

## Testing

Visit `/test-translation` to test the translation system:

- Single text translation
- Batch translation
- Page translation demo
- Cache statistics
- Error handling

## Error Handling

The system includes comprehensive error handling:

- **API key validation**
- **Network error recovery**
- **Quota limit warnings**
- **Graceful fallbacks**
- **User-friendly error messages**

## Best Practices

1. **Cache Management**: Monitor cache size and clear when needed
2. **API Quotas**: Track usage to avoid exceeding limits
3. **Content Marking**: Use `data-no-translate` for UI elements
4. **Batch Operations**: Group multiple translations together
5. **Error Handling**: Always handle translation failures gracefully
6. **Performance**: Use caching and batch operations for better performance

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify the key in DeepL dashboard
   - Check if using correct endpoint (free vs pro)
   - Ensure key has sufficient quota

2. **Translations Not Appearing**
   - Check browser console for errors
   - Verify elements aren't marked `data-no-translate`
   - Ensure target language is supported

3. **Cache Issues**
   - Clear browser localStorage
   - Use `clearCache()` function
   - Check cache size limits

### Debug Mode

Enable debug logging:

```tsx
const { translate } = useTranslation()

// Translation with detailed logging
const result = await translate(text)
console.log('Translation result:', result)
```

## License

This translation system is part of the CivicSense project and follows the same license terms. 