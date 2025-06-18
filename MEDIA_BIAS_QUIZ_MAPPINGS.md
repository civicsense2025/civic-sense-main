# Media Bias Engine - Quiz Content Mappings

This document maps existing quiz content and structures to the new media bias engine implementation.

## 🎯 Executive Summary

The CivicSense platform already has significant media literacy content that can be enhanced with the media bias engine:
- **3 existing media literacy assessment questions** with skills `source_evaluation` and `media_bias_recognition`
- **Media Literacy** is an established quiz category (📰)
- **Multiple quiz topics** already focus on media bias and fact-checking
- **Source attribution system** already tracks media organizations in quiz questions
- **Skills system** already tracks user progress in media bias recognition

## 📊 Existing Media Literacy Content

### Assessment Questions (Onboarding)

| Question ID | Skill | Focus Area | Maps To Bias Dimension |
|------------|-------|------------|----------------------|
| `cs_media_1` | `source_evaluation` | Anonymous/undated content red flags | Source Credibility |
| `cs_media_2` | `source_evaluation` | Clickbait language recognition | Sensationalism |
| `cs_media_3` | `media_bias_recognition` | Word choice framing ("protesters" vs "crowds") | Political Lean, Framing Bias |

### Quiz Topics with Media Components

| Topic ID | Primary Focus | Media Bias Relevance |
|---------|--------------|---------------------|
| `2025-media-literacy-fact-checking` | Professional fact-checking techniques | All dimensions |
| `2025-04-08-approval-ratings-historic-drop` | Polling interpretation | Media framing of data |
| `2025-06-11-leavitt-auto-pen-investigation-dodge` | Press transparency | Government-media relations |

### Existing Categories

- **Media Literacy (📰)**: Primary category for bias-related content
- **Government (🏛️)**: Often includes media coverage of government
- **Civil Rights (✊)**: Media representation of social movements
- **Elections (🗳️)**: Media coverage and election influence

## 🔗 Integration Points

### 1. Source Attribution Enhancement

**Current State**: Questions store sources as JSON arrays:
```json
[
  {"name": "CNN Article Title", "url": "https://cnn.com/..."},
  {"name": "NPR Report", "url": "https://npr.org/..."}
]
```

**Enhanced with Bias Engine**:
- Extract domain from URL → Look up `media_organizations` table
- Display bias scores in `SourceMetadataCardEnhanced` component
- Track which organizations are most cited in quiz content

### 2. Question-Level Bias Analysis

**New Capabilities**:
- Analyze question sources for bias patterns
- Flag questions that only cite sources from one side of political spectrum
- Suggest additional sources for balance
- Generate bias-aware quiz questions

### 3. User Skill Enhancement

**Existing Skills**:
- `source_evaluation`: Basic source credibility assessment
- `media_bias_recognition`: Identifying framing and word choice bias

**New Skill Dimensions**:
- `political_lean_detection`: Recognizing left/right bias
- `factual_accuracy_assessment`: Evaluating fact vs opinion
- `sensationalism_identification`: Spotting clickbait and emotional manipulation
- `corporate_influence_awareness`: Understanding funding and ownership impacts

## 📈 Implementation Roadmap

### Phase 1: Immediate Integration (No Code Changes)
1. **Source Domain Extraction**: Use existing source URLs to populate `media_organizations`
2. **Bias Score Display**: Show bias indicators on quiz source citations
3. **Feedback Collection**: Enable bias feedback on quiz sources

### Phase 2: Quiz Enhancement
1. **Bias-Balanced Question Generation**: Ensure diverse source perspectives
2. **Media Bias Quiz Series**: Create dedicated quiz topics for each bias dimension
3. **Source Diversity Scoring**: Rate quizzes on source balance

### Phase 3: Advanced Features
1. **AI-Powered Question Analysis**: Detect bias in question wording
2. **Personalized Media Diet**: Track user's source exposure patterns
3. **Bias Immunity Training**: Progressive exercises to build resistance

## 🎮 Gamification Opportunities

### New Achievements
- **Bias Detective**: Correctly identify bias in 10 sources
- **Balanced Reader**: Complete quizzes citing sources across political spectrum
- **Fact Champion**: Achieve 90%+ accuracy on factual accuracy questions
- **Media Critic**: Submit 25 helpful bias feedback reports

### Skill Progression
```
Novice → Apprentice → Practitioner → Expert → Master
   ↓         ↓            ↓            ↓         ↓
Can spot    Recognizes   Identifies   Predicts  Teaches
obvious     subtle       patterns     impacts   others
bias        framing      across       of bias   to detect
            differences  sources               bias
```

## 🗄️ Database Queries for Integration

### Find Quiz Questions by Source Domain
```sql
SELECT 
  q.question_id,
  q.topic_id,
  q.question,
  source->>'url' as source_url,
  source->>'name' as source_name
FROM questions q,
LATERAL jsonb_array_elements(q.sources) AS source
WHERE source->>'url' LIKE '%cnn.com%'
   OR source->>'url' LIKE '%foxnews.com%';
```

### Analyze Source Diversity by Topic
```sql
WITH source_domains AS (
  SELECT 
    q.topic_id,
    regexp_replace(
      regexp_replace(source->>'url', '^https?://(www\.)?', ''),
      '/.*$', ''
    ) as domain
  FROM questions q,
  LATERAL jsonb_array_elements(q.sources) AS source
)
SELECT 
  topic_id,
  COUNT(DISTINCT domain) as unique_sources,
  array_agg(DISTINCT domain) as domains
FROM source_domains
GROUP BY topic_id
ORDER BY unique_sources DESC;
```

### Map Questions to Media Organizations
```sql
-- After populating media_organizations table
SELECT 
  q.question_id,
  q.question,
  mo.name as organization_name,
  mo.organization_type,
  obs.current_score as political_lean_score,
  bd.dimension_name
FROM questions q,
LATERAL jsonb_array_elements(q.sources) AS source
JOIN media_organizations mo 
  ON mo.domain = regexp_replace(
    regexp_replace(source->>'url', '^https?://(www\.)?', ''),
    '/.*$', ''
  )
LEFT JOIN organization_bias_scores obs
  ON obs.organization_id = mo.id
LEFT JOIN bias_dimensions bd
  ON bd.id = obs.dimension_id
WHERE bd.dimension_slug = 'political_lean';
```

## 📝 Sample Enhanced Quiz Questions

### Original Question (Before Bias Engine)
```json
{
  "question": "What did the President announce about climate policy?",
  "sources": [
    {"name": "White House Statement", "url": "https://whitehouse.gov/..."},
    {"name": "CNN Report", "url": "https://cnn.com/..."}
  ]
}
```

### Enhanced Question (With Bias Engine)
```json
{
  "question": "What did the President announce about climate policy?",
  "sources": [
    {"name": "White House Statement", "url": "https://whitehouse.gov/...", "bias_note": "Official government source"},
    {"name": "CNN Report", "url": "https://cnn.com/...", "bias_scores": {"political_lean": -45, "factual_accuracy": 85}},
    {"name": "Fox News Coverage", "url": "https://foxnews.com/...", "bias_scores": {"political_lean": 65, "factual_accuracy": 75}},
    {"name": "Reuters Analysis", "url": "https://reuters.com/...", "bias_scores": {"political_lean": 0, "factual_accuracy": 95}}
  ],
  "source_balance_score": 0.85,
  "bias_learning_note": "Notice how different outlets emphasize different aspects of the same announcement"
}
```

## 🎯 Success Metrics

### User Engagement
- Increase in source citation clicks (+25% target)
- Bias feedback submissions per quiz (target: 0.5 per user)
- Media literacy skill progression rate

### Content Quality
- Source diversity score per quiz (target: 3+ sources, balance < 30)
- Factual accuracy ratings from user feedback
- Reduction in single-source quiz questions

### Learning Outcomes
- Pre/post assessment improvement in bias recognition
- User confidence in evaluating sources (survey data)
- Real-world application stories from users

## 🚀 Next Steps

1. **Populate Initial Data**: Run domain extraction on existing quiz sources
2. **Enable Feedback**: Activate bias feedback on quiz pages
3. **Create Test Content**: Develop first "Media Bias Detective" quiz series
4. **Measure Impact**: A/B test enhanced vs standard source display
5. **Iterate**: Refine based on user engagement and feedback

---

*This mapping document demonstrates how the media bias engine seamlessly integrates with existing CivicSense quiz infrastructure, enhancing rather than replacing current functionality.* 