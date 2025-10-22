/*
  COMPLETE KINDERDAG DATABASE MIGRATION
  =====================================

  This migration creates the complete database schema for the KinderDag app.
  Run this in your Supabase SQL Editor.

  Tables Created:
  - profiles: User profiles extending auth.users
  - kids: Children linked to profiles
  - activity_categories: Categories for organizing activities
  - activities: Main activities/venues database
  - activity_category_links: Many-to-many between activities and categories
  - favorites: User's saved activities
  - scheduled_activities: User's planned activities
  - reviews: User reviews and ratings
  - banners: Homepage promotional banners
  - tags: Special activity promotions and labels
  - activity_tag_links: Many-to-many between activities and tags
  - chat_conversations: AI chat assistant sessions
  - chat_messages: Individual chat messages
  - chat_recommendations: Activity recommendations from chat
  - cities: Netherlands city locations
*/

-- ============================================================================
-- PART 1: MAIN SCHEMA
-- ============================================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  language text DEFAULT 'en' CHECK (language IN ('en', 'nl')),
  location_lat numeric,
  location_lng numeric,
  location_name text,
  push_notifications_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create kids table
CREATE TABLE IF NOT EXISTS kids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text,
  birth_year integer NOT NULL CHECK (birth_year >= 1900 AND birth_year <= extract(year from current_date)),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own kids"
  ON kids FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own kids"
  ON kids FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own kids"
  ON kids FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own kids"
  ON kids FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Create activity_categories table (renamed from categories for consistency)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_nl text NOT NULL,
  icon text NOT NULL,
  color text DEFAULT '#0D9488',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description_en text NOT NULL,
  description_nl text NOT NULL,
  location_lat numeric NOT NULL,
  location_lng numeric NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  province text NOT NULL,
  age_min integer DEFAULT 0 CHECK (age_min >= 0 AND age_min <= 18),
  age_max integer DEFAULT 12 CHECK (age_max >= 0 AND age_max <= 18),
  price_min numeric DEFAULT 0 CHECK (price_min >= 0),
  price_max numeric DEFAULT 0 CHECK (price_max >= 0),
  is_free boolean DEFAULT false,
  is_indoor boolean DEFAULT false,
  is_outdoor boolean DEFAULT false,
  weather_dependent boolean DEFAULT false,
  phone text,
  email text,
  website text,
  booking_url text,
  images jsonb DEFAULT '[]'::jsonb,
  opening_hours jsonb DEFAULT '{}'::jsonb,
  average_rating numeric DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  total_reviews integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_seasonal boolean DEFAULT false,
  season_start date,
  season_end date,
  type text DEFAULT 'venue' CHECK (type IN ('event', 'venue')),
  event_start_datetime timestamptz,
  event_end_datetime timestamptz,
  venue_opening_hours jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN activities.type IS 'Type of activity: event (time-based) or venue (location-based)';
COMMENT ON COLUMN activities.event_start_datetime IS 'Start date and time for events (only used when type=event)';
COMMENT ON COLUMN activities.event_end_datetime IS 'End date and time for events (only used when type=event)';
COMMENT ON COLUMN activities.venue_opening_hours IS 'Opening hours for venues (only used when type=venue)';

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activities"
  ON activities FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can insert activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete activities"
  ON activities FOR DELETE
  TO authenticated
  USING (true);

-- Create activity_tags table (junction table)
CREATE TABLE IF NOT EXISTS activity_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(activity_id, tag_id)
);

ALTER TABLE activity_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity tags"
  ON activity_tags FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can insert activity tags"
  ON activity_tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete activity tags"
  ON activity_tags FOR DELETE
  TO authenticated
  USING (true);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, activity_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Create scheduled_activities table
CREATE TABLE IF NOT EXISTS scheduled_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time,
  notes text,
  reminder_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scheduled_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled activities"
  ON scheduled_activities FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own scheduled activities"
  ON scheduled_activities FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own scheduled activities"
  ON scheduled_activities FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own scheduled activities"
  ON scheduled_activities FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  visit_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(activity_id, profile_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert own reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Create banners table
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_nl text NOT NULL,
  subtitle_en text,
  subtitle_nl text,
  image_url text NOT NULL,
  action_type text CHECK (action_type IN ('activity', 'category', 'url')),
  action_value text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners"
  ON banners FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- ============================================================================
-- PART 2: TAGS SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'tag',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  show_on_home boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tags"
  ON tags FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all tags"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tags"
  ON tags FOR DELETE
  TO authenticated
  USING (true);

-- Insert default tags
INSERT INTO tags (name, slug, description, color, icon, sort_order) VALUES
  ('Don''t Miss This Week', 'dont-miss', 'Must-see activities this week', '#EF4444', 'star', 1),
  ('Seasonal Activity', 'seasonal', 'Available only during specific seasons', '#F59E0B', 'calendar', 2),
  ('Special Offer', 'special-offer', 'Activities with special discounts or promotions', '#10B981', 'tag', 3),
  ('Hot Pick', 'hot-pick', 'Popular activities with high ratings', '#F97316', 'flame', 4),
  ('Catch It Before It Ends', 'ending-soon', 'Activities ending soon', '#8B5CF6', 'clock', 5),
  ('Family Favorite', 'family-favorite', 'Loved by families', '#EC4899', 'heart', 6)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PART 3: AI CHAT SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT 'New Conversation',
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can create own conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON chat_conversations FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON chat_conversations FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'quick_reply', 'recommendation', 'activity_card')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from own conversations"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE profile_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS chat_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  score numeric DEFAULT 1.0 CHECK (score >= 0 AND score <= 1),
  reason text,
  was_viewed boolean DEFAULT false,
  was_favorited boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recommendations from own conversations"
  ON chat_recommendations FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can create recommendations in own conversations"
  ON chat_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recommendations in own conversations"
  ON chat_recommendations FOR UPDATE
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE profile_id = auth.uid()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE profile_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 4: CITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  province text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cities"
  ON cities FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert cities"
  ON cities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cities"
  ON cities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cities"
  ON cities FOR DELETE
  TO authenticated
  USING (true);

-- Insert Netherlands cities
INSERT INTO cities (name, province, latitude, longitude) VALUES
  ('Amsterdam', 'Noord-Holland', 52.3676, 4.9041),
  ('Rotterdam', 'Zuid-Holland', 51.9244, 4.4777),
  ('The Hague', 'Zuid-Holland', 52.0705, 4.3007),
  ('Utrecht', 'Utrecht', 52.0907, 5.1214),
  ('Eindhoven', 'Noord-Brabant', 51.4416, 5.4697),
  ('Groningen', 'Groningen', 53.2194, 6.5665),
  ('Tilburg', 'Noord-Brabant', 51.5555, 5.0913),
  ('Almere', 'Flevoland', 52.3508, 5.2647),
  ('Breda', 'Noord-Brabant', 51.5719, 4.7683),
  ('Nijmegen', 'Gelderland', 51.8126, 5.8372),
  ('Enschede', 'Overijssel', 52.2215, 6.8937),
  ('Haarlem', 'Noord-Holland', 52.3874, 4.6462),
  ('Arnhem', 'Gelderland', 51.9851, 5.8987),
  ('Zaanstad', 'Noord-Holland', 52.4391, 4.8275),
  ('Amersfoort', 'Utrecht', 52.1561, 5.3878),
  ('Apeldoorn', 'Gelderland', 52.2112, 5.9699),
  ('Hoofddorp', 'Noord-Holland', 52.3025, 4.6892),
  ('Maastricht', 'Limburg', 50.8514, 5.6909),
  ('Leiden', 'Zuid-Holland', 52.1601, 4.4970),
  ('Dordrecht', 'Zuid-Holland', 51.8133, 4.6901),
  ('Zoetermeer', 'Zuid-Holland', 52.0575, 4.4932),
  ('Zwolle', 'Overijssel', 52.5168, 6.0830),
  ('Deventer', 'Overijssel', 52.2551, 6.1639),
  ('Delft', 'Zuid-Holland', 52.0116, 4.3571),
  ('Alkmaar', 'Noord-Holland', 52.6325, 4.7494),
  ('Leeuwarden', 'Friesland', 53.2012, 5.7999),
  ('Den Bosch', 'Noord-Brabant', 51.6978, 5.3037),
  ('Hilversum', 'Noord-Holland', 52.2242, 5.1758),
  ('Roosendaal', 'Noord-Brabant', 51.5308, 4.4653),
  ('Purmerend', 'Noord-Holland', 52.5051, 4.9592),
  ('Schiedam', 'Zuid-Holland', 51.9192, 4.3964),
  ('Spijkenisse', 'Zuid-Holland', 51.8447, 4.3297),
  ('Alphen aan den Rijn', 'Zuid-Holland', 52.1287, 4.6574),
  ('Hoorn', 'Noord-Holland', 52.6426, 5.0597),
  ('Vlaardingen', 'Zuid-Holland', 51.9122, 4.3419),
  ('Alblasserdam', 'Zuid-Holland', 51.8652, 4.6596),
  ('Capelle aan den IJssel', 'Zuid-Holland', 51.9288, 4.5775),
  ('Veenendaal', 'Utrecht', 52.0279, 5.5581),
  ('Oss', 'Noord-Brabant', 51.7650, 5.5183),
  ('Zeist', 'Utrecht', 52.0894, 5.2378)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PART 5: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activities_location ON activities(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_activities_city ON activities(city);
CREATE INDEX IF NOT EXISTS idx_activities_featured ON activities(is_featured);
CREATE INDEX IF NOT EXISTS idx_activities_rating ON activities(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_profile ON favorites(profile_id);
CREATE INDEX IF NOT EXISTS idx_favorites_activity ON favorites(activity_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_date ON scheduled_activities(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reviews_activity ON reviews(activity_id);
CREATE INDEX IF NOT EXISTS idx_tags_active ON tags(is_active);
CREATE INDEX IF NOT EXISTS idx_tags_sort_order ON tags(sort_order);
CREATE INDEX IF NOT EXISTS idx_tags_show_on_home ON tags(show_on_home) WHERE show_on_home = true;
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_activity_tags_activity ON activity_tags(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_tags_tag ON activity_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_profile ON chat_conversations(profile_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_recommendations_conversation ON chat_recommendations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_recommendations_activity ON chat_recommendations(activity_id);

-- ============================================================================
-- PART 6: FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update average rating when reviews change
CREATE OR REPLACE FUNCTION update_activity_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE activities
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE activity_id = COALESCE(NEW.activity_id, OLD.activity_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE activity_id = COALESCE(NEW.activity_id, OLD.activity_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.activity_id, OLD.activity_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for rating updates
DROP TRIGGER IF EXISTS trigger_review_insert ON reviews;
CREATE TRIGGER trigger_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_rating();

DROP TRIGGER IF EXISTS trigger_review_update ON reviews;
CREATE TRIGGER trigger_review_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_rating();

DROP TRIGGER IF EXISTS trigger_review_delete ON reviews;
CREATE TRIGGER trigger_review_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_rating();

-- Function to auto-update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation timestamp when messages are added
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON chat_messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
