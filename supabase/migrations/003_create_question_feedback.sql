-- Create question_feedback table for user ratings and reports
CREATE TABLE question_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- References auth.users
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('rating', 'report')),
    
    -- Rating fields (for thumbs up/down)
    rating VARCHAR(10) CHECK (rating IN ('up', 'down') OR rating IS NULL),
    
    -- Report fields (for quality issues)
    report_reason VARCHAR(50) CHECK (
        report_reason IN (
            'incorrect_answer', 
            'unclear_question', 
            'outdated_information', 
            'inappropriate_content',
            'technical_error',
            'poor_explanation',
            'broken_source_link',
            'other'
        ) OR report_reason IS NULL
    ),
    report_details TEXT, -- Optional detailed explanation
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one feedback per user per question per type
    UNIQUE(question_id, user_id, feedback_type)
);

-- Create indexes for performance
CREATE INDEX idx_question_feedback_question_id ON question_feedback(question_id);
CREATE INDEX idx_question_feedback_user_id ON question_feedback(user_id);
CREATE INDEX idx_question_feedback_type ON question_feedback(feedback_type);
CREATE INDEX idx_question_feedback_rating ON question_feedback(rating) WHERE rating IS NOT NULL;
CREATE INDEX idx_question_feedback_report_reason ON question_feedback(report_reason) WHERE report_reason IS NOT NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_question_feedback_updated_at 
    BEFORE UPDATE ON question_feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for question feedback statistics
CREATE VIEW question_feedback_stats AS
SELECT 
    q.id as question_id,
    q.topic_id,
    q.question_number,
    q.category,
    
    -- Rating statistics
    COUNT(CASE WHEN qf.rating = 'up' THEN 1 END) as thumbs_up_count,
    COUNT(CASE WHEN qf.rating = 'down' THEN 1 END) as thumbs_down_count,
    COUNT(CASE WHEN qf.rating IS NOT NULL THEN 1 END) as total_ratings,
    
    -- Calculate rating percentage (thumbs up / total ratings)
    CASE 
        WHEN COUNT(CASE WHEN qf.rating IS NOT NULL THEN 1 END) > 0 
        THEN ROUND(
            (COUNT(CASE WHEN qf.rating = 'up' THEN 1 END)::DECIMAL / 
             COUNT(CASE WHEN qf.rating IS NOT NULL THEN 1 END)) * 100, 
            1
        )
        ELSE NULL 
    END as rating_percentage,
    
    -- Report statistics
    COUNT(CASE WHEN qf.feedback_type = 'report' THEN 1 END) as total_reports,
    
    -- Most common report reasons
    MODE() WITHIN GROUP (ORDER BY qf.report_reason) FILTER (WHERE qf.report_reason IS NOT NULL) as most_common_report_reason,
    
    -- Quality score (combination of ratings and reports)
    CASE 
        WHEN COUNT(CASE WHEN qf.rating IS NOT NULL THEN 1 END) > 0 
        THEN GREATEST(0, 
            (COUNT(CASE WHEN qf.rating = 'up' THEN 1 END)::DECIMAL / 
             COUNT(CASE WHEN qf.rating IS NOT NULL THEN 1 END)) * 100 - 
            (COUNT(CASE WHEN qf.feedback_type = 'report' THEN 1 END) * 10)
        )
        ELSE NULL 
    END as quality_score,
    
    -- Timestamps
    MAX(qf.created_at) as last_feedback_at
    
FROM questions q
LEFT JOIN question_feedback qf ON q.id = qf.question_id
WHERE q.is_active = true
GROUP BY q.id, q.topic_id, q.question_number, q.category;

-- Grant permissions for the view
GRANT SELECT ON question_feedback_stats TO authenticated;

-- Add some helpful comments
COMMENT ON TABLE question_feedback IS 'User feedback on quiz questions including ratings and quality reports';
COMMENT ON COLUMN question_feedback.feedback_type IS 'Type of feedback: rating (thumbs up/down) or report (quality issue)';
COMMENT ON COLUMN question_feedback.rating IS 'Thumbs up or down rating for the question';
COMMENT ON COLUMN question_feedback.report_reason IS 'Reason for reporting the question';
COMMENT ON COLUMN question_feedback.report_details IS 'Additional details about the report';
COMMENT ON VIEW question_feedback_stats IS 'Aggregated statistics for question feedback and quality metrics'; 