-- ============================================================================
-- ADD ALL MISSING AI AGENT COLUMNS
-- ============================================================================
-- This migration adds all missing columns needed by the AI agent system
-- Uses IF NOT EXISTS to safely add columns without conflicts

BEGIN;

-- ============================================================================
-- CONVERSATIONS TABLE - Add missing columns
-- ============================================================================

-- Add conversation state management columns
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS conversation_state VARCHAR(50) DEFAULT 'active';
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS current_topic VARCHAR(200);
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS conversation_mode VARCHAR(50) DEFAULT 'assistant';
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS user_satisfaction_score INTEGER CHECK (user_satisfaction_score >= 1 AND user_satisfaction_score <= 5);
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS conversation_summary TEXT;
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS context_data JSONB DEFAULT '{}';
ALTER TABLE ai_agent.conversations ADD COLUMN IF NOT EXISTS conversation_metadata JSONB DEFAULT '{}';

-- ============================================================================
-- MESSAGES TABLE - Add missing columns
-- ============================================================================

ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'standard';
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS context_metadata JSONB DEFAULT '{}';
ALTER TABLE ai_agent.messages ADD COLUMN IF NOT EXISTS processing_metadata JSONB DEFAULT '{}';

-- ============================================================================
-- PATTERNS TABLE - Add missing columns
-- ============================================================================

-- Core pattern fields
ALTER TABLE ai_agent.patterns ADD COLUMN IF NOT EXISTS pattern_type VARCHAR(100) NOT NULL DEFAULT 'general';
ALTER TABLE ai_agent.patterns ADD COLUMN IF NOT EXISTS pattern_category VARCHAR(100) NOT NULL DEFAULT 'general';
ALTER TABLE ai_agent.patterns ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE ai_agent.patterns ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1);
ALTER TABLE ai_agent.patterns ADD COLUMN IF NOT EXISTS evidence JSONB DEFAULT '[]';
ALTER TABLE ai_agent.patterns ADD COLUMN IF NOT EXISTS triggers JSONB DEFAULT '{}';
ALTER TABLE ai_agent.patterns ADD COLUMN IF NOT EXISTS outcomes JSONB DEFAULT '{}';
ALTER TABLE ai_agent.patterns ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE ai_agent.patterns ADD COLUMN IF NOT EXISTS model_version VARCHAR(50) NOT NULL DEFAULT 'unknown';
ALTER TABLE ai_agent.patterns ADD COLUMN IF NOT EXISTS source VARCHAR(100) NOT NULL DEFAULT 'system';
ALTER TABLE ai_agent.patterns ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE ai_agent.patterns ADD COLUMN IF NOT EXISTS success_rate NUMERIC(3,2) DEFAULT 0.5;
ALTER TABLE ai_agent.patterns ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================================
-- MEMORY_CLUSTERS TABLE - Add missing columns
-- ============================================================================

ALTER TABLE ai_agent.memory_clusters ADD COLUMN IF NOT EXISTS cluster_name VARCHAR(200) NOT NULL DEFAULT 'Unnamed Cluster';
ALTER TABLE ai_agent.memory_clusters ADD COLUMN IF NOT EXISTS cluster_type VARCHAR(100) NOT NULL DEFAULT 'general';
ALTER TABLE ai_agent.memory_clusters ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE ai_agent.memory_clusters ADD COLUMN IF NOT EXISTS semantic_keywords TEXT[] DEFAULT '{}';
ALTER TABLE ai_agent.memory_clusters ADD COLUMN IF NOT EXISTS cluster_metadata JSONB DEFAULT '{}';
ALTER TABLE ai_agent.memory_clusters ADD COLUMN IF NOT EXISTS coherence_score NUMERIC(3,2) DEFAULT 0.5;
ALTER TABLE ai_agent.memory_clusters ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================================
-- PERFORMANCE_METRICS TABLE - Add missing columns
-- ============================================================================

ALTER TABLE ai_agent.performance_metrics ADD COLUMN IF NOT EXISTS metric_type VARCHAR(100) NOT NULL DEFAULT 'general';
ALTER TABLE ai_agent.performance_metrics ADD COLUMN IF NOT EXISTS metric_name VARCHAR(200) NOT NULL DEFAULT 'unnamed_metric';
ALTER TABLE ai_agent.performance_metrics ADD COLUMN IF NOT EXISTS value NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE ai_agent.performance_metrics ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT '';
ALTER TABLE ai_agent.performance_metrics ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE ai_agent.performance_metrics ADD COLUMN IF NOT EXISTS agent_type VARCHAR(100);
ALTER TABLE ai_agent.performance_metrics ADD COLUMN IF NOT EXISTS context VARCHAR(200);

-- ============================================================================
-- LEARNING_PATTERNS TABLE - Add missing columns
-- ============================================================================

ALTER TABLE ai_agent.learning_patterns ADD COLUMN IF NOT EXISTS pattern_name VARCHAR(200) NOT NULL DEFAULT 'Unnamed Pattern';
ALTER TABLE ai_agent.learning_patterns ADD COLUMN IF NOT EXISTS pattern_description TEXT;
ALTER TABLE ai_agent.learning_patterns ADD COLUMN IF NOT EXISTS pattern_data JSONB DEFAULT '{}';
ALTER TABLE ai_agent.learning_patterns ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(3,2) DEFAULT 0.5;
ALTER TABLE ai_agent.learning_patterns ADD COLUMN IF NOT EXISTS application_count INTEGER DEFAULT 0;
ALTER TABLE ai_agent.learning_patterns ADD COLUMN IF NOT EXISTS success_rate NUMERIC(3,2) DEFAULT 0.5;
ALTER TABLE ai_agent.learning_patterns ADD COLUMN IF NOT EXISTS last_applied TIMESTAMP WITH TIME ZONE;
ALTER TABLE ai_agent.learning_patterns ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================================
-- GENERATED_CONTENT TABLE - Add missing columns
-- ============================================================================

ALTER TABLE ai_agent.generated_content ADD COLUMN IF NOT EXISTS generation_type VARCHAR(100) NOT NULL DEFAULT 'general';
ALTER TABLE ai_agent.generated_content ADD COLUMN IF NOT EXISTS source_reference VARCHAR(200);
ALTER TABLE ai_agent.generated_content ADD COLUMN IF NOT EXISTS prompt_template VARCHAR(200);
ALTER TABLE ai_agent.generated_content ADD COLUMN IF NOT EXISTS generation_parameters JSONB DEFAULT '{}';
ALTER TABLE ai_agent.generated_content ADD COLUMN IF NOT EXISTS generated_content JSONB DEFAULT '{}';
ALTER TABLE ai_agent.generated_content ADD COLUMN IF NOT EXISTS quality_scores JSONB DEFAULT '{}';
ALTER TABLE ai_agent.generated_content ADD COLUMN IF NOT EXISTS human_review_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE ai_agent.generated_content ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE ai_agent.generated_content ADD COLUMN IF NOT EXISTS model_used VARCHAR(100) NOT NULL DEFAULT 'unknown';
ALTER TABLE ai_agent.generated_content ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- ANALYSIS_CACHE TABLE - Add missing columns
-- ============================================================================

ALTER TABLE ai_agent.analysis_cache ADD COLUMN IF NOT EXISTS cache_key VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE ai_agent.analysis_cache ADD COLUMN IF NOT EXISTS cache_type VARCHAR(100) NOT NULL DEFAULT 'general';
ALTER TABLE ai_agent.analysis_cache ADD COLUMN IF NOT EXISTS input_hash VARCHAR(64) NOT NULL DEFAULT '';
ALTER TABLE ai_agent.analysis_cache ADD COLUMN IF NOT EXISTS analysis_result JSONB DEFAULT '{}';
ALTER TABLE ai_agent.analysis_cache ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(3,2) DEFAULT 0.5;
ALTER TABLE ai_agent.analysis_cache ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ai_agent.analysis_cache ADD COLUMN IF NOT EXISTS hit_count INTEGER DEFAULT 0;
ALTER TABLE ai_agent.analysis_cache ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================================================
-- KNOWLEDGE_GRAPH TABLE - Add missing columns
-- ============================================================================

ALTER TABLE ai_agent.knowledge_graph ADD COLUMN IF NOT EXISTS entity_id VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE ai_agent.knowledge_graph ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100) NOT NULL DEFAULT 'concept';
ALTER TABLE ai_agent.knowledge_graph ADD COLUMN IF NOT EXISTS entity_name VARCHAR(200) NOT NULL DEFAULT 'Unnamed Entity';
ALTER TABLE ai_agent.knowledge_graph ADD COLUMN IF NOT EXISTS entity_properties JSONB DEFAULT '{}';
ALTER TABLE ai_agent.knowledge_graph ADD COLUMN IF NOT EXISTS relationship_type VARCHAR(100);
ALTER TABLE ai_agent.knowledge_graph ADD COLUMN IF NOT EXISTS related_entity_id VARCHAR(200);
ALTER TABLE ai_agent.knowledge_graph ADD COLUMN IF NOT EXISTS relationship_strength NUMERIC(3,2) DEFAULT 0.5;
ALTER TABLE ai_agent.knowledge_graph ADD COLUMN IF NOT EXISTS relationship_metadata JSONB DEFAULT '{}';
ALTER TABLE ai_agent.knowledge_graph ADD COLUMN IF NOT EXISTS source_conversation_id UUID REFERENCES ai_agent.conversations(id);
ALTER TABLE ai_agent.knowledge_graph ADD COLUMN IF NOT EXISTS confidence_level NUMERIC(3,2) DEFAULT 0.5;
ALTER TABLE ai_agent.knowledge_graph ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- ============================================================================
-- Add missing indexes for performance
-- ============================================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_state ON ai_agent.conversations(conversation_state);
CREATE INDEX IF NOT EXISTS idx_conversations_mode ON ai_agent.conversations(conversation_mode);
CREATE INDEX IF NOT EXISTS idx_conversations_topic ON ai_agent.conversations(current_topic);

-- Patterns indexes
CREATE INDEX IF NOT EXISTS idx_patterns_type_category ON ai_agent.patterns(pattern_type, pattern_category);
CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON ai_agent.patterns(confidence);
CREATE INDEX IF NOT EXISTS idx_patterns_active ON ai_agent.patterns(is_active);

-- Memory clusters indexes
CREATE INDEX IF NOT EXISTS idx_memory_clusters_type ON ai_agent.memory_clusters(cluster_type);
CREATE INDEX IF NOT EXISTS idx_memory_clusters_active ON ai_agent.memory_clusters(is_active);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_name ON ai_agent.performance_metrics(metric_type, metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON ai_agent.performance_metrics(created_at);

-- Generated content indexes
CREATE INDEX IF NOT EXISTS idx_generated_content_type ON ai_agent.generated_content(generation_type);
CREATE INDEX IF NOT EXISTS idx_generated_content_status ON ai_agent.generated_content(human_review_status);

-- Analysis cache indexes
CREATE INDEX IF NOT EXISTS idx_analysis_cache_key ON ai_agent.analysis_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analysis_cache_type ON ai_agent.analysis_cache(cache_type);
CREATE INDEX IF NOT EXISTS idx_analysis_cache_expires ON ai_agent.analysis_cache(expires_at);

-- Knowledge graph indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_entity ON ai_agent.knowledge_graph(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_relationship ON ai_agent.knowledge_graph(relationship_type);

-- ============================================================================
-- Add constraints where missing
-- ============================================================================

-- Add unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_patterns_unique_type_desc ON ai_agent.patterns(pattern_type, pattern_category, description);
CREATE UNIQUE INDEX IF NOT EXISTS idx_analysis_cache_unique_key ON ai_agent.analysis_cache(cache_key, cache_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_memory_clusters_unique_name ON ai_agent.memory_clusters(cluster_name, cluster_type);

-- ============================================================================
-- Clean up any invalid data and set proper defaults
-- ============================================================================

-- Update any NULL required fields with defaults
UPDATE ai_agent.patterns SET pattern_type = 'general' WHERE pattern_type IS NULL;
UPDATE ai_agent.patterns SET pattern_category = 'general' WHERE pattern_category IS NULL;
UPDATE ai_agent.patterns SET description = 'No description provided' WHERE description IS NULL OR description = '';
UPDATE ai_agent.patterns SET model_version = 'unknown' WHERE model_version IS NULL;
UPDATE ai_agent.patterns SET source = 'system' WHERE source IS NULL;

UPDATE ai_agent.memory_clusters SET cluster_name = 'Unnamed Cluster' WHERE cluster_name IS NULL;
UPDATE ai_agent.memory_clusters SET cluster_type = 'general' WHERE cluster_type IS NULL;

UPDATE ai_agent.performance_metrics SET metric_type = 'general' WHERE metric_type IS NULL;
UPDATE ai_agent.performance_metrics SET metric_name = 'unnamed_metric' WHERE metric_name IS NULL;
UPDATE ai_agent.performance_metrics SET value = 0 WHERE value IS NULL;

UPDATE ai_agent.learning_patterns SET pattern_name = 'Unnamed Pattern' WHERE pattern_name IS NULL;

UPDATE ai_agent.generated_content SET generation_type = 'general' WHERE generation_type IS NULL;
UPDATE ai_agent.generated_content SET model_used = 'unknown' WHERE model_used IS NULL;

UPDATE ai_agent.analysis_cache SET cache_key = 'unknown_' || id::text WHERE cache_key IS NULL OR cache_key = '';
UPDATE ai_agent.analysis_cache SET cache_type = 'general' WHERE cache_type IS NULL;
UPDATE ai_agent.analysis_cache SET input_hash = 'unknown' WHERE input_hash IS NULL OR input_hash = '';

UPDATE ai_agent.knowledge_graph SET entity_id = 'entity_' || id::text WHERE entity_id IS NULL OR entity_id = '';
UPDATE ai_agent.knowledge_graph SET entity_type = 'concept' WHERE entity_type IS NULL;
UPDATE ai_agent.knowledge_graph SET entity_name = 'Unnamed Entity' WHERE entity_name IS NULL;

COMMIT; 