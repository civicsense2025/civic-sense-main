-- Migration: Create profiles table and enhanced pod customization features
-- Description: Adds profiles table, fixes auth issues, and implements comprehensive customization system

BEGIN;

-- Step 1: Create standalone tables first (no foreign key dependencies)
CREATE TABLE IF NOT EXISTS pod_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT,
  unlock_condition TEXT, -- e.g., 'complete_5_quizzes', 'civic_action', etc.
  is_seasonal BOOLEAN DEFAULT FALSE,
  season_start DATE,
  season_end DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pod_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  emoji TEXT NOT NULL,
  unlock_condition JSONB NOT NULL, -- detailed unlock requirements
  reward_type TEXT CHECK (reward_type IN ('theme', 'emoji', 'badge', 'feature')),
  reward_data JSONB DEFAULT '{}'::jsonb,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pod_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT CHECK (challenge_type IN ('weekly', 'monthly', 'seasonal', 'special_event')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  target_type TEXT CHECK (target_type IN ('individual', 'pod', 'cross_pod')),
  requirements JSONB NOT NULL, -- what needs to be accomplished
  rewards JSONB DEFAULT '[]'::jsonb, -- what users get for completing it
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create or update profiles table
-- Check if profiles table exists, if not create it, if yes add missing columns
DO $$ 
BEGIN
  -- Create profiles table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      full_name TEXT,
      display_name TEXT,
      avatar_url TEXT,
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
  
  -- Add new columns if they don't exist
  -- Pod personality and preferences
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_pod_personality') THEN
    ALTER TABLE profiles ADD COLUMN preferred_pod_personality TEXT CHECK (preferred_pod_personality IN ('competitive', 'collaborative', 'exploratory', 'structured'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'focus_areas') THEN
    ALTER TABLE profiles ADD COLUMN focus_areas TEXT[]; -- array of strings like ['local_politics', 'federal_government', 'voting_rights']
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'engagement_level') THEN
    ALTER TABLE profiles ADD COLUMN engagement_level TEXT CHECK (engagement_level IN ('casual', 'moderate', 'intensive')) DEFAULT 'moderate';
  END IF;
  
  -- Accessibility preferences
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'high_contrast_mode') THEN
    ALTER TABLE profiles ADD COLUMN high_contrast_mode BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'sensory_friendly_mode') THEN
    ALTER TABLE profiles ADD COLUMN sensory_friendly_mode BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_language') THEN
    ALTER TABLE profiles ADD COLUMN preferred_language TEXT DEFAULT 'en';
  END IF;
  
  -- Achievement tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_achievements') THEN
    ALTER TABLE profiles ADD COLUMN total_achievements INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'achievement_badges') THEN
    ALTER TABLE profiles ADD COLUMN achievement_badges JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_personality ON profiles(preferred_pod_personality);
CREATE INDEX IF NOT EXISTS idx_profiles_focus_areas ON profiles USING gin(focus_areas);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid NOT EXISTS errors
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Step 3: Create tables with foreign key dependencies
-- Create user achievements table (requires pod_achievements and learning_pods to exist)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES pod_achievements(id) ON DELETE CASCADE,
  pod_id UUID REFERENCES learning_pods(id) ON DELETE SET NULL, -- can be earned outside a pod
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  context JSONB DEFAULT '{}'::jsonb, -- additional context about how it was earned
  UNIQUE(user_id, achievement_id)
);

-- Create pod partnerships table (requires learning_pods to exist)
CREATE TABLE IF NOT EXISTS pod_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_1_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
  pod_2_id UUID NOT NULL REFERENCES learning_pods(id) ON DELETE CASCADE,
  partnership_type TEXT CHECK (partnership_type IN ('mentorship', 'collaboration', 'competition', 'sister_pods')),
  status TEXT CHECK (status IN ('pending', 'active', 'paused', 'ended')) DEFAULT 'pending',
  initiated_by UUID NOT NULL REFERENCES auth.users(id),
  partnership_data JSONB DEFAULT '{}'::jsonb, -- goals, shared challenges, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (pod_1_id != pod_2_id), -- can't partner with yourself
  UNIQUE(pod_1_id, pod_2_id)
);

-- Step 4: Enhance learning_pods table with new columns
-- Add new columns to learning_pods for enhanced customization
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'learning_pods' AND column_name = 'personality_type') THEN
    ALTER TABLE learning_pods ADD COLUMN personality_type TEXT CHECK (personality_type IN ('competitive', 'collaborative', 'exploratory', 'structured'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'learning_pods' AND column_name = 'theme_id') THEN
    ALTER TABLE learning_pods ADD COLUMN theme_id UUID REFERENCES pod_themes(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'learning_pods' AND column_name = 'accessibility_mode') THEN
    ALTER TABLE learning_pods ADD COLUMN accessibility_mode TEXT CHECK (accessibility_mode IN ('standard', 'high_contrast', 'sensory_friendly')) DEFAULT 'standard';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'learning_pods' AND column_name = 'unlocked_features') THEN
    ALTER TABLE learning_pods ADD COLUMN unlocked_features JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'learning_pods' AND column_name = 'milestone_data') THEN
    ALTER TABLE learning_pods ADD COLUMN milestone_data JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'learning_pods' AND column_name = 'challenge_participation') THEN
    ALTER TABLE learning_pods ADD COLUMN challenge_participation JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'learning_pods' AND column_name = 'partnership_status') THEN
    ALTER TABLE learning_pods ADD COLUMN partnership_status TEXT CHECK (partnership_status IN ('open', 'closed', 'invite_only')) DEFAULT 'open';
  END IF;
END $$;

-- Step 5: Create functions and triggers
-- Create function to handle user registration with enhanced profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name,
    engagement_level,
    preferred_language
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'moderate',
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'en')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(
  p_user_id UUID,
  p_pod_id UUID,
  p_trigger_type TEXT,
  p_trigger_data JSONB DEFAULT '{}'::jsonb
)
RETURNS INT AS $$
DECLARE
  achievement_record RECORD;
  awarded_count INT := 0;
BEGIN
  -- Loop through all achievements that could be triggered
  FOR achievement_record IN 
    SELECT * FROM pod_achievements 
    WHERE unlock_condition->>'trigger_type' = p_trigger_type
  LOOP
    -- Check if user already has this achievement for this pod
    IF NOT EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = p_user_id 
        AND achievement_id = achievement_record.id 
        AND (pod_id = p_pod_id OR pod_id IS NULL)
    ) THEN
      -- Check if unlock conditions are met (simplified logic)
      -- In real implementation, this would be more sophisticated
      INSERT INTO user_achievements (user_id, achievement_id, pod_id, context)
      VALUES (p_user_id, achievement_record.id, p_pod_id, p_trigger_data);
      
      awarded_count := awarded_count + 1;
    END IF;
  END LOOP;
  
  -- Update user's total achievement count
  UPDATE profiles 
  SET total_achievements = total_achievements + awarded_count,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN awarded_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Enable RLS and create policies for new tables
-- Enable RLS on all new tables
ALTER TABLE pod_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pod_partnerships ENABLE ROW LEVEL SECURITY;

-- Create policies for pod_themes (public readable)
DROP POLICY IF EXISTS "Pod themes are viewable by everyone" ON pod_themes;
CREATE POLICY "Pod themes are viewable by everyone" ON pod_themes
  FOR SELECT USING (true);

-- Create policies for pod_achievements (public readable)
DROP POLICY IF EXISTS "Pod achievements are viewable by everyone" ON pod_achievements;
CREATE POLICY "Pod achievements are viewable by everyone" ON pod_achievements
  FOR SELECT USING (true);

-- Create policies for pod_challenges (public readable)
DROP POLICY IF EXISTS "Pod challenges are viewable by everyone" ON pod_challenges;
CREATE POLICY "Pod challenges are viewable by everyone" ON pod_challenges
  FOR SELECT USING (true);

-- Create policies for user_achievements
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
CREATE POLICY "Users can insert their own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for pod_partnerships
DROP POLICY IF EXISTS "Pod members can view partnerships" ON pod_partnerships;
CREATE POLICY "Pod members can view partnerships" ON pod_partnerships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pod_memberships pm 
      WHERE pm.user_id = auth.uid() 
      AND (pm.pod_id = pod_1_id OR pm.pod_id = pod_2_id)
      AND pm.membership_status = 'active'
    )
  );

DROP POLICY IF EXISTS "Pod leaders can manage partnerships" ON pod_partnerships;
CREATE POLICY "Pod leaders can manage partnerships" ON pod_partnerships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pod_memberships pm 
      WHERE pm.user_id = auth.uid() 
      AND (pm.pod_id = pod_1_id OR pm.pod_id = pod_2_id)
      AND pm.role IN ('admin', 'organizer', 'teacher')
      AND pm.membership_status = 'active'
    )
  );

-- Step 7: Insert default data
-- Insert default themes
INSERT INTO pod_themes (name, display_name, emoji, primary_color, secondary_color, description) VALUES
('constitution', 'Constitutional Scholar', '📜', '#8B4513', '#F4E4BC', 'Classic theme inspired by founding documents'),
('democracy', 'Democratic Spirit', '🗳️', '#1E40AF', '#DBEAFE', 'Modern democracy and voting theme'),
('justice', 'Justice League', '⚖️', '#7C2D12', '#FED7AA', 'Justice and law theme'),
('local_gov', 'Town Hall Heroes', '🏛️', '#059669', '#D1FAE5', 'Local government and community theme'),
('activism', 'Change Makers', '✊', '#DC2626', '#FEE2E2', 'Social activism and engagement theme'),
('scholar', 'Academic Excellence', '🎓', '#7C3AED', '#E9D5FF', 'Scholarly and educational theme'),
('halloween_democracy', 'Spooky Civics', '🎃', '#EA580C', '#000000', 'Halloween-themed democracy education'),
('july_4th', 'Independence Day', '🇺🇸', '#DC2626', '#1E40AF', 'Patriotic American independence theme')
ON CONFLICT (name) DO NOTHING;

-- Insert sample achievements
INSERT INTO pod_achievements (name, display_name, description, emoji, unlock_condition, reward_type, reward_data, rarity) VALUES
('first_quiz', 'Quiz Pioneer', 'Complete your first quiz', '🌟', '{"trigger_type": "quiz_completed", "min_count": 1}', 'badge', '{}', 'common'),
('quiz_streak_5', 'Knowledge Seeker', 'Complete 5 quizzes in a row', '🔥', '{"trigger_type": "quiz_streak", "min_count": 5}', 'theme', '{"theme_id": "scholar"}', 'rare'),
('civic_action', 'Real World Impact', 'Take a civic action in real life', '💪', '{"trigger_type": "civic_action", "min_count": 1}', 'theme', '{"theme_id": "activism"}', 'epic'),
('pod_helper', 'Community Helper', 'Help 10 pod members with questions', '🤝', '{"trigger_type": "help_members", "min_count": 10}', 'badge', '{}', 'rare'),
('constitution_master', 'Constitutional Expert', 'Master constitutional knowledge', '📜', '{"trigger_type": "category_mastery", "category": "Constitutional Law", "min_accuracy": 90}', 'theme', '{"theme_id": "constitution"}', 'legendary')
ON CONFLICT (name) DO NOTHING;

-- Step 8: Add comments and grant permissions
-- Add comments
COMMENT ON TABLE profiles IS 'Enhanced user profile information with customization preferences';
COMMENT ON TABLE pod_themes IS 'Available themes for pod customization';
COMMENT ON TABLE pod_achievements IS 'Achievement system for unlocking customizations';
COMMENT ON TABLE pod_challenges IS 'Time-limited challenges for pods and users';
COMMENT ON TABLE user_achievements IS 'User achievement tracking';
COMMENT ON TABLE pod_partnerships IS 'Partnerships between different pods';

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
GRANT ALL ON pod_themes TO authenticated;
GRANT SELECT ON pod_themes TO anon;
GRANT ALL ON pod_achievements TO authenticated;
GRANT SELECT ON pod_achievements TO anon;
GRANT ALL ON pod_challenges TO authenticated;
GRANT SELECT ON pod_challenges TO anon;
GRANT ALL ON user_achievements TO authenticated;
GRANT ALL ON pod_partnerships TO authenticated;

COMMIT; 