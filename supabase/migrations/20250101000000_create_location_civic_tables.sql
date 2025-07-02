-- Location-Aware Civic Engagement Tables
-- Migration for implementing location-based representative tracking

BEGIN;

-- User Representatives Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Representative information
  name VARCHAR(200) NOT NULL,
  office VARCHAR(100),
  level VARCHAR(20) NOT NULL CHECK (level IN ('federal', 'state', 'county', 'municipal', 'local')),
  party VARCHAR(50),
  
  -- Contact information
  phone VARCHAR(20),
  email VARCHAR(100),
  office_address TEXT,
  website_url VARCHAR(500),
  
  -- District/jurisdiction info
  ocd_id VARCHAR(200), -- Open Civic Data ID
  district_name VARCHAR(100),
  jurisdiction VARCHAR(100),
  
  -- Data source tracking
  data_source VARCHAR(50) NOT NULL CHECK (data_source IN ('congress_gov', 'openstates', 'manual', 'scraped', 'google_civic')),
  source_id VARCHAR(100), -- ID from source API
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  needs_manual_verification BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  UNIQUE(user_id, source_id, data_source)
);

-- Location Coverage Tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.location_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_hash VARCHAR(100) UNIQUE NOT NULL, -- hash of normalized address
  coverage_level JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example: {"federal": "complete", "state": "complete", "local": "manual"}
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  needs_attention BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Location Preferences
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Address information
  formatted_address TEXT NOT NULL,
  street_address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  
  -- Geocoding results
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_hash TEXT, -- For deduplication and caching
  
  -- User preferences
  label TEXT, -- "Home", "Work", etc.
  is_primary BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Regular unique constraint (without WHERE clause)
  CONSTRAINT unique_user_location UNIQUE(user_id, formatted_address)
);

-- Create partial unique index to ensure only one primary location per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_locations_primary 
ON public.user_locations(user_id) WHERE is_primary = true;

-- Election Information Cache
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.election_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Election details
  election_id VARCHAR(100) UNIQUE NOT NULL, -- From Google Civic API
  election_name VARCHAR(200) NOT NULL,
  election_date DATE NOT NULL,
  election_type VARCHAR(50), -- 'federal', 'state', 'local', 'special'
  
  -- Geographic scope
  state VARCHAR(50),
  jurisdiction VARCHAR(100),
  ocd_ids JSONB DEFAULT '[]'::jsonb,
  
  -- Voting information
  voting_locations JSONB DEFAULT '[]'::jsonb,
  ballot_info JSONB DEFAULT '{}'::jsonb,
  candidates JSONB DEFAULT '[]'::jsonb,
  
  -- Data source
  data_source VARCHAR(50) DEFAULT 'google_civic',
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Election Participation Tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_election_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  election_id UUID REFERENCES public.election_info(id) ON DELETE CASCADE,
  
  -- Participation tracking
  is_registered BOOLEAN DEFAULT false,
  voting_method VARCHAR(50) CHECK (voting_method IN ('in_person', 'mail', 'early', 'absentee')),
  voted BOOLEAN DEFAULT false,
  voting_location_id VARCHAR(100),
  
  -- Engagement tracking
  researched_candidates BOOLEAN DEFAULT false,
  viewed_ballot_info BOOLEAN DEFAULT false,
  civic_education_completed BOOLEAN DEFAULT false,
  
  -- Reminders and notifications
  wants_reminders BOOLEAN DEFAULT true,
  reminder_sent BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, election_id)
);

-- Representative Content Mapping
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.representative_content_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES public.user_representatives(id) ON DELETE CASCADE,
  
  -- Content connections
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('topic', 'quiz', 'bill', 'vote', 'article')),
  content_id UUID NOT NULL,
  
  -- Relevance scoring
  relevance_score INTEGER DEFAULT 50 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  relevance_reason TEXT,
  
  -- Content metadata
  title VARCHAR(300),
  description TEXT,
  last_action_date TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(representative_id, content_type, content_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User representatives indexes
CREATE INDEX IF NOT EXISTS idx_user_representatives_user_id ON public.user_representatives(user_id);
CREATE INDEX IF NOT EXISTS idx_user_representatives_level ON public.user_representatives(level);
CREATE INDEX IF NOT EXISTS idx_user_representatives_data_source ON public.user_representatives(data_source);
CREATE INDEX IF NOT EXISTS idx_user_representatives_last_verified ON public.user_representatives(last_verified);
CREATE INDEX IF NOT EXISTS idx_user_representatives_needs_verification ON public.user_representatives(needs_manual_verification) WHERE needs_manual_verification = true;

-- Location coverage indexes
CREATE INDEX IF NOT EXISTS idx_location_coverage_hash ON public.location_coverage(location_hash);
CREATE INDEX IF NOT EXISTS idx_location_coverage_needs_attention ON public.location_coverage(needs_attention) WHERE needs_attention = true;

-- User locations indexes
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_primary ON public.user_locations(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_user_locations_geo ON public.user_locations(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Election info indexes
CREATE INDEX IF NOT EXISTS idx_election_info_date ON public.election_info(election_date DESC);
CREATE INDEX IF NOT EXISTS idx_election_info_active ON public.election_info(is_active, election_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_election_info_state ON public.election_info(state);

-- User election tracking indexes
CREATE INDEX IF NOT EXISTS idx_user_election_tracking_user ON public.user_election_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_election_tracking_election ON public.user_election_tracking(election_id);

-- Representative content mapping indexes
CREATE INDEX IF NOT EXISTS idx_rep_content_mapping_rep ON public.representative_content_mapping(representative_id);
CREATE INDEX IF NOT EXISTS idx_rep_content_mapping_content ON public.representative_content_mapping(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_rep_content_mapping_relevance ON public.representative_content_mapping(relevance_score DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.election_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_election_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representative_content_mapping ENABLE ROW LEVEL SECURITY;

-- User representatives policies
CREATE POLICY "Users can view their own representatives" ON public.user_representatives
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own representatives" ON public.user_representatives
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own representatives" ON public.user_representatives
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own representatives" ON public.user_representatives
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can manage all representatives
CREATE POLICY "Admins can manage all representatives" ON public.user_representatives
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Location coverage policies (readable by all for service optimization)
CREATE POLICY "Location coverage readable by authenticated users" ON public.location_coverage
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage location coverage" ON public.location_coverage
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- User locations policies
CREATE POLICY "Users can manage their own locations" ON public.user_locations
  FOR ALL USING (auth.uid() = user_id);

-- Election info policies (public read access)
CREATE POLICY "Election info readable by all authenticated users" ON public.election_info
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage election info" ON public.election_info
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- User election tracking policies
CREATE POLICY "Users can manage their own election tracking" ON public.user_election_tracking
  FOR ALL USING (auth.uid() = user_id);

-- Representative content mapping policies
CREATE POLICY "Users can view content mapping for their representatives" ON public.representative_content_mapping
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_representatives ur
      WHERE ur.id = representative_content_mapping.representative_id 
      AND ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage representative content mapping" ON public.representative_content_mapping
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
CREATE TRIGGER trigger_user_representatives_updated_at
  BEFORE UPDATE ON public.user_representatives
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_user_locations_updated_at
  BEFORE UPDATE ON public.user_locations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_election_info_updated_at
  BEFORE UPDATE ON public.election_info
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_user_election_tracking_updated_at
  BEFORE UPDATE ON public.user_election_tracking
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMIT; 