-- Entity-Based Congressional Data Schema
-- Flexible design that can accommodate multiple data sources (Congress.gov, GovInfo, etc.)

BEGIN;

-- =====================================================
-- CORE ENTITIES (Source-Agnostic)
-- =====================================================

-- Legislative documents (bills, resolutions, etc.)
CREATE TABLE IF NOT EXISTS public.legislative_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core document identification
  document_type TEXT NOT NULL CHECK (document_type IN (
    'bill', 'resolution', 'amendment', 'committee_report', 
    'hearing_document', 'federal_register', 'court_decision'
  )),
  document_number TEXT NOT NULL,
  congress_number INTEGER,
  chamber TEXT CHECK (chamber IN ('house', 'senate', 'joint', 'executive', 'judicial')),
  
  -- Document content
  title TEXT NOT NULL,
  short_title TEXT,
  official_title TEXT,
  summary_text TEXT,
  full_text TEXT,
  
  -- Status and dates
  current_status TEXT,
  introduced_date DATE,
  last_action_date DATE,
  last_action_text TEXT,
  
  -- Relationships
  primary_sponsor_id UUID REFERENCES public.public_figures(id),
  
  -- Content analysis (CivicSense AI)
  ai_summary TEXT,
  complexity_score INTEGER CHECK (complexity_score BETWEEN 1 AND 10),
  civic_impact_score INTEGER CHECK (civic_impact_score BETWEEN 1 AND 10),
  
  -- Content flags
  has_placeholder_content BOOLEAN DEFAULT FALSE,
  content_quality_score INTEGER CHECK (content_quality_score BETWEEN 0 AND 100),
  
  -- Standard audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure uniqueness within document type and congress
  UNIQUE(document_type, document_number, congress_number)
);

-- Document source tracking (many-to-many with sources)
CREATE TABLE IF NOT EXISTS public.document_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.legislative_documents(id) ON DELETE CASCADE,
  
  -- Source information
  source_system TEXT NOT NULL CHECK (source_system IN (
    'congress_api', 'govinfo_api', 'manual_import', 'web_scraping', 'other'
  )),
  source_id TEXT NOT NULL, -- API-specific ID (congress_api_id, govinfo_package_id, etc.)
  source_url TEXT,
  
  -- Source-specific metadata
  source_metadata JSONB DEFAULT '{}',
  
  -- Sync tracking
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'active' CHECK (sync_status IN ('active', 'deprecated', 'error')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(document_id, source_system, source_id)
);

-- Document actions/timeline (source-agnostic)
CREATE TABLE IF NOT EXISTS public.document_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.legislative_documents(id) ON DELETE CASCADE,
  
  -- Action details
  action_date DATE NOT NULL,
  action_text TEXT NOT NULL,
  action_type TEXT, -- 'introduced', 'committee', 'floor', 'passed', 'signed', etc.
  action_code TEXT, -- Source-specific codes stored here
  chamber TEXT CHECK (chamber IN ('house', 'senate', 'both', 'executive')),
  
  -- Relationships
  committee_id UUID REFERENCES public.congressional_committees(id),
  
  -- Analysis
  significance_score INTEGER CHECK (significance_score BETWEEN 1 AND 10),
  ai_interpretation TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document subjects/topics (source-agnostic)
CREATE TABLE IF NOT EXISTS public.document_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.legislative_documents(id) ON DELETE CASCADE,
  
  -- Subject information
  subject_name TEXT NOT NULL,
  is_primary_subject BOOLEAN DEFAULT FALSE,
  subject_category TEXT, -- 'policy_area', 'legislative_subject', 'custom'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(document_id, subject_name)
);

-- Document relationships (bills to bills, amendments, etc.)
CREATE TABLE IF NOT EXISTS public.document_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id UUID NOT NULL REFERENCES public.legislative_documents(id) ON DELETE CASCADE,
  target_document_id UUID NOT NULL REFERENCES public.legislative_documents(id) ON DELETE CASCADE,
  
  -- Relationship details
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'identical', 'related', 'supersedes', 'superseded_by', 
    'amends', 'amended_by', 'companion', 'incorporates'
  )),
  relationship_description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(source_document_id, target_document_id, relationship_type)
);

-- =====================================================
-- CONGRESSIONAL PROCEEDINGS (Hearings, Meetings, etc.)
-- =====================================================

-- Generic congressional proceedings
CREATE TABLE IF NOT EXISTS public.congressional_proceedings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Proceeding identification
  proceeding_type TEXT NOT NULL CHECK (proceeding_type IN (
    'hearing', 'markup', 'business_meeting', 'briefing', 'field_hearing'
  )),
  proceeding_number TEXT,
  
  -- Basic information
  title TEXT NOT NULL,
  description TEXT,
  purpose TEXT,
  
  -- Scheduling
  scheduled_date DATE,
  actual_date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  
  -- Relationships
  committee_id UUID REFERENCES public.congressional_committees(id),
  related_document_id UUID REFERENCES public.legislative_documents(id),
  
  -- Status
  proceeding_status TEXT DEFAULT 'scheduled' CHECK (proceeding_status IN (
    'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'
  )),
  
  -- Content analysis
  significance_score INTEGER CHECK (significance_score BETWEEN 1 AND 10),
  ai_summary TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proceeding participants (witnesses, members, etc.)
CREATE TABLE IF NOT EXISTS public.proceeding_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proceeding_id UUID NOT NULL REFERENCES public.congressional_proceedings(id) ON DELETE CASCADE,
  
  -- Participant identification
  participant_id UUID REFERENCES public.public_figures(id), -- NULL if not in our system
  participant_name TEXT NOT NULL, -- Always store name even if we have ID
  participant_title TEXT,
  participant_organization TEXT,
  
  -- Participation details
  participation_type TEXT NOT NULL CHECK (participation_type IN (
    'chair', 'ranking_member', 'committee_member', 'witness', 'staff', 'observer'
  )),
  testimony_text TEXT,
  prepared_statement_url TEXT,
  
  -- Analysis
  credibility_score INTEGER CHECK (credibility_score BETWEEN 1 AND 10),
  bias_analysis JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Q&A exchanges during proceedings
CREATE TABLE IF NOT EXISTS public.proceeding_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proceeding_id UUID NOT NULL REFERENCES public.congressional_proceedings(id) ON DELETE CASCADE,
  
  -- Exchange details
  questioner_id UUID REFERENCES public.proceeding_participants(id),
  respondent_id UUID REFERENCES public.proceeding_participants(id),
  
  -- Content
  question_text TEXT NOT NULL,
  response_text TEXT,
  exchange_timestamp TIME,
  
  -- Analysis
  topic_tags TEXT[],
  significance_score INTEGER CHECK (significance_score BETWEEN 1 AND 10),
  reveals_uncomfortable_truth BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONTENT GENERATION & ANALYSIS
-- =====================================================

-- CivicSense content analysis (source-agnostic)
CREATE TABLE IF NOT EXISTS public.civic_content_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Target entity (flexible - can analyze any entity type)
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'legislative_document', 'congressional_proceeding', 'public_figure', 'organization'
  )),
  entity_id UUID NOT NULL, -- Points to any entity table
  
  -- CivicSense content
  plain_english_summary TEXT NOT NULL,
  uncomfortable_truths TEXT[], -- Array of uncomfortable truths
  power_dynamics JSONB DEFAULT '{}', -- Who wins/loses, influence networks
  affected_populations JSONB DEFAULT '{}', -- Impact analysis
  economic_impact JSONB DEFAULT '{}', -- Financial implications
  action_items TEXT[], -- What citizens can do
  stake_analysis TEXT NOT NULL, -- Why this matters
  
  -- Quality tracking
  content_quality_score INTEGER CHECK (content_quality_score BETWEEN 0 AND 100),
  fact_check_status TEXT DEFAULT 'pending' CHECK (fact_check_status IN (
    'pending', 'verified', 'flagged', 'disputed'
  )),
  last_human_review TIMESTAMPTZ,
  
  -- Version control
  version_number INTEGER DEFAULT 1,
  replaces_analysis_id UUID REFERENCES public.civic_content_analysis(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for entity lookups
  UNIQUE(entity_type, entity_id, version_number)
);

-- Auto-generated events from any source
CREATE TABLE IF NOT EXISTS public.auto_generated_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source entity
  source_entity_type TEXT NOT NULL,
  source_entity_id UUID NOT NULL,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'bill_introduced', 'hearing_scheduled', 'vote_held', 'committee_action',
    'amendment_proposed', 'report_released', 'significant_action'
  )),
  event_title TEXT NOT NULL,
  event_description TEXT NOT NULL,
  event_date DATE NOT NULL,
  
  -- Significance
  significance_score INTEGER CHECK (significance_score BETWEEN 1 AND 10),
  public_impact_level TEXT CHECK (public_impact_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Publishing
  should_publish BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMPTZ,
  published_to TEXT[], -- Channels where this was published
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entity extraction from any content
CREATE TABLE IF NOT EXISTS public.extracted_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source content
  source_entity_type TEXT NOT NULL,
  source_entity_id UUID NOT NULL,
  source_text_excerpt TEXT, -- Where this entity was found
  
  -- Extracted entity
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'person', 'organization', 'location', 'policy_area', 'financial_amount', 'date', 'other'
  )),
  entity_name TEXT NOT NULL,
  entity_description TEXT,
  
  -- Confidence and context
  extraction_confidence DECIMAL(3,2) CHECK (extraction_confidence BETWEEN 0 AND 1),
  context_description TEXT,
  
  -- Linking
  linked_public_figure_id UUID REFERENCES public.public_figures(id),
  linked_organization_id UUID, -- Could reference organizations table
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationship extraction between entities
CREATE TABLE IF NOT EXISTS public.extracted_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source
  source_entity_type TEXT NOT NULL,
  source_entity_id UUID NOT NULL,
  
  -- Relationship
  subject_entity_id UUID NOT NULL REFERENCES public.extracted_entities(id),
  object_entity_id UUID NOT NULL REFERENCES public.extracted_entities(id),
  relationship_type TEXT NOT NULL, -- 'employed_by', 'lobbies_for', 'opposes', 'supports', etc.
  relationship_description TEXT,
  
  -- Confidence
  extraction_confidence DECIMAL(3,2) CHECK (extraction_confidence BETWEEN 0 AND 1),
  
  -- Verification
  human_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_legislative_documents_type_congress ON public.legislative_documents(document_type, congress_number);
CREATE INDEX IF NOT EXISTS idx_legislative_documents_status ON public.legislative_documents(current_status);
CREATE INDEX IF NOT EXISTS idx_legislative_documents_sponsor ON public.legislative_documents(primary_sponsor_id);
CREATE INDEX IF NOT EXISTS idx_legislative_documents_dates ON public.legislative_documents(introduced_date, last_action_date);

-- Source tracking indexes
CREATE INDEX IF NOT EXISTS idx_document_sources_system_id ON public.document_sources(source_system, source_id);
CREATE INDEX IF NOT EXISTS idx_document_sources_document ON public.document_sources(document_id);
CREATE INDEX IF NOT EXISTS idx_document_sources_sync ON public.document_sources(last_sync_at, sync_status);

-- Action indexes
CREATE INDEX IF NOT EXISTS idx_document_actions_document_date ON public.document_actions(document_id, action_date DESC);
CREATE INDEX IF NOT EXISTS idx_document_actions_type ON public.document_actions(action_type);

-- Proceeding indexes
CREATE INDEX IF NOT EXISTS idx_congressional_proceedings_date ON public.congressional_proceedings(actual_date DESC);
CREATE INDEX IF NOT EXISTS idx_congressional_proceedings_committee ON public.congressional_proceedings(committee_id);
CREATE INDEX IF NOT EXISTS idx_congressional_proceedings_type ON public.congressional_proceedings(proceeding_type);

-- Content analysis indexes
CREATE INDEX IF NOT EXISTS idx_civic_content_analysis_entity ON public.civic_content_analysis(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_civic_content_analysis_quality ON public.civic_content_analysis(content_quality_score DESC);

-- Entity extraction indexes
CREATE INDEX IF NOT EXISTS idx_extracted_entities_source ON public.extracted_entities(source_entity_type, source_entity_id);
CREATE INDEX IF NOT EXISTS idx_extracted_entities_type_name ON public.extracted_entities(entity_type, entity_name);
CREATE INDEX IF NOT EXISTS idx_extracted_entities_confidence ON public.extracted_entities(extraction_confidence DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.legislative_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congressional_proceedings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proceeding_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proceeding_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civic_content_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_generated_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_relationships ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "public_read_legislative_documents" ON public.legislative_documents
  FOR SELECT USING (true);

CREATE POLICY "public_read_document_actions" ON public.document_actions
  FOR SELECT USING (true);

CREATE POLICY "public_read_document_subjects" ON public.document_subjects
  FOR SELECT USING (true);

CREATE POLICY "public_read_proceedings" ON public.congressional_proceedings
  FOR SELECT USING (true);

CREATE POLICY "public_read_participants" ON public.proceeding_participants
  FOR SELECT USING (true);

CREATE POLICY "public_read_content_analysis" ON public.civic_content_analysis
  FOR SELECT USING (true);

CREATE POLICY "public_read_events" ON public.auto_generated_events
  FOR SELECT USING (should_publish = true);

-- Admin write access
CREATE POLICY "admin_write_all" ON public.legislative_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Apply similar admin policies to all tables
CREATE POLICY "admin_write_document_sources" ON public.document_sources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_write_document_actions" ON public.document_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_write_civic_content" ON public.civic_content_analysis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with updated_at
CREATE TRIGGER trigger_legislative_documents_updated_at
  BEFORE UPDATE ON public.legislative_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_document_sources_updated_at
  BEFORE UPDATE ON public.document_sources
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_document_actions_updated_at
  BEFORE UPDATE ON public.document_actions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_congressional_proceedings_updated_at
  BEFORE UPDATE ON public.congressional_proceedings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_proceeding_participants_updated_at
  BEFORE UPDATE ON public.proceeding_participants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_proceeding_exchanges_updated_at
  BEFORE UPDATE ON public.proceeding_exchanges
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_civic_content_analysis_updated_at
  BEFORE UPDATE ON public.civic_content_analysis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_auto_generated_events_updated_at
  BEFORE UPDATE ON public.auto_generated_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_extracted_entities_updated_at
  BEFORE UPDATE ON public.extracted_entities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_extracted_relationships_updated_at
  BEFORE UPDATE ON public.extracted_relationships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMIT; 