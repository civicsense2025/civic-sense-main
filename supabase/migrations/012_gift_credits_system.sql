-- Migration: Gift Credits System
-- Allows users to gift annual/lifetime access memberships from large donations

-- 1. GIFT CREDITS TABLE
-- Tracks available gift credits for users who donated in multiples of $25/$50
CREATE TABLE gift_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credit_type VARCHAR(20) NOT NULL CHECK (credit_type IN ('annual', 'lifetime')),
    credits_available INTEGER NOT NULL DEFAULT 0,
    credits_used INTEGER NOT NULL DEFAULT 0,
    source_donation_amount INTEGER NOT NULL, -- Amount in cents that generated these credits
    source_stripe_session_id VARCHAR(200), -- Reference to original Stripe session
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(donor_user_id, credit_type, source_stripe_session_id)
);

-- 2. GIFT REDEMPTIONS TABLE
-- Tracks when gift credits are redeemed and by whom
CREATE TABLE gift_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gift_credit_id UUID NOT NULL REFERENCES gift_credits(id) ON DELETE CASCADE,
    donor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('annual', 'lifetime')),
    gift_message TEXT,
    
    -- Status tracking
    redemption_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (redemption_status IN ('pending', 'claimed', 'expired')),
    redemption_code VARCHAR(50) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    claimed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FUNCTION TO CALCULATE GIFT CREDITS FROM DONATION
CREATE OR REPLACE FUNCTION calculate_gift_credits(donation_amount_cents INTEGER)
RETURNS TABLE(
    annual_credits INTEGER,
    lifetime_credits INTEGER,
    donor_access_type VARCHAR(20)
) AS $$
DECLARE
    remaining_amount INTEGER;
    annual_credit_cost INTEGER := 2500; -- $25 in cents
    lifetime_credit_cost INTEGER := 5000; -- $50 in cents
    calculated_annual_credits INTEGER := 0;
    calculated_lifetime_credits INTEGER := 0;
    calculated_donor_access VARCHAR(20) := 'none';
BEGIN
    -- First, determine donor's own access tier
    IF donation_amount_cents >= lifetime_credit_cost THEN
        calculated_donor_access := 'lifetime';
        remaining_amount := donation_amount_cents - lifetime_credit_cost;
    ELSIF donation_amount_cents >= annual_credit_cost THEN
        calculated_donor_access := 'annual';
        remaining_amount := donation_amount_cents - annual_credit_cost;
    ELSE
        calculated_donor_access := 'none';
        remaining_amount := 0;
    END IF;
    
    -- Calculate gift credits from remaining amount
    -- Prioritize lifetime credits (better value)
    IF remaining_amount >= lifetime_credit_cost THEN
        calculated_lifetime_credits := remaining_amount / lifetime_credit_cost;
        remaining_amount := remaining_amount % lifetime_credit_cost;
    END IF;
    
    -- Use remaining amount for annual credits
    IF remaining_amount >= annual_credit_cost THEN
        calculated_annual_credits := remaining_amount / annual_credit_cost;
    END IF;
    
    RETURN QUERY SELECT 
        calculated_annual_credits,
        calculated_lifetime_credits,
        calculated_donor_access;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. FUNCTION TO PROCESS DONATION AND CREATE GIFT CREDITS
CREATE OR REPLACE FUNCTION process_donation_gift_credits(
    p_user_id UUID,
    p_donation_amount_cents INTEGER,
    p_stripe_session_id VARCHAR(200)
) RETURNS TABLE(
    donor_access_type VARCHAR(20),
    annual_credits_granted INTEGER,
    lifetime_credits_granted INTEGER
) AS $$
DECLARE
    credit_calc RECORD;
    donor_access VARCHAR(20);
    annual_credits INTEGER;
    lifetime_credits INTEGER;
BEGIN
    -- Calculate gift credits
    SELECT * INTO credit_calc FROM calculate_gift_credits(p_donation_amount_cents);
    
    donor_access := credit_calc.donor_access_type;
    annual_credits := credit_calc.annual_credits;
    lifetime_credits := credit_calc.lifetime_credits;
    
    -- Create gift credit records if any credits are available
    IF annual_credits > 0 THEN
        INSERT INTO gift_credits (
            donor_user_id,
            credit_type,
            credits_available,
            credits_used,
            source_donation_amount,
            source_stripe_session_id
        ) VALUES (
            p_user_id,
            'annual',
            annual_credits,
            0,
            p_donation_amount_cents,
            p_stripe_session_id
        ) ON CONFLICT (donor_user_id, credit_type, source_stripe_session_id) 
        DO UPDATE SET
            credits_available = gift_credits.credits_available + EXCLUDED.credits_available,
            updated_at = NOW();
    END IF;
    
    IF lifetime_credits > 0 THEN
        INSERT INTO gift_credits (
            donor_user_id,
            credit_type,
            credits_available,
            credits_used,
            source_donation_amount,
            source_stripe_session_id
        ) VALUES (
            p_user_id,
            'lifetime',
            lifetime_credits,
            0,
            p_donation_amount_cents,
            p_stripe_session_id
        ) ON CONFLICT (donor_user_id, credit_type, source_stripe_session_id) 
        DO UPDATE SET
            credits_available = gift_credits.credits_available + EXCLUDED.credits_available,
            updated_at = NOW();
    END IF;
    
    RETURN QUERY SELECT 
        donor_access,
        annual_credits,
        lifetime_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNCTION TO CREATE GIFT REDEMPTION
CREATE OR REPLACE FUNCTION create_gift_redemption(
    p_donor_user_id UUID,
    p_recipient_email VARCHAR(255),
    p_access_type VARCHAR(20),
    p_gift_message TEXT DEFAULT NULL
) RETURNS TABLE(
    redemption_id UUID,
    redemption_code VARCHAR(50),
    success BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    available_credits INTEGER;
    gift_credit_record RECORD;
    new_redemption_id UUID;
    new_redemption_code VARCHAR(50);
BEGIN
    -- Check if donor has available credits of the requested type
    SELECT gc.id, gc.credits_available, gc.credits_used 
    INTO gift_credit_record
    FROM gift_credits gc
    WHERE gc.donor_user_id = p_donor_user_id 
    AND gc.credit_type = p_access_type
    AND (gc.credits_available - gc.credits_used) > 0
    ORDER BY gc.created_at ASC -- Use oldest credits first
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            NULL::UUID,
            NULL::VARCHAR(50),
            false,
            'No available ' || p_access_type || ' credits'::TEXT;
        RETURN;
    END IF;
    
    -- Generate unique redemption code
    new_redemption_code := 'CIVIC-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8));
    
    -- Create redemption record
    INSERT INTO gift_redemptions (
        gift_credit_id,
        donor_user_id,
        recipient_email,
        access_type,
        gift_message,
        redemption_code
    ) VALUES (
        gift_credit_record.id,
        p_donor_user_id,
        p_recipient_email,
        p_access_type,
        p_gift_message,
        new_redemption_code
    ) RETURNING id INTO new_redemption_id;
    
    -- Update gift credits usage
    UPDATE gift_credits 
    SET 
        credits_used = credits_used + 1,
        updated_at = NOW()
    WHERE id = gift_credit_record.id;
    
    RETURN QUERY SELECT 
        new_redemption_id,
        new_redemption_code,
        true,
        'Gift created successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCTION TO REDEEM GIFT CODE
CREATE OR REPLACE FUNCTION redeem_gift_code(
    p_redemption_code VARCHAR(50),
    p_recipient_user_id UUID
) RETURNS TABLE(
    success BOOLEAN,
    access_type VARCHAR(20),
    error_message TEXT
) AS $$
DECLARE
    redemption_record RECORD;
    subscription_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Find redemption record
    SELECT gr.*, gc.credit_type
    INTO redemption_record
    FROM gift_redemptions gr
    JOIN gift_credits gc ON gr.gift_credit_id = gc.id
    WHERE gr.redemption_code = p_redemption_code
    AND gr.redemption_status = 'pending'
    AND gr.expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            false,
            NULL::VARCHAR(20),
            'Invalid or expired redemption code'::TEXT;
        RETURN;
    END IF;
    
    -- Calculate subscription end date
    IF redemption_record.access_type = 'annual' THEN
        subscription_end_date := NOW() + INTERVAL '1 year';
    ELSE
        subscription_end_date := NULL; -- Lifetime access
    END IF;
    
    -- Create or update user subscription
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
        p_recipient_user_id,
        'premium',
        'active',
        NOW(),
        subscription_end_date,
        'gift',
        'gift_' || p_redemption_code,
        redemption_record.access_type,
        CASE WHEN redemption_record.access_type = 'annual' THEN 2500 ELSE 5000 END,
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
    
    -- Mark redemption as claimed
    UPDATE gift_redemptions 
    SET 
        redemption_status = 'claimed',
        recipient_user_id = p_recipient_user_id,
        claimed_at = NOW(),
        updated_at = NOW()
    WHERE id = redemption_record.id;
    
    RETURN QUERY SELECT 
        true,
        redemption_record.access_type,
        'Gift redeemed successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNCTION TO GET USER'S GIFT CREDITS SUMMARY
CREATE OR REPLACE FUNCTION get_user_gift_credits(p_user_id UUID)
RETURNS TABLE(
    credit_type VARCHAR(20),
    total_credits INTEGER,
    used_credits INTEGER,
    available_credits INTEGER,
    total_donation_amount INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gc.credit_type,
        SUM(gc.credits_available)::INTEGER as total_credits,
        SUM(gc.credits_used)::INTEGER as used_credits,
        SUM(gc.credits_available - gc.credits_used)::INTEGER as available_credits,
        SUM(gc.source_donation_amount)::INTEGER as total_donation_amount
    FROM gift_credits gc
    WHERE gc.donor_user_id = p_user_id
    GROUP BY gc.credit_type
    ORDER BY gc.credit_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX idx_gift_credits_donor_user_id ON gift_credits(donor_user_id);
CREATE INDEX idx_gift_credits_type_available ON gift_credits(credit_type, credits_available) WHERE credits_available > 0;
CREATE INDEX idx_gift_credits_stripe_session ON gift_credits(source_stripe_session_id);

CREATE INDEX idx_gift_redemptions_code ON gift_redemptions(redemption_code);
CREATE INDEX idx_gift_redemptions_donor ON gift_redemptions(donor_user_id);
CREATE INDEX idx_gift_redemptions_recipient ON gift_redemptions(recipient_email);
CREATE INDEX idx_gift_redemptions_status ON gift_redemptions(redemption_status);
CREATE INDEX idx_gift_redemptions_expires ON gift_redemptions(expires_at) WHERE redemption_status = 'pending';

-- 9. ROW LEVEL SECURITY POLICIES
ALTER TABLE gift_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own gift credits
CREATE POLICY "Users can view own gift credits" ON gift_credits
    FOR SELECT USING (auth.uid() = donor_user_id);

-- Users can only view gift redemptions they created or received
CREATE POLICY "Users can view relevant gift redemptions" ON gift_redemptions
    FOR SELECT USING (
        auth.uid() = donor_user_id OR 
        auth.uid() = recipient_user_id
    );

-- 10. TRIGGERS FOR UPDATED_AT COLUMNS
CREATE TRIGGER update_gift_credits_updated_at 
    BEFORE UPDATE ON gift_credits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gift_redemptions_updated_at 
    BEFORE UPDATE ON gift_redemptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. COMMENTS FOR DOCUMENTATION
COMMENT ON TABLE gift_credits IS 'Tracks gift credits earned from large donations';
COMMENT ON TABLE gift_redemptions IS 'Tracks when gift credits are redeemed and by whom';

COMMENT ON FUNCTION calculate_gift_credits(INTEGER) IS 'Calculates how many gift credits a donation amount generates';
COMMENT ON FUNCTION process_donation_gift_credits(UUID, INTEGER, VARCHAR) IS 'Processes a donation and creates appropriate gift credits';
COMMENT ON FUNCTION create_gift_redemption(UUID, VARCHAR, VARCHAR, TEXT) IS 'Creates a gift redemption for someone to claim';
COMMENT ON FUNCTION redeem_gift_code(VARCHAR, UUID) IS 'Redeems a gift code and grants access to the recipient';
COMMENT ON FUNCTION get_user_gift_credits(UUID) IS 'Gets summary of user''s available gift credits'; 