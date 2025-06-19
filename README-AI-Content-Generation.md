# AI Content Generation from News Articles

CivicSense now includes a comprehensive AI-powered workflow that automatically generates civic education content from news articles stored in your database.

## Overview

This system:
1. **Pulls news articles** from your `source_metadata` table 
2. **Filters for civic relevance** using keyword matching and credibility scores
3. **Compares against existing content** to avoid duplicates
4. **Generates new topics and questions** using GPT-4o
5. **Saves to database** with review status for admin approval

## How It Works

### 1. News Article Collection
- News articles are automatically saved to `source_metadata` via the News Ticker API
- Articles include metadata like credibility scores, bias ratings, and source information
- Only articles with credibility scores ≥70% are considered for content generation

### 2. Content Generation Process
The AI system follows CivicSense's brand principles:
- **Truth over comfort**: Present facts that challenge popular narratives
- **Clarity over politeness**: Cut through political doublespeak
- **Action over consumption**: Connect learning to civic participation
- **Systems thinking**: Address root causes, not just symptoms

### 3. Duplicate Prevention
- Compares article titles and content against existing topics
- Uses keyword overlap analysis (>60% overlap = duplicate)
- Can be overridden with "Force Generation" option

### 4. Quality Standards
Generated content follows strict guidelines:
- 8th-10th grade reading level
- Specific names, dates, and concrete details
- Connection to democratic participation
- Mix of question types and difficulty levels
- Verified sources with real URLs

## Using the Admin Interface

### Access the Generator
1. Go to `/admin/ai-content` (requires admin permissions)
2. Find the "Generate Content from News Articles" section
3. Configure generation settings

### Generation Settings

#### Basic Settings
- **Max Articles**: Number of articles to process (5-30)
- **Time Range**: How recent articles should be (1 day to 1 month)
- **Force Generation**: Override duplicate detection

#### Content Configuration
- **Questions Per Topic**: Number of questions to generate (3-12)
- **Question Type Distribution**: Percentage breakdown of:
  - Multiple Choice (default: 60%)
  - True/False (default: 25%)
  - Short Answer (default: 15%)
  - Fill-in-Blank (0% by default)
  - Matching (0% by default)
- **Difficulty Distribution**: Percentage breakdown of:
  - Easy/Recall (default: 30%)
  - Medium/Analysis (default: 50%)
  - Hard/Evaluation (default: 20%)

#### Scheduling Options
- **Generate for Future Dates**: Create content for specific future dates
- **Start Date**: When to begin generating content
- **Days to Generate**: How many consecutive days to create content for
- **Recurring Interval**: Frequency for automated generation

#### Quick Actions
- **Save as Scheduled Job**: Convert current settings to automated schedule
- **Daily Quiz Setup**: Optimized preset for daily quiz generation
- **Weekly Batch**: Settings for weekly bulk content creation

### Review Generated Content
- All generated content starts with `is_active: false`
- Admin must review and approve before content goes live
- Topics and questions appear in their respective tabs
- Use approve/reject buttons to manage content

## API Endpoint

### `/api/admin/generate-content-from-news`

**POST Request:**
```json
{
  "maxArticles": 10,
  "daysSinceCreated": 7,
  "categories": [],
  "forceGeneration": false,
  "userId": "user-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 5 new topics from 10 articles",
  "results": {
    "articlesProcessed": 10,
    "topicsGenerated": 5,
    "questionsGenerated": 35,
    "saveResults": {
      "topicsSaved": 5,
      "questionsSaved": 35,
      "errors": []
    }
  }
}
```

## Database Schema

### Generated Topics
Saved to `question_topics` table with:
- `source_analysis_id`: References the source article
- `ai_extraction_metadata`: Generation details and source info
- `is_active`: false (requires admin approval)

### Generated Questions  
Saved to `questions` table with:
- Standard quiz question format
- `sources`: Array including original article and constitutional references
- `tags`: Relevant civic education tags
- `is_active`: false (requires admin approval)

## Content Quality Features

### CivicSense Voice
Generated content uses CivicSense's distinctive voice:
- Direct, bold language that cuts through spin
- Focus on power dynamics and institutional mechanics
- Personal relevance through "Your [Issue]" framing
- Actionable outcomes that connect to civic participation

### Question Types
- **60% Multiple Choice**: Core civic knowledge and analysis
- **25% True/False**: Quick fact checks and recognition
- **15% Short Answer**: Critical thinking and application

### Difficulty Distribution
- **30% Easy**: Basic recall (names, dates, processes)
- **50% Medium**: Analysis and comprehension
- **20% Hard**: Evaluation and synthesis

## Monitoring and Quality Control

### Success Metrics
- Articles processed vs. content generated ratio
- Duplicate detection accuracy
- Admin approval rates
- User engagement with generated content

### Error Handling
- Failed articles are logged with specific error messages
- Partial failures don't stop the entire process
- Rate limiting prevents API overuse
- Graceful fallbacks for invalid content

## Best Practices

### For Administrators
1. **Start small**: Begin with 5-10 articles to test quality
2. **Review carefully**: Generated content needs human oversight
3. **Monitor sources**: Ensure diverse, credible news sources
4. **Update regularly**: Run generation weekly for fresh content

### For Content Quality
1. **Verify sources**: Check that generated URLs are real and accessible
2. **Test questions**: Ensure questions are answerable and educational
3. **Review explanations**: Confirm they connect to civic participation
4. **Check for bias**: Maintain non-partisan educational focus

## Troubleshooting

### Common Issues
- **No articles found**: Check if news ticker is collecting articles
- **Generation fails**: Verify OpenAI API key and credentials
- **Poor quality content**: Review prompt engineering and filtering
- **Duplicate detection**: Adjust overlap threshold if needed

### Technical Support
- Check server logs for detailed error messages
- Verify database permissions for content insertion
- Test API endpoints individually for debugging
- Monitor OpenAI usage and rate limits

## Automated Scheduling System

### Schedule Management
The system includes a comprehensive scheduling system for automated content generation:

#### API Endpoint: `/api/admin/schedule-content-generation`
- **GET**: List all scheduled generation configs
- **POST**: Create, update, delete, or run scheduled generations
- **PUT**: CRON endpoint for automated execution (requires `CRON_SECRET`)

#### Scheduling Features
- **Multiple Intervals**: Every 12 hours, daily, or weekly
- **Time Control**: Specify exact time of day for generation
- **Future Dating**: Generate content for days ahead (returning to quiz-per-day model)
- **Individual Management**: Each user manages their own schedules
- **Manual Triggers**: Run scheduled jobs immediately for testing

#### Setting Up Automated Generation

1. **Configure Generation Settings** in the admin interface
2. **Enable "Generate for Future Dates"**
3. **Set start date and duration** (e.g., 7 days ahead)
4. **Click "Save as Scheduled Job"** (coming soon in UI)
5. **Set up cron job** to call the scheduling endpoint

#### CRON Setup Example
```bash
# Run every 12 hours at 6 AM and 6 PM
0 6,18 * * * curl -X PUT -H "Authorization: Bearer ${CRON_SECRET}" \
  https://yoursite.com/api/admin/schedule-content-generation
```

#### Environment Variables Required
- `CRON_SECRET`: Secret token for secure cron job execution
- `NEXT_PUBLIC_SITE_URL`: Your site URL for internal API calls

### Returning to Quiz-Per-Day Model

The scheduling system enables you to return to a consistent quiz-per-day model:

1. **Set up daily generation** with `daysAhead: 1` 
2. **Schedule for early morning** (e.g., 6 AM)
3. **Generate content for the next day** automatically
4. **Ensure consistent daily content** without manual intervention

#### Example Daily Schedule Configuration
```json
{
  "name": "Daily Quiz Generation",
  "schedule": {
    "interval": "daily",
    "timeOfDay": "06:00",
    "timezone": "America/New_York"
  },
  "generationSettings": {
    "maxArticles": 5,
    "daysSinceCreated": 1,
    "questionsPerTopic": 6,
    "daysAhead": 1,
    "questionTypeDistribution": {
      "multipleChoice": 70,
      "trueFalse": 20,
      "shortAnswer": 10
    }
  }
}
```

This ensures that every morning at 6 AM, the system:
- Pulls the latest news from yesterday
- Generates 6-question quizzes for tomorrow
- Maintains a pipeline of ready-to-publish content

## Future Enhancements

### Planned Features
- **Full Scheduling UI**: Complete interface for schedule management
- **Category-specific generation**: Focus on specific civic areas
- **Multi-language content generation**: International civic education
- **Automated quality scoring**: AI-powered content validation
- **Batch approval workflows**: Streamlined content review process
- **Integration with existing quiz builder**: Seamless content pipeline

### Integration Opportunities
- **Quiz recommendation engine**: Smart content suggestions
- **User skill progression**: Adaptive difficulty based on learning
- **Gamification system**: Achievement and progress tracking
- **External platforms**: Export to educational management systems

This system transforms CivicSense into a dynamic, self-updating civic education platform that automatically turns current events into actionable learning experiences, maintaining a consistent daily quiz schedule without manual intervention. 