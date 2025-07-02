-- Stored procedures for assessment framework

-- Update indicator status with transaction safety
CREATE OR REPLACE FUNCTION update_indicator_status(
  p_indicator_id UUID,
  p_old_status TEXT,
  p_new_status TEXT,
  p_reason TEXT,
  p_sources JSONB,
  p_date TEXT
) RETURNS void AS $$
BEGIN
  -- Start transaction
  BEGIN
    -- Update indicator status
    UPDATE indicators
    SET 
      status = p_new_status,
      last_updated = CURRENT_TIMESTAMP
    WHERE id = p_indicator_id;

    -- Record the update in history
    INSERT INTO indicator_updates (
      indicator_id,
      old_status,
      new_status,
      reason,
      sources,
      created_at
    ) VALUES (
      p_indicator_id,
      p_old_status,
      p_new_status,
      p_reason,
      p_sources,
      p_date::TIMESTAMP WITH TIME ZONE
    );

    -- Commit transaction
    COMMIT;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback on error
    ROLLBACK;
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- Calculate relevance score for topic-indicator mapping
CREATE OR REPLACE FUNCTION calculate_topic_relevance(
  p_topic_id UUID,
  p_indicator_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER;
BEGIN
  -- Example scoring algorithm:
  -- 1. Base score from direct question matches
  -- 2. Bonus for recent content
  -- 3. Penalty for old/outdated content
  SELECT 
    LEAST(100, GREATEST(0,
      -- Base score from question count
      (
        SELECT COUNT(*) * 10
        FROM questions q
        WHERE q.topic_id = p_topic_id
        AND q.is_active = true
      ) +
      -- Bonus for recent content
      CASE 
        WHEN MAX(t.last_updated) > NOW() - INTERVAL '7 days' THEN 20
        WHEN MAX(t.last_updated) > NOW() - INTERVAL '30 days' THEN 10
        ELSE 0
      END -
      -- Penalty for old content
      CASE
        WHEN MIN(t.last_updated) < NOW() - INTERVAL '365 days' THEN 20
        WHEN MIN(t.last_updated) < NOW() - INTERVAL '180 days' THEN 10
        ELSE 0
      END
    ))
  INTO v_score
  FROM topics t
  WHERE t.id = p_topic_id;

  RETURN COALESCE(v_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Auto-update topic mappings based on content
CREATE OR REPLACE FUNCTION update_topic_mappings() RETURNS void AS $$
DECLARE
  v_topic RECORD;
  v_indicator RECORD;
  v_score INTEGER;
BEGIN
  -- For each active topic
  FOR v_topic IN (
    SELECT id 
    FROM topics 
    WHERE is_active = true
  ) LOOP
    -- For each indicator
    FOR v_indicator IN (
      SELECT id 
      FROM indicators
    ) LOOP
      -- Calculate relevance score
      v_score := calculate_topic_relevance(v_topic.id, v_indicator.id);
      
      -- Update mapping if score is significant
      IF v_score >= 30 THEN
        INSERT INTO topic_indicator_mappings (
          topic_id,
          indicator_id,
          relevance_score,
          evidence_strength,
          last_updated
        ) VALUES (
          v_topic.id,
          v_indicator.id,
          v_score,
          CASE
            WHEN v_score >= 80 THEN 'strong'
            WHEN v_score >= 50 THEN 'moderate'
            ELSE 'weak'
          END,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (topic_id, indicator_id) 
        DO UPDATE SET
          relevance_score = EXCLUDED.relevance_score,
          evidence_strength = EXCLUDED.evidence_strength,
          last_updated = CURRENT_TIMESTAMP;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql; 