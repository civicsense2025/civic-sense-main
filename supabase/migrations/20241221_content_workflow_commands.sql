-- Enhanced AI Command System: Content Workflow Commands
-- Migration: 20241221_content_workflow_commands.sql
-- Purpose: Comprehensive content pipeline from sourcing to publishing

-- =============================================================================
-- CONTENT DISCOVERY & SOURCING COMMANDS
-- =============================================================================

-- Command: Comprehensive Congressional Content Discovery
INSERT INTO ai_commands (
  command_name,
  command_description,
  natural_language_patterns,
  intent_keywords,
  parameter_schema,
  command_category,
  priority_level,
  requires_auth,
  estimated_duration_seconds,
  success_criteria
) VALUES (
  'discover_congressional_content',
  'Comprehensively discover and catalog new congressional content from multiple sources',
  ARRAY[
    'find new congressional content',
    'discover latest bills and hearings',
    'scan congress.gov for updates',
    'check for new legislative documents',
    'search congressional databases',
    'identify trending political content'
  ],
  ARRAY['discover', 'find', 'scan', 'search', 'congressional', 'bills', 'hearings', 'content'],
  '{
    "congress_numbers": {"type": "array", "items": {"type": "integer"}, "default": [118, 119]},
    "content_types": {"type": "array", "items": {"type": "string"}, "default": ["bills", "hearings", "committee_documents"]},
    "date_range": {"type": "object", "properties": {"start": {"type": "string"}, "end": {"type": "string"}}},
    "relevance_threshold": {"type": "number", "default": 0.7},
    "max_items_per_type": {"type": "integer", "default": 50},
    "include_analysis": {"type": "boolean", "default": true}
  }'::jsonb,
  'content_sourcing',
  8,
  true,
  300,
  'Successfully discovered and cataloged new content items'
);

-- Command: Multi-Source News Aggregation
INSERT INTO ai_commands (
  command_name,
  command_description,
  natural_language_patterns,
  intent_keywords,
  parameter_schema,
  command_category,
  priority_level,
  requires_auth,
  estimated_duration_seconds,
  success_criteria
) VALUES (
  'aggregate_political_news',
  'Aggregate and analyze political news from multiple sources with bias detection',
  ARRAY[
    'gather political news',
    'aggregate news sources',
    'collect current events',
    'find breaking political news',
    'scan news for civic content'
  ],
  ARRAY['news', 'aggregate', 'political', 'current', 'events', 'breaking'],
  '{
    "source_categories": {"type": "array", "items": {"type": "string"}, "default": ["mainstream", "alternative", "government", "nonprofit"]},
    "bias_spectrum": {"type": "boolean", "default": true},
    "credibility_minimum": {"type": "number", "default": 60},
    "time_window_hours": {"type": "integer", "default": 24},
    "civic_relevance_filter": {"type": "boolean", "default": true},
    "fact_check_required": {"type": "boolean", "default": true}
  }'::jsonb,
  'content_sourcing',
  7,
  true,
  180,
  'Successfully aggregated and analyzed news sources'
);

-- =============================================================================
-- CONTENT ANALYSIS & PROCESSING COMMANDS  
-- =============================================================================

-- Command: Deep Congressional Document Analysis
INSERT INTO ai_commands (
  command_name,
  command_description,
  natural_language_patterns,
  intent_keywords,
  parameter_schema,
  command_category,
  priority_level,
  requires_auth,
  estimated_duration_seconds,
  success_criteria
) VALUES (
  'analyze_congressional_documents',
  'Perform comprehensive analysis of congressional documents including power dynamics, bias detection, and civic education value',
  ARRAY[
    'analyze congressional documents',
    'review bills and hearings deeply',
    'examine legislative content',
    'assess civic education value',
    'identify power dynamics in congress'
  ],
  ARRAY['analyze', 'review', 'examine', 'assess', 'congressional', 'documents', 'bills'],
  '{
    "document_ids": {"type": "array", "items": {"type": "string"}},
    "analysis_depth": {"type": "string", "enum": ["basic", "comprehensive", "expert"], "default": "comprehensive"},
    "include_power_analysis": {"type": "boolean", "default": true},
    "detect_uncomfortable_truths": {"type": "boolean", "default": true},
    "stakeholder_mapping": {"type": "boolean", "default": true},
    "lobbying_influence_detection": {"type": "boolean", "default": true},
    "contradiction_analysis": {"type": "boolean", "default": true},
    "civic_action_generation": {"type": "boolean", "default": true}
  }'::jsonb,
  'content_analysis',
  9,
  true,
  600,
  'Comprehensive analysis completed with actionable insights'
);

-- Command: Multi-Perspective Content Analysis
INSERT INTO ai_commands (
  command_name,
  command_description,
  natural_language_patterns,
  intent_keywords,
  parameter_schema,
  command_category,
  priority_level,
  requires_auth,
  estimated_duration_seconds,
  success_criteria
) VALUES (
  'multi_perspective_analysis',
  'Analyze content from multiple political and ideological perspectives to ensure balanced civic education',
  ARRAY[
    'analyze from multiple perspectives',
    'check different political viewpoints',
    'ensure balanced coverage',
    'examine all sides of issue',
    'validate content neutrality'
  ],
  ARRAY['perspective', 'viewpoints', 'balanced', 'sides', 'neutrality', 'political'],
  '{
    "content_id": {"type": "string"},
    "perspective_types": {"type": "array", "items": {"type": "string"}, "default": ["conservative", "liberal", "libertarian", "progressive", "centrist"]},
    "include_stakeholder_views": {"type": "boolean", "default": true},
    "bias_detection": {"type": "boolean", "default": true},
    "fact_verification": {"type": "boolean", "default": true},
    "generate_counterarguments": {"type": "boolean", "default": true}
  }'::jsonb,
  'content_analysis',
  8,
  true,
  240,
  'Multi-perspective analysis completed with balanced insights'
);

-- =============================================================================
-- CONTENT VALIDATION & QUALITY CONTROL COMMANDS
-- =============================================================================

-- Command: CivicSense Brand Voice Validation
INSERT INTO ai_commands (
  command_name,
  command_description,
  natural_language_patterns,
  intent_keywords,
  parameter_schema,
  command_category,
  priority_level,
  requires_auth,
  estimated_duration_seconds,
  success_criteria
) VALUES (
  'validate_brand_voice',
  'Validate content against CivicSense brand voice and quality standards',
  ARRAY[
    'validate brand voice',
    'check content quality',
    'ensure civicsense standards',
    'verify uncomfortable truths',
    'validate content compliance'
  ],
  ARRAY['validate', 'brand', 'voice', 'quality', 'standards', 'compliance'],
  '{
    "content_ids": {"type": "array", "items": {"type": "string"}},
    "validation_criteria": {
      "type": "object",
      "properties": {
        "uncomfortable_truth_required": {"type": "boolean", "default": true},
        "active_voice_minimum": {"type": "number", "default": 80},
        "specific_actors_required": {"type": "integer", "default": 2},
        "power_dynamics_required": {"type": "boolean", "default": true},
        "diplomatic_softening_forbidden": {"type": "boolean", "default": true}
      }
    },
    "auto_fix_violations": {"type": "boolean", "default": false},
    "generate_improvement_suggestions": {"type": "boolean", "default": true}
  }'::jsonb,
  'content_validation',
  9,
  true,
  120,
  'Content validated against brand voice standards'
);

-- Command: Fact-Checking and Source Verification
INSERT INTO ai_commands (
  command_name,
  command_description,
  natural_language_patterns,
  intent_keywords,
  parameter_schema,
  command_category,
  priority_level,
  requires_auth,
  estimated_duration_seconds,
  success_criteria
) VALUES (
  'verify_facts_and_sources',
  'Comprehensive fact-checking and source verification for all content claims',
  ARRAY[
    'fact check content',
    'verify sources',
    'validate claims',
    'check factual accuracy',
    'verify information sources'
  ],
  ARRAY['fact', 'check', 'verify', 'sources', 'validate', 'claims', 'accuracy'],
  '{
    "content_ids": {"type": "array", "items": {"type": "string"}},
    "verification_depth": {"type": "string", "enum": ["basic", "thorough", "investigative"], "default": "thorough"},
    "required_source_types": {"type": "array", "items": {"type": "string"}, "default": ["primary", "government", "academic"]},
    "cross_reference_minimum": {"type": "integer", "default": 2},
    "credibility_threshold": {"type": "number", "default": 75},
    "flag_controversial_claims": {"type": "boolean", "default": true}
  }'::jsonb,
  'content_validation',
  10,
  true,
  300,
  'All factual claims verified with credible sources'
);

-- =============================================================================
-- CONTENT OPTIMIZATION & ENHANCEMENT COMMANDS
-- =============================================================================

-- Command: Educational Content Optimization
INSERT INTO ai_commands (
  command_name,
  command_description,
  natural_language_patterns,
  intent_keywords,
  parameter_schema,
  command_category,
  priority_level,
  requires_auth,
  estimated_duration_seconds,
  success_criteria
) VALUES (
  'optimize_educational_content',
  'Optimize content for maximum educational impact and civic engagement',
  ARRAY[
    'optimize content for learning',
    'enhance educational value',
    'improve civic engagement',
    'maximize learning impact',
    'optimize for comprehension'
  ],
  ARRAY['optimize', 'educational', 'learning', 'engagement', 'impact', 'comprehension'],
  '{
    "content_ids": {"type": "array", "items": {"type": "string"}},
    "target_audience": {"type": "string", "enum": ["beginner", "intermediate", "advanced", "mixed"], "default": "mixed"},
    "optimization_goals": {"type": "array", "items": {"type": "string"}, "default": ["engagement", "comprehension", "retention", "action"]},
    "include_interactive_elements": {"type": "boolean", "default": true},
    "generate_discussion_questions": {"type": "boolean", "default": true},
    "add_civic_action_steps": {"type": "boolean", "default": true},
    "reading_level_target": {"type": "string", "default": "grade_10"}
  }'::jsonb,
  'content_optimization',
  8,
  true,
  180,
  'Content optimized for educational impact'
);

-- Command: Generate Comprehensive Quiz Content
INSERT INTO ai_commands (
  command_name,
  command_description,
  natural_language_patterns,
  intent_keywords,
  parameter_schema,
  command_category,
  priority_level,
  requires_auth,
  estimated_duration_seconds,
  success_criteria
) VALUES (
  'generate_comprehensive_quizzes',
  'Generate comprehensive quiz content from congressional documents and analysis',
  ARRAY[
    'generate quiz content',
    'create questions from documents',
    'build educational quizzes',
    'generate learning assessments',
    'create civic knowledge tests'
  ],
  ARRAY['generate', 'quiz', 'questions', 'assessments', 'tests', 'educational'],
  '{
    "source_document_ids": {"type": "array", "items": {"type": "string"}},
    "question_types": {"type": "array", "items": {"type": "string"}, "default": ["multiple_choice", "true_false", "short_answer"]},
    "difficulty_distribution": {"type": "object", "default": {"easy": 30, "medium": 50, "hard": 20}},
    "questions_per_topic": {"type": "integer", "default": 10},
    "include_uncomfortable_truths": {"type": "boolean", "default": true},
    "focus_on_power_dynamics": {"type": "boolean", "default": true},
    "generate_explanations": {"type": "boolean", "default": true},
    "civic_action_integration": {"type": "boolean", "default": true}
  }'::jsonb,
  'content_generation',
  7,
  true,
  240,
  'Comprehensive quizzes generated successfully'
);

-- =============================================================================
-- WORKFLOW ORCHESTRATION COMMANDS
-- =============================================================================

-- Command: Full Content Pipeline Execution
INSERT INTO ai_commands (
  command_name,
  command_description,
  natural_language_patterns,
  intent_keywords,
  parameter_schema,
  command_category,
  priority_level,
  requires_auth,
  estimated_duration_seconds,
  success_criteria
) VALUES (
  'execute_full_content_pipeline',
  'Execute the complete content pipeline from discovery to publication',
  ARRAY[
    'run full content pipeline',
    'execute complete workflow',
    'process content end to end',
    'run entire content workflow',
    'complete content processing'
  ],
  ARRAY['pipeline', 'workflow', 'complete', 'end-to-end', 'process', 'full'],
  '{
    "pipeline_configuration": {
      "type": "object",
      "properties": {
        "discovery_enabled": {"type": "boolean", "default": true},
        "analysis_depth": {"type": "string", "default": "comprehensive"},
        "validation_strict": {"type": "boolean", "default": true},
        "optimization_level": {"type": "string", "default": "high"},
        "auto_publish": {"type": "boolean", "default": false}
      }
    },
    "content_sources": {"type": "array", "items": {"type": "string"}, "default": ["congress_api", "govinfo_api", "news_feeds"]},
    "quality_gates": {"type": "array", "items": {"type": "string"}, "default": ["fact_check", "brand_voice", "educational_value"]},
    "notification_settings": {"type": "object", "default": {"email": true, "slack": false}}
  }'::jsonb,
  'workflow_orchestration',
  10,
  true,
  1800,
  'Complete content pipeline executed successfully'
);

-- =============================================================================
-- AI ACTIONS FOR CONTENT WORKFLOW
-- =============================================================================

-- Action: Congressional API Data Fetching
INSERT INTO ai_actions (
  action_name,
  action_description,
  executor_class,
  executor_method,
  input_schema,
  output_schema,
  timeout_seconds,
  retry_attempts,
  requires_api_key
) VALUES (
  'fetch_congressional_data',
  'Fetch data from Congress.gov API with comprehensive error handling',
  'CongressAPIExecutor',
  'fetchComprehensiveData',
  '{
    "endpoint": {"type": "string", "required": true},
    "parameters": {"type": "object"},
    "congress_numbers": {"type": "array", "items": {"type": "integer"}},
    "include_metadata": {"type": "boolean", "default": true}
  }'::jsonb,
  '{
    "data": {"type": "array"},
    "metadata": {"type": "object"},
    "pagination": {"type": "object"},
    "request_info": {"type": "object"}
  }'::jsonb,
  120,
  3,
  true
);

-- Action: GovInfo Document Processing
INSERT INTO ai_actions (
  action_name,
  action_description,
  executor_class,
  executor_method,
  input_schema,
  output_schema,
  timeout_seconds,
  retry_attempts,
  requires_api_key
) VALUES (
  'process_govinfo_documents',
  'Process and analyze documents from GovInfo API',
  'GovInfoExecutor',
  'processDocuments',
  '{
    "package_ids": {"type": "array", "items": {"type": "string"}},
    "analysis_depth": {"type": "string", "enum": ["basic", "comprehensive"]},
    "extract_entities": {"type": "boolean", "default": true}
  }'::jsonb,
  '{
    "processed_documents": {"type": "array"},
    "extracted_entities": {"type": "array"},
    "analysis_results": {"type": "object"}
  }'::jsonb,
  300,
  2,
  true
);

-- Action: Content Quality Analysis
INSERT INTO ai_actions (
  action_name,
  action_description,
  executor_class,
  executor_method,
  input_schema,
  output_schema,
  timeout_seconds,
  retry_attempts,
  requires_api_key
) VALUES (
  'analyze_content_quality',
  'Comprehensive content quality analysis with CivicSense standards',
  'ContentQualityAnalyzer',
  'analyzeContent',
  '{
    "content": {"type": "string", "required": true},
    "content_type": {"type": "string"},
    "analysis_criteria": {"type": "object"}
  }'::jsonb,
  '{
    "quality_score": {"type": "number"},
    "brand_voice_compliance": {"type": "object"},
    "violations": {"type": "array"},
    "recommendations": {"type": "array"}
  }'::jsonb,
  60,
  2,
  true
);

-- Action: Multi-Source Fact Checking
INSERT INTO ai_actions (
  action_name,
  action_description,
  executor_class,
  executor_method,
  input_schema,
  output_schema,
  timeout_seconds,
  retry_attempts,
  requires_api_key
) VALUES (
  'fact_check_multi_source',
  'Comprehensive fact-checking using multiple verification sources',
  'FactCheckingEngine',
  'verifyMultiSource',
  '{
    "claims": {"type": "array", "items": {"type": "string"}},
    "source_requirements": {"type": "object"},
    "verification_depth": {"type": "string", "default": "thorough"}
  }'::jsonb,
  '{
    "verification_results": {"type": "array"},
    "credibility_scores": {"type": "object"},
    "source_analysis": {"type": "object"}
  }'::jsonb,
  180,
  2,
  true
);

-- =============================================================================
-- SPECIALIZED PROMPTS FOR CONTENT WORKFLOW
-- =============================================================================

-- Prompt: Congressional Document Analysis
INSERT INTO ai_prompts (
  prompt_name,
  prompt_description,
  prompt_template,
  prompt_category,
  model_provider,
  model_name,
  temperature,
  max_tokens,
  response_format
) VALUES (
  'congressional_document_analysis',
  'Comprehensive analysis prompt for congressional documents with CivicSense focus',
  'You are analyzing congressional documents for CivicSense, revealing uncomfortable truths about power dynamics.

DOCUMENT: {{document_title}}
TYPE: {{document_type}}
CONGRESS: {{congress_number}}

CONTENT:
{{document_content}}

Provide analysis in this JSON format:
{
  "executive_summary": "Direct, uncomfortable truth about what this document reveals",
  "power_dynamics": {
    "who_benefits": ["Specific actors who gain power/money"],
    "who_loses": ["Groups that pay the price"],
    "hidden_mechanisms": ["How power actually flows"]
  },
  "uncomfortable_truths": [
    "Truth 1 that politicians don\'t want revealed",
    "Truth 2 about how the system actually works",
    "Truth 3 about who really makes decisions"
  ],
  "stakeholder_analysis": {
    "primary_beneficiaries": [],
    "hidden_influencers": [],
    "affected_populations": []
  },
  "civic_action_steps": [
    "Immediate action citizens can take",
    "Medium-term pressure point",
    "Long-term systemic change approach"
  ],
  "educational_value": {
    "civic_concepts_revealed": [],
    "government_process_exposed": [],
    "democratic_failures_highlighted": []
  }
}

Focus on:
- WHO specifically benefits from this
- HOW power actually flows
- WHAT citizens can do about it
- WHY this matters to daily life',
  'congressional_analysis',
  'anthropic',
  'claude-3-5-sonnet-20241022',
  0.3,
  4000,
  'json'
);

-- Prompt: Multi-Perspective Analysis
INSERT INTO ai_prompts (
  prompt_name,
  prompt_description,
  prompt_template,
  prompt_category,
  model_provider,
  model_name,
  temperature,
  max_tokens,
  response_format
) VALUES (
  'multi_perspective_analysis',
  'Analyze content from multiple political perspectives for balanced civic education',
  'Analyze this content from multiple perspectives to ensure balanced civic education:

CONTENT: {{content_title}}
{{content_body}}

Provide analysis from these perspectives:
{{#each perspectives}}
**{{this}} Perspective:**
- Key concerns and priorities
- How they would frame this issue
- Their proposed solutions
- Valid points they raise
{{/each}}

Return JSON format:
{
  "balanced_summary": "Objective summary acknowledging valid points from all sides",
  "perspective_analysis": {
    {{#each perspectives}}
    "{{this}}": {
      "key_concerns": [],
      "framing": "How they present the issue",
      "solutions": [],
      "valid_points": [],
      "potential_blind_spots": []
    },
    {{/each}}
  },
  "common_ground": ["Areas where perspectives align"],
  "fundamental_disagreements": ["Core differences that can\'t be bridged"],
  "civic_learning_opportunities": [
    "What citizens can learn from each perspective",
    "How to evaluate competing claims",
    "Democratic processes for resolving disagreements"
  ],
  "balanced_action_steps": [
    "Actions that respect multiple viewpoints",
    "Ways to engage constructively across differences"
  ]
}

Maintain CivicSense commitment to truth while respecting legitimate differences.',
  'perspective_analysis',
  'anthropic',
  'claude-3-5-sonnet-20241022',
  0.4,
  3500,
  'json'
);

-- Prompt: Educational Content Optimization
INSERT INTO ai_prompts (
  prompt_name,
  prompt_description,
  prompt_template,
  prompt_category,
  model_provider,
  model_name,
  temperature,
  max_tokens,
  response_format
) VALUES (
  'educational_content_optimization',
  'Optimize content for maximum educational impact and civic engagement',
  'Optimize this civic education content for maximum learning impact:

ORIGINAL CONTENT:
{{content}}

TARGET AUDIENCE: {{target_audience}}
LEARNING OBJECTIVES: {{learning_objectives}}

Transform this content following CivicSense principles:

1. CLARITY: Make complex concepts accessible without dumbing down
2. ENGAGEMENT: Use storytelling and real examples
3. ACTION: Connect learning to civic participation
4. TRUTH: Maintain uncomfortable truths while making them digestible

Return optimized content in this JSON format:
{
  "optimized_content": {
    "hook": "Compelling opening that grabs attention",
    "main_content": "Restructured content with improved flow",
    "key_takeaways": ["3-5 memorable insights"],
    "real_world_examples": ["Specific, recent examples"],
    "uncomfortable_truth": "The hard truth made accessible",
    "power_dynamics_explained": "How power actually works in this context",
    "civic_connection": "Why this matters for civic participation"
  },
  "educational_enhancements": {
    "discussion_questions": ["Questions that provoke deeper thinking"],
    "interactive_elements": ["Suggested activities or exercises"],
    "assessment_opportunities": ["Ways to check understanding"],
    "further_exploration": ["Resources for deeper learning"]
  },
  "civic_action_integration": {
    "immediate_actions": ["What readers can do today"],
    "skill_building": ["Civic skills this content develops"],
    "long_term_engagement": ["Ongoing civic participation opportunities"]
  },
  "accessibility_features": {
    "reading_level": "Grade level assessment",
    "key_terms_defined": {"term": "definition"},
    "visual_aids_suggested": ["Charts, infographics, or diagrams that would help"]
  }
}',
  'content_optimization',
  'anthropic',
  'claude-3-5-sonnet-20241022',
  0.5,
  4000,
  'json'
);

-- =============================================================================
-- WORKFLOW COMPOSITION: COMPLETE CONTENT PIPELINE
-- =============================================================================

-- Link discovery command to data fetching actions
INSERT INTO ai_command_actions (command_id, action_id, execution_order, is_parallel, is_required)
SELECT 
  c.id, 
  a.id, 
  1, 
  true, 
  true
FROM ai_commands c, ai_actions a 
WHERE c.command_name = 'discover_congressional_content' 
AND a.action_name IN ('fetch_congressional_data', 'process_govinfo_documents');

-- Link analysis command to quality analysis
INSERT INTO ai_command_actions (command_id, action_id, execution_order, is_parallel, is_required)
SELECT 
  c.id, 
  a.id, 
  1, 
  false, 
  true
FROM ai_commands c, ai_actions a 
WHERE c.command_name = 'analyze_congressional_documents' 
AND a.action_name = 'analyze_content_quality';

-- Link validation command to fact checking
INSERT INTO ai_command_actions (command_id, action_id, execution_order, is_parallel, is_required)
SELECT 
  c.id, 
  a.id, 
  1, 
  false, 
  true
FROM ai_commands c, ai_actions a 
WHERE c.command_name = 'verify_facts_and_sources' 
AND a.action_name = 'fact_check_multi_source';

-- =============================================================================
-- PROMPT USAGE RELATIONSHIPS
-- =============================================================================

-- Congressional analysis uses congressional document analysis prompt
INSERT INTO ai_action_prompts (action_id, prompt_id, usage_context, parameter_mapping)
SELECT 
  a.id, 
  p.id, 
  'primary_analysis',
  '{
    "document_title": "$.document.title",
    "document_type": "$.document.type", 
    "congress_number": "$.document.congress",
    "document_content": "$.document.content"
  }'::jsonb
FROM ai_actions a, ai_prompts p 
WHERE a.action_name = 'analyze_content_quality' 
AND p.prompt_name = 'congressional_document_analysis';

-- Multi-perspective analysis uses perspective prompt
INSERT INTO ai_action_prompts (action_id, prompt_id, usage_context, parameter_mapping)
SELECT 
  a.id, 
  p.id, 
  'perspective_analysis',
  '{
    "content_title": "$.content.title",
    "content_body": "$.content.body",
    "perspectives": "$.analysis_config.perspectives"
  }'::jsonb
FROM ai_actions a, ai_prompts p 
WHERE a.action_name = 'analyze_content_quality' 
AND p.prompt_name = 'multi_perspective_analysis';

-- Content optimization uses optimization prompt  
INSERT INTO ai_action_prompts (action_id, prompt_id, usage_context, parameter_mapping)
SELECT 
  a.id, 
  p.id, 
  'content_optimization',
  '{
    "content": "$.content.body",
    "target_audience": "$.optimization_config.target_audience",
    "learning_objectives": "$.optimization_config.learning_objectives"
  }'::jsonb
FROM ai_actions a, ai_prompts p 
WHERE a.action_name = 'analyze_content_quality' 
AND p.prompt_name = 'educational_content_optimization';

-- =============================================================================
-- COMMAND USAGE EXAMPLES AND METADATA
-- =============================================================================

-- Add usage examples for complex commands
UPDATE ai_commands SET 
  usage_examples = ARRAY[
    'discover new congressional content from the last 30 days',
    'find recent bills and hearings from congress 118',
    'scan for trending legislative documents'
  ],
  metadata = '{
    "api_dependencies": ["congress_api", "govinfo_api"],
    "estimated_cost": "$0.05-0.15",
    "typical_results": "10-50 new content items",
    "quality_gates": ["relevance_check", "duplicate_detection"]
  }'::jsonb
WHERE command_name = 'discover_congressional_content';

UPDATE ai_commands SET 
  usage_examples = ARRAY[
    'run the complete content pipeline for new bills',
    'execute end-to-end processing workflow', 
    'process and publish congressional updates'
  ],
  metadata = '{
    "workflow_steps": ["discovery", "analysis", "validation", "optimization", "publishing"],
    "estimated_cost": "$2.00-8.00",
    "processing_time": "15-30 minutes",
    "quality_assurance": "comprehensive"
  }'::jsonb
WHERE command_name = 'execute_full_content_pipeline';

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Optimize command discovery by category and keywords
CREATE INDEX IF NOT EXISTS idx_ai_commands_category_keywords ON ai_commands 
USING GIN (command_category, intent_keywords);

-- Optimize workflow execution queries
CREATE INDEX IF NOT EXISTS idx_ai_command_actions_execution ON ai_command_actions 
(command_id, execution_order, is_parallel);

-- Optimize prompt usage lookups
CREATE INDEX IF NOT EXISTS idx_ai_action_prompts_context ON ai_action_prompts 
(action_id, usage_context);

-- =============================================================================
-- ANALYTICS AND MONITORING VIEWS
-- =============================================================================

-- View for content pipeline analytics
CREATE OR REPLACE VIEW content_pipeline_analytics AS
SELECT 
  c.command_name,
  c.command_category,
  COUNT(DISTINCT ca.action_id) as action_count,
  COUNT(DISTINCT ap.prompt_id) as prompt_count,
  c.estimated_duration_seconds,
  c.priority_level,
  CASE 
    WHEN c.command_category = 'workflow_orchestration' THEN 'Pipeline'
    WHEN c.command_category = 'content_sourcing' THEN 'Discovery'
    WHEN c.command_category = 'content_analysis' THEN 'Analysis'
    WHEN c.command_category = 'content_validation' THEN 'Quality Control'
    WHEN c.command_category = 'content_optimization' THEN 'Enhancement'
    ELSE 'Other'
  END as pipeline_stage
FROM ai_commands c
LEFT JOIN ai_command_actions ca ON c.id = ca.command_id
LEFT JOIN ai_actions a ON ca.action_id = a.id
LEFT JOIN ai_action_prompts ap ON a.id = ap.action_id
WHERE c.command_category IN (
  'content_sourcing', 'content_analysis', 'content_validation', 
  'content_optimization', 'content_generation', 'workflow_orchestration'
)
GROUP BY c.id, c.command_name, c.command_category, c.estimated_duration_seconds, c.priority_level;

-- View for command complexity analysis
CREATE OR REPLACE VIEW command_complexity_analysis AS
SELECT 
  c.command_name,
  c.command_category,
  array_length(c.natural_language_patterns, 1) as pattern_variety,
  array_length(c.intent_keywords, 1) as keyword_count,
  jsonb_array_length(c.parameter_schema->'properties') as parameter_complexity,
  COUNT(ca.action_id) as action_count,
  AVG(a.timeout_seconds) as avg_action_timeout,
  c.estimated_duration_seconds,
  CASE 
    WHEN COUNT(ca.action_id) = 1 THEN 'Simple'
    WHEN COUNT(ca.action_id) <= 3 THEN 'Moderate' 
    WHEN COUNT(ca.action_id) <= 6 THEN 'Complex'
    ELSE 'Advanced'
  END as complexity_level
FROM ai_commands c
LEFT JOIN ai_command_actions ca ON c.id = ca.command_id  
LEFT JOIN ai_actions a ON ca.action_id = a.id
GROUP BY c.id, c.command_name, c.command_category, c.natural_language_patterns, 
         c.intent_keywords, c.parameter_schema, c.estimated_duration_seconds;

COMMENT ON VIEW content_pipeline_analytics IS 'Analytics view for content pipeline performance and structure';
COMMENT ON VIEW command_complexity_analysis IS 'Analysis of command complexity and execution characteristics'; 