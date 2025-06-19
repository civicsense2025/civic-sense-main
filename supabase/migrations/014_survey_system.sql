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
        'likert',
        'matrix',
        'slider',
        'date',
        'email',
        'phone',
        'number',
        'dropdown',
        'image_choice',
        'file_upload',
        'rating_stars',
        'yes_no',
        'statement',
        'contact_info'
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
            AND auth.users.email = 'admin@civicsense.one'
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
            AND auth.users.email = 'admin@civicsense.one'
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
            AND auth.users.email = 'admin@civicsense.one'
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
            AND auth.users.email = 'admin@civicsense.one'
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
DO $$
DECLARE
    survey_uuid UUID;
BEGIN
    -- Insert survey and capture the generated UUID
    INSERT INTO surveys (
        title, 
        description, 
        status, 
        allow_anonymous, 
        allow_partial_responses, 
        estimated_time
    ) VALUES (
        'CivicSense Alpha User Research Survey',
        'Help us understand current civic engagement patterns, content preferences, and test our core value propositions for product-market fit.',
        'active',
        true,
        true,
        15
    ) RETURNING id INTO survey_uuid;

    -- Add all questions from the CivicSense Alpha User Research Survey
    INSERT INTO survey_questions (survey_id, question_order, question_type, question_text, description, required, options, scale_config) VALUES
    
    -- Demographics & Background (5 questions)
    (survey_uuid, 1, 'multiple_choice', 'Age Range', null, true, '["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]', null),
    (survey_uuid, 2, 'multiple_choice', 'Highest Level of Education', null, true, '["High school or equivalent", "Some college", "Bachelor''s degree", "Graduate degree", "Trade/vocational school"]', null),
    (survey_uuid, 3, 'multiple_choice', 'How would you describe your political identity?', null, false, '["Very liberal", "Somewhat liberal", "Moderate/Independent", "Somewhat conservative", "Very conservative", "Other/Prefer not to say"]', null),
    (survey_uuid, 4, 'multiple_choice', 'Which best describes where you live?', null, true, '["Urban area (city center)", "Suburban area", "Rural area", "Small town"]', null),
    (survey_uuid, 5, 'multiple_choice', 'Employment Status', null, true, '["Full-time employed", "Part-time employed", "Student", "Retired", "Unemployed/seeking work", "Self-employed"]', null),

    -- Current Civic Knowledge & Confidence (8 questions)
    (survey_uuid, 6, 'scale', 'How confident do you feel about your understanding of how the U.S. government works?', null, true, null, '{"min": 1, "max": 5, "labels": {"min": "Not confident at all", "max": "Very confident"}}'),
    (survey_uuid, 7, 'multiple_select', 'Which of these can you name without looking them up?', 'Select all that apply', true, '["Your U.S. Representative", "Your U.S. Senators (both)", "Your state governor", "Your mayor or local chief executive", "Your state representative/assembly member", "None of the above"]', null),
    (survey_uuid, 8, 'multiple_choice', 'How often do you feel confused or overwhelmed by political news?', null, true, '["Almost always", "Often", "Sometimes", "Rarely", "Never"]', null),
    (survey_uuid, 9, 'textarea', 'When you see a political news story that seems important, what''s your biggest challenge in understanding it?', null, false, null, null),
    (survey_uuid, 10, 'scale', 'How confident are you in your ability to tell reliable news from misinformation?', null, true, null, '{"min": 1, "max": 5, "labels": {"min": "Not confident at all", "max": "Very confident"}}'),
    (survey_uuid, 11, 'multiple_choice', 'Before the 2020 election, had you ever heard of the Electoral College?', null, true, '["Yes, and I understood how it works", "Yes, but I didn''t really understand it", "I had heard of it but knew very little", "No, I had never heard of it"]', null),
    (survey_uuid, 12, 'textarea', 'If a friend asked you to explain how a bill becomes a law, how would you describe it in 2-3 sentences?', null, false, null, null),
    (survey_uuid, 13, 'multiple_choice', 'Which statement best describes your feelings about politics and government?', null, true, '["I''m engaged and feel like I understand what''s happening", "I want to be more engaged but feel overwhelmed by complexity", "I pay attention but often feel confused by what I''m seeing", "I try to avoid political news because it''s too stressful", "I don''t think my involvement matters much anyway"]', null),

    -- News Consumption & Information Habits (10 questions)
    (survey_uuid, 14, 'multiple_choice', 'How often do you actively seek out news about politics or government?', null, true, '["Multiple times per day", "Daily", "A few times per week", "Weekly", "Rarely", "Never"]', null),
    (survey_uuid, 15, 'multiple_select', 'What are your primary sources for political news?', 'Select up to 3', true, '["Traditional TV news (CNN, Fox, MSNBC, etc.)", "Local TV news", "Newspapers (online or print)", "Social media feeds (Facebook, Twitter, Instagram)", "News podcasts", "News websites directly", "Radio news", "Friends and family", "Other"]', '{"max_selections": 3}'),
    (survey_uuid, 16, 'textarea', 'When you see political news on social media, how do you decide whether to trust it?', null, false, null, null),
    (survey_uuid, 17, 'multiple_choice', 'How often do you fact-check news stories you see on social media?', null, true, '["Always", "Often", "Sometimes", "Rarely", "Never"]', null),
    (survey_uuid, 18, 'multiple_choice', 'Have you ever shared a news story on social media that you later found out was misleading or false?', null, true, '["Yes, multiple times", "Yes, once or twice", "Not that I know of", "No, I don''t share news on social media"]', null),
    (survey_uuid, 19, 'multiple_select', 'When you disagree with a political news story, what do you usually do?', 'Select all that apply', true, '["Look for other sources to confirm or contradict it", "Dismiss it as biased", "Share it with friends to get their opinions", "Look up the original source or documents", "Ignore it and move on", "Other"]', null),
    (survey_uuid, 20, 'textarea', 'Describe a recent time when you felt like you didn''t have enough context to understand an important political story.', null, false, null, null),
    (survey_uuid, 21, 'matrix', 'How much do you trust these institutions to provide accurate information?', null, true, '["Traditional news media", "Social media platforms", "Government officials", "Academic experts", "Fact-checking websites"]', '{"scale": {"min": 1, "max": 5, "labels": {"min": "No trust", "max": "Complete trust"}}}'),
    (survey_uuid, 22, 'ranking', 'Which format would you prefer for learning about complex political topics?', 'Rank your top 3 preferences', true, '["Short videos (2-3 minutes)", "Interactive quizzes with explanations", "Detailed articles with examples", "Infographics and visual summaries", "Podcasts or audio explanations", "Discussion with others", "Step-by-step guides"]', '{"max_rankings": 3}'),
    (survey_uuid, 23, 'textarea', 'What''s the most confusing thing about how news is covered today?', null, false, null, null),

    -- Civic Engagement & Barriers (7 questions)
    (survey_uuid, 24, 'multiple_select', 'Which civic activities have you done in the past two years?', 'Select all that apply', true, '["Voted in a presidential election", "Voted in local elections (mayor, city council, school board)", "Contacted an elected official", "Attended a town hall or public meeting", "Volunteered for a political campaign", "Participated in a protest or demonstration", "Signed a petition", "Donated to a political cause or candidate", "None of the above"]', null),
    (survey_uuid, 25, 'multiple_select', 'What prevents you from being more involved in politics/government?', 'Select up to 3', true, '["Don''t have enough time", "Don''t understand the issues well enough", "Don''t know how to get involved", "Don''t think my voice matters", "Too much conflicting information", "Politics is too toxic/divisive", "Don''t trust politicians or institutions", "Other"]', '{"max_selections": 3}'),
    (survey_uuid, 26, 'textarea', 'If you could ask one question to your local mayor or city council member, what would it be?', null, false, null, null),
    (survey_uuid, 27, 'scale', 'How important is it to you that other people in your community are informed about politics and government?', null, true, null, '{"min": 1, "max": 5, "labels": {"min": "Not important", "max": "Very important"}}'),
    (survey_uuid, 28, 'multiple_choice', 'Have you ever decided NOT to vote because you felt uninformed about the candidates or issues?', null, true, '["Yes, multiple times", "Yes, once or twice", "No, I vote regardless", "No, I always research before voting", "I don''t vote for other reasons"]', null),
    (survey_uuid, 29, 'textarea', 'What would make you feel more confident about participating in local government (attending meetings, contacting officials, etc.)?', null, false, null, null),
    (survey_uuid, 30, 'multiple_choice', 'If there was an app that made it easier to understand politics and government, what would be the most important feature?', null, true, '["Explanations of current events with historical context", "Guides for how to contact representatives about issues you care about", "Unbiased summaries of different political positions", "Interactive lessons about how government works", "Tools to fact-check news and information", "Other"]', null),

    -- Values & Motivations (6 questions)
    (survey_uuid, 31, 'textarea', 'What does "good citizenship" mean to you?', null, false, null, null),
    (survey_uuid, 32, 'scale', 'How much do you agree with this statement: "People like me can have a real impact on politics and government"?', null, true, null, '{"min": 1, "max": 5, "labels": {"min": "Strongly disagree", "max": "Strongly agree"}}'),
    (survey_uuid, 33, 'multiple_select', 'Which of these concerns you most about the current state of democracy?', 'Select top 2', true, '["Too much misinformation and people can''t agree on basic facts", "People don''t understand how government actually works", "Too much money in politics", "Politicians don''t represent ordinary people''s interests", "Social media is making political divisions worse", "People have stopped listening to different viewpoints", "Voter suppression and election security", "Other"]', '{"max_selections": 2}'),
    (survey_uuid, 34, 'textarea', 'What gives you hope about the future of democracy in America?', null, false, null, null),
    (survey_uuid, 35, 'scale', 'How important is it that political education be non-partisan?', null, true, null, '{"min": 1, "max": 5, "labels": {"min": "Not important", "max": "Very important"}}'),
    (survey_uuid, 36, 'textarea', 'If you could change one thing about how Americans learn about politics and government, what would it be?', null, false, null, null),

    -- Product Testing & Validation (8 questions)
    (survey_uuid, 37, 'scale', 'How interested would you be in a platform that helps you understand current political events by connecting them to how government actually works?', null, true, null, '{"min": 1, "max": 5, "labels": {"min": "Not interested", "max": "Very interested"}}'),
    (survey_uuid, 38, 'statement', 'Next, you''ll see a sample CivicSense quiz question. Please review it carefully before rating.', null, false, null, null),
    (survey_uuid, 39, 'scale', 'After reviewing that sample question, how would you rate it?', null, true, null, '{"min": 1, "max": 5, "labels": {"min": "Unhelpful", "max": "Very helpful"}}'),
    (survey_uuid, 40, 'multiple_choice', 'What did you like most about that quiz question format?', null, true, '["The explanation connected current events to bigger principles", "It tested understanding, not just memorization", "The wrong answers helped me learn too", "It gave me specific sources to learn more", "Other"]', null),
    (survey_uuid, 41, 'multiple_choice', 'How often would you use a civic education app if it existed?', null, true, '["Daily", "A few times per week", "Weekly", "Monthly", "Only during election seasons", "Probably never"]', null),
    (survey_uuid, 42, 'textarea', 'What would make you recommend a civic education platform to friends?', null, false, null, null),
    (survey_uuid, 43, 'multiple_choice', 'Which statement best describes what you want from political/civic education?', null, true, '["Help me understand current events better", "Teach me how government and politics actually work", "Give me skills to evaluate news and information", "Show me how to get involved and make a difference", "Help me have better political conversations with others", "All of the above"]', null),
    (survey_uuid, 44, 'textarea', 'What''s your biggest worry about using an app focused on politics and government?', null, false, null, null),
    (survey_uuid, 45, 'multiple_choice', 'How likely would you be to pay for a high-quality civic education platform?', null, true, '["Very likely", "Somewhat likely", "Unsure", "Probably not", "Definitely not"]', null),

    -- Final Questions (2 questions)
    (survey_uuid, 46, 'textarea', 'What''s one thing you wish you understood better about American politics or government?', null, false, null, null),
    (survey_uuid, 47, 'textarea', 'Any other thoughts about civic education, news consumption, or political engagement you''d like to share?', null, false, null, null);
    
    -- Log the created survey ID for reference
    RAISE NOTICE 'Created survey with ID: %', survey_uuid;
END $$;

COMMIT; 