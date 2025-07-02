-- ============================================================================
-- GOVINFO API INTEGRATION MIGRATION
-- Extends existing CivicSense congressional infrastructure
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- ============================================================================
-- GOVINFO DOCUMENT PACKAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS govinfo_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- GovInfo package identification
  package_id TEXT NOT NULL UNIQUE,
  package_link TEXT NOT NULL,
  collection_code TEXT NOT NULL, -- BILLS, CHRG, CRPT, CPRT, FR, USCOURTS
  
  -- Document metadata
  title TEXT NOT NULL,
  doc_class TEXT, -- HR, S, HRPT, SHRPT, etc.
  congress_number INTEGER,
  session_number INTEGER,
  chamber TEXT CHECK (chamber IN ('house', 'senate', 'joint')),
  committee_code TEXT,
  committee_name TEXT,
  
  -- Document content
  published_date DATE,
  last_modified_date TIMESTAMPTZ,
  download_links JSONB DEFAULT '{}', -- {txtLink, pdfLink, xmlLink}
  full_text TEXT, -- Full document text for analysis
  document_size_bytes INTEGER,
  
  -- Processing status
  content_extracted BOOLEAN DEFAULT FALSE,
  ai_processed BOOLEAN DEFAULT FALSE,
  civic_analysis_complete BOOLEAN DEFAULT FALSE,
  last_processed_at TIMESTAMPTZ,
  processing_errors TEXT[],
  
  -- CivicSense analysis results
  civic_significance_score INTEGER CHECK (civic_significance_score BETWEEN 1 AND 10),
  uncomfortable_truths TEXT[],
  power_dynamics_revealed TEXT[],
  action_items_generated TEXT[],
  
  -- Standard fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for govinfo_documents
CREATE INDEX idx_govinfo_documents_package_id ON govinfo_documents(package_id);
CREATE INDEX idx_govinfo_documents_collection ON govinfo_documents(collection_code);
CREATE INDEX idx_govinfo_documents_congress ON govinfo_documents(congress_number);
CREATE INDEX idx_govinfo_documents_chamber ON govinfo_documents(chamber);
CREATE INDEX idx_govinfo_documents_committee ON govinfo_documents(committee_code);
CREATE INDEX idx_govinfo_documents_published_date ON govinfo_documents(published_date DESC);
CREATE INDEX idx_govinfo_documents_processing_status ON govinfo_documents(ai_processed, civic_analysis_complete);
CREATE INDEX idx_govinfo_documents_full_text_search ON govinfo_documents USING gin(to_tsvector('english', full_text));

-- ============================================================================
-- CONGRESSIONAL HEARINGS (Extends existing congressional infrastructure)
-- ============================================================================

CREATE TABLE IF NOT EXISTS congressional_hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to GovInfo document
  govinfo_document_id UUID REFERENCES govinfo_documents(id) ON DELETE CASCADE,
  
  -- Hearing metadata
  hearing_title TEXT NOT NULL,
  committee_code TEXT NOT NULL,
  committee_name TEXT NOT NULL,
  subcommittee_name TEXT,
  chamber TEXT NOT NULL CHECK (chamber IN ('house', 'senate', 'joint')),
  congress_number INTEGER NOT NULL,
  session_number INTEGER,
  hearing_date DATE NOT NULL,
  hearing_type TEXT, -- 'oversight', 'legislative', 'confirmation', 'investigative'
  
  -- Hearing content analysis
  hearing_purpose TEXT,
  key_topics TEXT[],
  policy_areas TEXT[],
  related_bill_numbers TEXT[],
  witness_count INTEGER DEFAULT 0,
  
  -- CivicSense analysis
  civic_education_summary TEXT,
  uncomfortable_truths TEXT[],
  power_dynamics_revealed TEXT[],
  stakeholder_analysis JSONB,
  lobbying_influence_detected BOOLEAN DEFAULT FALSE,
  contradictions_found TEXT[],
  
  -- Content quality metrics
  transcript_quality_score INTEGER CHECK (transcript_quality_score BETWEEN 1 AND 10),
  civic_education_value INTEGER CHECK (civic_education_value BETWEEN 1 AND 10),
  controversy_level INTEGER CHECK (controversy_level BETWEEN 1 AND 10),
  
  -- Processing metadata
  last_analyzed_at TIMESTAMPTZ,
  analysis_version TEXT DEFAULT '1.0',
  human_reviewed BOOLEAN DEFAULT FALSE,
  reviewer_notes TEXT,
  
  -- Standard fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for congressional_hearings
CREATE INDEX idx_congressional_hearings_govinfo_doc ON congressional_hearings(govinfo_document_id);
CREATE INDEX idx_congressional_hearings_committee ON congressional_hearings(committee_code);
CREATE INDEX idx_congressional_hearings_chamber ON congressional_hearings(chamber);
CREATE INDEX idx_congressional_hearings_date ON congressional_hearings(hearing_date DESC);
CREATE INDEX idx_congressional_hearings_congress ON congressional_hearings(congress_number);
CREATE INDEX idx_congressional_hearings_topics ON congressional_hearings USING gin(key_topics);
CREATE INDEX idx_congressional_hearings_civic_value ON congressional_hearings(civic_education_value DESC);

-- ============================================================================
-- HEARING WITNESSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS hearing_witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  hearing_id UUID NOT NULL REFERENCES congressional_hearings(id) ON DELETE CASCADE,
  public_figure_id UUID REFERENCES public_figures(id), -- Link to existing public figures if available
  
  -- Witness information
  witness_name TEXT NOT NULL,
  witness_title TEXT,
  organization TEXT,
  organization_type TEXT, -- 'government', 'nonprofit', 'corporate', 'academic', 'advocacy'
  
  -- Witness categorization
  witness_type TEXT NOT NULL CHECK (witness_type IN ('government', 'expert', 'advocate', 'industry', 'other')),
  political_leaning TEXT, -- 'progressive', 'conservative', 'neutral', 'unknown'
  credibility_score INTEGER CHECK (credibility_score BETWEEN 1 AND 10),
  expertise_relevance INTEGER CHECK (expertise_relevance BETWEEN 1 AND 10),
  
  -- Testimony analysis
  testimony_summary TEXT,
  key_arguments TEXT[],
  uncomfortable_truths_revealed TEXT[],
  contradictions_with_previous_statements TEXT[],
  lobbying_connections TEXT[],
  financial_conflicts_of_interest TEXT[],
  
  -- Interaction analysis
  most_challenging_questions TEXT[],
  evasive_responses_detected BOOLEAN DEFAULT FALSE,
  credibility_issues_identified TEXT[],
  
  -- Processing metadata
  testimony_extracted BOOLEAN DEFAULT FALSE,
  ai_analysis_complete BOOLEAN DEFAULT FALSE,
  fact_checked BOOLEAN DEFAULT FALSE,
  fact_check_results JSONB,
  
  -- Standard fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for hearing_witnesses
CREATE INDEX idx_hearing_witnesses_hearing_id ON hearing_witnesses(hearing_id);
CREATE INDEX idx_hearing_witnesses_public_figure ON hearing_witnesses(public_figure_id);
CREATE INDEX idx_hearing_witnesses_organization ON hearing_witnesses(organization);
CREATE INDEX idx_hearing_witnesses_type ON hearing_witnesses(witness_type);
CREATE INDEX idx_hearing_witnesses_credibility ON hearing_witnesses(credibility_score DESC);
CREATE INDEX idx_hearing_witnesses_name_search ON hearing_witnesses USING gin(to_tsvector('english', witness_name));

-- ============================================================================
-- HEARING Q&A EXCHANGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS hearing_qa_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  hearing_id UUID NOT NULL REFERENCES congressional_hearings(id) ON DELETE CASCADE,
  questioner_figure_id UUID REFERENCES public_figures(id), -- Congressional member asking
  respondent_witness_id UUID REFERENCES hearing_witnesses(id), -- Witness responding
  
  -- Exchange content
  questioner_name TEXT NOT NULL,
  questioner_party TEXT,
  questioner_state TEXT,
  question_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  
  -- Exchange analysis
  question_type TEXT, -- 'oversight', 'gotcha', 'softball', 'procedural', 'substantive'
  response_quality TEXT, -- 'direct', 'evasive', 'comprehensive', 'inadequate'
  topic_areas TEXT[],
  uncomfortable_truth_revealed BOOLEAN DEFAULT FALSE,
  contradiction_exposed BOOLEAN DEFAULT FALSE,
  
  -- Civic education value
  civic_education_significance INTEGER CHECK (civic_education_significance BETWEEN 1 AND 10),
  reveals_power_dynamics BOOLEAN DEFAULT FALSE,
  demonstrates_government_process BOOLEAN DEFAULT FALSE,
  exposes_institutional_failures BOOLEAN DEFAULT FALSE,
  
  -- Analysis metadata
  ai_analysis JSONB, -- Detailed AI analysis results
  human_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  educational_summary TEXT,
  
  -- Standard fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for hearing_qa_exchanges
CREATE INDEX idx_hearing_qa_exchanges_hearing ON hearing_qa_exchanges(hearing_id);
CREATE INDEX idx_hearing_qa_exchanges_questioner ON hearing_qa_exchanges(questioner_figure_id);
CREATE INDEX idx_hearing_qa_exchanges_respondent ON hearing_qa_exchanges(respondent_witness_id);
CREATE INDEX idx_hearing_qa_exchanges_significance ON hearing_qa_exchanges(civic_education_significance DESC);
CREATE INDEX idx_hearing_qa_exchanges_power_dynamics ON hearing_qa_exchanges(reveals_power_dynamics);
CREATE INDEX idx_hearing_qa_exchanges_question_text ON hearing_qa_exchanges USING gin(to_tsvector('english', question_text));

-- ============================================================================
-- COMMITTEE DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS committee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to GovInfo document
  govinfo_document_id UUID REFERENCES govinfo_documents(id) ON DELETE CASCADE,
  
  -- Document metadata
  document_title TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'committee_report', 'committee_print', 'staff_report'
  report_number TEXT,
  committee_code TEXT NOT NULL,
  committee_name TEXT NOT NULL,
  subcommittee_name TEXT,
  chamber TEXT NOT NULL CHECK (chamber IN ('house', 'senate', 'joint')),
  congress_number INTEGER NOT NULL,
  
  -- Document analysis
  executive_summary TEXT,
  key_findings TEXT[],
  recommendations TEXT[],
  minority_views TEXT,
  dissenting_opinions TEXT[],
  
  -- CivicSense analysis
  uncomfortable_truths_exposed TEXT[],
  institutional_failures_identified TEXT[],
  power_structure_revelations TEXT[],
  lobbying_influence_documented TEXT[],
  
  -- Related content
  related_hearings UUID[], -- Array of hearing IDs
  related_bills TEXT[], -- Array of bill numbers
  cited_sources TEXT[],
  
  -- Quality metrics
  factual_accuracy_score INTEGER CHECK (factual_accuracy_score BETWEEN 1 AND 10),
  bias_detection_score INTEGER CHECK (bias_detection_score BETWEEN 1 AND 10),
  civic_education_value INTEGER CHECK (civic_education_value BETWEEN 1 AND 10),
  
  -- Processing status
  content_analyzed BOOLEAN DEFAULT FALSE,
  fact_checked BOOLEAN DEFAULT FALSE,
  ready_for_civic_education BOOLEAN DEFAULT FALSE,
  
  -- Standard fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for committee_documents
CREATE INDEX idx_committee_documents_govinfo_doc ON committee_documents(govinfo_document_id);
CREATE INDEX idx_committee_documents_committee ON committee_documents(committee_code);
CREATE INDEX idx_committee_documents_type ON committee_documents(document_type);
CREATE INDEX idx_committee_documents_congress ON committee_documents(congress_number);
CREATE INDEX idx_committee_documents_civic_value ON committee_documents(civic_education_value DESC);
CREATE INDEX idx_committee_documents_title_search ON committee_documents USING gin(to_tsvector('english', document_title));

-- ============================================================================
-- AUTO-GENERATED EVENTS TABLE (Links to existing events system)
-- ============================================================================

CREATE TABLE IF NOT EXISTS auto_generated_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source document
  source_type TEXT NOT NULL CHECK (source_type IN ('hearing', 'committee_document', 'govinfo_document')),
  source_hearing_id UUID REFERENCES congressional_hearings(id) ON DELETE CASCADE,
  source_committee_doc_id UUID REFERENCES committee_documents(id) ON DELETE CASCADE,
  source_govinfo_doc_id UUID REFERENCES govinfo_documents(id) ON DELETE CASCADE,
  
  -- Generated event info
  event_title TEXT NOT NULL,
  event_description TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL, -- 'hearing', 'report_release', 'investigation', 'oversight'
  
  -- CivicSense analysis
  why_this_matters TEXT NOT NULL,
  uncomfortable_truths TEXT[],
  power_dynamics_revealed TEXT[],
  action_items TEXT[],
  
  -- Significance metrics
  civic_significance_score INTEGER CHECK (civic_significance_score BETWEEN 1 AND 10),
  media_attention_score INTEGER CHECK (media_attention_score BETWEEN 1 AND 10),
  long_term_impact_score INTEGER CHECK (long_term_impact_score BETWEEN 1 AND 10),
  
  -- Processing metadata
  auto_generated BOOLEAN DEFAULT TRUE,
  ai_confidence_score INTEGER CHECK (ai_confidence_score BETWEEN 1 AND 10),
  human_reviewed BOOLEAN DEFAULT FALSE,
  approved_for_publication BOOLEAN DEFAULT FALSE,
  
  -- Link to published event (if approved)
  published_event_id UUID, -- Would reference events table if published
  
  -- Standard fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for auto_generated_events
CREATE INDEX idx_auto_generated_events_source_type ON auto_generated_events(source_type);
CREATE INDEX idx_auto_generated_events_hearing ON auto_generated_events(source_hearing_id);
CREATE INDEX idx_auto_generated_events_committee_doc ON auto_generated_events(source_committee_doc_id);
CREATE INDEX idx_auto_generated_events_date ON auto_generated_events(event_date DESC);
CREATE INDEX idx_auto_generated_events_significance ON auto_generated_events(civic_significance_score DESC);
CREATE INDEX idx_auto_generated_events_human_reviewed ON auto_generated_events(human_reviewed, approved_for_publication);

-- ============================================================================
-- AUTO-EXTRACTED ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS auto_extracted_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source document
  source_type TEXT NOT NULL CHECK (source_type IN ('hearing', 'committee_document', 'govinfo_document')),
  source_hearing_id UUID REFERENCES congressional_hearings(id) ON DELETE CASCADE,
  source_committee_doc_id UUID REFERENCES committee_documents(id) ON DELETE CASCADE,
  source_govinfo_doc_id UUID REFERENCES govinfo_documents(id) ON DELETE CASCADE,
  
  -- Organization information
  organization_name TEXT NOT NULL,
  organization_type TEXT, -- 'government', 'nonprofit', 'corporate', 'academic', 'advocacy', 'lobbying'
  primary_sector TEXT, -- 'healthcare', 'finance', 'defense', 'energy', etc.
  
  -- Context from document
  mentioned_context TEXT,
  role_in_document TEXT, -- 'witness_affiliation', 'cited_entity', 'regulated_party', 'beneficiary'
  influence_level TEXT, -- 'high', 'medium', 'low'
  
  -- Analysis
  lobbying_activity_detected BOOLEAN DEFAULT FALSE,
  government_contracts_mentioned BOOLEAN DEFAULT FALSE,
  regulatory_relationships TEXT[],
  political_connections TEXT[],
  
  -- Verification status
  organization_verified BOOLEAN DEFAULT FALSE,
  verification_source TEXT,
  needs_fact_checking BOOLEAN DEFAULT TRUE,
  
  -- Linking to existing entities
  potential_matches TEXT[], -- Potential existing organization matches
  linked_to_existing_org UUID, -- If linked to existing organization
  
  -- Frequency tracking
  mention_count INTEGER DEFAULT 1,
  first_mentioned_date DATE,
  last_mentioned_date DATE,
  
  -- Standard fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for auto_extracted_organizations
CREATE INDEX idx_auto_extracted_orgs_name ON auto_extracted_organizations(organization_name);
CREATE INDEX idx_auto_extracted_orgs_type ON auto_extracted_organizations(organization_type);
CREATE INDEX idx_auto_extracted_orgs_source_type ON auto_extracted_organizations(source_type);
CREATE INDEX idx_auto_extracted_orgs_verification ON auto_extracted_organizations(organization_verified, needs_fact_checking);
CREATE INDEX idx_auto_extracted_orgs_mention_count ON auto_extracted_organizations(mention_count DESC);
CREATE INDEX idx_auto_extracted_orgs_lobbying ON auto_extracted_organizations(lobbying_activity_detected);

-- ============================================================================
-- AUTO-EXTRACTED RELATIONSHIPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS auto_extracted_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source document
  source_type TEXT NOT NULL CHECK (source_type IN ('hearing', 'committee_document', 'govinfo_document')),
  source_hearing_id UUID REFERENCES congressional_hearings(id) ON DELETE CASCADE,
  source_committee_doc_id UUID REFERENCES committee_documents(id) ON DELETE CASCADE,
  source_govinfo_doc_id UUID REFERENCES govinfo_documents(id) ON DELETE CASCADE,
  
  -- Relationship entities
  entity1_type TEXT NOT NULL, -- 'person', 'organization', 'government_entity'
  entity1_name TEXT NOT NULL,
  entity1_id UUID, -- Link to public_figures, organizations, etc. if identified
  
  entity2_type TEXT NOT NULL,
  entity2_name TEXT NOT NULL,
  entity2_id UUID,
  
  -- Relationship details
  relationship_type TEXT NOT NULL, -- 'employment', 'lobbying', 'funding', 'regulatory', 'contract'
  relationship_description TEXT,
  relationship_strength TEXT CHECK (relationship_strength IN ('strong', 'moderate', 'weak', 'alleged')),
  
  -- Context
  context_from_document TEXT,
  time_period TEXT, -- When this relationship existed
  financial_amount_mentioned TEXT, -- If money was mentioned
  
  -- Analysis flags
  potential_conflict_of_interest BOOLEAN DEFAULT FALSE,
  revolving_door_detected BOOLEAN DEFAULT FALSE,
  lobbying_relationship BOOLEAN DEFAULT FALSE,
  regulatory_capture_indicator BOOLEAN DEFAULT FALSE,
  
  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verification_sources TEXT[],
  confidence_score INTEGER CHECK (confidence_score BETWEEN 1 AND 10),
  
  -- Standard fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for auto_extracted_relationships
CREATE INDEX idx_auto_extracted_relationships_entity1 ON auto_extracted_relationships(entity1_type, entity1_name);
CREATE INDEX idx_auto_extracted_relationships_entity2 ON auto_extracted_relationships(entity2_type, entity2_name);
CREATE INDEX idx_auto_extracted_relationships_type ON auto_extracted_relationships(relationship_type);
CREATE INDEX idx_auto_extracted_relationships_source_type ON auto_extracted_relationships(source_type);
CREATE INDEX idx_auto_extracted_relationships_conflict ON auto_extracted_relationships(potential_conflict_of_interest);
CREATE INDEX idx_auto_extracted_relationships_lobbying ON auto_extracted_relationships(lobbying_relationship);
CREATE INDEX idx_auto_extracted_relationships_confidence ON auto_extracted_relationships(confidence_score DESC);

-- ============================================================================
-- EXTEND EXISTING TABLES FOR GOVINFO INTEGRATION
-- ============================================================================

-- Add GovInfo fields to existing congressional_bills table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'congressional_bills' AND column_name = 'govinfo_package_id') THEN
    ALTER TABLE congressional_bills ADD COLUMN govinfo_package_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'congressional_bills' AND column_name = 'govinfo_last_sync') THEN
    ALTER TABLE congressional_bills ADD COLUMN govinfo_last_sync TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'congressional_bills' AND column_name = 'govinfo_metadata') THEN
    ALTER TABLE congressional_bills ADD COLUMN govinfo_metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add GovInfo fields to existing bill_content_analysis table  
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bill_content_analysis' AND column_name = 'hearing_references') THEN
    ALTER TABLE bill_content_analysis ADD COLUMN hearing_references UUID[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bill_content_analysis' AND column_name = 'committee_document_references') THEN
    ALTER TABLE bill_content_analysis ADD COLUMN committee_document_references UUID[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bill_content_analysis' AND column_name = 'witness_perspectives') THEN
    ALTER TABLE bill_content_analysis ADD COLUMN witness_perspectives JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bill_content_analysis' AND column_name = 'lobbying_analysis') THEN
    ALTER TABLE bill_content_analysis ADD COLUMN lobbying_analysis JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add GovInfo fields to existing public_figures table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_figures' AND column_name = 'hearing_participation_count') THEN
    ALTER TABLE public_figures ADD COLUMN hearing_participation_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_figures' AND column_name = 'committee_leadership_roles') THEN
    ALTER TABLE public_figures ADD COLUMN committee_leadership_roles TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_figures' AND column_name = 'questioning_style_analysis') THEN
    ALTER TABLE public_figures ADD COLUMN questioning_style_analysis JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'public_figures' AND column_name = 'oversight_effectiveness_score') THEN
    ALTER TABLE public_figures ADD COLUMN oversight_effectiveness_score INTEGER CHECK (oversight_effectiveness_score BETWEEN 1 AND 10);
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE govinfo_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE congressional_hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearing_witnesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearing_qa_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_generated_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_extracted_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_extracted_relationships ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "govinfo_documents_public_read" ON govinfo_documents
  FOR SELECT USING (civic_analysis_complete = true);

CREATE POLICY "congressional_hearings_public_read" ON congressional_hearings
  FOR SELECT USING (true); -- All hearing data is public

CREATE POLICY "hearing_witnesses_public_read" ON hearing_witnesses
  FOR SELECT USING (true); -- All witness data is public

CREATE POLICY "hearing_qa_exchanges_public_read" ON hearing_qa_exchanges
  FOR SELECT USING (true); -- All Q&A data is public

CREATE POLICY "committee_documents_public_read" ON committee_documents
  FOR SELECT USING (ready_for_civic_education = true);

CREATE POLICY "auto_generated_events_public_read" ON auto_generated_events
  FOR SELECT USING (approved_for_publication = true);

CREATE POLICY "auto_extracted_organizations_public_read" ON auto_extracted_organizations
  FOR SELECT USING (organization_verified = true);

CREATE POLICY "auto_extracted_relationships_public_read" ON auto_extracted_relationships
  FOR SELECT USING (verified = true);

-- Admin access for all operations
CREATE POLICY "admin_full_access_govinfo_documents" ON govinfo_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "admin_full_access_congressional_hearings" ON congressional_hearings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "admin_full_access_hearing_witnesses" ON hearing_witnesses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "admin_full_access_hearing_qa_exchanges" ON hearing_qa_exchanges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "admin_full_access_committee_documents" ON committee_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "admin_full_access_auto_generated_events" ON auto_generated_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "admin_full_access_auto_extracted_organizations" ON auto_extracted_organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "admin_full_access_auto_extracted_relationships" ON auto_extracted_relationships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND is_admin = true
    )
  );

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all new tables
CREATE TRIGGER update_govinfo_documents_updated_at BEFORE UPDATE ON govinfo_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_congressional_hearings_updated_at BEFORE UPDATE ON congressional_hearings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hearing_witnesses_updated_at BEFORE UPDATE ON hearing_witnesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hearing_qa_exchanges_updated_at BEFORE UPDATE ON hearing_qa_exchanges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_committee_documents_updated_at BEFORE UPDATE ON committee_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auto_generated_events_updated_at BEFORE UPDATE ON auto_generated_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auto_extracted_organizations_updated_at BEFORE UPDATE ON auto_extracted_organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auto_extracted_relationships_updated_at BEFORE UPDATE ON auto_extracted_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update witness count on hearings
CREATE OR REPLACE FUNCTION update_hearing_witness_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE congressional_hearings 
        SET witness_count = witness_count + 1 
        WHERE id = NEW.hearing_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE congressional_hearings 
        SET witness_count = witness_count - 1 
        WHERE id = OLD.hearing_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger to maintain witness count
CREATE TRIGGER update_hearing_witness_count_trigger
    AFTER INSERT OR DELETE ON hearing_witnesses
    FOR EACH ROW EXECUTE FUNCTION update_hearing_witness_count();

-- ============================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ============================================================================

-- Comprehensive hearing analysis view
CREATE MATERIALIZED VIEW mv_hearing_analysis AS
SELECT 
    h.id as hearing_id,
    h.hearing_title,
    h.committee_name,
    h.chamber,
    h.hearing_date,
    h.witness_count,
    h.civic_education_value,
    COUNT(qa.id) as qa_exchange_count,
    COUNT(CASE WHEN qa.reveals_power_dynamics THEN 1 END) as power_dynamics_exchanges,
    COUNT(CASE WHEN qa.uncomfortable_truth_revealed THEN 1 END) as uncomfortable_truth_exchanges,
    AVG(qa.civic_education_significance) as avg_qa_significance,
    ARRAY_AGG(DISTINCT w.organization) FILTER (WHERE w.organization IS NOT NULL) as organizations_represented,
    ARRAY_AGG(DISTINCT w.witness_type) as witness_types_present,
    h.uncomfortable_truths,
    h.power_dynamics_revealed
FROM congressional_hearings h
LEFT JOIN hearing_witnesses w ON h.id = w.hearing_id
LEFT JOIN hearing_qa_exchanges qa ON h.id = qa.hearing_id
GROUP BY h.id, h.hearing_title, h.committee_name, h.chamber, h.hearing_date, 
         h.witness_count, h.civic_education_value, h.uncomfortable_truths, h.power_dynamics_revealed;

-- Create index on the materialized view
CREATE INDEX idx_mv_hearing_analysis_civic_value ON mv_hearing_analysis(civic_education_value DESC);
CREATE INDEX idx_mv_hearing_analysis_date ON mv_hearing_analysis(hearing_date DESC);
CREATE INDEX idx_mv_hearing_analysis_chamber ON mv_hearing_analysis(chamber);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_govinfo_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW mv_hearing_analysis;
END;
$$ language 'plpgsql';

-- ============================================================================
-- FUNCTIONS FOR GOVINFO INTEGRATION
-- ============================================================================

-- Function to calculate overall civic education score for a hearing
CREATE OR REPLACE FUNCTION calculate_hearing_civic_score(hearing_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    hearing_score INTEGER;
    witness_quality_avg DECIMAL;
    qa_significance_avg DECIMAL;
    uncomfortable_truths_count INTEGER;
    power_dynamics_count INTEGER;
    final_score INTEGER;
BEGIN
    -- Get base hearing civic education value
    SELECT civic_education_value INTO hearing_score
    FROM congressional_hearings 
    WHERE id = hearing_id_param;
    
    -- Calculate average witness credibility
    SELECT AVG(credibility_score) INTO witness_quality_avg
    FROM hearing_witnesses 
    WHERE hearing_id = hearing_id_param;
    
    -- Calculate average Q&A significance
    SELECT AVG(civic_education_significance) INTO qa_significance_avg
    FROM hearing_qa_exchanges 
    WHERE hearing_id = hearing_id_param;
    
    -- Count uncomfortable truths and power dynamics
    SELECT 
        array_length(uncomfortable_truths, 1),
        array_length(power_dynamics_revealed, 1)
    INTO uncomfortable_truths_count, power_dynamics_count
    FROM congressional_hearings 
    WHERE id = hearing_id_param;
    
    -- Calculate final score (weighted average)
    final_score := ROUND(
        (COALESCE(hearing_score, 5) * 0.3) +
        (COALESCE(witness_quality_avg, 5) * 0.25) +
        (COALESCE(qa_significance_avg, 5) * 0.25) +
        (LEAST(COALESCE(uncomfortable_truths_count, 0), 5) * 0.1) +
        (LEAST(COALESCE(power_dynamics_count, 0), 5) * 0.1)
    );
    
    RETURN LEAST(final_score, 10); -- Cap at 10
END;
$$ language 'plpgsql';

-- Function to find potential organization matches
CREATE OR REPLACE FUNCTION find_potential_organization_matches(org_name TEXT)
RETURNS TEXT[] AS $$
DECLARE
    matches TEXT[];
BEGIN
    -- Simple similarity matching - in production would use more sophisticated matching
    SELECT ARRAY_AGG(organization_name)
    INTO matches
    FROM auto_extracted_organizations
    WHERE organization_name ILIKE '%' || org_name || '%'
       OR org_name ILIKE '%' || organization_name || '%'
    LIMIT 5;
    
    RETURN COALESCE(matches, ARRAY[]::TEXT[]);
END;
$$ language 'plpgsql';

-- ============================================================================
-- COMPLETION
-- ============================================================================

COMMENT ON TABLE govinfo_documents IS 'Stores GovInfo API document packages with CivicSense analysis';
COMMENT ON TABLE congressional_hearings IS 'Congressional hearing analysis extending existing infrastructure';
COMMENT ON TABLE hearing_witnesses IS 'Witness information and credibility analysis from hearings';
COMMENT ON TABLE hearing_qa_exchanges IS 'Q&A exchanges from hearings with civic education analysis';
COMMENT ON TABLE committee_documents IS 'Committee reports and prints with CivicSense analysis';
COMMENT ON TABLE auto_generated_events IS 'Automatically generated events from government documents';
COMMENT ON TABLE auto_extracted_organizations IS 'Organizations extracted from government documents';
COMMENT ON TABLE auto_extracted_relationships IS 'Relationships and connections extracted from documents';

-- Migration completed successfully 