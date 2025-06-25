# AI Tools Migration Guide

## Overview
This guide helps you migrate from the old AI tool implementations to the new enhanced versions that provide:
- Robust JSON parsing with automatic repair
- High-quality output validation
- Reliable Supabase saves with batch processing
- Comprehensive error handling and retry logic

## Migration Steps

### 1. Update Imports

**Old:**
```typescript
import { generateGlossaryTerms } from '@/lib/ai/glossary-terms-generator'
import { KeyTakeawaysGenerator } from '@/lib/ai/key-takeaways-generator'
import { analyzeBias } from '@/lib/ai/bias-detector'
```

**New:**
```typescript
import { 
  generateGlossaryTerms,
  generateKeyTakeaways,
  analyzeBias,
  createAITool,
  batchProcess,
  validateContentQuality,
  type AIToolResult
} from '@/lib/ai'
```

### 2. Update Function Calls

#### Glossary Generation

**Old:**
```typescript
const terms = await generateGlossaryTerms(content, count)
```

**New:**
```typescript
const result = await generateGlossaryTerms({
  type: 'extract_from_content',
  content: content,
  count: count,
  categories: ['general'],
  difficulty_level: 3
})

if (result.success) {
  console.log(`Generated ${result.data.terms.length} terms`)
  console.log(`Saved ${result.data.metadata.saved_to_db} to database`)
} else {
  console.error('Generation failed:', result.error)
}
```

#### Key Takeaways Generation

**Old:**
```typescript
const generator = new KeyTakeawaysGenerator()
const takeaways = await generator.generateKeyTakeaways(
  topicId,
  topicTitle,
  questions,
  existingContent
)
```

**New:**
```typescript
const result = await generateKeyTakeaways({
  topicTitle: topicTitle,
  topicId: topicId,
  questionContent: questions,
  existingContent: existingContent,
  includeCurrentEvents: true
})

if (result.success) {
  console.log('Key takeaways saved:', result.data.saved)
  console.log('Topic ID:', result.data.topicId)
} else {
  console.error('Generation failed:', result.error)
}
```

#### Bias Analysis

**Old:**
```typescript
const analysis = await analyzeBias(articleUrl, articleContent)
```

**New:**
```typescript
const result = await analyzeBias({
  articleUrl: articleUrl,
  articleContent: articleContent,
  sourceMetadataId: sourceId,
  organizationId: orgId
})

if (result.success) {
  console.log('Analysis ID:', result.data.analysisId)
  console.log('Bias scores:', result.data.analysis.bias_scores)
  console.log('Civic content extracted:', result.data.civicContentSaved)
} else {
  console.error('Analysis failed:', result.error)
}
```

### 3. Batch Processing

Process multiple items efficiently:

```typescript
import { createAITool, batchProcess } from '@/lib/ai'

// Create a glossary generator
const glossaryTool = createAITool({
  toolType: 'glossary_generator',
  provider: 'anthropic'
})

// Process multiple topics
const topics = [
  { type: 'generate_new', topic: 'Gerrymandering', count: 5 },
  { type: 'generate_new', topic: 'Lobbying', count: 5 },
  { type: 'generate_new', topic: 'Campaign Finance', count: 5 }
]

const { successful, failed } = await batchProcess(
  glossaryTool,
  topics,
  {
    concurrency: 2,
    continueOnError: true,
    progressCallback: (completed, total) => {
      console.log(`Progress: ${completed}/${total}`)
    }
  }
)

console.log(`Successful: ${successful.length}`)
console.log(`Failed: ${failed.length}`)
```

### 4. Quality Validation

Validate content before saving:

```typescript
import { validateContentQuality } from '@/lib/ai'

const quality = validateContentQuality(generatedContent)

if (quality.passes_minimum) {
  // Save to database
  console.log('Quality scores:', {
    overall: quality.overall_score,
    brand_voice: quality.brand_voice_score,
    accuracy: quality.accuracy_score,
    actionability: quality.actionability_score
  })
} else {
  console.error('Content failed quality standards')
}
```

### 5. Error Handling

All enhanced tools return a standardized result format:

```typescript
interface AIToolResult<T> {
  success: boolean
  data?: T
  error?: string
  metadata: {
    toolName: string
    provider: string
    model: string
    processingTime: number
    retryCount: number
    cost?: number
  }
}
```

Handle errors gracefully:

```typescript
const result = await generateKeyTakeaways(input)

if (!result.success) {
  // Log error details
  console.error(`Tool: ${result.metadata.toolName}`)
  console.error(`Error: ${result.error}`)
  console.error(`Retries: ${result.metadata.retryCount}`)
  
  // Handle specific error types
  if (result.error?.includes('API key')) {
    // Handle missing API key
  } else if (result.error?.includes('rate limit')) {
    // Handle rate limiting
  } else {
    // General error handling
  }
}
```

### 6. Type Safety

All enhanced tools use Zod schemas for validation:

```typescript
// Type-safe input
const input: GlossaryGenerationInput = {
  type: 'generate_new',
  topic: 'Electoral College',
  count: 10,
  categories: ['elections'],
  difficulty_level: 3
}

// Type-safe output
const result: AIToolResult<GlossaryGenerationOutput> = 
  await generateGlossaryTerms(input)

if (result.success) {
  // TypeScript knows result.data is defined
  result.data.terms.forEach(term => {
    console.log(term.term, term.definition)
  })
}
```

## Common Issues & Solutions

### Issue: JSON Parse Errors

**Old behavior:** Throws exception on malformed JSON

**New behavior:** Automatically repairs JSON with multiple strategies:
1. Removes markdown code blocks
2. Extracts JSON from mixed text
3. Uses jsonrepair library
4. Falls back to pattern matching

### Issue: Supabase Save Failures

**Old behavior:** Single save attempt, fails completely

**New behavior:** 
- Batch processing with configurable batch size
- Automatic retry on failure
- Individual item fallback if batch fails
- Detailed error reporting per item

### Issue: Quality Inconsistency

**Old behavior:** No quality validation

**New behavior:**
- Automated quality scoring
- CivicSense brand voice validation
- Minimum score requirements
- Detailed quality metrics

## Performance Improvements

1. **Batch Processing**: Process multiple items with controlled concurrency
2. **Retry Logic**: Automatic retries with exponential backoff
3. **Caching**: Results cached to prevent duplicate API calls
4. **Rate Limiting**: Built-in delays between batches

## Monitoring & Analytics

Track tool usage automatically:

```typescript
// Usage is tracked automatically, but you can add custom tracking:
import { trackToolUsage } from '@/lib/ai'

await trackToolUsage({
  tool_name: 'Custom Tool',
  tool_type: 'content_generator',
  provider: 'openai',
  model: 'gpt-4',
  tokens_used: 1500,
  cost: 0.045,
  processing_time: 3200,
  success: true
})
```

## Rollback Plan

If you need to rollback:

1. Keep old implementations in separate files with `-legacy` suffix
2. Use feature flags to switch between implementations
3. Monitor error rates and quality scores
4. Gradually migrate one tool at a time

```typescript
const useEnhancedTools = process.env.USE_ENHANCED_AI_TOOLS === 'true'

const result = useEnhancedTools
  ? await generateGlossaryTerms(input) // New
  : await legacyGenerateGlossaryTerms(input) // Old
```

## Next Steps

1. Update all imports to use the new unified export
2. Replace function calls with new signatures
3. Add error handling for the new result format
4. Test with sample data before production deployment
5. Monitor quality scores and adjust thresholds as needed
6. Remove legacy implementations after successful migration 