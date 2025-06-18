-- Migration: Shareable Gift Links System
-- Allows donors to create shareable links that anyone can use to claim gift access

-- 1. SHAREABLE GIFT LINKS TABLE
-- Tracks shareable links that can be used by multiple people until credits run out
CREATE TABLE shareable_gift_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    link_code VARCHAR(50) UNIQUE NOT NULL,
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('annual', 'lifetime')),
    total_credits INTEGER NOT NULL DEFAULT 0,
    used_credits INTEGER NOT NULL DEFAULT 0,
    
    -- Link configuration
    title VARCHAR(200) DEFAULT 'CivicSense Access Gift',
    message TEXT,
    custom_slug VARCHAR(50), -- Optional custom ending for the link
    
    -- Expiration and limits
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days'),
    max_uses_per_email INTEGER DEFAULT 1, -- Prevent same email from claiming multiple times
    is_active BOOLEAN DEFAULT true,
    
    -- Source tracking
    source_donation_amount INTEGER, -- Amount in cents that generated these credits
    source_stripe_session_id VARCHAR(200), -- Reference to original Stripe session
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_credits CHECK (total_credits >= 0),
    CONSTRAINT valid_usage CHECK (used_credits <= total_credits)
);

-- 2. SHAREABLE LINK CLAIMS TABLE
-- Tracks who has claimed access from shareable links
CREATE TABLE shareable_link_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shareable_link_id UUID NOT NULL REFERENCES shareable_gift_links(id) ON DELETE CASCADE,
    claimer_email VARCHAR(255) NOT NULL,
    claimer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('annual', 'lifetime')),
    
    -- Claim tracking
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET, -- Track IP for abuse prevention
    user_agent TEXT, -- Track user agent for analytics
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(shareable_link_id, claimer_email) -- Prevent same email from claiming multiple times from same link
);

-- 3. FUNCTION TO CREATE SHAREABLE GIFT LINK
CREATE OR REPLACE FUNCTION create_shareable_gift_link(
    p_donor_user_id UUID,
    p_access_type VARCHAR(20),
    p_credits_to_use INTEGER,
    p_title VARCHAR(200) DEFAULT NULL,
    p_message TEXT DEFAULT NULL,
    p_custom_slug VARCHAR(50) DEFAULT NULL
) RETURNS TABLE(
    link_id UUID,
    link_code VARCHAR(50),
    success BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    available_credits INTEGER;
    new_link_id UUID;
    new_link_code VARCHAR(50);
    base_code VARCHAR(20);
    final_code VARCHAR(50);
BEGIN
    -- Check if donor has enough available credits of the requested type
    SELECT COALESCE(SUM(gc.credits_available - gc.credits_used), 0) 
    INTO available_credits
    FROM gift_credits gc
    WHERE gc.donor_user_id = p_donor_user_id 
    AND gc.credit_type = p_access_type;
    
    IF available_credits < p_credits_to_use THEN
        RETURN QUERY SELECT 
            NULL::UUID,
            NULL::VARCHAR(50),
            false,
            ('Insufficient ' || p_access_type || ' credits. Available: ' || available_credits || ', Requested: ' || p_credits_to_use)::TEXT;
        RETURN;
    END IF;
    
    -- Generate unique link code
    base_code := 'SHARE-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8));
    
    -- Add custom slug if provided
    IF p_custom_slug IS NOT NULL AND p_custom_slug != '' THEN
        final_code := base_code || '-' || UPPER(REGEXP_REPLACE(p_custom_slug, '[^A-Za-z0-9]', '', 'g'));
    ELSE
        final_code := base_code;
    END IF;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM shareable_gift_links WHERE link_code = final_code) LOOP
        base_code := 'SHARE-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8));
        IF p_custom_slug IS NOT NULL AND p_custom_slug != '' THEN
            final_code := base_code || '-' || UPPER(REGEXP_REPLACE(p_custom_slug, '[^A-Za-z0-9]', '', 'g'));
        ELSE
            final_code := base_code;
        END IF;
    END LOOP;
    
    -- Create shareable link record
    INSERT INTO shareable_gift_links (
        donor_user_id,
        link_code,
        access_type,
        total_credits,
        title,
        message,
        custom_slug
    ) VALUES (
        p_donor_user_id,
        final_code,
        p_access_type,
        p_credits_to_use,
        COALESCE(p_title, 'CivicSense Access Gift'),
        p_message,
        p_custom_slug
    ) RETURNING id INTO new_link_id;
    
    -- Deduct credits from user's gift credits (oldest first)
    DECLARE
        credits_remaining INTEGER := p_credits_to_use;
        gift_credit_record RECORD;
    BEGIN
        FOR gift_credit_record IN 
            SELECT id, credits_available, credits_used 
            FROM gift_credits 
            WHERE donor_user_id = p_donor_user_id 
            AND credit_type = p_access_type
            AND (credits_available - credits_used) > 0
            ORDER BY created_at ASC
        LOOP
            DECLARE
                available_in_record INTEGER := gift_credit_record.credits_available - gift_credit_record.credits_used;
                to_deduct INTEGER := LEAST(available_in_record, credits_remaining);
            BEGIN
                UPDATE gift_credits 
                SET credits_used = credits_used + to_deduct,
                    updated_at = NOW()
                WHERE id = gift_credit_record.id;
                
                credits_remaining := credits_remaining - to_deduct;
                
                EXIT WHEN credits_remaining <= 0;
            END;
        END LOOP;
    END;
    
    RETURN QUERY SELECT 
        new_link_id,
        final_code,
        true,
        'Shareable link created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNCTION TO CLAIM FROM SHAREABLE LINK
CREATE OR REPLACE FUNCTION claim_shareable_gift_link(
    p_link_code VARCHAR(50),
    p_claimer_email VARCHAR(255),
    p_claimer_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS TABLE(
    success BOOLEAN,
    access_type VARCHAR(20),
    message TEXT,
    subscription_created BOOLEAN
) AS $$
DECLARE
    link_record RECORD;
    subscription_end_date TIMESTAMP WITH TIME ZONE;
    existing_claim_count INTEGER;
BEGIN
    -- Find and validate shareable link
    SELECT sl.*, (sl.total_credits - sl.used_credits) as available_credits
    INTO link_record
    FROM shareable_gift_links sl
    WHERE sl.link_code = p_link_code
    AND sl.is_active = true
    AND sl.expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            false,
            NULL::VARCHAR(20),
            'Invalid, expired, or inactive gift link'::TEXT,
            false;
        RETURN;
    END IF;
    
    -- Check if link has available credits
    IF link_record.available_credits <= 0 THEN
        RETURN QUERY SELECT 
            false,
            NULL::VARCHAR(20),
            'This gift link has been fully claimed'::TEXT,
            false;
        RETURN;
    END IF;
    
    -- Check if this email has already claimed from this link
    SELECT COUNT(*) INTO existing_claim_count
    FROM shareable_link_claims 
    WHERE shareable_link_id = link_record.id 
    AND claimer_email = p_claimer_email;
    
    IF existing_claim_count >= link_record.max_uses_per_email THEN
        RETURN QUERY SELECT 
            false,
            NULL::VARCHAR(20),
            'This email has already claimed from this gift link'::TEXT,
            false;
        RETURN;
    END IF;
    
    -- Calculate subscription end date
    IF link_record.access_type = 'annual' THEN
        subscription_end_date := NOW() + INTERVAL '1 year';
    ELSE
        subscription_end_date := NULL; -- Lifetime access
    END IF;
    
    -- Create or update user subscription if user is provided
    IF p_claimer_user_id IS NOT NULL THEN
        INSERT INTO user_subscriptions (
            user_id,
            subscription_tier,
            subscription_status,
            subscription_start_date,
            subscription_end_date,
            payment_provider,
            external_subscription_id,
            billing_cycle,
            amount_cents,
            currency
        ) VALUES (
            p_claimer_user_id,
            'premium',
            'active',
            NOW(),
            subscription_end_date,
            'gift_link',
            'gift_link_' || p_link_code,
            link_record.access_type,
            CASE WHEN link_record.access_type = 'annual' THEN 2500 ELSE 5000 END,
            'usd'
        ) ON CONFLICT (user_id) DO UPDATE SET
            subscription_tier = EXCLUDED.subscription_tier,
            subscription_status = EXCLUDED.subscription_status,
            subscription_start_date = EXCLUDED.subscription_start_date,
            subscription_end_date = CASE 
                WHEN EXCLUDED.subscription_end_date IS NULL THEN NULL -- Lifetime always wins
                WHEN user_subscriptions.subscription_end_date IS NULL THEN NULL -- Keep existing lifetime
                ELSE GREATEST(user_subscriptions.subscription_end_date, EXCLUDED.subscription_end_date)
            END,
            payment_provider = EXCLUDED.payment_provider,
            external_subscription_id = EXCLUDED.external_subscription_id,
            billing_cycle = CASE 
                WHEN EXCLUDED.subscription_end_date IS NULL THEN 'lifetime'
                WHEN user_subscriptions.subscription_end_date IS NULL THEN user_subscriptions.billing_cycle
                ELSE EXCLUDED.billing_cycle
            END,
            updated_at = NOW();
    END IF;
    
    -- Record the claim
    INSERT INTO shareable_link_claims (
        shareable_link_id,
        claimer_email,
        claimer_user_id,
        access_type,
        ip_address,
        user_agent
    ) VALUES (
        link_record.id,
        p_claimer_email,
        p_claimer_user_id,
        link_record.access_type,
        p_ip_address,
        p_user_agent
    );
    
    -- Increment used credits
    UPDATE shareable_gift_links 
    SET 
        used_credits = used_credits + 1,
        updated_at = NOW()
    WHERE id = link_record.id;
    
    RETURN QUERY SELECT 
        true,
        link_record.access_type,
        ('Successfully claimed ' || link_record.access_type || ' access!')::TEXT,
        (p_claimer_user_id IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNCTION TO GET SHAREABLE LINK INFO
CREATE OR REPLACE FUNCTION get_shareable_link_info(p_link_code VARCHAR(50))
RETURNS TABLE(
    link_id UUID,
    title VARCHAR(200),
    message TEXT,
    access_type VARCHAR(20),
    total_credits INTEGER,
    used_credits INTEGER,
    available_credits INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.id,
        sl.title,
        sl.message,
        sl.access_type,
        sl.total_credits,
        sl.used_credits,
        (sl.total_credits - sl.used_credits) as available_credits,
        sl.expires_at,
        sl.is_active,
        (sl.is_active AND sl.expires_at > NOW() AND (sl.total_credits - sl.used_credits) > 0) as is_valid
    FROM shareable_gift_links sl
    WHERE sl.link_code = p_link_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCTION TO GET USER'S SHAREABLE LINKS
CREATE OR REPLACE FUNCTION get_user_shareable_links(p_user_id UUID)
RETURNS TABLE(
    link_id UUID,
    link_code VARCHAR(50),
    title VARCHAR(200),
    message TEXT,
    access_type VARCHAR(20),
    total_credits INTEGER,
    used_credits INTEGER,
    available_credits INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    claims_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.id,
        sl.link_code,
        sl.title,
        sl.message,
        sl.access_type,
        sl.total_credits,
        sl.used_credits,
        (sl.total_credits - sl.used_credits) as available_credits,
        sl.expires_at,
        sl.is_active,
        sl.created_at,
        COALESCE(claim_counts.claims, 0)::INTEGER as claims_count
    FROM shareable_gift_links sl
    LEFT JOIN (
        SELECT 
            shareable_link_id,
            COUNT(*) as claims
        FROM shareable_link_claims
        GROUP BY shareable_link_id
    ) claim_counts ON sl.id = claim_counts.shareable_link_id
    WHERE sl.donor_user_id = p_user_id
    ORDER BY sl.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_shareable_gift_links_donor ON shareable_gift_links(donor_user_id);
CREATE INDEX idx_shareable_gift_links_code ON shareable_gift_links(link_code);
CREATE INDEX idx_shareable_gift_links_active ON shareable_gift_links(is_active, expires_at) WHERE is_active = true;
CREATE INDEX idx_shareable_gift_links_credits ON shareable_gift_links(total_credits, used_credits) WHERE (total_credits - used_credits) > 0;

CREATE INDEX idx_shareable_link_claims_link ON shareable_link_claims(shareable_link_id);
CREATE INDEX idx_shareable_link_claims_email ON shareable_link_claims(claimer_email);
CREATE INDEX idx_shareable_link_claims_user ON shareable_link_claims(claimer_user_id) WHERE claimer_user_id IS NOT NULL;

-- 8. ROW LEVEL SECURITY POLICIES
ALTER TABLE shareable_gift_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE shareable_link_claims ENABLE ROW LEVEL SECURITY;

-- Users can only view their own shareable links
CREATE POLICY "Users can view own shareable links" ON shareable_gift_links
    FOR SELECT USING (auth.uid() = donor_user_id);

-- Users can only view claims for their own links
CREATE POLICY "Users can view claims for own links" ON shareable_link_claims
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shareable_gift_links 
            WHERE id = shareable_link_claims.shareable_link_id 
            AND donor_user_id = auth.uid()
        )
    );

-- 9. TRIGGERS FOR UPDATED_AT COLUMNS
CREATE TRIGGER update_shareable_gift_links_updated_at 
    BEFORE UPDATE ON shareable_gift_links 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. COMMENTS FOR DOCUMENTATION
COMMENT ON TABLE shareable_gift_links IS 'Shareable links that allow multiple people to claim gift access';
COMMENT ON TABLE shareable_link_claims IS 'Tracks who has claimed access from shareable links';

COMMENT ON FUNCTION create_shareable_gift_link(UUID, VARCHAR, INTEGER, VARCHAR, TEXT, VARCHAR) IS 'Creates a shareable gift link from user''s available credits';
COMMENT ON FUNCTION claim_shareable_gift_link(VARCHAR, VARCHAR, UUID, INET, TEXT) IS 'Claims access from a shareable gift link';
COMMENT ON FUNCTION get_shareable_link_info(VARCHAR) IS 'Gets public info about a shareable gift link';
COMMENT ON FUNCTION get_user_shareable_links(UUID) IS 'Gets all shareable links created by a user'; 