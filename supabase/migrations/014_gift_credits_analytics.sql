-- Migration: Gift Credits Analytics and Detailed Tracking
-- Adds comprehensive analytics and tracking for gift credit owners

-- 1. ENHANCED FUNCTION TO GET DETAILED GIFT CREDITS WITH CLAIMS
CREATE OR REPLACE FUNCTION get_detailed_gift_credits(p_user_id UUID)
RETURNS TABLE(
    -- Gift Credits Info
    credit_id UUID,
    credit_type VARCHAR(20),
    credits_available INTEGER,
    credits_used INTEGER,
    source_donation_amount INTEGER,
    source_stripe_session_id VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE,
    
    -- Individual Claims (as JSON array)
    individual_claims JSONB,
    
    -- Shareable Links (as JSON array)
    shareable_links JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gc.id as credit_id,
        gc.credit_type,
        gc.credits_available,
        gc.credits_used,
        gc.source_donation_amount,
        gc.source_stripe_session_id,
        gc.created_at,
        
        -- Get individual gift redemptions for this credit batch
        COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'id', gr.id,
                    'recipient_email', gr.recipient_email,
                    'access_type', gr.access_type,
                    'gift_message', gr.gift_message,
                    'redemption_status', gr.redemption_status,
                    'redemption_code', gr.redemption_code,
                    'expires_at', gr.expires_at,
                    'claimed_at', gr.claimed_at,
                    'created_at', gr.created_at
                ) ORDER BY gr.created_at DESC
            )
            FROM gift_redemptions gr
            JOIN gift_credits gc_inner ON gr.gift_credit_id = gc_inner.id
            WHERE gc_inner.donor_user_id = p_user_id 
            AND gc_inner.id = gc.id
            AND gc_inner.credit_type = gc.credit_type
            AND gc_inner.source_stripe_session_id = gc.source_stripe_session_id),
            '[]'::json
        )::jsonb as individual_claims,
        
        -- Get shareable links created from this credit batch
        COALESCE(
            (SELECT json_agg(
                json_build_object(
                    'id', sl.id,
                    'link_code', sl.link_code,
                    'title', sl.title,
                    'message', sl.message,
                    'access_type', sl.access_type,
                    'total_credits', sl.total_credits,
                    'used_credits', sl.used_credits,
                    'available_credits', (sl.total_credits - sl.used_credits),
                    'expires_at', sl.expires_at,
                    'is_active', sl.is_active,
                    'created_at', sl.created_at,
                    'claims', COALESCE(claims_data.claims, '[]'::json)
                ) ORDER BY sl.created_at DESC
            )
            FROM shareable_gift_links sl
            LEFT JOIN (
                SELECT 
                    slc.shareable_link_id,
                    json_agg(
                        json_build_object(
                            'claimer_email', slc.claimer_email,
                            'access_type', slc.access_type,
                            'claimed_at', slc.claimed_at,
                            'ip_address', slc.ip_address
                        ) ORDER BY slc.claimed_at DESC
                    ) as claims
                FROM shareable_link_claims slc
                GROUP BY slc.shareable_link_id
            ) claims_data ON sl.id = claims_data.shareable_link_id
            WHERE sl.donor_user_id = p_user_id 
            AND sl.access_type = gc.credit_type
            AND sl.source_stripe_session_id = gc.source_stripe_session_id),
            '[]'::json
        )::jsonb as shareable_links
        
    FROM gift_credits gc
    WHERE gc.donor_user_id = p_user_id
    ORDER BY gc.created_at DESC, gc.credit_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNCTION TO GET GIFT ANALYTICS SUMMARY
CREATE OR REPLACE FUNCTION get_gift_analytics_summary(p_user_id UUID)
RETURNS TABLE(
    total_donated_amount INTEGER,
    total_gift_credits_earned INTEGER,
    total_gift_credits_used INTEGER,
    total_people_helped INTEGER,
    unique_emails_helped INTEGER,
    active_shareable_links INTEGER,
    expired_shareable_links INTEGER,
    pending_individual_gifts INTEGER,
    claimed_individual_gifts INTEGER,
    most_recent_claim_date TIMESTAMP WITH TIME ZONE,
    conversion_rate REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Total donation amount that generated gift credits
        COALESCE(SUM(DISTINCT gc.source_donation_amount), 0)::INTEGER as total_donated_amount,
        
        -- Total gift credits earned and used
        COALESCE(SUM(gc.credits_available), 0)::INTEGER as total_gift_credits_earned,
        COALESCE(SUM(gc.credits_used), 0)::INTEGER as total_gift_credits_used,
        
        -- Total people helped (individual + shareable link claims)
        (
            COALESCE((SELECT COUNT(*) FROM gift_redemptions gr 
                     JOIN gift_credits gc_inner ON gr.gift_credit_id = gc_inner.id 
                     WHERE gc_inner.donor_user_id = p_user_id), 0) +
            COALESCE((SELECT COUNT(*) FROM shareable_link_claims slc 
                     JOIN shareable_gift_links sl ON slc.shareable_link_id = sl.id 
                     WHERE sl.donor_user_id = p_user_id), 0)
        )::INTEGER as total_people_helped,
        
        -- Unique emails helped
        (
            SELECT COUNT(DISTINCT email) FROM (
                SELECT gr.recipient_email as email
                FROM gift_redemptions gr 
                JOIN gift_credits gc_inner ON gr.gift_credit_id = gc_inner.id 
                WHERE gc_inner.donor_user_id = p_user_id
                UNION
                SELECT slc.claimer_email as email
                FROM shareable_link_claims slc 
                JOIN shareable_gift_links sl ON slc.shareable_link_id = sl.id 
                WHERE sl.donor_user_id = p_user_id
            ) unique_emails
        )::INTEGER as unique_emails_helped,
        
        -- Shareable links status
        COALESCE((SELECT COUNT(*) FROM shareable_gift_links sl 
                 WHERE sl.donor_user_id = p_user_id AND sl.is_active = true AND sl.expires_at > NOW()), 0)::INTEGER as active_shareable_links,
        COALESCE((SELECT COUNT(*) FROM shareable_gift_links sl 
                 WHERE sl.donor_user_id = p_user_id AND (sl.is_active = false OR sl.expires_at <= NOW())), 0)::INTEGER as expired_shareable_links,
        
        -- Individual gifts status
        COALESCE((SELECT COUNT(*) FROM gift_redemptions gr 
                 JOIN gift_credits gc_inner ON gr.gift_credit_id = gc_inner.id 
                 WHERE gc_inner.donor_user_id = p_user_id AND gr.redemption_status = 'pending'), 0)::INTEGER as pending_individual_gifts,
        COALESCE((SELECT COUNT(*) FROM gift_redemptions gr 
                 JOIN gift_credits gc_inner ON gr.gift_credit_id = gc_inner.id 
                 WHERE gc_inner.donor_user_id = p_user_id AND gr.redemption_status = 'claimed'), 0)::INTEGER as claimed_individual_gifts,
        
        -- Most recent claim
        (
            SELECT MAX(claim_date) FROM (
                SELECT MAX(gr.claimed_at) as claim_date
                FROM gift_redemptions gr 
                JOIN gift_credits gc_inner ON gr.gift_credit_id = gc_inner.id 
                WHERE gc_inner.donor_user_id = p_user_id AND gr.redemption_status = 'claimed'
                UNION ALL
                SELECT MAX(slc.claimed_at) as claim_date
                FROM shareable_link_claims slc 
                JOIN shareable_gift_links sl ON slc.shareable_link_id = sl.id 
                WHERE sl.donor_user_id = p_user_id
            ) all_claims
        ) as most_recent_claim_date,
        
        -- Conversion rate (credits used / credits available)
        CASE 
            WHEN COALESCE(SUM(gc.credits_available), 0) > 0 
            THEN (COALESCE(SUM(gc.credits_used), 0)::REAL / COALESCE(SUM(gc.credits_available), 1)::REAL)
            ELSE 0::REAL
        END as conversion_rate
        
    FROM gift_credits gc
    WHERE gc.donor_user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNCTION TO GET ALL PEOPLE HELPED BY A DONOR
CREATE OR REPLACE FUNCTION get_people_helped_by_donor(p_user_id UUID)
RETURNS TABLE(
    email VARCHAR(255),
    access_type VARCHAR(20),
    claim_method VARCHAR(20), -- 'individual' or 'shareable_link'
    claimed_at TIMESTAMP WITH TIME ZONE,
    gift_message TEXT,
    redemption_code VARCHAR(50),
    link_title VARCHAR(200),
    ip_address INET
) AS $$
BEGIN
    RETURN QUERY
    -- Individual gift redemptions
    SELECT 
        gr.recipient_email as email,
        gr.access_type,
        'individual'::VARCHAR(20) as claim_method,
        gr.claimed_at,
        gr.gift_message,
        gr.redemption_code,
        NULL::VARCHAR(200) as link_title,
        NULL::INET as ip_address
    FROM gift_redemptions gr
    JOIN gift_credits gc ON gr.gift_credit_id = gc.id
    WHERE gc.donor_user_id = p_user_id
    AND gr.redemption_status = 'claimed'
    
    UNION ALL
    
    -- Shareable link claims
    SELECT 
        slc.claimer_email as email,
        slc.access_type,
        'shareable_link'::VARCHAR(20) as claim_method,
        slc.claimed_at,
        sl.message as gift_message,
        sl.link_code as redemption_code,
        sl.title as link_title,
        slc.ip_address
    FROM shareable_link_claims slc
    JOIN shareable_gift_links sl ON slc.shareable_link_id = sl.id
    WHERE sl.donor_user_id = p_user_id
    
    ORDER BY claimed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. UPDATE SHAREABLE LINKS TO TRACK SOURCE
-- Add source tracking to shareable links for better analytics
ALTER TABLE shareable_gift_links 
ADD COLUMN IF NOT EXISTS source_donation_amount INTEGER,
ADD COLUMN IF NOT EXISTS source_stripe_session_id VARCHAR(200);

-- Update existing shareable links to link them to their source donations
-- This will be done through the application when creating new links

-- 5. ADD INDEXES FOR ANALYTICS PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_gift_credits_donor_source ON gift_credits(donor_user_id, source_stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_gift_redemptions_claimed_at ON gift_redemptions(claimed_at) WHERE redemption_status = 'claimed';
CREATE INDEX IF NOT EXISTS idx_shareable_link_claims_claimed_at ON shareable_link_claims(claimed_at);

-- 6. COMMENTS FOR DOCUMENTATION
COMMENT ON FUNCTION get_detailed_gift_credits(UUID) IS 'Gets comprehensive gift credits data including all claims and shareable links';
COMMENT ON FUNCTION get_gift_analytics_summary(UUID) IS 'Gets high-level analytics summary for a donor''s gift credits';
COMMENT ON FUNCTION get_people_helped_by_donor(UUID) IS 'Gets list of all people who claimed gifts from a specific donor'; 