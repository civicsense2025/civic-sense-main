-- Foreign Key Indexes Migration - Part 2
-- Bookmark, Content, and Category related indexes
-- Generated: 2024-12-19

BEGIN;

-- Bookmark Analytics
CREATE INDEX IF NOT EXISTS idx_bookmark_analytics_bookmark_id 
ON public.bookmark_analytics(bookmark_id);

CREATE INDEX IF NOT EXISTS idx_bookmark_analytics_snippet_id 
ON public.bookmark_analytics(snippet_id);

CREATE INDEX IF NOT EXISTS idx_bookmark_analytics_user_id 
ON public.bookmark_analytics(user_id);

-- Bookmark Snippets
CREATE INDEX IF NOT EXISTS idx_bookmark_snippets_collection_id 
ON public.bookmark_snippets(collection_id);

-- Category Synonyms
CREATE INDEX IF NOT EXISTS idx_category_synonyms_category_id 
ON public.category_synonyms(category_id);

-- Clever User Mapping
CREATE INDEX IF NOT EXISTS idx_clever_user_mapping_civicsense_user_id 
ON public.clever_user_mapping(civicsense_user_id);

-- Content Generation Queue
CREATE INDEX IF NOT EXISTS idx_content_generation_queue_execution_log_id 
ON public.content_generation_queue(execution_log_id);

-- Fact Check Logs
CREATE INDEX IF NOT EXISTS idx_fact_check_logs_question_id 
ON public.fact_check_logs(question_id);

COMMIT; 