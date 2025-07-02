# Collection Items Integration Guide

## Overview

The CivicSense bookmark collection system now uses a flexible junction table (`bookmark_collection_items`) to manage any type of saved content within collections. This replaces the previous system of having `collection_id` fields directly on content tables.

## Architecture Changes

### 1. Database Schema

**New Junction Table**: `bookmark_collection_items`
```sql
CREATE TABLE bookmark_collection_items (
    id UUID PRIMARY KEY,
    collection_id UUID REFERENCES bookmark_collections(id),
    user_id UUID REFERENCES auth.users(id),
    content_type TEXT, -- 'bookmark', 'snippet', 'quiz_result', etc.
    content_id TEXT,   -- ID of the actual content
    title TEXT,        -- Cached title for performance
    description TEXT,  -- Cached description
    image_url TEXT,    -- Cached image for performance
    user_notes TEXT,   -- User's personal notes
    user_tags TEXT[],  -- User's custom tags
    sort_order INTEGER,-- Manual ordering within collection
    added_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Benefits**:
- Any content type can be added to collections
- Supports user notes and tagging per collection item
- Enables manual ordering within collections
- Caches display data for performance
- Supports future content types without schema changes

### 2. Service Layer

**CollectionItemsService** (`apps/mobile/lib/services/collection-items-service.ts`)

Key functions:
- `addToCollection()` - Add any content to a collection
- `removeFromCollection()` - Remove items from collections
- `getCollectionItems()` - Get all items in a collection
- `getItemCollections()` - Get all collections containing an item
- `getCollectionItemCount()` - Get count of items in a collection
- `moveItemToCollection()` - Move item between collections
- `updateItemInCollection()` - Update notes, tags, order

### 3. Content Types Supported

```typescript
type ContentType = 
  | 'bookmark'       // Web bookmarks
  | 'snippet'        // Highlighted text snippets
  | 'quiz_result'    // Quiz attempt results
  | 'custom_quiz'    // User-created quizzes
  | 'topic'          // Learning topics
  | 'lesson'         // Educational lessons
  | 'article'        // Saved articles
```

## Integration with Saved Screen

### Current Implementation (saved.tsx)

**Collection Display**:
- Collections show accurate item counts from junction table
- Collection filtering works with new system
- Migration-friendly: supports both legacy and new systems

**Item Management**:
- Moving items to collections uses the new junction table
- Legacy `collection_id` columns are cleared when items are moved
- Collection membership is checked via junction table

**Benefits for Users**:
- More flexible content organization
- Personal notes and tags per collection item
- Better performance with cached display data
- Support for organizing any type of saved content

### Key Functions Updated

1. **`loadCollections()`** - Now uses `CollectionItemsService.getCollectionItemCount()`
2. **`handleMoveToCollection()`** - Uses junction table for new associations
3. **Collection filtering** - Works with both legacy and new systems

### Migration Strategy

**Phase 1: Dual System Support** (Current)
- New items are added to junction table
- Legacy `collection_id` columns are kept for compatibility
- Both systems are checked when displaying collections

**Phase 2: Migration Script** (Future)
- Migrate existing `collection_id` associations to junction table
- Add user notes and tags during migration
- Verify data integrity

**Phase 3: Legacy Cleanup** (Future)
- Remove `collection_id` columns from content tables
- Simplify queries to only use junction table

## Usage Examples

### Adding a Bookmark to Collection
```typescript
const itemInput: CollectionItemInput = {
  contentType: 'bookmark',
  contentId: bookmarkId,
  title: bookmark.title,
  description: bookmark.description,
  imageUrl: bookmark.image_url,
  userNotes: 'My thoughts on this article',
  userTags: ['important', 'research']
};

const { error } = await CollectionItemsService.addToCollection(
  collectionId,
  userId,
  itemInput
);
```

### Getting Items in a Collection
```typescript
const { items, error } = await CollectionItemsService.getCollectionItems(
  collectionId,
  userId,
  {
    limit: 20,
    offset: 0,
    orderBy: 'added_at',
    orderDirection: 'desc'
  }
);
```

### Checking if Item is in Collections
```typescript
const { collectionItems, error } = await CollectionItemsService.getItemCollections(
  'bookmark',
  bookmarkId,
  userId
);

// collectionItems contains all collections this bookmark is in
```

## Performance Considerations

### Caching Strategy
- Display data (title, description, image) is cached in junction table
- Reduces need for joins when displaying collection contents
- Periodic sync ensures cached data stays current

### Query Optimization
- Indexes on `(collection_id, user_id)` and `(content_type, content_id, user_id)`
- Batch operations for moving multiple items
- Pagination support for large collections

### Background Sync
- Cached data is updated when source content changes
- Background job ensures consistency
- User can manually refresh if needed

## Future Enhancements

### Smart Collections
- Auto-collections based on tags or content type
- "Recently Added" and "Favorites" auto-collections
- AI-suggested collections based on content

### Collaboration Features
- Shared collections between users
- Collection access permissions
- Collection activity feeds

### Advanced Organization
- Nested collections (subcollections)
- Collection templates
- Bulk organization tools

### Analytics Integration
- Track collection usage patterns
- Suggest better organization
- Content discovery within collections

## Error Handling

### Graceful Degradation
- If junction table query fails, fall back to legacy system
- Missing cached data is fetched from source
- User sees loading states during sync operations

### Data Integrity
- Orphaned junction table entries are cleaned up
- Missing source content is marked as unavailable
- User can remove broken links from collections

## Testing Strategy

### Unit Tests
- Test all CollectionItemsService functions
- Test migration between systems
- Test error conditions and edge cases

### Integration Tests
- Test saved.tsx screen with new system
- Test collection filtering and display
- Test item movement between collections

### User Testing
- Verify improved organization workflow
- Test performance with large collections
- Validate migration doesn't lose data

---

**This flexible collection system empowers users to organize their civic learning content more effectively while maintaining excellent performance and supporting future content types.** 