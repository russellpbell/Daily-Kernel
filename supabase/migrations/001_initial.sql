-- Users table (id matches auth.users.id from Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  cards_per_briefing INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source_type TEXT NOT NULL DEFAULT 'news' CHECK (source_type IN ('news', 'biomedical', 'stem', 'academic')),
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- Indexes for performance
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_briefings_user_id_date ON briefings(user_id, date);
CREATE INDEX idx_cards_briefing_id ON cards(briefing_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_card_id ON feedback(card_id);
CREATE INDEX idx_daily_completions_user_id ON daily_completions(user_id);

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
