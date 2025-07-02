-- Comprehensive RLS Policies for CivicSense - Part 3: Public Figures and Reference Data
-- Addresses security warnings while maintaining proper guest access
-- Created: 2024

BEGIN;

-- =============================================================================
-- EVENTS AND CIVIC CONTENT (Public read access)
-- =============================================================================

-- Events - Public read access for civic content
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are publicly readable"
ON events FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can manage events"
ON events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update events"
ON events FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete events"
ON events FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- PUBLIC FIGURES (Public read access, admin write)
-- =============================================================================

-- Public Figures - Public read access for civic education
ALTER TABLE public_figures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public figures are publicly readable"
ON public_figures FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can manage public figures"
ON public_figures FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update public figures"
ON public_figures FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete public figures"
ON public_figures FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- ORGANIZATIONS (Public read access, admin write)
-- =============================================================================

-- Organizations - Public read access for civic education
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are publicly readable"
ON organizations FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can manage organizations"
ON organizations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update organizations"
ON organizations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete organizations"
ON organizations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- FIGURE RELATIONSHIPS (Public read access, admin write)
-- =============================================================================

-- Figure Relationships - Public read access for understanding power networks
ALTER TABLE figure_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Figure relationships are publicly readable"
ON figure_relationships FOR SELECT
USING (is_active = true AND is_public = true);

CREATE POLICY "Only admins can manage figure relationships"
ON figure_relationships FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update figure relationships"
ON figure_relationships FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete figure relationships"
ON figure_relationships FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- FIGURE ORGANIZATIONS (Public read access, admin write)
-- =============================================================================

-- Figure Organizations - Public read access for understanding power structures
ALTER TABLE figure_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Figure organizations are publicly readable"
ON figure_organizations FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can manage figure organizations"
ON figure_organizations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update figure organizations"
ON figure_organizations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete figure organizations"
ON figure_organizations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- FIGURE EVENTS (Public read access, admin write)
-- =============================================================================

-- Figure Events - Public read access for civic timeline understanding
ALTER TABLE figure_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Figure events are publicly readable"
ON figure_events FOR SELECT
USING (true); -- All figure events are public for civic education

CREATE POLICY "Only admins can manage figure events"
ON figure_events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update figure events"
ON figure_events FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete figure events"
ON figure_events FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- FIGURE POLICY POSITIONS (Public read access, admin write)
-- =============================================================================

-- Figure Policy Positions - Public read access for understanding political positions
ALTER TABLE figure_policy_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Figure policy positions are publicly readable"
ON figure_policy_positions FOR SELECT
USING (true); -- All policy positions are public for civic education

CREATE POLICY "Only admins can manage figure policy positions"
ON figure_policy_positions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update figure policy positions"
ON figure_policy_positions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete figure policy positions"
ON figure_policy_positions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- =============================================================================
-- REFERENCE DATA (Public read access)
-- =============================================================================

ALTER TABLE category_synonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Category synonyms are publicly readable"
ON category_synonyms FOR SELECT
USING (true);

ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Glossary terms are publicly readable"
ON glossary_terms FOR SELECT
USING (is_active = true);

ALTER TABLE subscription_tier_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscription tier limits are publicly readable"
ON subscription_tier_limits FOR SELECT
USING (true);

COMMIT; 