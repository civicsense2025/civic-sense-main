-- Add game_mode enum type
DO $$ BEGIN
    CREATE TYPE quiz_game_mode AS ENUM (
        'standard',           -- Regular quiz mode
        'practice',          -- Practice mode with hints and explanations
        'challenge',         -- Timed challenge mode
        'assessment',        -- Assessment mode
        'multiplayer',       -- Multiplayer game mode
        'npc_battle'         -- NPC battle mode
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create quiz_attempts table if it doesn't exist
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_token text,
  session_id text NOT NULL UNIQUE,
  game_mode text NOT NULL DEFAULT 'standard'
    CHECK (game_mode IN (
      -- Solo Modes
      'standard',
      'practice',
      'assessment',
      'npc_battle',
      'civics_test_quick',
      'civics_test_full',
      'daily',
      'rapid',
      'challenge',
      -- Multiplayer Modes
      'classic_quiz',
      'speed_round',
      'matching_challenge',
      'debate_mode'
    )),
  platform text NOT NULL DEFAULT 'web'
    CHECK (platform IN ('web', 'mobile')),
  streak_count integer DEFAULT 0,
  max_streak integer DEFAULT 0,
  total_time_seconds integer DEFAULT 0,
  correct_count integer DEFAULT 0,
  question_count integer DEFAULT 0,
  category text,
  skill_id text,
  mode_settings jsonb DEFAULT '{}'::jsonb,
  response_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_game_mode ON quiz_attempts(game_mode);
CREATE INDEX idx_quiz_attempts_platform ON quiz_attempts(platform);
CREATE INDEX idx_quiz_attempts_category ON quiz_attempts(category);
CREATE INDEX idx_quiz_attempts_skill_id ON quiz_attempts(skill_id);
CREATE INDEX idx_quiz_attempts_created_at ON quiz_attempts(created_at);

-- Create views for different quiz types
CREATE VIEW civics_test_attempts AS
SELECT *
FROM quiz_attempts
WHERE game_mode IN ('civics_test_quick', 'civics_test_full');

CREATE VIEW multiplayer_attempts AS
SELECT *
FROM quiz_attempts
WHERE game_mode IN ('classic_quiz', 'speed_round', 'matching_challenge', 'debate_mode');

CREATE VIEW practice_attempts AS
SELECT *
FROM quiz_attempts
WHERE game_mode IN ('practice', 'standard', 'assessment');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quiz_attempts_updated_at
    BEFORE UPDATE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE quiz_attempts IS 'Unified table for tracking all quiz and assessment attempts';
COMMENT ON COLUMN quiz_attempts.game_mode IS 'The type of quiz or game mode being played';
COMMENT ON COLUMN quiz_attempts.mode_settings IS 'JSON settings specific to the game mode (time limits, question counts, etc)';
COMMENT ON COLUMN quiz_attempts.response_data IS 'JSON array of question responses with timing, correctness, etc';
COMMENT ON COLUMN quiz_attempts.platform IS 'The platform where the quiz was taken (web or mobile)';
COMMENT ON COLUMN quiz_attempts.guest_token IS 'Token for tracking guest users before they create an account';

-- Create a trigger to validate game_metadata based on game mode and platform
CREATE OR REPLACE FUNCTION validate_game_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure game_metadata is an object
    IF NOT (NEW.game_metadata @> '{}'::jsonb) THEN
        RAISE EXCEPTION 'game_metadata must be a JSON object';
    END IF;

    -- Validate metadata based on game mode
    CASE NEW.game_mode
        -- Multiplayer modes validation
        WHEN 'classic_quiz', 'speed_round', 'matching_challenge', 'debate_mode' THEN
            IF NOT (
                NEW.game_metadata ? 'room_id' AND 
                NEW.game_metadata ? 'player_count' AND 
                NEW.game_metadata ? 'time_limit'
            ) THEN
                RAISE EXCEPTION 'multiplayer modes require room_id, player_count, and time_limit in game_metadata';
            END IF;
            
            -- Additional validation for premium modes
            IF NEW.game_mode IN ('debate_mode') THEN
                IF NOT (NEW.game_metadata ? 'premium_features') THEN
                    RAISE EXCEPTION 'premium game modes require premium_features in game_metadata';
                END IF;
            END IF;

        -- NPC battle validation
        WHEN 'npc_battle' THEN
            IF NOT (NEW.game_metadata ? 'npc_id' AND NEW.game_metadata ? 'difficulty') THEN
                RAISE EXCEPTION 'npc_battle mode requires npc_id and difficulty in game_metadata';
            END IF;

        -- Platform-specific metadata validation
        ELSE
            -- Mobile-specific requirements
            IF NEW.platform = 'mobile' THEN
                IF NOT (NEW.game_metadata ? 'device_info') THEN
                    RAISE EXCEPTION 'mobile platform requires device_info in game_metadata';
                END IF;
            END IF;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate game_metadata before insert or update
CREATE TRIGGER validate_game_metadata_trigger
    BEFORE INSERT OR UPDATE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION validate_game_metadata(); 