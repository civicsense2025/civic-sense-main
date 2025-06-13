-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create question_topics table
CREATE TABLE question_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id VARCHAR(100) UNIQUE NOT NULL,
    topic_title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    why_this_matters TEXT NOT NULL, -- HTML content explaining relevance
    emoji VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    day_of_week VARCHAR(10) NOT NULL,
    categories JSONB NOT NULL DEFAULT '[]', -- Array of category strings
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id VARCHAR(100) NOT NULL REFERENCES question_topics(topic_id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
    category VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_answer TEXT NOT NULL,
    hint TEXT NOT NULL,
    explanation TEXT NOT NULL,
    tags JSONB DEFAULT '[]', -- Array of tag strings
    sources JSONB DEFAULT '[]', -- Array of {name, url} objects
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique question numbers per topic
    UNIQUE(topic_id, question_number)
);

-- Create categories table for reference
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_quiz_attempts table for tracking progress
CREATE TABLE user_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References auth.users
    topic_id VARCHAR(100) NOT NULL REFERENCES question_topics(topic_id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    score INTEGER, -- Percentage score (0-100)
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER DEFAULT 0,
    time_spent_seconds INTEGER, -- Total time in seconds
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_question_responses table for detailed tracking
CREATE TABLE user_question_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES user_quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    hint_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one response per question per attempt
    UNIQUE(attempt_id, question_id)
);

-- Create user_progress table for streak tracking
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL, -- References auth.users
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    total_quizzes_completed INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    favorite_categories JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_questions_topic_id ON questions(topic_id);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX idx_user_quiz_attempts_user_id ON user_quiz_attempts(user_id);
CREATE INDEX idx_user_quiz_attempts_topic_id ON user_quiz_attempts(topic_id);
CREATE INDEX idx_user_quiz_attempts_completed ON user_quiz_attempts(user_id, completed_at) WHERE is_completed = true;
CREATE INDEX idx_user_question_responses_attempt_id ON user_question_responses(attempt_id);
CREATE INDEX idx_question_topics_date ON question_topics(date);
CREATE INDEX idx_question_topics_active ON question_topics(is_active) WHERE is_active = true;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_question_topics_updated_at BEFORE UPDATE ON question_topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, emoji, description, display_order) VALUES
('Government', '🏛️', 'Federal, state, and local government structures and processes', 1),
('Elections', '🗳️', 'Electoral systems, voting rights, and campaign processes', 2),
('Economy', '💰', 'Economic policy, taxation, and financial systems', 3),
('Foreign Policy', '🌐', 'International relations and diplomatic affairs', 4),
('Justice', '⚖️', 'Legal system, courts, and law enforcement', 5),
('Civil Rights', '✊', 'Individual rights and civil liberties', 6),
('Environment', '🌱', 'Environmental policy and sustainability', 7),
('Local Issues', '🏙️', 'Community governance and local civic engagement', 8),
('Constitutional Law', '📜', 'Constitutional principles and interpretation', 9),
('National Security', '🛡️', 'Defense, security, and public safety', 10),
('Public Policy', '📋', 'Policy analysis and implementation', 11),
('Historical Precedent', '📚', 'Historical context and precedents', 12),
('Civic Action', '🤝', 'Community engagement and civic participation', 13),
('Electoral Systems', '📊', 'Voting systems and electoral processes', 14),
('Legislative Process', '🏛️', 'How laws are made and implemented', 15),
('Judicial Review', '⚖️', 'Court review of laws and executive actions', 16),
('Policy Analysis', '🔍', 'Analyzing and evaluating public policies', 17),
('Civic Participation', '🗣️', 'Ways citizens can engage in democracy', 18); 