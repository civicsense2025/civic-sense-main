-- Create news_agent_config table for storing News AI Agent configuration
-- Migration: 20250621_create_news_agent_config_table.sql

BEGIN;

-- Create table for News AI Agent configuration
CREATE TABLE IF NOT EXISTS public.news_agent_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Single row table
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

-- Add comment explaining the table structure
COMMENT ON TABLE public.news_agent_config IS 'Stores configuration for the News AI Agent. Single row table with ID=1.';
COMMENT ON COLUMN public.news_agent_config.config IS 'JSONB configuration object containing all agent settings';
COMMENT ON COLUMN public.news_agent_config.updated_by IS 'User who last updated the configuration';

-- Create index for faster lookups (though single row, good practice)
CREATE INDEX IF NOT EXISTS idx_news_agent_config_updated_at 
ON public.news_agent_config(updated_at DESC);

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_news_agent_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_news_agent_config_updated_at
    BEFORE UPDATE ON public.news_agent_config
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_news_agent_config_updated_at();

-- Enable RLS
ALTER TABLE public.news_agent_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only authenticated users can access configuration
-- In the future, this could be restricted to admin users only
CREATE POLICY "Authenticated users can view config" ON public.news_agent_config
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update config" ON public.news_agent_config
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert default configuration if none exists
INSERT INTO public.news_agent_config (id, config, updated_by)
VALUES (
  1,
  '{
    "isActive": false,
    "monitoringIntervalMinutes": 30,
    "minCivicRelevanceScore": 70,
    "maxEventsPerCycle": 10,
    "contentGeneration": {
      "generateQuestions": true,
      "generateSkills": true,
      "generateGlossaryTerms": true,
      "generateEvents": true,
      "generatePublicFigures": true
    },
    "databaseTargets": {
      "saveToContentPackages": true,
      "saveToContentTables": true,
      "targetTables": {
        "question_topics": true,
        "questions": true,
        "skills": true,
        "glossary_terms": true,
        "events": true,
        "public_figures": true
      },
      "customTableMappings": {},
      "schemaConfig": {
        "schemaName": "public",
        "useCustomFieldMappings": false,
        "customFieldMappings": {}
      }
    },
    "qualityControl": {
      "publishAsActive": true,
      "validateSchema": true,
      "requireMinimumFields": true
    }
  }'::jsonb,
  NULL
)
ON CONFLICT (id) DO NOTHING;

COMMIT; 