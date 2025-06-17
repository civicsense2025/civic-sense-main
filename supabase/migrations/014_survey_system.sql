-- Survey System Migration
-- Created: 2025-01-17

BEGIN;

-- Create surveys table
CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
    allow_anonymous BOOLEAN NOT NULL DEFAULT true,
    allow_partial_responses BOOLEAN NOT NULL DEFAULT true,
    estimated_time INTEGER, -- in minutes
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- Create survey questions table
CREATE TABLE IF NOT EXISTS survey_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN (
        'multiple_choice', 
        'multiple_select', 
        'scale', 
        'text', 
        'textarea', 
        'ranking', 
        'likert'
    )),
    question_text TEXT NOT NULL,
    description TEXT,
    required BOOLEAN NOT NULL DEFAULT false,
    options JSONB, -- array of options for multiple choice/select questions
    scale_config JSONB, -- min, max, labels for scale questions
    conditional_logic JSONB, -- show_if, show_when logic
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(survey_id, question_order)
);

-- Create survey responses table (session-based)
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL, -- unique session identifier
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    guest_token TEXT, -- for anonymous responses
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    is_complete BOOLEAN NOT NULL DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create survey answers table (individual question responses)
CREATE TABLE IF NOT EXISTS survey_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
    answer_data JSONB NOT NULL, -- flexible storage for different answer types
    answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(response_id, question_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_created_by ON surveys(created_by);
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey_id ON survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_order ON survey_questions(survey_id, question_order);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_session_id ON survey_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_completed ON survey_responses(survey_id, is_complete);
CREATE INDEX IF NOT EXISTS idx_survey_answers_response_id ON survey_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_survey_answers_question_id ON survey_answers(question_id);

-- Add RLS policies
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_answers ENABLE ROW LEVEL SECURITY;

-- Surveys policies
CREATE POLICY "Public can view active surveys" ON surveys FOR SELECT 
    USING (status = 'active');

CREATE POLICY "Users can create surveys" ON surveys FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own surveys" ON surveys FOR UPDATE 
    USING (created_by = auth.uid());

CREATE POLICY "Admin can do everything on surveys" ON surveys 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@civicsense.app'
        )
    );

-- Survey questions policies
CREATE POLICY "Public can view questions for active surveys" ON survey_questions FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM surveys 
            WHERE surveys.id = survey_questions.survey_id 
            AND surveys.status = 'active'
        )
    );

CREATE POLICY "Survey creators can manage questions" ON survey_questions 
    USING (
        EXISTS (
            SELECT 1 FROM surveys 
            WHERE surveys.id = survey_questions.survey_id 
            AND surveys.created_by = auth.uid()
        )
    );

CREATE POLICY "Admin can do everything on survey questions" ON survey_questions 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@civicsense.app'
        )
    );

-- Survey responses policies
CREATE POLICY "Users can insert their own responses" ON survey_responses FOR INSERT 
    WITH CHECK (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR 
        (auth.uid() IS NULL AND guest_token IS NOT NULL)
    );

CREATE POLICY "Users can view and update their own responses" ON survey_responses 
    USING (
        user_id = auth.uid() OR 
        (auth.uid() IS NULL AND guest_token IS NOT NULL)
    );

CREATE POLICY "Survey creators can view responses to their surveys" ON survey_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM surveys 
            WHERE surveys.id = survey_responses.survey_id 
            AND surveys.created_by = auth.uid()
        )
    );

CREATE POLICY "Admin can view all responses" ON survey_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@civicsense.app'
        )
    );

-- Survey answers policies
CREATE POLICY "Users can insert answers for their responses" ON survey_answers FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM survey_responses 
            WHERE survey_responses.id = survey_answers.response_id 
            AND (
                survey_responses.user_id = auth.uid() OR 
                (auth.uid() IS NULL AND survey_responses.guest_token IS NOT NULL)
            )
        )
    );

CREATE POLICY "Users can view and update their own answers" ON survey_answers 
    USING (
        EXISTS (
            SELECT 1 FROM survey_responses 
            WHERE survey_responses.id = survey_answers.response_id 
            AND (
                survey_responses.user_id = auth.uid() OR 
                (auth.uid() IS NULL AND survey_responses.guest_token IS NOT NULL)
            )
        )
    );

CREATE POLICY "Survey creators can view answers to their surveys" ON survey_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM survey_responses sr
            JOIN surveys s ON s.id = sr.survey_id
            WHERE sr.id = survey_answers.response_id 
            AND s.created_by = auth.uid()
        )
    );

CREATE POLICY "Admin can view all answers" ON survey_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@civicsense.app'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_responses_updated_at BEFORE UPDATE ON survey_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for easier querying
CREATE OR REPLACE VIEW survey_summary AS
SELECT 
    s.id,
    s.title,
    s.description,
    s.status,
    s.allow_anonymous,
    s.allow_partial_responses,
    s.estimated_time,
    s.created_at,
    s.published_at,
    COUNT(DISTINCT sq.id) as question_count,
    COUNT(DISTINCT sr.id) as total_responses,
    COUNT(DISTINCT CASE WHEN sr.is_complete THEN sr.id END) as completed_responses,
    COUNT(DISTINCT CASE WHEN sr.user_id IS NOT NULL THEN sr.id END) as authenticated_responses,
    COUNT(DISTINCT CASE WHEN sr.guest_token IS NOT NULL THEN sr.id END) as anonymous_responses
FROM surveys s
LEFT JOIN survey_questions sq ON s.id = sq.survey_id
LEFT JOIN survey_responses sr ON s.id = sr.survey_id
GROUP BY s.id, s.title, s.description, s.status, s.allow_anonymous, 
         s.allow_partial_responses, s.estimated_time, s.created_at, s.published_at;

-- Seed with the example CivicSense Alpha User Research Survey
INSERT INTO surveys (
    id,
    title, 
    description, 
    status, 
    allow_anonymous, 
    allow_partial_responses, 
    estimated_time
) VALUES (
    'alpha-user-research-2025',
    'CivicSense Alpha User Research Survey',
    'Help us understand current civic engagement patterns, content preferences, and test our core value propositions for product-market fit.',
    'active',
    true,
    true,
    15
) ON CONFLICT (id) DO NOTHING;

-- Add some example questions from the survey
INSERT INTO survey_questions (survey_id, question_order, question_type, question_text, required, options) VALUES
-- Demographics
('alpha-user-research-2025', 1, 'multiple_choice', 'Age Range', true, '["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]'),
('alpha-user-research-2025', 2, 'multiple_choice', 'Highest Level of Education', true, '["High school or equivalent", "Some college", "Bachelor''s degree", "Graduate degree", "Trade/vocational school"]'),
('alpha-user-research-2025', 3, 'multiple_choice', 'How would you describe your political identity?', false, '["Very liberal", "Somewhat liberal", "Moderate/Independent", "Somewhat conservative", "Very conservative", "Other/Prefer not to say"]'),
('alpha-user-research-2025', 4, 'multiple_choice', 'Which best describes where you live?', true, '["Urban area (city center)", "Suburban area", "Rural area", "Small town"]'),
('alpha-user-research-2025', 5, 'multiple_choice', 'Employment Status', true, '["Full-time employed", "Part-time employed", "Student", "Retired", "Unemployed/seeking work", "Self-employed"]'),

-- Civic Knowledge & Confidence
('alpha-user-research-2025', 6, 'scale', 'How confident do you feel about your understanding of how the U.S. government works?', true, '{"min": 1, "max": 5, "labels": {"min": "Not confident at all", "max": "Very confident"}}'),
('alpha-user-research-2025', 7, 'multiple_select', 'Which of these can you name without looking them up? (Select all that apply)', true, '["Your U.S. Representative", "Your U.S. Senators (both)", "Your state governor", "Your mayor or local chief executive", "Your state representative/assembly member", "None of the above"]'),
('alpha-user-research-2025', 8, 'multiple_choice', 'How often do you feel confused or overwhelmed by political news?', true, '["Almost always", "Often", "Sometimes", "Rarely", "Never"]'),
('alpha-user-research-2025', 9, 'textarea', 'When you see a political news story that seems important, what''s your biggest challenge in understanding it?', false, null),
('alpha-user-research-2025', 10, 'scale', 'How confident are you in your ability to tell reliable news from misinformation?', true, '{"min": 1, "max": 5, "labels": {"min": "Not confident at all", "max": "Very confident"}}')

ON CONFLICT (survey_id, question_order) DO NOTHING;

COMMIT; 