# CivicSense User Data Strategy

> **Mission Reminder**: Every data point we collect must advance democratic participation without compromising user trust. Transparency, consent, and accessibility are non-negotiable.

## 📋 Table of Contents
1. Guiding Principles
2. Data Governance & Privacy
3. Table-by-Table Playbook  
   3.1 Learning Progress  
   3.2 Skill Development & Analytics  
   3.3 Content Personalisation  
   3.4 Engagement & Feature Usage  
   3.5 Integrations & External Footprints  
   3.6 Monetisation & Credits  
   3.7 Achievements & Gamification  
   3.8 Feedback, Events & Research  
   3.9 Question Management & Analytics  
   3.10 Question Metadata & Relationships  
   3.11 Content Generation & Quality  
   3.12 Social & Multiplayer Features  
   3.13 Database Views & Optimization
4. Surfacing Insights to Users
5. Example Supabase Queries
6. Open Questions & Next Steps

---

## 1  Guiding Principles
1. **Truth Over Comfort** — collect only data that makes users harder to manipulate.  
2. **Action Over Passive Consumption** — every stored field must map to a concrete next-step we can show the user (quiz reminder, skill plan, etc.).  
3. **Accessibility Is Democracy** — store user preferences (font size, reduced motion) so we never break their experience.  
4. **Transparency by Default** — surface *all* tracked data in a "My Civic Data" dashboard (opt-out or delete at any time).  
5. **No Dark Patterns** — never record or infer sensitive traits (political affiliation, health, religion) without explicit need and consent.

---

## 2  Data Governance & Privacy
| Area | Rule |
|------|------|
| **Consent** | First session → granular toggles (analytics, personalised tips, email). |
| **Retention** | Default 3 years, auto-anonymise inactive accounts after 18 months. |
| **RLS** | All `user_*` tables: `user_id = auth.uid()`.  Admin role can `select`, never `update/delete` directly. |
| **Auditing** | `created_at`, `updated_at`, `created_by`, `updated_by` on every row. |
| **Encryption** | PII fields (`email`, `phone`) → column level pgcrypto.  Tokens → `expo-secure-store`. |

> See `supabase/policies/` for exact SQL.

---

## 3  Table-by-Table Playbook

### 3.1  Learning Progress
| Table | Purpose | When to Write | Key Columns |
|-------|---------|--------------|-------------|
| `user_progress` | Current position in any multi-step flow (quiz, lesson) | On every step change | `content_id`, `step_index`, `time_spent_ms` |
| `user_progress_history` | Immutable log for analytics & streaks | Nightly cron or `INSERT` trigger copying from `user_progress` | Same as above + `completed_at` |
| `user_step_progress` | Fine-grained completion of sub-steps (interactive components) | On sub-step submit | `step_id`, `status`, `score` |
| `user_streak_history` | Daily record of learning activity | End of day worker | `streak_length`, `date` |

**Front-End Usage**:  
```ts
const { data: progress } = await supabase.from('user_progress')
  .select('*')
  .eq('content_id', lessonId)
  .single();
router.push(`/lesson/${lessonId}?step=${progress.step_index}`);
```

### 3.2  Skill Development & Analytics
| Table | Purpose | Write Point | Notes |
|-------|---------|------------|-------|
| `skills` | Master list seeded by curriculum team | Migration | — |
| `question_skills`, `pathway_skills`, `content_item_skills` | Attach skill IDs to content | Authoring pipeline | Many-to-many |
| `user_skill_progress` | Per-skill XP & mastery | After quiz grading | `current_xp`, `level`, `last_practiced` |
| `user_skill_analytics` | Aggregated accuracy & avg time per skill | Nightly job | Drives insights |
| `user_skill_assessment_criteria` | Custom thresholds per user | On settings change | Adaptive algorithms |
| `user_category_skills` | Skills grouped by category of interest | Weekly job | Drives recommendations |

### 3.3  Content Personalisation
| Table | What We Store | Use to… |
|-------|---------------|---------|
| `user_learning_goals` | Target exam date, weekly time goal | Generate weekly plan |
| `user_learning_insights` | Auto-generated summaries (strengths, weaknesses) | Show in "Insights" tab |
| `user_question_memory` | Spaced-repetition history | Adaptive quiz engine |
| `user_custom_decks` / `user_deck_content` | User-curated flashcard decks | Share / remix decks |

### 3.4  Engagement & Feature Usage
| Table | Examples | Dashboard KPI |
|-------|----------|--------------|
| `user_feature_usage` | `{ feature: 'offline_mode', count: 7 }` | % of users enabling offline |
| `user_events` | CTA clicks, page views | Funnel drop-offs |
| `user_generation_usage` | AI summary requests | Tokens used |

### 3.5  Integrations & External Footprints
| Table | Purpose | Example Data |
|-------|---------|-------------|
| `user_integrations` | OAuth tokens (Google Cal, Apple Health) | `provider`, `status` |
| `user_election_tracking` | Races the user follows | `race_id`, `notify_on_updates` |
| `user_representatives` | Cached civic reps by location | `office`, `party` |
| `user_locations` | Home / work geohash (precision 5) | Power mapping |

### 3.6  Monetisation & Credits
| Table | Why | Notes |
|-------|-----|-------|
| `user_credits` | Free vs paid AI tokens | Decrement on usage |
| `user_discount_usage` | Promo code redemptions | Prevent abuse |
| `user_subscriptions` | Stripe webhook sink | Manage paywall |

### 3.7  Achievements & Badges
| Table | Flow |
|-------|------|
| `badge_requirements` → `skill_badges` → `user_badges` | Earn skill-specific badges |
| `pod_achievements` → `user_achievements` | Group challenges |

### 3.8  Feedback, Events & Research
| Table | Purpose |
|-------|---------|
| `user_feedback` | NPS, in-app surveys |
| `user_survey_completions` | Research studies |
| `user_notification_subscriptions` | Push / email topics |
| `user_email_preferences` | Marketing vs transactional |

### 3.9  Question Management & Analytics
| Table | Purpose | Write Point | Key Use Case |
|-------|---------|------------|-------------|
| `questions` | Master question bank | Content authoring | Core civic knowledge Q&A |
| `question_analytics` | Aggregated difficulty & accuracy per question | Nightly job | Identify confusing questions |
| `question_feedback` | User reports (unclear, biased, outdated) | On feedback submit | Crowdsourced quality control |
| `question_feedback_stats` | Aggregated feedback patterns | Weekly job | Prioritize question rewrites |
| `question_response_stats` | Answer distribution & timing | After each response | A/B test question formats |
| `user_question_responses` | Individual answer attempts | On quiz submit | Spaced repetition & progress |
| `user_question_memory` | Spaced repetition scheduling | Algorithm triggers | Optimize retention |
| `assessment_question_stats` | Performance on standardized tests | Post-assessment | Benchmark civic knowledge |
| `user_assessment_questions` | User's assessment history | Test completion | Track mastery over time |
| `survey_questions` | Research questions for studies | Survey creation | Measure app effectiveness |

**Democratic Impact**: Questions are the core of civic education. Track which civic concepts users struggle with most to guide curriculum development and ensure no citizen is left behind in democratic literacy.

### 3.10  Question Metadata & Relationships  
| Table | Purpose | Example Data |
|-------|---------|-------------|
| `question_skills` | Map questions to civic skills | `question_id → "constitutional_law"` |
| `question_topic_categories` | Organize by civic domain | `question_id → "voting_rights"` |
| `question_topics` | Fine-grained topic tagging | `question_id → "gerrymandering"` |
| `question_topics_few_questions` | Topics needing more content | Auto-flagged topics with <5 questions |
| `question_event_connections` | Link to current events | `question_id → breaking_news_id` |
| `question_source_links` | Original source material | `question_id → credible_news_url` |
| `question_sources_enhanced` | AI-enriched source metadata | Credibility scores, bias analysis |

### 3.11  Content Generation & Quality
| Table | Purpose | Workflow |
|-------|---------|---------|
| `content_generation_queue` | AI question generation tasks | Content team → AI → review queue |
| `custom_content_questions` | User-contributed questions | Community moderation pipeline |
| `source_fetch_queue` | Scrape civic news for questions | RSS feeds → AI processing → questions |

**Truth Over Comfort**: These tables ensure every question is grounded in verifiable sources and reveals how power actually works, not how civics textbooks say it should work.

### 3.12  Social & Multiplayer Features
| Table | Purpose | Democratic Value |
|-------|---------|-----------------|
| `friend_requests` | Connect with other learners | Build civic learning communities |
| `multiplayer_question_responses` | Real-time quiz competitions | Gamify civic knowledge |
| `npc_question_responses` | AI personas (historical figures) | Learn from past civic leaders |
| `pod_join_requests` | Small group civic challenges | Organize local civic action |
| `progress_question_responses` | Shared progress tracking | Peer accountability for civic growth |

### 3.13  Database Views & Optimization
| View | Purpose | Performance Benefit |
|------|---------|-------------------|
| `v_topics_with_questions_and_translations` | Pre-joined topic data | Avoid N+1 queries in mobile app |
| `v_topics_without_questions` | Content gaps for curriculum team | Identify missing civic domains |

---

## 4  Surfacing Insights to Users
| Insight | Data Source | UI Surface | Example Copy |
|---------|-------------|-----------|--------------|
| Weekly progress | `user_streak_history`, `user_progress_history` | Home banner | "You practiced *4 days* this week — keep your streak alive!" |
| Mastered skills | `user_skill_progress` | Profile → Skills | "🎉 You reached *Level 3* in *Constitutional Law*." |
| Goal tracking | `user_learning_goals`, `user_progress` | Dashboard | "12 hours left to hit this week's 5-hour goal." |
| Civic impact | `user_events` (contact reps, petitions) | Impact tab | "You've taken *6 civic actions* this month." |
| **Question mastery** | `user_question_responses`, `question_analytics` | Quiz results | "You're in the top 15% on *voting rights* questions." |
| **Weak spots** | `question_response_stats`, `user_question_memory` | Study recommendations | "Time to review *gerrymandering* — you missed this 3 times." |
| **Current events** | `question_event_connections` | Daily cards | "Test your knowledge of *today's Supreme Court ruling*." |
| **Community engagement** | `multiplayer_question_responses`, `pod_join_requests` | Social tab | "5 friends challenged you to a *Constitutional Law* quiz battle!" |
| **Content quality** | `question_feedback`, `custom_content_questions` | Contributor dashboard | "Your question about *campaign finance* helped 234 users learn." |

---

## 5  Example Supabase Queries
```sql
-- 1. Fetch top 3 weakest skills for personalised quiz
drop policy if exists "weak_skills" on user_skill_analytics;
create policy "weak_skills" on user_skill_analytics
  for select using (auth.uid() = user_id);

select skill_id, accuracy
from user_skill_analytics
where user_id = auth.uid()
order by accuracy asc
limit 3;

-- 2. Update step progress inside transaction
begin;
  insert into user_step_progress (user_id, content_id, step_id, status)
  values (auth.uid(), 'lesson_abc', 'step_3', 'completed')
  on conflict (user_id, step_id) do update
    set status = 'completed', updated_at = now();
commit;

-- 3. Find questions user consistently gets wrong (spaced repetition)
select q.id, q.question_text, count(*) as wrong_attempts
from user_question_responses uqr
join questions q on q.id = uqr.question_id
where uqr.user_id = auth.uid() 
  and uqr.is_correct = false
  and uqr.created_at > now() - interval '30 days'
group by q.id, q.question_text
having count(*) >= 2
order by wrong_attempts desc;

-- 4. Get current events quiz questions
select q.*, qec.event_title, qec.event_date
from questions q
join question_event_connections qec on q.id = qec.question_id
where qec.event_date >= current_date - interval '7 days'
  and q.is_published = true
order by qec.event_date desc;

-- 5. User's civic knowledge percentile by topic
with user_scores as (
  select 
    qt.topic_name,
    avg(case when uqr.is_correct then 1.0 else 0.0 end) as user_accuracy
  from user_question_responses uqr
  join questions q on q.id = uqr.question_id
  join question_topics qt on qt.question_id = q.id
  where uqr.user_id = auth.uid()
  group by qt.topic_name
),
global_scores as (
  select 
    qt.topic_name,
    avg(case when uqr.is_correct then 1.0 else 0.0 end) as global_accuracy
  from user_question_responses uqr
  join questions q on q.id = uqr.question_id
  join question_topics qt on qt.question_id = q.id
  group by qt.topic_name
)
select 
  us.topic_name,
  us.user_accuracy,
  gs.global_accuracy,
  case 
    when us.user_accuracy > gs.global_accuracy + 0.2 then 'Top 15%'
    when us.user_accuracy > gs.global_accuracy + 0.1 then 'Above Average'
    when us.user_accuracy < gs.global_accuracy - 0.1 then 'Needs Practice'
    else 'Average'
  end as performance_tier
from user_scores us
join global_scores gs on us.topic_name = gs.topic_name
order by us.user_accuracy desc;

-- 6. Questions needing review based on feedback
select q.id, q.question_text, 
       count(qf.id) as feedback_count,
       avg(qf.clarity_rating) as avg_clarity,
       array_agg(distinct qf.feedback_type) as feedback_types
from questions q
join question_feedback qf on q.id = qf.question_id
where qf.created_at > now() - interval '90 days'
group by q.id, q.question_text
having count(qf.id) >= 5 or avg(qf.clarity_rating) < 3.0
order by feedback_count desc, avg_clarity asc;

-- 7. Generate adaptive quiz based on user weaknesses
with weak_topics as (
  select qt.topic_name, count(*) as wrong_count
  from user_question_responses uqr
  join questions q on q.id = uqr.question_id
  join question_topics qt on qt.question_id = q.id
  where uqr.user_id = auth.uid() 
    and uqr.is_correct = false
    and uqr.created_at > now() - interval '14 days'
  group by qt.topic_name
  order by wrong_count desc
  limit 3
)
select q.id, q.question_text, q.difficulty_level
from questions q
join question_topics qt on qt.question_id = q.id
join weak_topics wt on wt.topic_name = qt.topic_name
where q.is_published = true
  and q.id not in (
    select question_id from user_question_responses 
    where user_id = auth.uid() 
      and created_at > now() - interval '7 days'
  )
order by random()
limit 10;
```

---

## 6  Open Questions & Next Steps
1. **GDPR / CCPA portal** — build export & delete flows.  
2. **Data volume** — estimate row growth (esp. `user_question_responses`, `question_analytics`). Partitioning strategy?  
3. **Realtime triggers** — use Supabase Functions for live streak counters and multiplayer notifications?  
4. **Cross-device sync** — reconcile progress when offline edits collide.  
5. **Public API** — allow users to export their learning data to personal data pods.
6. **Question quality pipeline** — automate flagging of low-clarity questions based on `question_feedback_stats`.
7. **Content generation ethics** — ensure AI-generated questions in `content_generation_queue` maintain CivicSense's "uncomfortable truths" standard.
8. **Multiplayer privacy** — what question response data do we share between users in `multiplayer_question_responses`?
9. **NPC training** — how do we train AI personas in `npc_question_responses` to embody historical civic leaders authentically?
10. **Spaced repetition optimization** — tune algorithms using `user_question_memory` to maximize long-term civic knowledge retention.

> **Action Item**: schedule a data-model review with curriculum + infra teams before enabling writes to these tables.

### Priority Implementation Order
1. **Phase 1**: Core question tracking (`user_question_responses`, `question_analytics`)
2. **Phase 2**: Spaced repetition system (`user_question_memory`, adaptive quizzing)
3. **Phase 3**: Content quality feedback loop (`question_feedback`, `question_feedback_stats`)
4. **Phase 4**: Social features (`multiplayer_question_responses`, `friend_requests`)
5. **Phase 5**: Advanced AI features (`npc_question_responses`, `content_generation_queue`)

---

**Remember**: Every insert or update should answer the question *"How does this empower the user to engage with power structures?"*  If it doesn't, it doesn't belong in our database. 