# Database Types

This project uses automatically generated TypeScript types from the Supabase database schema to ensure type safety and consistency.

## Generated Types

The database types are automatically generated from your Supabase schema and stored in `lib/database.types.ts`. This file contains:

- **Database**: The main database interface with all tables, views, functions, and enums
- **Tables<T>**: Helper type to get row types for any table
- **TablesInsert<T>**: Helper type to get insert types for any table  
- **TablesUpdate<T>**: Helper type to get update types for any table
- **Convenient exports**: Pre-defined types for common database operations

## Usage

### Basic Table Types

```typescript
import type { DbQuestionTopic, DbQuestion, DbUserProgress } from '@/lib/database.types'

// Use the row types for data you receive from the database
const topic: DbQuestionTopic = await supabase
  .from('question_topics')
  .select('*')
  .single()
```

### Insert Types

```typescript
import type { DbQuestionInsert, DbQuestionTopicInsert } from '@/lib/database.types'

// Use insert types when creating new records
const newTopic: DbQuestionTopicInsert = {
  topic_id: 'my_topic_2024',
  topic_title: 'My Topic',
  description: 'Description here',
  // ... other required fields
}

await supabase.from('question_topics').insert(newTopic)
```

### Update Types

```typescript
import type { DbQuestionUpdate } from '@/lib/database.types'

// Use update types for partial updates
const updates: DbQuestionUpdate = {
  explanation: 'Updated explanation',
  difficulty_level: 3
}

await supabase.from('questions').update(updates).eq('id', questionId)
```

## Regenerating Types

When your database schema changes, regenerate the types using:

```bash
npm run generate-types
```

This command:
1. Connects to your Supabase project
2. Reads the current database schema
3. Generates TypeScript types
4. **Automatically adds convenient type exports** (DbQuestionTopic, DbQuestion, etc.)
5. Overwrites `lib/database.types.ts`

**✅ No Manual Fixes Required:** The convenient type exports are automatically added by the `post-generate-types.js` script, so you won't get import errors in your existing code.

### Automated Workflow

The type generation process is fully automated:

```bash
# This single command does everything:
npm run generate-types

# Equivalent to running:
# 1. supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > lib/database.types.ts
# 2. node scripts/post-generate-types.js
```

The `post-generate-types.js` script automatically adds these exports to the generated file:

```typescript
// Convenient type exports for easier usage
export type DbQuestionTopic = Tables<'question_topics'>
export type DbQuestion = Tables<'questions'>
// ... and all other table types

// Insert types
export type DbQuestionTopicInsert = TablesInsert<'question_topics'>
// ... and all other insert types

// Update types  
export type DbQuestionTopicUpdate = TablesUpdate<'question_topics'>
// ... and all other update types
```

## Type Safety Features

### Supabase Client

The Supabase client is configured with the generated types for full type safety:

```typescript
import { supabase } from '@/lib/supabase'

// All queries are now fully typed
const { data } = await supabase
  .from('questions') // ✅ Table name is typed
  .select('question, correct_answer') // ✅ Column names are typed
  .eq('topic_id', 'some_topic') // ✅ Column values are typed
```

### Database Operations

The `lib/database.ts` file uses these generated types for all database operations, ensuring:

- ✅ **Column names** are validated at compile time
- ✅ **Data types** match the database schema exactly
- ✅ **Required fields** are enforced for inserts
- ✅ **Relationships** are properly typed

## Available Tables

The generated types include all tables in your database:

- `question_topics` - Quiz topic metadata
- `questions` - Individual quiz questions
- `user_quiz_attempts` - User quiz attempt records
- `user_progress` - User learning progress tracking
- `user_question_responses` - Individual question responses
- `profiles` - User profile information
- `categories` - Question categories
- `events` - Event/topic information

## JSON Fields

Some fields use the `Json` type for flexible data storage:

```typescript
// These fields are typed as Json and need casting when used
categories: Json  // Actually string[]
sources: Json     // Actually Array<{name: string, url: string}>
tags: Json        // Actually string[]
```

When working with these fields, cast them to the expected type:

```typescript
const categories = topic.categories as string[]
const sources = question.sources as Array<{name: string, url: string}>
```

## Best Practices

1. **Always regenerate types** after schema changes
2. **Use the convenient type exports** (`DbQuestion`, `DbQuestionInsert`, etc.)
3. **Cast Json fields** to their expected types when needed
4. **Handle nullable fields** with null coalescing (`??`) operators
5. **Use the typed Supabase client** for all database operations

## Troubleshooting

### Type Errors After Schema Changes

If you see TypeScript errors after changing your database schema:

1. Run `npm run generate-types` to update the types
2. Check if any field names or types changed
3. Update your code to match the new schema

### Json Field Type Issues

For Json fields that should be arrays or objects:

```typescript
// ❌ Don't do this
const tags = question.tags.map(tag => tag.toUpperCase())

// ✅ Do this instead
const tags = (question.tags as string[]).map(tag => tag.toUpperCase())
```

### Null vs Undefined

Database fields use `null` for empty values, not `undefined`:

```typescript
// ❌ Don't do this
option_a: someValue || undefined

// ✅ Do this instead  
option_a: someValue ?? null
``` 