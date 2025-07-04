-- Example database schema for CivicSense content translation
-- This shows the expected structure for the translation script to work

-- Main content tables
CREATE TABLE categories (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE question_topics (
  topic_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(category_id),
  topic_title TEXT NOT NULL,
  description TEXT,
  why_this_matters TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE questions (
  question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES question_topics(topic_id),
  question_text TEXT NOT NULL,
  explanation TEXT,
  difficulty_level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Translation tables (these store the translated content)
CREATE TABLE category_translations (
  category_id UUID REFERENCES categories(category_id),
  language_code TEXT NOT NULL,
  category_name TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (category_id, language_code)
);

CREATE TABLE topic_translations (
  topic_id UUID REFERENCES question_topics(topic_id),
  language_code TEXT NOT NULL,
  topic_title TEXT,
  description TEXT,
  why_this_matters TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (topic_id, language_code)
);

CREATE TABLE question_translations (
  question_id UUID REFERENCES questions(question_id),
  language_code TEXT NOT NULL,
  question_text TEXT,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (question_id, language_code)
);

-- Indexes for better performance
CREATE INDEX idx_category_translations_language ON category_translations(language_code);
CREATE INDEX idx_topic_translations_language ON topic_translations(language_code);
CREATE INDEX idx_question_translations_language ON question_translations(language_code);

-- Example data
INSERT INTO categories (category_name, description) VALUES 
('Government Structure', 'Understanding how government institutions are organized and function'),
('Voting Rights', 'Knowledge about electoral processes and citizen participation'),
('Civil Liberties', 'Understanding fundamental rights and freedoms');

INSERT INTO question_topics (category_id, topic_title, description, why_this_matters) VALUES 
((SELECT category_id FROM categories WHERE category_name = 'Government Structure'), 
 'How Congress Works', 
 'Learn about the legislative branch and how laws are made',
 'Understanding Congress helps you know how to influence policy and hold representatives accountable');

INSERT INTO questions (topic_id, question_text, explanation) VALUES 
((SELECT topic_id FROM question_topics WHERE topic_title = 'How Congress Works'),
 'How many senators does each state have?',
 'Each state has exactly 2 senators, regardless of population size. This ensures equal representation for all states in the Senate.'); 