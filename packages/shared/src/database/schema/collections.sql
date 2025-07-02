-- Collections system schema for CivicSense

-- Main collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  cover_image_url TEXT,
  
  -- Learning metadata
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5) DEFAULT 1,
  estimated_minutes INTEGER DEFAULT 30,
  prerequisites TEXT[],
  learning_objectives TEXT[],
  
  -- CivicSense specific
  action_items TEXT[],
  current_events_relevance INTEGER CHECK (current_events_relevance >= 1 AND current_events_relevance <= 5) DEFAULT 3,
  political_balance_score INTEGER CHECK (political_balance_score >= 1 AND political_balance_score <= 5),
  source_diversity_score INTEGER CHECK (source_diversity_score >= 1 AND source_diversity_score <= 5),
  
  -- Discovery & organization
  tags TEXT[],
  categories TEXT[], -- e.g., ['Foreign Policy', 'Middle East', 'Military']
  
  -- Status & visibility
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT FALSE,
  featured_order INTEGER, -- for ordering featured collections
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  
  -- Indexes
  CONSTRAINT valid_featured_order CHECK (
    (is_featured = TRUE AND featured_order IS NOT NULL) OR 
    (is_featured = FALSE AND featured_order IS NULL)
  )
);

-- Collection content items (linking table)
CREATE TABLE collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  
  -- Content reference
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN (
    'topic', 'question', 'glossary_term', 'survey', 'event', 'article'
  )),
  content_id UUID NOT NULL,
  
  -- Organization within collection
  sort_order INTEGER NOT NULL,
  category VARCHAR(100), -- 'Background', 'Current Events', 'Take Action', etc.
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Context
  title_override VARCHAR(255), -- optional custom title for this context
  description_override TEXT, -- optional context for why this item is included
  notes TEXT, -- admin notes
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique ordering within collection
  UNIQUE(collection_id, sort_order)
);

-- User progress tracking
CREATE TABLE user_collection_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  
  -- Progress tracking
  completed_items UUID[], -- array of collection_item.id they've completed
  current_item_id UUID REFERENCES collection_items(id), -- where they left off
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- Time tracking
  total_time_spent_minutes INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- User feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,
  
  -- Ensure one progress record per user per collection
  UNIQUE(user_id, collection_id)
);

-- Collection ratings and reviews
CREATE TABLE collection_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  -- Helpful votes from other users
  helpful_votes INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- One review per user per collection
  UNIQUE(collection_id, user_id)
);

-- Collection analytics (for admin dashboard)
CREATE TABLE collection_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  
  -- Daily metrics
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  starts INTEGER DEFAULT 0, -- people who started the collection
  completions INTEGER DEFAULT 0,
  avg_completion_time_minutes INTEGER DEFAULT 0,
  avg_session_time_minutes INTEGER DEFAULT 0,
  
  -- Content engagement
  most_popular_item_id UUID REFERENCES collection_items(id),
  biggest_drop_off_item_id UUID REFERENCES collection_items(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- One record per collection per day
  UNIQUE(collection_id, date)
);

-- Indexes for performance
CREATE INDEX idx_collections_status ON collections(status);
CREATE INDEX idx_collections_featured ON collections(is_featured, featured_order) WHERE is_featured = TRUE;
CREATE INDEX idx_collections_tags ON collections USING GIN(tags);
CREATE INDEX idx_collections_categories ON collections USING GIN(categories);
CREATE INDEX idx_collections_created_at ON collections(created_at DESC);

CREATE INDEX idx_collection_items_collection ON collection_items(collection_id, sort_order);
CREATE INDEX idx_collection_items_content ON collection_items(content_type, content_id);

CREATE INDEX idx_user_progress_user ON user_collection_progress(user_id);
CREATE INDEX idx_user_progress_collection ON user_collection_progress(collection_id);
CREATE INDEX idx_user_progress_completed ON user_collection_progress(completed_at) WHERE completed_at IS NOT NULL;

CREATE INDEX idx_collection_reviews_collection ON collection_reviews(collection_id);
CREATE INDEX idx_collection_reviews_rating ON collection_reviews(rating);

CREATE INDEX idx_collection_analytics_date ON collection_analytics(collection_id, date DESC);

-- Functions to update collection stats
CREATE OR REPLACE FUNCTION update_collection_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update average rating and total ratings
  UPDATE collections SET
    avg_rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM collection_reviews 
      WHERE collection_id = NEW.collection_id
    ),
    total_ratings = (
      SELECT COUNT(*) 
      FROM collection_reviews 
      WHERE collection_id = NEW.collection_id
    ),
    updated_at = NOW()
  WHERE id = NEW.collection_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when reviews change
CREATE TRIGGER trigger_update_collection_stats
  AFTER INSERT OR UPDATE OR DELETE ON collection_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_stats();

-- Function to update completion count
CREATE OR REPLACE FUNCTION update_collection_completion_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD IS NULL) THEN
    UPDATE collections SET
      completion_count = completion_count + 1,
      updated_at = NOW()
    WHERE id = NEW.collection_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update completion count
CREATE TRIGGER trigger_update_collection_completion_count
  AFTER INSERT OR UPDATE ON user_collection_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_completion_count();

-- RLS Policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collection_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_analytics ENABLE ROW LEVEL SECURITY;

-- Public can view published collections
CREATE POLICY "Public can view published collections" ON collections
  FOR SELECT USING (status = 'published');

-- Admins can do everything
CREATE POLICY "Admins can manage collections" ON collections
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Public can view collection items for published collections
CREATE POLICY "Public can view collection items" ON collection_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections 
      WHERE id = collection_items.collection_id 
      AND status = 'published'
    )
  );

-- Admins can manage collection items
CREATE POLICY "Admins can manage collection items" ON collection_items
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Users can view their own progress
CREATE POLICY "Users can view own progress" ON user_collection_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress" ON user_collection_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify own progress" ON user_collection_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Public can view reviews
CREATE POLICY "Public can view reviews" ON collection_reviews
  FOR SELECT USING (true);

-- Users can manage their own reviews
CREATE POLICY "Users can manage own reviews" ON collection_reviews
  FOR ALL USING (auth.uid() = user_id);

-- Only admins can view analytics
CREATE POLICY "Admins can view analytics" ON collection_analytics
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin'); 