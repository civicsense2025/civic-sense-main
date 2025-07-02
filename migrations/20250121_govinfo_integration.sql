-- GovInfo API Integration - Database Schema Extension
-- Extends existing Congressional infrastructure with comprehensive document support

BEGIN;

-- ===== DOCUMENT COLLECTIONS =====

-- GovInfo document packages (extends congressional_bills)
CREATE TABLE IF NOT EXISTS govinfo_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id TEXT UNIQUE NOT NULL, -- GovInfo package identifier
  collection_code TEXT NOT NULL, -- 'BILLS', 'CHRG', 'CRPT', 'CPRT', 'FR', etc.
  
  -- Document metadata
  title TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'bill', 'hearing', 'report', 'print', 'rule', 'decision'
  congress_number INTEGER,
  chamber TEXT, -- 'house', 'senate', 'joint', null for non-congressional
  session_number INTEGER,
  
  -- Content tracking
  full_text TEXT,
  document_url TEXT,
  pdf_url TEXT,
  xml_url TEXT,
  content_quality TEXT DEFAULT 'pending', -- 'pending', 'processed', 'failed'
  
  -- Publishing information
  published_date DATE,
  last_modified_date TIMESTAMPTZ,
  document_class TEXT, -- Additional classification
  
  -- Processing status
  govinfo_last_sync TIMESTAMPTZ DEFAULT NOW(),
  content_extracted BOOLEAN DEFAULT FALSE,
  ai_analysis_complete BOOLEAN DEFAULT FALSE,
  entities_extracted BOOLEAN DEFAULT FALSE,
  
  -- Standard audit fields
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_govinfo_documents_package_id ON govinfo_documents(package_id);
CREATE INDEX IF NOT EXISTS idx_govinfo_documents_collection ON govinfo_documents(collection_code);
CREATE INDEX IF NOT EXISTS idx_govinfo_documents_congress ON govinfo_documents(congress_number);
CREATE INDEX IF NOT EXISTS idx_govinfo_documents_type ON govinfo_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_govinfo_documents_published ON govinfo_documents(published_date);

-- ===== CONGRESSIONAL HEARINGS =====

-- Congressional hearings (sourced from GovInfo CHRG collection)
CREATE TABLE IF NOT EXISTS congressional_hearings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  govinfo_document_id UUID NOT NULL REFERENCES govinfo_documents(id) ON DELETE CASCADE,
  
  -- Hearing identification
  hearing_title TEXT NOT NULL,
  congress_number INTEGER NOT NULL,
  chamber TEXT NOT NULL, -- 'house', 'senate', 'joint'
  session_number INTEGER,
  hearing_number TEXT,
  
  -- Committee information
  committee_id UUID REFERENCES congressional_committees(id),
  committee_name TEXT NOT NULL,
  subcommittee_name TEXT,
  
  -- Hearing details
  hearing_date DATE,
  hearing_location TEXT,
  hearing_purpose TEXT,
  hearing_type TEXT, -- 'oversight', 'legislative', 'confirmation', 'investigative'
  
  -- Content analysis
  witness_count INTEGER DEFAULT 0,
  testimony_sections_count INTEGER DEFAULT 0,
  questions_answered_count INTEGER DEFAULT 0,
  
  -- CivicSense analysis
  power_dynamics_revealed TEXT[],
  uncomfortable_truths TEXT[],
  key_revelations TEXT[],
  followup_actions_needed TEXT[],
  
  -- Processing flags
  witnesses_extracted BOOLEAN DEFAULT FALSE,
  testimony_processed BOOLEAN DEFAULT FALSE,
  entities_linked BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===== HEARING WITNESSES & TESTIMONY =====

-- Witnesses who testify at hearings
CREATE TABLE IF NOT EXISTS hearing_witnesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hearing_id UUID NOT NULL REFERENCES congressional_hearings(id) ON DELETE CASCADE,
  
  -- Witness identification  
  full_name TEXT NOT NULL,
  title TEXT,
  organization TEXT,
  organization_type TEXT, -- 'government', 'corporation', 'nonprofit', 'academic', 'individual'
  
  -- Witness background
  credentials TEXT,
  bio_summary TEXT,
  previous_testimony_count INTEGER DEFAULT 0,
  
  -- Testimony details
  testimony_order INTEGER, -- Order of appearance
  testimony_text TEXT,
  written_statement_url TEXT,
  key_points TEXT[],
  
  -- Analysis
  stance TEXT, -- 'supportive', 'opposed', 'neutral', 'mixed'
  credibility_score INTEGER CHECK (credibility_score >= 1 AND credibility_score <= 10),
  influence_level TEXT, -- 'high', 'medium', 'low'
  potential_conflicts TEXT[], -- Potential conflicts of interest
  
  -- Link to existing figures
  public_figure_id UUID REFERENCES public_figures(id),
  auto_matched BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Question and answer sessions from hearings
CREATE TABLE IF NOT EXISTS hearing_qa_exchanges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hearing_id UUID NOT NULL REFERENCES congressional_hearings(id) ON DELETE CASCADE,
  witness_id UUID REFERENCES hearing_witnesses(id),
  
  -- Q&A participants
  questioner_name TEXT NOT NULL,
  questioner_member_id UUID REFERENCES public_figures(id), -- If questioner is Congress member
  questioner_role TEXT, -- 'chair', 'ranking_member', 'member', 'counsel'
  
  -- Exchange content
  question_text TEXT NOT NULL,
  answer_text TEXT,
  exchange_topic TEXT,
  contentious_level INTEGER CHECK (contentious_level >= 1 AND contentious_level <= 5),
  
  -- Analysis
  reveals_new_information BOOLEAN DEFAULT FALSE,
  contradicts_previous_statements BOOLEAN DEFAULT FALSE,
  significant_admission BOOLEAN DEFAULT FALSE,
  evasive_response BOOLEAN DEFAULT FALSE,
  
  -- Timing
  exchange_timestamp TIME, -- Time within hearing
  exchange_order INTEGER, -- Sequence in hearing
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===== COMMITTEE DOCUMENTS =====

-- Committee reports and prints (CRPT, CPRT collections)
CREATE TABLE IF NOT EXISTS committee_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  govinfo_document_id UUID NOT NULL REFERENCES govinfo_documents(id) ON DELETE CASCADE,
  
  -- Document classification
  document_category TEXT NOT NULL, -- 'report', 'print', 'document'
  report_type TEXT, -- 'majority', 'minority', 'conference', 'joint'
  congress_number INTEGER NOT NULL,
  chamber TEXT NOT NULL,
  
  -- Committee information
  committee_id UUID REFERENCES congressional_committees(id),
  committee_name TEXT NOT NULL,
  subcommittee_name TEXT,
  
  -- Document details
  document_number TEXT,
  document_title TEXT NOT NULL,
  summary_text TEXT,
  
  -- Related legislation
  related_bill_id UUID REFERENCES congressional_bills(id),
  related_bills_mentioned TEXT[], -- Bill numbers mentioned in document
  
  -- Content analysis
  recommendations TEXT[],
  findings TEXT[],
  dissenting_views TEXT[],
  cost_estimates JSONB, -- CBO cost estimates if available
  
  -- Publication info
  published_date DATE,
  pages_count INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===== AUTOMATED CONTENT GENERATION =====

-- Auto-generated events from hearings and documents
CREATE TABLE IF NOT EXISTS auto_generated_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Source document
  source_type TEXT NOT NULL, -- 'hearing', 'committee_document', 'bill_action'
  source_id UUID NOT NULL, -- References hearing, document, or bill
  govinfo_document_id UUID REFERENCES govinfo_documents(id),
  
  -- Event details (feeds into existing events system)
  event_title TEXT NOT NULL,
  event_description TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL, -- 'hearing', 'markup', 'vote', 'report_release'
  
  -- Location and participants
  location TEXT,
  participants TEXT[], -- Names of key participants
  committees_involved TEXT[],
  
  -- Content analysis
  significance_score INTEGER CHECK (significance_score >= 1 AND significance_score <= 10),
  public_interest_level TEXT, -- 'high', 'medium', 'low'
  media_attention_predicted BOOLEAN DEFAULT FALSE,
  
  -- CivicSense content
  why_it_matters TEXT, -- Plain English explanation
  uncomfortable_truth TEXT, -- What powers don't want revealed
  action_items TEXT[], -- What citizens can do
  power_players TEXT[], -- Who benefits/loses
  
  -- Processing status
  content_generated BOOLEAN DEFAULT FALSE,
  published_to_events BOOLEAN DEFAULT FALSE,
  auto_approval_eligible BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-extracted organizations and entities
CREATE TABLE IF NOT EXISTS auto_extracted_organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Source tracking
  source_type TEXT NOT NULL, -- 'hearing_testimony', 'committee_document', 'bill_text'
  source_id UUID NOT NULL,
  govinfo_document_id UUID REFERENCES govinfo_documents(id),
  
  -- Organization details
  organization_name TEXT NOT NULL,
  organization_type TEXT, -- 'corporation', 'nonprofit', 'government_agency', 'trade_association'
  organization_description TEXT,
  
  -- Context from source
  context_mentioned TEXT, -- How/where org was mentioned
  role_described TEXT, -- Their role in the issue
  stance_indicated TEXT, -- 'supportive', 'opposed', 'neutral'
  influence_level TEXT, -- 'high', 'medium', 'low', 'unknown'
  
  -- Verification
  verified_organization BOOLEAN DEFAULT FALSE,
  matched_existing_org_id UUID, -- If matched to existing org
  needs_manual_review BOOLEAN DEFAULT TRUE,
  
  -- Frequency tracking
  mention_count INTEGER DEFAULT 1,
  first_mentioned_date DATE,
  last_mentioned_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-extracted relationships between entities
CREATE TABLE IF NOT EXISTS auto_extracted_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Source tracking
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  govinfo_document_id UUID REFERENCES govinfo_documents(id),
  
  -- Relationship details
  entity_1_type TEXT NOT NULL, -- 'person', 'organization', 'bill', 'committee'
  entity_1_id UUID,
  entity_1_name TEXT NOT NULL,
  
  entity_2_type TEXT NOT NULL,
  entity_2_id UUID,
  entity_2_name TEXT NOT NULL,
  
  relationship_type TEXT NOT NULL, -- 'employed_by', 'funds', 'opposes', 'supports', 'lobbies'
  relationship_description TEXT,
  relationship_strength TEXT, -- 'strong', 'moderate', 'weak'
  
  -- Context
  context_explanation TEXT,
  evidence_quality TEXT, -- 'direct_statement', 'implied', 'inferred'
  
  -- Verification
  verified_relationship BOOLEAN DEFAULT FALSE,
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 10),
  needs_fact_check BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ===== INTEGRATION WITH EXISTING SYSTEM =====

-- Link GovInfo documents to existing congressional bills
ALTER TABLE congressional_bills 
ADD COLUMN IF NOT EXISTS govinfo_package_id TEXT,
ADD COLUMN IF NOT EXISTS govinfo_last_sync TIMESTAMPTZ;

-- Add GovInfo source tracking to existing bill content analysis
ALTER TABLE bill_content_analysis 
ADD COLUMN IF NOT EXISTS govinfo_enhanced BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hearing_references TEXT[],
ADD COLUMN IF NOT EXISTS committee_document_references TEXT[];

-- Extend public figures with witness/testimony tracking
ALTER TABLE public_figures 
ADD COLUMN IF NOT EXISTS total_hearing_appearances INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_testimony_given INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_hearing_appearance DATE,
ADD COLUMN IF NOT EXISTS hearing_topics TEXT[];

-- ===== INDEXES FOR PERFORMANCE =====

-- Hearing-specific indexes
CREATE INDEX IF NOT EXISTS idx_congressional_hearings_date ON congressional_hearings(hearing_date);
CREATE INDEX IF NOT EXISTS idx_congressional_hearings_committee ON congressional_hearings(committee_id);
CREATE INDEX IF NOT EXISTS idx_congressional_hearings_congress ON congressional_hearings(congress_number);

-- Witness indexes
CREATE INDEX IF NOT EXISTS idx_hearing_witnesses_hearing ON hearing_witnesses(hearing_id);
CREATE INDEX IF NOT EXISTS idx_hearing_witnesses_public_figure ON hearing_witnesses(public_figure_id);
CREATE INDEX IF NOT EXISTS idx_hearing_witnesses_organization ON hearing_witnesses(organization);

-- Auto-generation indexes
CREATE INDEX IF NOT EXISTS idx_auto_generated_events_date ON auto_generated_events(event_date);
CREATE INDEX IF NOT EXISTS idx_auto_generated_events_source ON auto_generated_events(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_auto_extracted_orgs_name ON auto_extracted_organizations(organization_name);
CREATE INDEX IF NOT EXISTS idx_auto_extracted_rels_entities ON auto_extracted_relationships(entity_1_type, entity_1_id, entity_2_type, entity_2_id);

COMMIT; 