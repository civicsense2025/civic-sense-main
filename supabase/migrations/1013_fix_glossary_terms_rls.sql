-- ============================================================================
-- FIX GLOSSARY TERMS RLS POLICIES
-- ============================================================================
-- Add missing INSERT, UPDATE, DELETE policies for glossary_terms table
-- The table currently only has SELECT policies which blocks all admin operations

BEGIN;

-- Add admin policies for glossary_terms INSERT operations
CREATE POLICY "Admins can insert glossary terms"
ON glossary_terms FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Add admin policies for glossary_terms UPDATE operations
CREATE POLICY "Admins can update glossary terms"
ON glossary_terms FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Add admin policies for glossary_terms DELETE operations
CREATE POLICY "Admins can delete glossary terms"
ON glossary_terms FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Also add policies for related tables that might have similar issues

-- Glossary term categories
CREATE POLICY "Admins can manage glossary term categories" 
ON glossary_term_categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Glossary term relationships
CREATE POLICY "Admins can manage glossary term relationships"
ON glossary_term_relationships FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Public read access for glossary term categories (if not already exists)
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'glossary_term_categories' 
    AND policyname = 'Public can view glossary term categories'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view glossary term categories" ON glossary_term_categories FOR SELECT USING (true)';
  END IF;
END $$;

-- Public read access for glossary term relationships (if not already exists)
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'glossary_term_relationships' 
    AND policyname = 'Public can view active glossary term relationships'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view active glossary term relationships" ON glossary_term_relationships FOR SELECT USING (is_active = true)';
  END IF;
END $$;

COMMIT; 