-- Migration for adding crossword puzzle support to the CivicSense database

-- 1. Ensure the question_type column accepts the new 'crossword' type
DO $$
BEGIN
    -- Check if the column exists and if it's of type text
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'questions'
        AND column_name = 'question_type'
    ) THEN
        -- No need to alter the column if it's already text type
        -- Just ensuring the column exists
        NULL;
    ELSE
        -- Add the column if it doesn't exist
        ALTER TABLE questions ADD COLUMN question_type text NOT NULL DEFAULT 'multiple_choice';
    END IF;
END
$$;

-- 2. Add a crossword_data JSONB column to store the crossword puzzle data
-- This allows for flexible storage of the crossword grid, clues, and answers
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS crossword_data JSONB;

-- 3. Create an index on the question_type column for faster queries
CREATE INDEX IF NOT EXISTS idx_questions_question_type ON questions(question_type);

-- 4. Create a view for crossword puzzles to make querying easier
CREATE OR REPLACE VIEW crossword_puzzles AS
SELECT 
    id,
    topic_id,
    question_number,
    question,
    hint,
    explanation,
    crossword_data,
    created_at,
    updated_at
FROM 
    questions
WHERE 
    question_type = 'crossword' AND
    is_active = true;

-- 5. Add a function to validate crossword puzzle data structure
CREATE OR REPLACE FUNCTION validate_crossword_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this is a crossword question
    IF NEW.question_type = 'crossword' THEN
        -- Validate that crossword_data is present and has the required structure
        IF NEW.crossword_data IS NULL OR 
           NOT (NEW.crossword_data ? 'size') OR 
           NOT (NEW.crossword_data ? 'words') THEN
            RAISE EXCEPTION 'Crossword questions must include valid crossword_data with size and words';
        END IF;
        
        -- Validate that size has rows and cols
        IF NOT ((NEW.crossword_data->'size') ? 'rows') OR 
           NOT ((NEW.crossword_data->'size') ? 'cols') THEN
            RAISE EXCEPTION 'Crossword size must include rows and cols';
        END IF;
        
        -- Validate that words is an array and not empty
        IF jsonb_array_length(NEW.crossword_data->'words') = 0 THEN
            RAISE EXCEPTION 'Crossword must include at least one word';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a trigger to validate crossword data on insert/update
DROP TRIGGER IF EXISTS validate_crossword_data_trigger ON questions;
CREATE TRIGGER validate_crossword_data_trigger
BEFORE INSERT OR UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION validate_crossword_data();

-- 7. Add a function to generate the correct_answer field for crossword puzzles
-- This helps maintain compatibility with the existing quiz system
CREATE OR REPLACE FUNCTION generate_crossword_answer()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a crossword question and correct_answer is empty
    IF NEW.question_type = 'crossword' AND 
       (NEW.correct_answer IS NULL OR NEW.correct_answer = '') THEN
        -- Generate a JSON string with all words as the correct answer
        NEW.correct_answer = (
            SELECT jsonb_agg(word->>'word')::text
            FROM jsonb_array_elements(NEW.crossword_data->'words') AS word
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create a trigger to generate crossword answers
DROP TRIGGER IF EXISTS generate_crossword_answer_trigger ON questions;
CREATE TRIGGER generate_crossword_answer_trigger
BEFORE INSERT OR UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION generate_crossword_answer();

-- 9. Update any existing questions that might have been manually set to crossword type
UPDATE questions
SET crossword_data = jsonb_build_object(
    'size', jsonb_build_object('rows', 5, 'cols', 5),
    'words', jsonb_build_array()
)
WHERE question_type = 'crossword' AND crossword_data IS NULL; 