# Database Constants System

This document explains the database constants system for the CivicSense mobile app, which ensures consistency between the web and mobile applications when database schema changes occur.

## Overview

The database constants system automatically extracts table names, enum values, and function names from the main `database.types.ts` file and generates a mobile-specific constants file. This prevents hardcoded table names and ensures the mobile app stays in sync with database schema changes.

## Files

### Core Files
- `lib/database-constants.ts` - Generated constants file (DO NOT EDIT MANUALLY)
- `scripts/sync-database-constants.js` - Sync script that generates the constants
- `lib/database.ts` - Database utilities that use the constants

### Source
- `../../../lib/database.types.ts` - Main database types file (source of truth)

## Usage

### Basic Usage

```typescript
import { DB_TABLES, DB_ENUMS, DB_FUNCTIONS } from '../lib/database-constants';

// Use table constants instead of hardcoded strings
const { data } = await supabase
  .from(DB_TABLES.CATEGORIES)  // Instead of 'categories'
  .select('*');

// Use enum constants
const userRole = DB_ENUMS.COURSE_ROLE.STUDENT;  // Instead of 'student'

// Use function constants
const { data } = await supabase.rpc(DB_FUNCTIONS.CREATE_MULTIPLAYER_ROOM, params);
```

### Mobile-Specific Features

```typescript
import { MOBILE_CONSTANTS, QUERY_PATTERNS } from '../lib/database-constants';

// Use mobile-optimized batch sizes
const questions = await getQuestionsForTopic(
  topicId, 
  MOBILE_CONSTANTS.BATCH_SIZES.QUESTIONS
);

// Use predefined query patterns
const { data } = await supabase.rpc('execute_sql', {
  query: QUERY_PATTERNS.SELECT_ACTIVE_CATEGORIES
});

// Check cache durations
const cacheExpiry = Date.now() + MOBILE_CONSTANTS.CACHE_DURATIONS.CATEGORIES;
```

### Real-time Subscriptions

```typescript
import { REALTIME_CHANNELS } from '../lib/database-constants';

// Subscribe to multiplayer events
const subscription = supabase
  .channel(REALTIME_CHANNELS.MULTIPLAYER_ROOM)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: DB_TABLES.MULTIPLAYER_ROOMS
  }, handleRoomChanges)
  .subscribe();
```

## Syncing Constants

### Automatic Sync
The constants are automatically synced when you run `npm install` (via postinstall hook).

### Manual Sync
```bash
# Sync database constants manually
npm run sync:db-constants
```

### When to Sync
- After database schema changes
- When new tables, enums, or functions are added
- Before major releases
- When switching branches that might have schema changes

## Generated Structure

### DB_TABLES
Contains all table names as constants:
```typescript
export const DB_TABLES = {
  CATEGORIES: 'categories',
  QUESTIONS: 'questions',
  USER_PROGRESS: 'user_progress',
  // ... all other tables
} as const;
```

### DB_ENUMS
Contains all enum values:
```typescript
export const DB_ENUMS = {
  COURSE_ROLE: {
    STUDENT: 'student',
    TEACHER: 'teacher',
    // ...
  },
  // ... all other enums
} as const;
```

### DB_FUNCTIONS
Contains all database function names:
```typescript
export const DB_FUNCTIONS = {
  CREATE_MULTIPLAYER_ROOM: 'create_multiplayer_room',
  JOIN_MULTIPLAYER_ROOM: 'join_multiplayer_room',
  // ... all other functions
} as const;
```

### MOBILE_CONSTANTS
Mobile-specific optimizations:
```typescript
export const MOBILE_CONSTANTS = {
  SYNC_PRIORITIES: {
    HIGH: ['user_progress', 'user_quiz_attempts', 'categories'],
    MEDIUM: ['questions', 'question_topics', 'user_assessments'],
    LOW: ['events', 'public_figures', 'organizations'],
  },
  CACHE_DURATIONS: {
    CATEGORIES: 24 * 60 * 60 * 1000, // 24 hours
    QUESTIONS: 12 * 60 * 60 * 1000,  // 12 hours
    // ...
  },
  BATCH_SIZES: {
    QUESTIONS: 25,
    QUIZ_ATTEMPTS: 50,
    // ...
  },
  LIMITS: {
    MAX_OFFLINE_ATTEMPTS: 100,
    MAX_CACHED_QUESTIONS: 500,
    // ...
  },
} as const;
```

## Type Safety

The system includes type guards for runtime validation:

```typescript
import { isValidTableName, isValidEnumValue, isValidFunctionName } from '../lib/database-constants';

// Type-safe validation
if (isValidTableName(tableName)) {
  // tableName is now typed as keyof typeof DB_TABLES
}

if (isValidEnumValue('COURSE_ROLE', value)) {
  // value is valid for the COURSE_ROLE enum
}
```

## Best Practices

### DO
- ✅ Always use constants instead of hardcoded strings
- ✅ Run sync script after schema changes
- ✅ Use mobile-specific batch sizes and limits
- ✅ Leverage predefined query patterns
- ✅ Use type guards for validation

### DON'T
- ❌ Edit `database-constants.ts` manually
- ❌ Use hardcoded table names in queries
- ❌ Ignore sync script errors
- ❌ Skip syncing after schema changes
- ❌ Use web-specific constants in mobile code

## Troubleshooting

### Sync Script Fails
1. Check that the main database types file exists
2. Ensure the path in the sync script is correct
3. Verify file permissions
4. Check for syntax errors in the types file

### Missing Constants
1. Run the sync script manually
2. Check if the table/enum/function exists in the main types file
3. Verify the extraction regex patterns in the sync script

### Type Errors
1. Ensure you're importing from the correct constants file
2. Check that the constant names match the generated ones
3. Run TypeScript compiler to check for issues

## Integration with CI/CD

Add to your CI/CD pipeline:

```yaml
# .github/workflows/mobile.yml
- name: Sync Database Constants
  run: npm run sync:db-constants
  
- name: Check for Changes
  run: |
    if [[ -n $(git diff --name-only) ]]; then
      echo "Database constants are out of sync!"
      exit 1
    fi
```

This ensures constants are always up-to-date in production builds.

## Future Enhancements

- Automatic migration detection
- Schema validation
- Performance monitoring
- Offline sync optimization
- Real-time schema updates 