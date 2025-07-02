-- Migration: Populate media organizations from existing quiz sources
-- and create sample media bias quiz content

BEGIN;

-- First, extract unique domains from all quiz question sources
WITH source_domains AS (
  SELECT DISTINCT
    regexp_replace(
      regexp_replace(source->>'url', '^https?://(www\.)?', ''),
      '/.*$', ''
    ) as domain,
    source->>'name' as source_name,
    source->>'url' as sample_url
  FROM questions q,
  LATERAL jsonb_array_elements(q.sources) AS source
  WHERE source->>'url' IS NOT NULL
    AND source->>'url' != ''
),
-- Map common news organizations
domain_org_mapping AS (
  SELECT 
    domain,
    source_name,
    sample_url,
    CASE 
      -- Major news networks
      WHEN domain LIKE '%cnn.com%' THEN 'CNN'
      WHEN domain LIKE '%foxnews.com%' THEN 'Fox News'
      WHEN domain LIKE '%msnbc.com%' THEN 'MSNBC'
      WHEN domain LIKE '%nbcnews.com%' THEN 'NBC News'
      WHEN domain LIKE '%abcnews.go.com%' THEN 'ABC News'
      WHEN domain LIKE '%cbsnews.com%' THEN 'CBS News'
      
      -- Print media
      WHEN domain LIKE '%nytimes.com%' THEN 'The New York Times'
      WHEN domain LIKE '%washingtonpost.com%' THEN 'The Washington Post'
      WHEN domain LIKE '%wsj.com%' THEN 'The Wall Street Journal'
      WHEN domain LIKE '%usatoday.com%' THEN 'USA Today'
      
      -- Wire services
      WHEN domain LIKE '%reuters.com%' THEN 'Reuters'
      WHEN domain LIKE '%apnews.com%' OR domain LIKE '%ap.org%' THEN 'Associated Press'
      
      -- Digital first
      WHEN domain LIKE '%politico.com%' THEN 'Politico'
      WHEN domain LIKE '%axios.com%' THEN 'Axios'
      WHEN domain LIKE '%vox.com%' THEN 'Vox'
      WHEN domain LIKE '%buzzfeednews.com%' THEN 'BuzzFeed News'
      
      -- International
      WHEN domain LIKE '%bbc.com%' OR domain LIKE '%bbc.co.uk%' THEN 'BBC'
      WHEN domain LIKE '%theguardian.com%' THEN 'The Guardian'
      
      -- Public media
      WHEN domain LIKE '%npr.org%' THEN 'NPR'
      WHEN domain LIKE '%pbs.org%' THEN 'PBS'
      
      -- Government
      WHEN domain LIKE '%.gov' THEN 'Government Source'
      WHEN domain LIKE '%whitehouse.gov%' THEN 'White House'
      WHEN domain LIKE '%congress.gov%' THEN 'U.S. Congress'
      
      -- Default to extracted name
      ELSE COALESCE(
        regexp_replace(source_name, ' - .*$', ''), -- Remove " - Article Title" suffixes
        initcap(replace(domain, '.com', ''))
      )
    END as organization_name,
    CASE
      WHEN domain LIKE '%.gov' THEN 'government'
      WHEN domain LIKE '%npr.org%' OR domain LIKE '%pbs.org%' OR domain LIKE '%bbc.%' THEN 'public_media'
      WHEN domain LIKE '%ap.org%' OR domain LIKE '%reuters.com%' OR domain LIKE '%apnews.com%' THEN 'wire_service'
      ELSE 'news_outlet'
    END as org_type
  FROM source_domains
)
-- Insert organizations (skip if already exists)
INSERT INTO media_organizations (
  name, 
  organization_type, 
  domain,
  description,
  transparency_score
)
SELECT DISTINCT
  organization_name as name,
  org_type as organization_type,
  domain,
  CASE org_type
    WHEN 'government' THEN 'Official government source'
    WHEN 'public_media' THEN 'Publicly funded media organization'
    WHEN 'wire_service' THEN 'News wire service providing content to multiple outlets'
    ELSE 'News media organization'
  END as description,
  CASE org_type
    WHEN 'government' THEN 95  -- High transparency for government sources
    WHEN 'public_media' THEN 85 -- Good transparency for public media
    WHEN 'wire_service' THEN 90 -- High transparency for wire services
    ELSE 70 -- Default for other news outlets
  END as transparency_score
FROM domain_org_mapping
WHERE domain IS NOT NULL
  AND domain != ''
ON CONFLICT (domain) DO NOTHING;

-- Insert default bias scores for major organizations
-- Political lean: -100 (far left) to +100 (far right), 0 is center
-- Factual accuracy: 0 to 100 (higher is better)
-- Sensationalism: 0 to 100 (higher is more sensational)

-- Get dimension IDs
DO $$
DECLARE
  political_lean_id uuid;
  factual_accuracy_id uuid;
  sensationalism_id uuid;
  corporate_influence_id uuid;
  establishment_bias_id uuid;
BEGIN
  SELECT id INTO political_lean_id FROM bias_dimensions WHERE dimension_slug = 'political_lean';
  SELECT id INTO factual_accuracy_id FROM bias_dimensions WHERE dimension_slug = 'factual_accuracy';
  SELECT id INTO sensationalism_id FROM bias_dimensions WHERE dimension_slug = 'sensationalism';
  SELECT id INTO corporate_influence_id FROM bias_dimensions WHERE dimension_slug = 'corporate_influence';
  SELECT id INTO establishment_bias_id FROM bias_dimensions WHERE dimension_slug = 'establishment_bias';

  -- CNN
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, political_lean_id, -35, 0.85, 1000 FROM media_organizations WHERE name = 'CNN'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;
  
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, factual_accuracy_id, 75, 0.80, 500 FROM media_organizations WHERE name = 'CNN'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;
  
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, sensationalism_id, 60, 0.75, 300 FROM media_organizations WHERE name = 'CNN'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;

  -- Fox News
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, political_lean_id, 65, 0.90, 1200 FROM media_organizations WHERE name = 'Fox News'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;
  
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, factual_accuracy_id, 65, 0.85, 600 FROM media_organizations WHERE name = 'Fox News'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;
  
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, sensationalism_id, 70, 0.80, 400 FROM media_organizations WHERE name = 'Fox News'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;

  -- NPR
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, political_lean_id, -25, 0.85, 800 FROM media_organizations WHERE name = 'NPR'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;
  
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, factual_accuracy_id, 90, 0.90, 700 FROM media_organizations WHERE name = 'NPR'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;
  
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, sensationalism_id, 20, 0.85, 400 FROM media_organizations WHERE name = 'NPR'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;

  -- Reuters
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, political_lean_id, 0, 0.90, 1000 FROM media_organizations WHERE name = 'Reuters'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;
  
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, factual_accuracy_id, 95, 0.95, 900 FROM media_organizations WHERE name = 'Reuters'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;
  
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, sensationalism_id, 10, 0.90, 500 FROM media_organizations WHERE name = 'Reuters'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;

  -- The New York Times
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, political_lean_id, -40, 0.85, 1100 FROM media_organizations WHERE name = 'The New York Times'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;
  
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, factual_accuracy_id, 85, 0.90, 800 FROM media_organizations WHERE name = 'The New York Times'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;

  -- The Wall Street Journal
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, political_lean_id, 35, 0.85, 900 FROM media_organizations WHERE name = 'The Wall Street Journal'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;
  
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, factual_accuracy_id, 85, 0.90, 700 FROM media_organizations WHERE name = 'The Wall Street Journal'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;

  -- Associated Press
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, political_lean_id, -5, 0.95, 1500 FROM media_organizations WHERE name = 'Associated Press'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;
  
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, factual_accuracy_id, 95, 0.95, 1200 FROM media_organizations WHERE name = 'Associated Press'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;
  
  INSERT INTO organization_bias_scores (organization_id, dimension_id, current_score, confidence_level, sample_size)
  SELECT id, sensationalism_id, 5, 0.90, 600 FROM media_organizations WHERE name = 'Associated Press'
  ON CONFLICT (organization_id, dimension_id) DO NOTHING;
END $$;

-- Create a sample media bias quiz topic
INSERT INTO question_topics (
  topic_id,
  topic_title,
  description,
  why_this_matters,
  emoji,
  date,
  day_of_week,
  categories,
  is_active
) VALUES (
  '2025-media-bias-detection-fundamentals',
  'Media Bias Detection: Understanding Different Perspectives',
  'Learn to identify different types of media bias and understand how the same story can be presented differently across news sources.',
  '<ul><li><strong>Critical Thinking:</strong> Develop skills to evaluate news sources and identify potential biases in reporting</li><li><strong>Informed Citizenship:</strong> Make better voting and civic decisions by understanding how media shapes narratives</li><li><strong>Media Literacy:</strong> Recognize techniques used to influence opinion through word choice, framing, and source selection</li><li><strong>Democratic Participation:</strong> Engage more effectively in democracy by consuming diverse, balanced news sources</li></ul>',
  '🔍',
  CURRENT_DATE::text,
  to_char(CURRENT_DATE, 'Day'),
  '["Media Literacy", "Civic Participation", "Civil Rights"]',
  true
) ON CONFLICT (topic_id) DO NOTHING;

-- Sample questions for media bias detection
INSERT INTO questions (
  topic_id,
  question_number,
  question_type,
  category,
  question,
  option_a,
  option_b,
  option_c,
  option_d,
  correct_answer,
  hint,
  explanation,
  tags,
  sources,
  difficulty_level,
  is_active
) VALUES 
(
  '2025-media-bias-detection-fundamentals',
  1,
  'multiple_choice',
  'Media Literacy',
  'When CNN reports "Protesters demand justice" while Fox News reports "Rioters cause chaos" about the same event, this is an example of:',
  'Factual error',
  'Framing bias',
  'Statistical manipulation',
  'Source suppression',
  'Framing bias',
  'Think about how word choice affects perception',
  'Framing bias occurs when media outlets use different language to describe the same event, shaping how audiences perceive it. Words like "protesters" vs "rioters" carry very different connotations and can influence public opinion without changing the underlying facts.',
  '["media bias", "framing", "word choice"]',
  '[{"name": "AllSides Media Bias Guide", "url": "https://www.allsides.com/media-bias/how-to-spot-types-of-media-bias"}, {"name": "Stanford History Education Group", "url": "https://sheg.stanford.edu/news/media-literacy"}]',
  2,
  true
),
(
  '2025-media-bias-detection-fundamentals',
  2,
  'multiple_choice',
  'Media Literacy',
  'A news outlet consistently quotes experts from only one political party. This demonstrates:',
  'Selection bias',
  'Confirmation bias',
  'Availability bias',
  'Anchoring bias',
  'Selection bias',
  'Consider what voices are being included or excluded',
  'Selection bias in media occurs when news outlets systematically choose sources that support a particular viewpoint while excluding opposing perspectives. This creates an echo chamber effect and prevents audiences from hearing diverse viewpoints on important issues.',
  '["source selection", "media bias", "echo chambers"]',
  '[{"name": "Pew Research Center - News Media Bias", "url": "https://www.pewresearch.org/journalism/2020/01/24/u-s-media-polarization-and-the-2020-election/"}, {"name": "Media Bias Chart", "url": "https://www.adfontesmedia.com/media-bias-chart/"}]',
  2,
  true
),
(
  '2025-media-bias-detection-fundamentals',
  3,
  'true_false',
  'Media Literacy',
  'Wire services like Reuters and Associated Press generally have less political bias than cable news networks.',
  NULL,
  NULL,
  NULL,
  NULL,
  'True',
  'Think about the business model of wire services vs cable news',
  'Wire services sell news to outlets across the political spectrum, incentivizing neutral reporting. Cable news networks target specific audiences and use opinion programming to build viewer loyalty, which often leads to more pronounced political bias.',
  '["wire services", "media neutrality", "business models"]',
  '[{"name": "Columbia Journalism Review - Wire Services", "url": "https://www.cjr.org/analysis/wire-services.php"}, {"name": "AllSides Media Bias Ratings", "url": "https://www.allsides.com/media-bias/media-bias-ratings"}]',
  1,
  true
) ON CONFLICT (topic_id, question_number) DO NOTHING;

-- Create a function to analyze source diversity in quiz topics
CREATE OR REPLACE FUNCTION analyze_topic_source_diversity(p_topic_id text)
RETURNS TABLE (
  unique_organizations bigint,
  political_diversity numeric,
  avg_factual_accuracy numeric,
  balance_score numeric
) AS $$
DECLARE
  political_lean_id uuid;
  factual_accuracy_id uuid;
BEGIN
  SELECT id INTO political_lean_id FROM bias_dimensions WHERE dimension_slug = 'political_lean';
  SELECT id INTO factual_accuracy_id FROM bias_dimensions WHERE dimension_slug = 'factual_accuracy';
  
  RETURN QUERY
  WITH topic_sources AS (
    SELECT DISTINCT
      mo.id as org_id,
      mo.name as org_name
    FROM questions q,
    LATERAL jsonb_array_elements(q.sources) AS source
    JOIN media_organizations mo 
      ON mo.domain = regexp_replace(
        regexp_replace(source->>'url', '^https?://(www\.)?', ''),
        '/.*$', ''
      )
    WHERE q.topic_id = p_topic_id
  ),
  bias_scores AS (
    SELECT 
      ts.org_id,
      MAX(CASE WHEN obs.dimension_id = political_lean_id THEN obs.current_score END) as political_score,
      MAX(CASE WHEN obs.dimension_id = factual_accuracy_id THEN obs.current_score END) as accuracy_score
    FROM topic_sources ts
    LEFT JOIN organization_bias_scores obs ON obs.organization_id = ts.org_id
    GROUP BY ts.org_id
  )
  SELECT 
    COUNT(DISTINCT org_id)::bigint as unique_organizations,
    STDDEV(political_score)::numeric as political_diversity,
    AVG(accuracy_score)::numeric as avg_factual_accuracy,
    CASE 
      WHEN COUNT(*) < 2 THEN 0
      ELSE (100 - ABS(AVG(political_score)))::numeric 
    END as balance_score
  FROM bias_scores;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION analyze_topic_source_diversity(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_media_organization(text, text) TO authenticated;

COMMIT; 