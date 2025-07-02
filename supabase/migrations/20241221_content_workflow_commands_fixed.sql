-- Enhanced AI Command System: Content Workflow Commands
-- Migration: 20241221_content_workflow_commands_fixed.sql
-- Purpose: Comprehensive content pipeline from sourcing to publishing
-- Updated to target ai_agent schema

BEGIN;

-- =============================================================================
-- CREATE AI_AGENT SCHEMA IF NOT EXISTS
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS ai_agent;

-- =============================================================================
-- SCHEMA UPDATES (Add any missing columns first)
-- =============================================================================

-- Add missing columns to ai_agent.ai_prompts table
-- These columns are referenced in the ai_prompts inserts below but missing from base schema
ALTER TABLE ai_agent.ai_prompts ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE ai_agent.ai_prompts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE ai_agent.ai_prompts ADD COLUMN IF NOT EXISTS parameters TEXT[];
ALTER TABLE ai_agent.ai_prompts ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,2);
ALTER TABLE ai_agent.ai_prompts ADD COLUMN IF NOT EXISTS max_tokens INTEGER;

-- Add comprehensive good and bad examples for AI agent guidance
ALTER TABLE ai_agent.ai_prompts ADD COLUMN IF NOT EXISTS good_examples JSONB DEFAULT '{}';
ALTER TABLE ai_agent.ai_prompts ADD COLUMN IF NOT EXISTS bad_examples JSONB DEFAULT '{}';

-- Add other missing columns that will be needed for comprehensive command system
ALTER TABLE ai_agent.ai_commands ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE ai_agent.ai_commands ADD COLUMN IF NOT EXISTS complexity_score INTEGER DEFAULT 1 CHECK (complexity_score >= 1 AND complexity_score <= 10);
ALTER TABLE ai_agent.ai_commands ADD COLUMN IF NOT EXISTS estimated_cost_usd DECIMAL(8,4) DEFAULT 0.00;
ALTER TABLE ai_agent.ai_commands ADD COLUMN IF NOT EXISTS requires_streaming BOOLEAN DEFAULT false;
ALTER TABLE ai_agent.ai_commands ADD COLUMN IF NOT EXISTS allows_batch_processing BOOLEAN DEFAULT false;
ALTER TABLE ai_agent.ai_commands ADD COLUMN IF NOT EXISTS max_batch_size INTEGER DEFAULT 1;
ALTER TABLE ai_agent.ai_commands ADD COLUMN IF NOT EXISTS required_integrations TEXT[];

ALTER TABLE ai_agent.ai_actions ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE ai_agent.ai_actions ADD COLUMN IF NOT EXISTS complexity_score INTEGER DEFAULT 1 CHECK (complexity_score >= 1 AND complexity_score <= 10);
ALTER TABLE ai_agent.ai_actions ADD COLUMN IF NOT EXISTS estimated_cost_usd DECIMAL(8,4) DEFAULT 0.00;
ALTER TABLE ai_agent.ai_actions ADD COLUMN IF NOT EXISTS max_concurrent_executions INTEGER DEFAULT 1;
ALTER TABLE ai_agent.ai_actions ADD COLUMN IF NOT EXISTS required_integrations TEXT[];

ALTER TABLE ai_agent.ai_prompts ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE ai_agent.ai_prompts ADD COLUMN IF NOT EXISTS cost_per_execution DECIMAL(8,4) DEFAULT 0.00;
ALTER TABLE ai_agent.ai_prompts ADD COLUMN IF NOT EXISTS required_model_capabilities TEXT[];

-- =============================================================================
-- CONTENT WORKFLOW COMMANDS AND ACTIONS
-- =============================================================================

-- =============================================================================
-- CONTENT DISCOVERY & SOURCING COMMANDS
-- =============================================================================

-- Command: Comprehensive Congressional Content Discovery
INSERT INTO ai_agent.ai_commands (
  command_name,
  display_name,
  description,
  category,
  natural_language_patterns,
  example_inputs,
  intent_keywords,
  parameters_schema,
  requires_admin,
  timeout_seconds
) VALUES (
  'discover_congressional_content',
  'Discover Congressional Content',
  'Comprehensively discover and catalog new congressional content from Congress API and GovInfo API',
  'content',
  ARRAY[
    'discover (congressional|congress) content.*',
    'find new (bills?|legislation|hearings?|reports?).*',
    'search (congress|congressional) (database|api).*',
    'what.* new in congress.*'
  ],
  ARRAY[
    'discover congressional content for the last week',
    'find new bills about healthcare',
    'search congress api for climate legislation',
    'what new bills were introduced today'
  ],
  ARRAY['discover', 'congress', 'bills', 'legislation', 'hearings', 'reports', 'congressional'],
  jsonb_build_object(
    'congress_number', jsonb_build_object('type', 'integer', 'default', 118),
    'content_types', jsonb_build_object('type', 'array', 'items', jsonb_build_object('type', 'string'), 'default', '["bills", "hearings", "reports", "nominations"]'),
    'date_range', jsonb_build_object('type', 'object', 'properties', jsonb_build_object(
      'start_date', jsonb_build_object('type', 'string', 'format', 'date'),
      'end_date', jsonb_build_object('type', 'string', 'format', 'date')
    )),
    'topics', jsonb_build_object('type', 'array', 'items', jsonb_build_object('type', 'string')),
    'limit', jsonb_build_object('type', 'integer', 'default', 100)
  ),
  true,
  300
);

-- Command: Aggregate News Articles for Content Generation
INSERT INTO ai_agent.ai_commands (
  command_name,
  display_name,
  description,
  category,
  natural_language_patterns,
  example_inputs,
  intent_keywords,
  parameters_schema,
  requires_admin,
  timeout_seconds
) VALUES (
  'aggregate_news_sources',
  'Aggregate News Sources',
  'Collect and aggregate news articles from multiple sources for content generation',
  'content',
  ARRAY[
    'aggregate news.*',
    'collect (news|articles).*',
    'gather (political|civic) news.*',
    'find news about.*'
  ],
  ARRAY[
    'aggregate news about voting rights',
    'collect articles on supreme court decisions',
    'gather political news from last 24 hours',
    'find news about congressional actions'
  ],
  ARRAY['aggregate', 'news', 'articles', 'collect', 'gather', 'sources'],
  jsonb_build_object(
    'topics', jsonb_build_object('type', 'array', 'items', jsonb_build_object('type', 'string'), 'required', true),
    'sources', jsonb_build_object('type', 'array', 'items', jsonb_build_object('type', 'string'), 'default', '["congress.gov", "govinfo.gov", "whitehouse.gov"]'),
    'time_range', jsonb_build_object('type', 'string', 'enum', '["24h", "3d", "7d", "30d"]', 'default', '24h'),
    'bias_balance', jsonb_build_object('type', 'boolean', 'default', true),
    'min_credibility', jsonb_build_object('type', 'number', 'default', 70)
  ),
  true,
  180
);

-- =============================================================================
-- CONTENT VALIDATION & OPTIMIZATION COMMANDS
-- =============================================================================

-- Command: Validate Content Against CivicSense Rubrics
INSERT INTO ai_agent.ai_commands (
  command_name,
  display_name,
  description,
  category,
  natural_language_patterns,
  example_inputs,
  intent_keywords,
  parameters_schema,
  requires_admin,
  timeout_seconds
) VALUES (
  'validate_civic_content',
  'Validate Civic Content',
  'Validate content against CivicSense brand voice and quality rubrics',
  'content',
  ARRAY[
    'validate (content|article|quiz).*',
    'check content quality.*',
    'verify brand voice.*',
    'assess civic content.*'
  ],
  ARRAY[
    'validate content for brand voice compliance',
    'check content quality score',
    'verify this article meets our standards',
    'assess civic content quality'
  ],
  ARRAY['validate', 'check', 'verify', 'quality', 'brand', 'voice', 'rubric'],
  jsonb_build_object(
    'content_id', jsonb_build_object('type', 'string', 'required', true),
    'content_type', jsonb_build_object('type', 'string', 'enum', '["quiz", "article", "news_analysis", "public_figure", "glossary"]'),
    'validation_criteria', jsonb_build_object('type', 'array', 'items', jsonb_build_object('type', 'string'), 
      'default', '["brand_voice", "accuracy", "actionability", "uncomfortable_truths", "power_dynamics"]'),
    'minimum_scores', jsonb_build_object('type', 'object', 'properties', jsonb_build_object(
      'brand_voice', jsonb_build_object('type', 'number', 'default', 70),
      'accuracy', jsonb_build_object('type', 'number', 'default', 80),
      'actionability', jsonb_build_object('type', 'number', 'default', 60)
    ))
  ),
  true,
  120
);

-- Command: Optimize Content for Engagement
INSERT INTO ai_agent.ai_commands (
  command_name,
  display_name,
  description,
  category,
  natural_language_patterns,
  example_inputs,
  intent_keywords,
  parameters_schema,
  requires_admin,
  timeout_seconds
) VALUES (
  'optimize_content_engagement',
  'Optimize Content for Engagement',
  'Optimize content for maximum civic engagement while maintaining brand standards',
  'content',
  ARRAY[
    'optimize content.*',
    'improve (engagement|readability).*',
    'enhance civic content.*',
    'make content more engaging.*'
  ],
  ARRAY[
    'optimize content for mobile users',
    'improve engagement on this quiz',
    'enhance civic content readability',
    'make content more engaging for young adults'
  ],
  ARRAY['optimize', 'improve', 'enhance', 'engagement', 'readability'],
  jsonb_build_object(
    'content_id', jsonb_build_object('type', 'string', 'required', true),
    'optimization_goals', jsonb_build_object('type', 'array', 'items', jsonb_build_object('type', 'string'),
      'default', '["clarity", "engagement", "mobile", "accessibility"]'),
    'target_audience', jsonb_build_object('type', 'string', 'enum', '["general", "youth", "educators", "activists"]'),
    'preserve_elements', jsonb_build_object('type', 'array', 'items', jsonb_build_object('type', 'string'),
      'default', '["uncomfortable_truths", "action_steps", "source_citations"]')
  ),
  true,
  180
);

-- =============================================================================
-- CONTENT GENERATION COMMANDS
-- =============================================================================

-- Command: Generate Quiz from Congressional Documents
INSERT INTO ai_agent.ai_commands (
  command_name,
  display_name,
  description,
  category,
  natural_language_patterns,
  example_inputs,
  intent_keywords,
  parameters_schema,
  requires_admin,
  timeout_seconds
) VALUES (
  'generate_congressional_quiz',
  'Generate Congressional Quiz',
  'Generate educational quiz content from congressional documents using AI',
  'content',
  ARRAY[
    'generate quiz.* (from|about) (congress|bill|legislation).*',
    'create quiz.* congressional.*',
    'make quiz.* (bill|hearing|report).*'
  ],
  ARRAY[
    'generate quiz from HR 1234',
    'create quiz about recent healthcare bills',
    'make quiz from congressional hearing on climate',
    'generate quiz about voting rights legislation'
  ],
  ARRAY['generate', 'create', 'quiz', 'congress', 'bill', 'legislation'],
  jsonb_build_object(
    'source_type', jsonb_build_object('type', 'string', 'enum', '["bill", "hearing", "report", "multiple"]', 'required', true),
    'source_ids', jsonb_build_object('type', 'array', 'items', jsonb_build_object('type', 'string')),
    'quiz_config', jsonb_build_object('type', 'object', 'properties', jsonb_build_object(
      'question_count', jsonb_build_object('type', 'integer', 'default', 10),
      'difficulty', jsonb_build_object('type', 'string', 'enum', '["easy", "medium", "hard", "mixed"]', 'default', 'medium'),
      'focus_areas', jsonb_build_object('type', 'array', 'items', jsonb_build_object('type', 'string'))
    )),
    'civicsense_requirements', jsonb_build_object('type', 'object', 'properties', jsonb_build_object(
      'include_uncomfortable_truths', jsonb_build_object('type', 'boolean', 'default', true),
      'include_power_dynamics', jsonb_build_object('type', 'boolean', 'default', true),
      'include_action_steps', jsonb_build_object('type', 'boolean', 'default', true)
    ))
  ),
  true,
  300
);

-- =============================================================================
-- CONTENT WORKFLOW ACTIONS
-- =============================================================================

-- Action: Query Congress API
INSERT INTO ai_agent.ai_actions (
  action_name,
  display_name,
  description,
  action_type,
  executor_class,
  executor_method,
  configuration,
  input_schema,
  output_schema,
  timeout_seconds,
  retry_count,
  is_idempotent
) VALUES (
  'query_congress_api',
  'Query Congress API',
  'Query the Congress.gov API for legislative data',
  'api_call',
  'CongressApiIntegrator',
  'queryCongressData',
  jsonb_build_object(
    'base_url', 'https://api.congress.gov/v3',
    'api_key_env', 'CONGRESS_API_KEY',
    'rate_limit', 1000
  ),
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'endpoint', jsonb_build_object('type', 'string', 'required', true),
      'params', jsonb_build_object('type', 'object'),
      'congress', jsonb_build_object('type', 'integer')
    )
  ),
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'results', jsonb_build_object('type', 'array'),
      'total_count', jsonb_build_object('type', 'integer'),
      'next_page', jsonb_build_object('type', 'string')
    )
  ),
  30,
  3,
  true
);

-- Action: Query GovInfo API
INSERT INTO ai_agent.ai_actions (
  action_name,
  display_name,
  description,
  action_type,
  executor_class,
  executor_method,
  configuration,
  input_schema,
  output_schema,
  timeout_seconds,
  retry_count,
  is_idempotent
) VALUES (
  'query_govinfo_api',
  'Query GovInfo API',
  'Query the GovInfo API for government documents',
  'api_call',
  'GovInfoApiIntegrator',
  'queryGovInfoData',
  jsonb_build_object(
    'base_url', 'https://api.govinfo.gov',
    'api_key_env', 'GOVINFO_API_KEY',
    'collections', '["BILLS", "CRPT", "CHRG", "PLAW"]'
  ),
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'collection', jsonb_build_object('type', 'string'),
      'query', jsonb_build_object('type', 'string'),
      'date_range', jsonb_build_object('type', 'object')
    )
  ),
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'documents', jsonb_build_object('type', 'array'),
      'count', jsonb_build_object('type', 'integer'),
      'nextPage', jsonb_build_object('type', 'string')
    )
  ),
  30,
  3,
  true
);

-- Action: Apply Brand Voice Validation
INSERT INTO ai_agent.ai_actions (
  action_name,
  display_name,
  description,
  action_type,
  executor_class,
  executor_method,
  configuration,
  input_schema,
  output_schema,
  timeout_seconds,
  retry_count,
  is_idempotent
) VALUES (
  'apply_brand_voice_validation',
  'Apply Brand Voice Validation',
  'Validate content against CivicSense brand voice standards',
  'ai_generation',
  'BrandVoiceValidator',
  'validateContent',
  jsonb_build_object(
    'validation_rules', jsonb_build_object(
      'truth_over_comfort', true,
      'clarity_over_politeness', true,
      'action_over_passive', true,
      'evidence_over_opinion', true
    )
  ),
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'content', jsonb_build_object('type', 'string', 'required', true),
      'content_type', jsonb_build_object('type', 'string')
    )
  ),
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'is_valid', jsonb_build_object('type', 'boolean'),
      'scores', jsonb_build_object('type', 'object'),
      'issues', jsonb_build_object('type', 'array'),
      'suggestions', jsonb_build_object('type', 'array')
    )
  ),
  60,
  1,
  true
);

-- =============================================================================
-- CONTENT WORKFLOW PROMPTS
-- =============================================================================

-- Prompt: Congressional Content Analysis
INSERT INTO ai_agent.ai_prompts (
  prompt_name,
  description,
  prompt_type,
  prompt_template,
  parameters,
  provider,
  model_config,
  temperature,
  max_tokens,
  good_examples,
  bad_examples
) VALUES (
  'analyze_congressional_document',
  'Analyze congressional documents for key civic education opportunities',
  'analysis',
  'You are a CivicSense content analyst. Analyze the following congressional document and identify:

1. **Uncomfortable Truths**: What do politicians not want people to know about this?
2. **Power Dynamics**: Who benefits and who loses? Follow the money and influence.
3. **Civic Actions**: What specific steps can citizens take?
4. **Key Stakeholders**: Name specific people, not vague "lawmakers"

Document Type: {{document_type}}
Document Title: {{document_title}}
Document Content: {{document_content}}

Provide a structured analysis that reveals how power actually works, not civics textbook fantasies.',
  ARRAY['document_type', 'document_title', 'document_content'],
  'openai',
  jsonb_build_object('model', 'gpt-4-turbo-preview'),
  0.7,
  2000,
  jsonb_build_object(
    'content_analysis', jsonb_build_object(
      'uncomfortable_truths', ARRAY[
        'This bill allows pharmaceutical companies to set prices 40% higher than negotiated Medicare rates by exempting "breakthrough" drugs that haven''t been proven more effective than existing treatments.',
        'Senator McConnell''s amendment creates a loophole that lets defense contractors avoid competitive bidding on contracts worth over $50 million.',
        'The bill requires a 60% supermajority to close tax loopholes used by hedge funds, making it nearly impossible to reform.'
      ],
      'power_dynamics', ARRAY[
        'Pharmaceutical lobby spent $4.7M on this bill''s sponsors in the last election cycle, with Rep. Smith (R-TX) receiving the most at $340K.',
        'Three former EPA administrators now work for companies that would benefit from these environmental rule changes.',
        'The bill''s language was written by K Street firm Williams & Jensen, whose clients include all major oil companies.'
      ],
      'specific_actors', ARRAY[
        'Rep. Johnson (D-CA) chairs the subcommittee and owns $200K in healthcare stocks that would benefit from this legislation.',
        'EPA Administrator Wheeler previously lobbied for coal companies and still holds stock options worth $2.3M.',
        'Sen. Murphy''s (D-CT) chief of staff formerly worked for Aetna, which stands to gain $800M annually from these changes.'
      ],
      'civic_actions', ARRAY[
        'Call Rep. Smith at (202) 225-3452 and demand she explain why she voted to exempt oil companies from cleanup costs.',
        'Submit public comment to EPA by March 15th opposing rule changes at www.regulations.gov (Docket ID: EPA-2024-0123).',
        'Attend town hall with Sen. Murphy on Feb 20th at Hartford Community Center to ask about healthcare stock holdings.'
      ]
    ),
    'brand_voice_compliance', jsonb_build_object(
      'active_voice', ARRAY[
        'Congress voted to increase defense spending by $50 billion.',
        'The pharmaceutical lobby killed the prescription drug pricing amendment.',
        'Three Republicans switched their votes after meeting with oil executives.'
      ],
      'specific_naming', ARRAY[
        'Sen. McConnell (R-KY) blocked the voting rights bill for the third time this session.',
        'EPA Administrator Wheeler approved the pesticide despite knowing it causes birth defects.',
        'Rep. Pelosi''s (D-CA) husband bought defense stocks one week before the military budget vote.'
      ],
      'uncomfortable_truths', ARRAY[
        'This "patient protection" bill actually increases insurance company profits by $12 billion annually.',
        'The climate bill exempts the 15 largest polluting companies from new emission standards.',
        'Members of Congress can legally insider trade based on upcoming legislation votes.'
      ]
    )
  ),
  jsonb_build_object(
    'content_analysis', jsonb_build_object(
      'passive_voice', ARRAY[
        'Mistakes were made in the oversight process.',
        'It has been suggested that changes might be needed.',
        'The bill was passed by lawmakers yesterday.'
      ],
      'vague_language', ARRAY[
        'Some officials believe this could impact the economy.',
        'The government is working on solutions.',
        'Experts suggest this might affect healthcare.'
      ],
      'diplomatic_softening', ARRAY[
        'This represents a difference of opinion between stakeholders.',
        'The policy may have unintended consequences for some groups.',
        'There are various perspectives on this complex issue.'
      ],
      'missing_uncomfortable_truths', ARRAY[
        'This bipartisan bill will help American families.',
        'The legislation aims to improve government efficiency.',
        'Both parties worked together to find common ground.'
      ],
      'weak_power_analysis', ARRAY[
        'Industry groups have expressed concerns about the bill.',
        'Lobbyists are monitoring the situation closely.',
        'Special interests are involved in the process.'
      ]
    ),
    'false_equivalencies', ARRAY[
      'Both parties share blame for this crisis.',
      'There are good people on both sides of this issue.',
      'Democrats and Republicans equally contributed to this problem.'
    ]
  )
);

-- Prompt: Quiz Generation from Congressional Content
INSERT INTO ai_agent.ai_prompts (
  prompt_name,
  description,
  prompt_type,
  prompt_template,
  parameters,
  provider,
  model_config,
  temperature,
  max_tokens,
  good_examples,
  bad_examples
) VALUES (
  'generate_quiz_from_congress',
  'Generate educational quiz questions from congressional documents',
  'generation',
  'Create {{question_count}} quiz questions from this congressional document that follow CivicSense standards:

Document: {{document_summary}}
Key Points: {{key_points}}
Difficulty: {{difficulty}}

Requirements:
- Each question must reveal an uncomfortable truth about power
- Name specific institutions and officials, not "government"
- Include questions about who benefits from this legislation
- Focus on actionable civic knowledge, not trivia

Format each question as:
{
  "question": "specific question text",
  "options": ["A", "B", "C", "D"],
  "correct_answer": "letter",
  "explanation": "explanation that includes uncomfortable truth",
  "civic_action": "what citizens can do about this"
}',
  ARRAY['question_count', 'document_summary', 'key_points', 'difficulty'],
  'openai',
  jsonb_build_object('model', 'gpt-4-turbo-preview'),
  0.8,
  3000,
  jsonb_build_object(
    'multiple_choice_questions', ARRAY[
      jsonb_build_object(
        'question', 'Which pharmaceutical company will benefit most from the Medicare "breakthrough drug" exemption in HR 3456?',
        'options', ARRAY['Johnson & Johnson, which spent $2.3M lobbying for this exemption', 'Pfizer, which has three drugs that would qualify', 'Moderna, which developed the provision''s language', 'Roche, which employs the bill''s lead sponsor''s former chief of staff'],
        'correct_answer', 'A',
        'explanation', 'Johnson & Johnson spent the most on lobbying specifically for this exemption and has four "breakthrough" drugs that aren''t more effective than existing treatments but would avoid price negotiations under this bill.',
        'civic_action', 'Call your representatives at (202) 224-3121 and ask them to remove the breakthrough drug exemption that lets pharmaceutical companies avoid Medicare price negotiations.',
        'why_good', 'Names specific company, reveals lobbying influence, includes dollar amounts, provides direct action'
      ),
      jsonb_build_object(
        'question', 'What happens when EPA Administrator Wheeler approves pesticides despite knowing health risks?',
        'options', ARRAY['Companies must pay health damage costs', 'Wheeler faces criminal prosecution', 'Families exposed to toxins have no legal recourse', 'Congress automatically reviews the decision'],
        'correct_answer', 'C',
        'explanation', 'EPA has legal immunity for approved pesticides, meaning families harmed by chemicals Wheeler approved despite health evidence cannot sue for damages. This protection was added by the chemical industry lobby in 1996.',
        'civic_action', 'Join the lawsuit filed by Beyond Pesticides (beyondpesticides.org) or demand your state legislature pass pesticide notification laws.',
        'why_good', 'Reveals uncomfortable truth about legal immunity, explains systemic protection for industry, provides specific action'
      )
    ],
    'true_false_questions', ARRAY[
      jsonb_build_object(
        'question', 'True or False: Members of Congress must sell their stocks before voting on legislation that affects those companies.',
        'correct_answer', 'False',
        'explanation', 'Congress members can legally trade stocks based on insider information from upcoming votes. The STOCK Act of 2012 requires disclosure but not divestiture, and many members still trade actively.',
        'civic_action', 'Support the Ban Congressional Stock Trading Act by calling your representatives and demanding they cosponsor HR 1579.',
        'why_good', 'Exposes legal insider trading, references specific legislation, provides concrete action'
      )
    ],
    'question_explanations', jsonb_build_object(
      'uncomfortable_truth_integration', 'Each explanation must reveal something politicians don''t want voters to know - like legal corruption, industry capture, or systemic advantages for the wealthy.',
      'specific_action_requirement', 'Every civic action must include specific contact information, bill numbers, or organization names - not vague suggestions to "get involved".',
      'power_dynamics_focus', 'Questions should reveal who has power, how they use it, and who benefits from current systems rather than testing civics textbook knowledge.'
    )
  ),
  jsonb_build_object(
    'bad_multiple_choice', ARRAY[
      jsonb_build_object(
        'question', 'What branch of government makes laws?',
        'options', ARRAY['Executive', 'Legislative', 'Judicial', 'Administrative'],
        'correct_answer', 'B',
        'explanation', 'The legislative branch, consisting of the House and Senate, is responsible for making laws according to the Constitution.',
        'civic_action', 'Citizens should learn about how government works.',
        'why_bad', 'Basic civics trivia, no uncomfortable truth, vague civic action, teaches theory not reality'
      ),
      jsonb_build_object(
        'question', 'How does a bill become a law?',
        'options', ARRAY['President signs it', 'Congress passes it', 'Supreme Court approves it', 'Both houses of Congress pass it and the President signs it'],
        'correct_answer', 'D',
        'explanation', 'A bill must pass both houses of Congress and be signed by the President to become law.',
        'civic_action', 'Citizens should participate in democracy.',
        'why_bad', 'Textbook answer ignoring lobbying, committee gatekeepers, and corporate influence on legislation'
      )
    ],
    'problematic_patterns', jsonb_build_object(
      'passive_voice', ARRAY[
        'The bill was passed by Congress.',
        'Mistakes were made in the oversight process.',
        'Changes are being considered by lawmakers.'
      ],
      'vague_language', ARRAY[
        'Some representatives support this measure.',
        'The government is working on solutions.',
        'Officials are concerned about the impact.'
      ],
      'missing_power_analysis', ARRAY[
        'This bipartisan bill helps American families.',
        'The legislation aims to improve efficiency.',
        'Both parties worked together on this compromise.'
      ],
      'weak_civic_actions', ARRAY[
        'Citizens should vote.',
        'People need to get involved.',
        'Contact your representatives.',
        'Stay informed about politics.'
      ]
    ),
    'quiz_content_violations', jsonb_build_object(
      'civics_textbook_questions', 'Questions that test memorization of how government is supposed to work rather than how it actually works',
      'entertainment_politics', 'Questions that treat politics like sports or entertainment rather than power structures that affect people''s lives',
      'false_balance', 'Questions that suggest "both sides" are equally responsible for problems or equally valid in their positions',
      'academic_jargon', 'Questions using terms like "stakeholders" or "policymakers" instead of naming specific people and institutions'
    )
  )
);

-- =============================================================================
-- WORKFLOW CONNECTIONS
-- =============================================================================

-- Workflow: Discover Congressional Content
INSERT INTO ai_agent.ai_command_actions (command_id, action_id, execution_order, input_mapping, output_mapping)
SELECT 
  c.id,
  a.id,
  1,
  jsonb_build_object(
    'endpoint', '/bill',
    'params', jsonb_build_object(
      'congress', '{{parameters.congress_number}}',
      'limit', '{{parameters.limit}}'
    )
  ),
  jsonb_build_object('congress_results', 'results')
FROM ai_agent.ai_commands c, ai_agent.ai_actions a
WHERE c.command_name = 'discover_congressional_content'
  AND a.action_name = 'query_congress_api';

-- Add GovInfo query to discovery workflow
INSERT INTO ai_agent.ai_command_actions (command_id, action_id, execution_order, input_mapping, output_mapping)
SELECT 
  c.id,
  a.id,
  2,
  jsonb_build_object(
    'collection', 'BILLS',
    'date_range', '{{parameters.date_range}}'
  ),
  jsonb_build_object('govinfo_results', 'documents')
FROM ai_agent.ai_commands c, ai_agent.ai_actions a
WHERE c.command_name = 'discover_congressional_content'
  AND a.action_name = 'query_govinfo_api';

-- Workflow: Generate Congressional Quiz
INSERT INTO ai_agent.ai_command_actions (command_id, action_id, execution_order, input_mapping, output_mapping)
SELECT 
  c.id,
  a.id,
  1,
  jsonb_build_object(
    'endpoint', '/bill/{{parameters.source_ids[0]}}',
    'params', jsonb_build_object()
  ),
  jsonb_build_object('bill_data', 'results')
FROM ai_agent.ai_commands c, ai_agent.ai_actions a
WHERE c.command_name = 'generate_congressional_quiz'
  AND a.action_name = 'query_congress_api';

-- Connect prompts to actions
INSERT INTO ai_agent.ai_action_prompts (action_id, prompt_id, usage_context, parameter_mapping)
SELECT 
  a.id,
  p.id,
  'execution',
  jsonb_build_object(
    'document_type', '{{input.source_type}}',
    'document_content', '{{context.bill_data}}'
  )
FROM ai_agent.ai_actions a, ai_agent.ai_prompts p
WHERE a.action_name = 'apply_brand_voice_validation'
  AND p.prompt_name = 'analyze_congressional_document';

COMMIT; 