# CivicSense Database Schema

This document outlines the comprehensive database schema for the CivicSense daily civic education quiz game.

## Table Structure

### 1. `question_topics`
Stores topic metadata for daily civic topics.

```sql
- id: UUID (Primary Key)
- topic_id: VARCHAR(100) (Unique identifier for topics)
- topic_title: VARCHAR(255) (Display title)
- description: TEXT (Topic description)
- why_this_matters: TEXT (HTML content explaining relevance)
- emoji: VARCHAR(10) (Topic emoji)
- date: DATE (Publication date)
- day_of_week: VARCHAR(10) (Day of the week)
- categories: JSONB (Array of category strings)
- is_active: BOOLEAN (Whether topic is active)
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
```

### 2. `questions`
Stores individual quiz questions linked to topics.

```sql
- id: UUID (Primary Key)
- topic_id: VARCHAR(100) (Foreign Key to question_topics)
- question_number: INTEGER (Question order within topic)
- question_type: VARCHAR(20) (multiple_choice, true_false, short_answer)
- category: VARCHAR(100) (Question category)
- question: TEXT (Question text)
- option_a: TEXT (Multiple choice option A)
- option_b: TEXT (Multiple choice option B)
- option_c: TEXT (Multiple choice option C)
- option_d: TEXT (Multiple choice option D)
- correct_answer: TEXT (Correct answer)
- hint: TEXT (Question hint)
- explanation: TEXT (Answer explanation)
- tags: JSONB (Array of tag strings)
- sources: JSONB (Array of {name, url} objects)
- difficulty_level: INTEGER (1-5 difficulty scale)
- is_active: BOOLEAN (Whether question is active)
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
```

### 3. `categories`
Reference table for quiz categories.

```sql
- id: UUID (Primary Key)
- name: VARCHAR(100) (Category name)
- emoji: VARCHAR(10) (Category emoji)
- description: TEXT (Category description)
- display_order: INTEGER (Display order)
- is_active: BOOLEAN
- created_at: TIMESTAMP WITH TIME ZONE
```

### 4. `user_quiz_attempts`
Tracks user quiz attempts and progress.

```sql
- id: UUID (Primary Key)
- user_id: UUID (References auth.users)
- topic_id: VARCHAR(100) (References question_topics)
- started_at: TIMESTAMP WITH TIME ZONE
- completed_at: TIMESTAMP WITH TIME ZONE
- score: INTEGER (Percentage score 0-100)
- total_questions: INTEGER
- correct_answers: INTEGER
- time_spent_seconds: INTEGER
- is_completed: BOOLEAN
- created_at: TIMESTAMP WITH TIME ZONE
```

### 5. `user_question_responses`
Detailed tracking of individual question responses.

```sql
- id: UUID (Primary Key)
- attempt_id: UUID (References user_quiz_attempts)
- question_id: UUID (References questions)
- user_answer: TEXT (User's selected answer)
- is_correct: BOOLEAN
- time_spent_seconds: INTEGER
- hint_used: BOOLEAN
- created_at: TIMESTAMP WITH TIME ZONE
```

### 6. `user_progress`
Overall user progress and streak tracking.

```sql
- id: UUID (Primary Key)
- user_id: UUID (References auth.users)
- current_streak: INTEGER
- longest_streak: INTEGER
- last_activity_date: DATE
- total_quizzes_completed: INTEGER
- total_questions_answered: INTEGER
- total_correct_answers: INTEGER
- favorite_categories: JSONB (Array of preferred categories)
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
```

## Database Setup

### 1. Run Migrations

```bash
# Apply the database schema
npx supabase migration up

# Or if using Supabase CLI locally
supabase db push
```

### 2. Import Sample Data

The TikTok regulation example has been included as sample data:

```bash
# Import the sample TikTok topic and questions
# This is automatically included in migration 002_seed_tiktok_topic.sql
```

## Using the Database API

### Import the database helpers

```typescript
import { 
  topicOperations, 
  questionOperations, 
  quizAttemptOperations,
  userProgressOperations,
  dbUtils 
} from '@/lib/database'
```

### Common Operations

#### Get all topics
```typescript
const topics = await topicOperations.getAll()
```

#### Get topic with questions
```typescript
const { topic, questions } = await dbUtils.getTopicWithQuestions('tiktok_regulation_2024')
```

#### Start a quiz attempt
```typescript
const attempt = await quizAttemptOperations.start(userId, topicId, 20)
```

#### Complete a quiz
```typescript
await quizAttemptOperations.complete(attemptId, 85, 17, 300)
await userProgressOperations.updateAfterQuiz(userId, 17, 20)
```

#### Get user dashboard data
```typescript
const { progress, recentAttempts, completedTopics } = await dbUtils.getUserDashboard(userId)
```

## Data Import/Export

### CSV Import

Use the import script to add new topics and questions from CSV files:

```bash
# Create a topic configuration file
cat > tiktok_config.json << EOF
{
  "topic_id": "tiktok_regulation_2024",
  "topic_title": "TikTok Regulation and Potential Ban",
  "description": "Legislative action on TikTok regulation...",
  "why_this_matters": "<ul><li>Digital Privacy...</li></ul>",
  "emoji": "📱",
  "date": "2024-03-15",
  "day_of_week": "Friday",
  "categories": ["Government", "National Security", "Media Literacy"]
}
EOF

# Import from CSV
npx tsx scripts/import-quiz-data.ts import-csv questions.csv tiktok_config.json
```

### CSV Export

Export existing topics to CSV format:

```bash
npx tsx scripts/import-quiz-data.ts export-csv tiktok_regulation_2024 output.csv
```

### Import Existing Static Data

Migrate from the existing static data structure:

```bash
npx tsx scripts/import-quiz-data.ts import-existing
```

## CSV Format

Your CSV file should have these columns:

| Column | Description | Example |
|--------|-------------|---------|
| Question Number | Sequential number | 1 |
| Question Type | multiple_choice, true_false, or short_answer | Multiple Choice |
| Category | Question category | Government |
| Question | Question text | Which federal body passed legislation... |
| Option A | First option (multiple choice only) | The Supreme Court |
| Option B | Second option | The House of Representatives |
| Option C | Third option | The Federal Communications Commission |
| Option D | Fourth option | The Department of Justice |
| Correct Answer | Correct answer text | The House of Representatives |
| Hint | Question hint | It's the legislative chamber... |
| Explanation | Answer explanation | In March 2024, the U.S. House... |
| Sources | JSON array of sources | [{"name": "NY Times", "url": "..."}] |

## Question Types

### Multiple Choice
- Uses `option_a`, `option_b`, `option_c`, `option_d`
- `correct_answer` should be `option_a`, `option_b`, etc.

### True/False
- No options needed
- `correct_answer` should be `true` or `false`

### Short Answer
- No options needed
- `correct_answer` is the expected text response
- Case-insensitive matching

## Categories

Default categories include:
- Government 🏛️
- Elections 🗳️
- Economy 💰
- Foreign Policy 🌐
- Justice ⚖️
- Civil Rights ✊
- Environment 🌱
- Media 📱
- Local Issues 🏙️
- Constitutional Law 📜
- National Security 🛡️
- Public Policy 📋

## Performance Considerations

The schema includes optimized indexes for:
- Topic lookups by ID and date
- Question queries by topic and category
- User progress tracking
- Quiz attempt history

## Security

- Row Level Security (RLS) should be enabled for user-specific tables
- Users can only access their own quiz attempts and progress
- Topics and questions are publicly readable
- Only authenticated users can create quiz attempts

## Migration Strategy

1. **Phase 1**: Create tables and import existing data
2. **Phase 2**: Update application to use database instead of static data
3. **Phase 3**: Add real-time features and advanced analytics
4. **Phase 4**: Implement content management system for educators

This schema provides a solid foundation for scaling the CivicSense application while maintaining compatibility with the existing TypeScript interfaces. 