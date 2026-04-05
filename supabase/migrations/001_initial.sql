-- Users table (id matches auth.users.id from Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  cards_per_briefing INTEGER NOT NULL DEFAULT 10,
  subscription_status TEXT NOT NULL DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'canceled', 'past_due', 'free_pass')),
  subscription_plan TEXT CHECK (subscription_plan IN ('monthly', 'annual', NULL)),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_expires_at TIMESTAMPTZ,
  free_pass_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source_type TEXT NOT NULL DEFAULT 'news' CHECK (source_type IN ('news', 'biomedical', 'stem', 'academic', 'curriculum')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Briefings
CREATE TABLE briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Cards
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_url TEXT,
  source_name TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_review BOOLEAN NOT NULL DEFAULT false,
  review_id UUID,  -- will reference review_queue(id) after that table is created
  topic_index INTEGER,  -- for curriculum cards, tracks which syllabus topic
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spaced repetition: papers/articles queued for resurfacing
CREATE TABLE review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  original_summary TEXT NOT NULL,
  category_name TEXT NOT NULL,
  source_name TEXT,
  times_reviewed INTEGER NOT NULL DEFAULT 0,
  next_review_date DATE NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, source_url)
);

CREATE INDEX idx_review_queue_user_date ON review_queue(user_id, next_review_date);

-- Add foreign key from cards.review_id to review_queue now that review_queue exists
ALTER TABLE cards ADD CONSTRAINT cards_review_id_fkey FOREIGN KEY (review_id) REFERENCES review_queue(id) ON DELETE SET NULL;

-- Feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('thumbs_up', 'thumbs_down', 'skip')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, card_id)
);

-- Streaks
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_review_date DATE
);

-- Daily completions
CREATE TABLE daily_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  cards_reviewed INTEGER NOT NULL DEFAULT 0,
  cards_total INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Search cache: shared search results across users for the same category+source_type+date
CREATE TABLE search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'news',
  date DATE NOT NULL,
  results JSONB NOT NULL,  -- cached NewsArticle[] as JSON
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_name, source_type, date)
);

-- Summary cache: cached Claude summaries for the same set of articles
CREATE TABLE summary_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,  -- hash of category + article URLs
  category_name TEXT NOT NULL,
  summaries JSONB NOT NULL,  -- cached CardSummary[] as JSON
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reading list: saved cards for later deep reading
CREATE TABLE reading_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_url TEXT,
  source_name TEXT,
  category_name TEXT NOT NULL,
  notes TEXT,  -- user's personal notes
  is_read BOOLEAN NOT NULL DEFAULT false,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Knowledge memory: tracks topics and concepts a user has been exposed to
CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  topic TEXT NOT NULL,  -- extracted topic/concept (e.g., "CRISPR base editing")
  times_seen INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expertise_level INTEGER NOT NULL DEFAULT 1,  -- 1=beginner, 2=familiar, 3=intermediate, 4=advanced, 5=expert
  UNIQUE(user_id, topic)
);

-- User expertise level per category (aggregated)
CREATE TABLE user_expertise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,  -- 1-5
  topics_covered INTEGER NOT NULL DEFAULT 0,
  cards_reviewed INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_name)
);

-- Learning paths: Claude-generated syllabi for curriculum categories
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  syllabus JSONB NOT NULL,  -- Array of {topic, description, order, difficulty_level}
  total_topics INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_name)
);

-- Progress through learning path topics
CREATE TABLE path_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  topic_index INTEGER NOT NULL,  -- index in the syllabus array
  topic_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'learned', 'mastered')),
  times_reviewed INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  comprehension_score REAL,  -- 0-1, based on quiz performance
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, learning_path_id, topic_index)
);

-- Free pass codes for friends and family
CREATE TABLE free_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  redeemed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_redeemed BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_free_passes_code ON free_passes(code);

-- Indexes for performance
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_briefings_user_id_date ON briefings(user_id, date);
CREATE INDEX idx_cards_briefing_id ON cards(briefing_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_card_id ON feedback(card_id);
CREATE INDEX idx_daily_completions_user_id ON daily_completions(user_id);
CREATE INDEX idx_search_cache_lookup ON search_cache(category_name, source_type, date);
CREATE INDEX idx_summary_cache_key ON summary_cache(cache_key);
CREATE INDEX idx_reading_list_user ON reading_list(user_id, is_read);
CREATE INDEX idx_knowledge_entries_user ON knowledge_entries(user_id, category_name);
CREATE INDEX idx_user_expertise_user ON user_expertise(user_id);
CREATE INDEX idx_learning_paths_user ON learning_paths(user_id, category_name);
CREATE INDEX idx_path_progress_user ON path_progress(user_id, learning_path_id);
CREATE INDEX idx_path_progress_review ON path_progress(user_id, next_review_at);

-- Row Level Security policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_completions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (our API routes use service role)
CREATE POLICY "Service role full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON briefings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON streaks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON daily_completions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE summary_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_expertise ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON search_cache FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON summary_cache FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON reading_list FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON knowledge_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON user_expertise FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON review_queue FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON learning_paths FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON path_progress FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE free_passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON free_passes FOR ALL USING (true) WITH CHECK (true);
