-- Create category_synonyms table for mapping aliases to canonical categories
CREATE TABLE category_synonyms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alias VARCHAR(100) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique aliases
    UNIQUE(alias)
);

-- Create index for fast alias lookups
CREATE INDEX idx_category_synonyms_alias ON category_synonyms(alias);
CREATE INDEX idx_category_synonyms_category_id ON category_synonyms(category_id);

-- Add the missing canonical categories first
WITH curated_new_categories(name, emoji, description) AS (
  VALUES
    ('AI Governance',    '🤖',  'Ethics & regulation of AI'),
    ('Immigration',      '🛂',  'Migration law & policy'),
    ('Media Literacy',   '📰',  'Understanding & critiquing media')
)
INSERT INTO categories (name, emoji, description, display_order, is_active)
SELECT name, emoji, description, 
       (SELECT COALESCE(MAX(display_order), 0) + 1 FROM categories) + ROW_NUMBER() OVER() - 1,
       true
FROM curated_new_categories
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE categories.name = curated_new_categories.name);

-- Now populate category_synonyms with canonical names mapping to themselves
INSERT INTO category_synonyms (alias, category_id)
SELECT name, id FROM categories WHERE is_active = true;

-- Add common aliases for existing categories
WITH category_aliases AS (
  SELECT 
    c.id,
    unnest(ARRAY[
      -- Government aliases
      CASE WHEN c.name = 'Government' THEN 'Federal Government' END,
      CASE WHEN c.name = 'Government' THEN 'State Government' END,
      CASE WHEN c.name = 'Government' THEN 'Local Government' END,
      CASE WHEN c.name = 'Government' THEN 'Public Administration' END,
      
      -- Elections aliases  
      CASE WHEN c.name = 'Elections' THEN 'Electoral Process' END,
      CASE WHEN c.name = 'Elections' THEN 'Voting' END,
      CASE WHEN c.name = 'Elections' THEN 'Campaign Finance' END,
      
      -- Economy aliases
      CASE WHEN c.name = 'Economy' THEN 'Economic Policy' END,
      CASE WHEN c.name = 'Economy' THEN 'Fiscal Policy' END,
      CASE WHEN c.name = 'Economy' THEN 'Monetary Policy' END,
      CASE WHEN c.name = 'Economy' THEN 'Trade Policy' END,
      
      -- Foreign Policy aliases
      CASE WHEN c.name = 'Foreign Policy' THEN 'International Relations' END,
      CASE WHEN c.name = 'Foreign Policy' THEN 'Diplomacy' END,
      CASE WHEN c.name = 'Foreign Policy' THEN 'International Affairs' END,
      
      -- Justice aliases
      CASE WHEN c.name = 'Justice' THEN 'Criminal Justice' END,
      CASE WHEN c.name = 'Justice' THEN 'Law Enforcement' END,
      CASE WHEN c.name = 'Justice' THEN 'Legal System' END,
      
      -- Civil Rights aliases
      CASE WHEN c.name = 'Civil Rights' THEN 'Civil Liberties' END,
      CASE WHEN c.name = 'Civil Rights' THEN 'Human Rights' END,
      CASE WHEN c.name = 'Civil Rights' THEN 'Individual Rights' END,
      
      -- Environment aliases
      CASE WHEN c.name = 'Environment' THEN 'Environmental Policy' END,
      CASE WHEN c.name = 'Environment' THEN 'Climate Policy' END,
      CASE WHEN c.name = 'Environment' THEN 'Sustainability' END,
      
      -- Constitutional Law aliases
      CASE WHEN c.name = 'Constitutional Law' THEN 'Constitutional Rights' END,
      CASE WHEN c.name = 'Constitutional Law' THEN 'Constitutional Interpretation' END,
      CASE WHEN c.name = 'Constitutional Law' THEN 'Constitutional Principles' END,
      
      -- National Security aliases
      CASE WHEN c.name = 'National Security' THEN 'Defense Policy' END,
      CASE WHEN c.name = 'National Security' THEN 'Homeland Security' END,
      CASE WHEN c.name = 'National Security' THEN 'Military Policy' END,
      
      -- Legislative Process aliases
      CASE WHEN c.name = 'Legislative Process' THEN 'Congressional Process' END,
      CASE WHEN c.name = 'Legislative Process' THEN 'Lawmaking' END,
      CASE WHEN c.name = 'Legislative Process' THEN 'Bill Process' END,
      
      -- Judicial Review aliases
      CASE WHEN c.name = 'Judicial Review' THEN 'Court Review' END,
      CASE WHEN c.name = 'Judicial Review' THEN 'Supreme Court Review' END,
      CASE WHEN c.name = 'Judicial Review' THEN 'Constitutional Review' END,
      
      -- Immigration aliases
      CASE WHEN c.name = 'Immigration' THEN 'Immigration Policy' END,
      CASE WHEN c.name = 'Immigration' THEN 'Immigration Enforcement' END,
      CASE WHEN c.name = 'Immigration' THEN 'Border Security' END,
      
      -- Media Literacy aliases
      CASE WHEN c.name = 'Media Literacy' THEN 'Information Literacy' END,
      CASE WHEN c.name = 'Media Literacy' THEN 'Digital Literacy' END,
      CASE WHEN c.name = 'Media Literacy' THEN 'News Literacy' END,
      
      -- AI Governance aliases
      CASE WHEN c.name = 'AI Governance' THEN 'Artificial Intelligence Policy' END,
      CASE WHEN c.name = 'AI Governance' THEN 'AI Regulation' END,
      CASE WHEN c.name = 'AI Governance' THEN 'Technology Policy' END
    ]) as alias
  FROM categories c
  WHERE c.is_active = true
)
INSERT INTO category_synonyms (alias, category_id)
SELECT alias, id 
FROM category_aliases 
WHERE alias IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM category_synonyms WHERE category_synonyms.alias = category_aliases.alias);

-- Create a view for easy category resolution
CREATE OR REPLACE VIEW category_resolution AS
SELECT 
  cs.alias,
  c.id as category_id,
  c.name as canonical_name,
  c.emoji,
  c.description
FROM category_synonyms cs
JOIN categories c ON cs.category_id = c.id
WHERE c.is_active = true; 