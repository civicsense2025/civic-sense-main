# Setup Guide: Automated Content Generation

This guide walks you through setting up the automated content generation system to return to a quiz-per-day model.

## Prerequisites

- CivicSense application deployed and running
- Admin access to the application
- OpenAI API key with sufficient credits
- Access to set up cron jobs (server or service like Vercel Cron)

## Environment Variables

Add these environment variables to your deployment:

```bash
# Required for AI content generation
OPENAI_API_KEY=your_openai_api_key

# Required for scheduling system
CRON_SECRET=your_secure_random_string_for_cron_jobs
NEXT_PUBLIC_SITE_URL=https://your-site.com

# Optional: Additional news sources
NEWS_API_KEY=your_news_api_key
```

## Database Setup

1. **Run the migration** to create the scheduling table:
   ```sql
   -- This is handled automatically if using Supabase migrations
   -- File: supabase/migrations/041_create_scheduled_content_generation.sql
   ```

2. **Verify the table exists**:
   ```sql
   SELECT * FROM scheduled_content_generation LIMIT 1;
   ```

## Manual Content Generation Setup

### Step 1: Access Admin Interface
1. Go to `/admin/ai-content` (requires admin permissions)
2. Locate the "Generate Content from News Articles" section

### Step 2: Configure Generation Settings

#### For Daily Quiz Generation:
```
Basic Settings:
- Max Articles: 5-10
- Time Range: Last 24 hours
- Force Generation: false

Content Configuration:
- Questions Per Topic: 6
- Question Types: 70% Multiple Choice, 20% True/False, 10% Short Answer
- Difficulty: 25% Easy, 55% Medium, 20% Hard

Scheduling Options:
- Generate for Future Dates: ✓ enabled
- Start Date: Tomorrow
- Days to Generate: 7 (one week ahead)
```

#### Quick Setup:
Click "Daily Quiz Setup" button for optimized preset configuration.

### Step 3: Test Manual Generation
1. Click "Generate Content" to test the system
2. Review generated content in the admin interface
3. Approve quality content for publishing

## Automated Scheduling Setup

### Step 1: Create Scheduled Job (API)

Use the scheduling API to create automated generation:

```bash
curl -X POST https://your-site.com/api/admin/schedule-content-generation \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "userId": "your-admin-user-id",
    "config": {
      "name": "Daily Quiz Generation",
      "isActive": true,
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
          "shortAnswer": 10,
          "fillInBlank": 0,
          "matching": 0
        },
        "difficultyDistribution": {
          "easy": 25,
          "medium": 55,
          "hard": 20
        }
      }
    }
  }'
```

### Step 2: Set Up CRON Job

#### Option A: Server Cron (Linux/macOS)
```bash
# Add to crontab (crontab -e)
# Run every day at 6 AM
0 6 * * * curl -X PUT -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-site.com/api/admin/schedule-content-generation

# Or run every 12 hours
0 6,18 * * * curl -X PUT -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-site.com/api/admin/schedule-content-generation
```

#### Option B: Vercel Cron (if using Vercel)
Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/admin/schedule-content-generation",
      "schedule": "0 6 * * *"
    }
  ]
}
```

And update the API to handle Vercel cron authentication.

#### Option C: GitHub Actions (if using GitHub)
Create `.github/workflows/content-generation.yml`:
```yaml
name: Daily Content Generation
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC

jobs:
  generate-content:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Content Generation
        run: |
          curl -X PUT \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-site.com/api/admin/schedule-content-generation
```

## Content Review Workflow

### Step 1: Monitor Generation
- Check logs for successful generation
- Review generated content quality
- Monitor API usage and costs

### Step 2: Approval Process
1. Generated content starts with `is_active: false`
2. Admin reviews topics and questions in `/admin/ai-content`
3. Approve quality content using admin interface
4. Content becomes live and available to users

### Step 3: Quality Control
- Monitor user engagement with generated content
- Adjust generation settings based on feedback
- Fine-tune question types and difficulty over time

## Troubleshooting

### Common Issues

#### "No articles found"
- Check if news ticker is collecting articles
- Verify `source_metadata` table has recent entries
- Adjust `daysSinceCreated` parameter

#### "Generation fails"
- Verify `OPENAI_API_KEY` is valid and has credits
- Check API rate limits and usage
- Review error logs for specific issues

#### "Scheduled jobs not running"
- Verify `CRON_SECRET` environment variable
- Check cron job configuration and timing
- Test manual trigger via API

#### "Poor content quality"
- Adjust generation settings (difficulty, question types)
- Increase credibility score threshold
- Review and improve prompts if needed

### Monitoring Commands

```bash
# Check scheduled jobs
curl https://your-site.com/api/admin/schedule-content-generation

# Test manual trigger
curl -X POST https://your-site.com/api/admin/schedule-content-generation \
  -H "Content-Type: application/json" \
  -d '{"action": "run_now", "config": {"id": "schedule-id"}, "userId": "user-id"}'

# Monitor recent generations
# Check admin interface at /admin/ai-content
```

## Success Metrics

### Content Pipeline
- **Daily Generation**: 1 quiz per day automatically created
- **Content Quality**: 80%+ approval rate from admin review
- **User Engagement**: Consistent daily quiz participation
- **System Reliability**: 95%+ successful automated generations

### Cost Management
- **OpenAI Usage**: Monitor token consumption per generation
- **Generation Efficiency**: Track articles processed vs. content created
- **Quality vs. Cost**: Balance between content quality and API costs

## Scaling Considerations

### Multiple Quiz Streams
- Set up different schedules for different topics
- Create weekend vs. weekday content variations
- Generate content for different difficulty levels

### International Markets
- Configure timezone-specific generation
- Adapt content for different political systems
- Consider multi-language generation capabilities

This setup enables CivicSense to return to a consistent quiz-per-day model with minimal manual intervention, ensuring fresh, relevant civic education content is always available to users. 