/*
  # Complete Database Setup with Initial Data

  This migration creates all necessary tables and populates them with initial data.

  ## Tables Created:
  1. profiles - User profiles linked to auth.users
  2. kids - Children information for each profile
  3. activity_categories - Categories for activities
  4. activities - Main activities/venues table
  5. activity_category_links - Many-to-many relationship
  6. tags - Activity tags
  7. activity_tag_links - Many-to-many relationship
  8. favorites - User favorites
  9. scheduled_activities - User's scheduled activities
  10. reviews - User reviews for activities
  11. banners - Homepage promotional banners
  12. cities - Major Dutch cities
  13. chat_conversations - AI chat conversations
  14. chat_messages - Chat messages
  15. chat_recommendations - Activity recommendations from chat

  ## Security:
  - RLS enabled on all tables
  - Policies for authenticated and anonymous users where appropriate
*/

-- =============================================
-- 1. PROFILES TABLE
-- =============================================

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

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- =============================================
-- 2. KIDS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS kids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text,
  birth_year int NOT NULL CHECK (birth_year >= 1900 AND birth_year <= EXTRACT(year FROM CURRENT_DATE)),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own kids" ON kids;
CREATE POLICY "Users can manage own kids"
  ON kids FOR ALL
  TO authenticated
  USING (profile_id = auth.uid());

-- =============================================
-- 3. ACTIVITY CATEGORIES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS activity_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_nl text NOT NULL,
  icon text NOT NULL,
  color text DEFAULT '#6B46C1',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view categories" ON activity_categories;
CREATE POLICY "Anyone can view categories"
  ON activity_categories FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert categories" ON activity_categories;
CREATE POLICY "Authenticated users can insert categories"
  ON activity_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update categories" ON activity_categories;
CREATE POLICY "Authenticated users can update categories"
  ON activity_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete categories" ON activity_categories;
CREATE POLICY "Authenticated users can delete categories"
  ON activity_categories FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- 4. ACTIVITIES TABLE
-- =============================================

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
  age_min int DEFAULT 0 CHECK (age_min >= 0 AND age_min <= 18),
  age_max int DEFAULT 12 CHECK (age_max >= 0 AND age_max <= 18),
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
  total_reviews int DEFAULT 0,
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

COMMENT ON TABLE activities IS 'Activities and venues for families';
COMMENT ON COLUMN activities.type IS 'Type of activity: event (time-based) or venue (location-based)';
COMMENT ON COLUMN activities.event_start_datetime IS 'Start date and time for events (only used when type=event)';
COMMENT ON COLUMN activities.event_end_datetime IS 'End date and time for events (only used when type=event)';
COMMENT ON COLUMN activities.venue_opening_hours IS 'Opening hours for venues (only used when type=venue)';

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view activities" ON activities;
CREATE POLICY "Anyone can view activities"
  ON activities FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert activities" ON activities;
CREATE POLICY "Authenticated users can insert activities"
  ON activities FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update activities" ON activities;
CREATE POLICY "Authenticated users can update activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete activities" ON activities;
CREATE POLICY "Authenticated users can delete activities"
  ON activities FOR DELETE
  TO authenticated
  USING (true);

-- =============================================
-- 5. ACTIVITY CATEGORY LINKS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS activity_category_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES activity_categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(activity_id, category_id)
);

ALTER TABLE activity_category_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view activity category links" ON activity_category_links;
CREATE POLICY "Anyone can view activity category links"
  ON activity_category_links FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage links" ON activity_category_links;
CREATE POLICY "Authenticated users can manage links"
  ON activity_category_links FOR ALL
  TO authenticated
  USING (true);

-- =============================================
-- 6. TAGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'tag',
  show_on_home boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view tags" ON tags;
CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage tags" ON tags;
CREATE POLICY "Authenticated users can manage tags"
  ON tags FOR ALL
  TO authenticated
  USING (true);

-- =============================================
-- 7. ACTIVITY TAG LINKS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS activity_tag_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(activity_id, tag_id)
);

ALTER TABLE activity_tag_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view activity tag links" ON activity_tag_links;
CREATE POLICY "Anyone can view activity tag links"
  ON activity_tag_links FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage tag links" ON activity_tag_links;
CREATE POLICY "Authenticated users can manage tag links"
  ON activity_tag_links FOR ALL
  TO authenticated
  USING (true);

-- =============================================
-- 8. FAVORITES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, activity_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  TO authenticated
  USING (profile_id = auth.uid());

-- =============================================
-- 9. SCHEDULED ACTIVITIES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS scheduled_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  scheduled_time time,
  notes text,
  reminder_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scheduled_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own scheduled activities" ON scheduled_activities;
CREATE POLICY "Users can manage own scheduled activities"
  ON scheduled_activities FOR ALL
  TO authenticated
  USING (profile_id = auth.uid());

-- =============================================
-- 10. REVIEWS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  visit_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(activity_id, profile_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can manage own reviews" ON reviews;
CREATE POLICY "Users can manage own reviews"
  ON reviews FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- =============================================
-- 11. BANNERS TABLE
-- =============================================

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
  sort_order int DEFAULT 0,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active banners" ON banners;
CREATE POLICY "Anyone can view active banners"
  ON banners FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can manage banners" ON banners;
CREATE POLICY "Authenticated users can manage banners"
  ON banners FOR ALL
  TO authenticated
  USING (true);

-- =============================================
-- 12. CITIES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  province text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view cities" ON cities;
CREATE POLICY "Anyone can view cities"
  ON cities FOR SELECT
  TO anon, authenticated
  USING (true);

-- =============================================
-- 13. CHAT CONVERSATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text DEFAULT 'New Conversation',
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own conversations" ON chat_conversations;
CREATE POLICY "Users can manage own conversations"
  ON chat_conversations FOR ALL
  TO authenticated
  USING (profile_id = auth.uid());

-- =============================================
-- 14. CHAT MESSAGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'quick_reply', 'recommendation', 'activity_card')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
CREATE POLICY "Users can view own messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own messages" ON chat_messages;
CREATE POLICY "Users can insert own messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.profile_id = auth.uid()
    )
  );

-- =============================================
-- 15. CHAT RECOMMENDATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS chat_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  score numeric DEFAULT 1.0 CHECK (score >= 0 AND score <= 1),
  reason text,
  was_viewed boolean DEFAULT false,
  was_favorited boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recommendations" ON chat_recommendations;
CREATE POLICY "Users can view own recommendations"
  ON chat_recommendations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_recommendations.conversation_id
      AND chat_conversations.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage own recommendations" ON chat_recommendations;
CREATE POLICY "Users can manage own recommendations"
  ON chat_recommendations FOR INSERT, UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_recommendations.conversation_id
      AND chat_conversations.profile_id = auth.uid()
    )
  );

-- =============================================
-- INSERT INITIAL DATA
-- =============================================

-- Insert Categories
INSERT INTO activity_categories (name_en, name_nl, icon, color, sort_order) VALUES
  ('Theme Parks', 'Pretparken', 'ferris-wheel', '#FF6B6B', 1),
  ('Museums', 'Musea', 'building-2', '#4ECDC4', 2),
  ('Outdoor Play', 'Buiten Spelen', 'trees', '#95E1D3', 3),
  ('Animals & Nature', 'Dieren & Natuur', 'bird', '#F9A826', 4),
  ('Indoor Play', 'Binnen Spelen', 'home', '#AA96DA', 5),
  ('Water Activities', 'Wateractiviteiten', 'waves', '#5DADE2', 6),
  ('Sports & Active', 'Sport & Actief', 'activity', '#FF8C42', 7),
  ('Creative & Arts', 'Creatief & Kunst', 'palette', '#E74C3C', 8),
  ('Educational', 'Educatief', 'book-open', '#3498DB', 9)
ON CONFLICT DO NOTHING;

-- Insert Tags
INSERT INTO tags (name, slug, description, color, icon, show_on_home, sort_order, is_active) VALUES
  ('Popular', 'popular', 'Most loved by families', '#FF6B6B', 'heart', true, 1, true),
  ('New', 'new', 'Recently added activities', '#4ECDC4', 'sparkles', true, 2, true),
  ('Budget Friendly', 'budget-friendly', 'Free or low-cost activities', '#95E1D3', 'piggy-bank', true, 3, true),
  ('Rainy Day', 'rainy-day', 'Perfect for bad weather', '#5DADE2', 'cloud-rain', true, 4, true),
  ('Weekend Fun', 'weekend-fun', 'Great weekend activities', '#F9A826', 'calendar', true, 5, true),
  ('Birthday Party', 'birthday-party', 'Perfect for celebrations', '#E74C3C', 'cake', true, 6, true)
ON CONFLICT DO NOTHING;

-- Insert Cities
INSERT INTO cities (name, province, latitude, longitude) VALUES
  ('Amsterdam', 'North Holland', 52.3676, 4.9041),
  ('Rotterdam', 'South Holland', 51.9244, 4.4777),
  ('The Hague', 'South Holland', 52.0705, 4.3007),
  ('Utrecht', 'Utrecht', 52.0907, 5.1214),
  ('Eindhoven', 'North Brabant', 51.4416, 5.4697),
  ('Tilburg', 'North Brabant', 51.5555, 5.0913),
  ('Groningen', 'Groningen', 53.2194, 6.5665),
  ('Almere', 'Flevoland', 52.3508, 5.2647),
  ('Breda', 'North Brabant', 51.5719, 4.7683),
  ('Nijmegen', 'Gelderland', 51.8426, 5.8523)
ON CONFLICT DO NOTHING;

-- Insert Activities
INSERT INTO activities (
  name, description_en, description_nl, location_lat, location_lng,
  address, city, province, age_min, age_max, price_min, price_max,
  is_free, is_indoor, is_outdoor, weather_dependent, phone, email,
  website, booking_url, images, average_rating, total_reviews, is_featured, type
) VALUES
  (
    'Efteling Theme Park',
    'Magical theme park featuring fairy tale attractions thrilling rides and enchanting shows for the whole family.',
    'Magisch themapark met sprookjesattracties spannende attracties en betoverende shows voor het hele gezin.',
    51.6496, 5.0451,
    'Europalaan 1', 'Kaatsheuvel', 'North Brabant',
    2, 12, 43, 43,
    false, false, true, true,
    '+31 416 288 111', NULL,
    'https://www.efteling.com', 'https://www.efteling.com/en/tickets',
    '["https://images.pexels.com/photos/163041/pexels-photo-163041.jpeg","https://images.pexels.com/photos/269077/pexels-photo-269077.jpeg"]'::jsonb,
    4.8, 3200, true, 'venue'
  ),
  (
    'NEMO Science Museum',
    'Interactive science and technology museum designed for curious minds of all ages. Explore hands-on exhibits experiments and educational activities.',
    'Interactief wetenschap- en technologiemuseum ontworpen voor nieuwsgierige geesten van alle leeftijden. Ontdek hands-on tentoonstellingen experimenten en educatieve activiteiten.',
    52.3742, 4.9122,
    'Oosterdok 2', 'Amsterdam', 'North Holland',
    0, 12, 17.50, 17.50,
    false, true, false, false,
    '+31 20 531 3233', NULL,
    'https://www.nemosciencemuseum.nl', 'https://www.nemosciencemuseum.nl/en/visit/',
    '["https://images.pexels.com/photos/2781814/pexels-photo-2781814.jpeg","https://images.pexels.com/photos/256490/pexels-photo-256490.jpeg"]'::jsonb,
    4.7, 1250, true, 'venue'
  ),
  (
    'Vondelpark Playground',
    'Large public park with multiple playgrounds open spaces for running and beautiful nature perfect for family picnics.',
    'Groot openbaar park met meerdere speeltuinen open ruimtes om te rennen en prachtige natuur perfect voor familiepicknicks.',
    52.3579, 4.8686,
    'Vondelpark 7', 'Amsterdam', 'North Holland',
    0, 12, 0, 0,
    true, false, true, true,
    NULL, NULL,
    'https://www.amsterdam.nl/vondelpark', NULL,
    '["https://images.pexels.com/photos/1128318/pexels-photo-1128318.jpeg","https://images.pexels.com/photos/1612353/pexels-photo-1612353.jpeg"]'::jsonb,
    4.5, 890, true, 'venue'
  ),
  (
    'Artis Royal Zoo',
    'Historic zoo featuring exotic animals planetarium aquarium and beautiful botanical gardens in the heart of Amsterdam.',
    'Historische dierentuin met exotische dieren planetarium aquarium en prachtige botanische tuinen in het hart van Amsterdam.',
    52.3660, 4.9152,
    'Plantage Kerklaan 38-40', 'Amsterdam', 'North Holland',
    0, 12, 24.95, 24.95,
    false, false, true, true,
    '+31 20 523 3400', NULL,
    'https://www.artis.nl', 'https://www.artis.nl/en/plan-your-visit/',
    '["https://images.pexels.com/photos/1661535/pexels-photo-1661535.jpeg","https://images.pexels.com/photos/792381/pexels-photo-792381.jpeg"]'::jsonb,
    4.6, 2100, true, 'venue'
  ),
  (
    'Madurodam Miniature Park',
    'Miniature city showcasing famous Dutch landmarks and buildings at 1:25 scale. Interactive and educational experience.',
    'Miniatuurstad met beroemde Nederlandse monumenten en gebouwen op schaal 1:25. Interactieve en educatieve ervaring.',
    52.1005, 4.3122,
    'George Maduroplein 1', 'The Hague', 'South Holland',
    2, 12, 18.50, 18.50,
    false, false, true, true,
    '+31 70 416 2400', NULL,
    'https://www.madurodam.nl', 'https://www.madurodam.nl/en/tickets',
    '["https://images.pexels.com/photos/1470405/pexels-photo-1470405.jpeg","https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg"]'::jsonb,
    4.5, 1800, true, 'venue'
  ),
  (
    'Indoor Playground Ballorig',
    'Large indoor play center with climbing structures slides trampolines and ball pits. Perfect for active kids regardless of weather.',
    'Groot overdekt speelcentrum met klimstructuren glijbanen trampolines en ballenbaden. Perfect voor actieve kinderen ongeacht het weer.',
    52.3702, 4.8952,
    'Various locations', 'Amsterdam', 'North Holland',
    1, 12, 8.50, 8.50,
    false, true, false, false,
    '+31 20 123 4567', NULL,
    'https://www.ballorig.nl', 'https://www.ballorig.nl/locaties/amsterdam',
    '["https://images.pexels.com/photos/1449934/pexels-photo-1449934.jpeg","https://images.pexels.com/photos/3661254/pexels-photo-3661254.jpeg"]'::jsonb,
    4.3, 650, false, 'venue'
  ),
  (
    'Beach Day at Zandvoort',
    'Beautiful sandy beach with shallow waters beach clubs playgrounds and plenty of family-friendly facilities.',
    'Prachtig zandstrand met ondiep water strandclubs speeltuinen en tal van gezinsvriendelijke faciliteiten.',
    52.3727, 4.5309,
    'Zandvoort Beach', 'Zandvoort', 'North Holland',
    0, 12, 0, 0,
    true, false, true, true,
    NULL, NULL,
    'https://www.visitzandvoort.nl', NULL,
    '["https://images.pexels.com/photos/457881/pexels-photo-457881.jpeg","https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg"]'::jsonb,
    4.4, 920, true, 'venue'
  ),
  (
    'Het Amsterdamse Bos Forest',
    'Vast forest park with playgrounds petting zoo canoeing cycling paths and wide open spaces for outdoor activities.',
    'Uitgestrekt bospark met speeltuinen kinderboerderij kanoën fietspaden en ruime open ruimtes voor buitenactiviteiten.',
    52.3149, 4.8362,
    'Bosbaanweg', 'Amstelveen', 'North Holland',
    0, 12, 0, 0,
    true, false, true, true,
    '+31 20 545 6100', NULL,
    'https://www.amsterdamsebos.nl', NULL,
    '["https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg","https://images.pexels.com/photos/1496373/pexels-photo-1496373.jpeg"]'::jsonb,
    4.6, 1450, true, 'venue'
  ),
  (
    'Kinderkookcafe Cooking Workshop',
    'Interactive cooking workshops where children learn to prepare healthy meals and develop culinary skills in a fun environment.',
    'Interactieve kookworkshops waar kinderen leren gezonde maaltijden te bereiden en culinaire vaardigheden ontwikkelen in een leuke omgeving.',
    52.3676, 4.9041,
    'Various locations', 'Amsterdam', 'North Holland',
    4, 12, 25, 25,
    false, true, false, false,
    '+31 20 987 6543', NULL,
    'https://www.kinderkookcafe.nl', 'https://www.kinderkookcafe.nl/workshops',
    '["https://images.pexels.com/photos/1001773/pexels-photo-1001773.jpeg","https://images.pexels.com/photos/4259140/pexels-photo-4259140.jpeg"]'::jsonb,
    4.7, 340, false, 'venue'
  ),
  (
    'Archeon Historical Theme Park',
    'Living history museum where children experience life in prehistoric Roman and medieval times through interactive exhibits.',
    'Levend geschiedenismuseum waar kinderen het leven in prehistorische Romeinse en middeleeuwse tijden ervaren door interactieve tentoonstellingen.',
    52.1183, 4.4686,
    'Archeonlaan 1', 'Alphen aan den Rijn', 'South Holland',
    4, 12, 21.50, 21.50,
    false, false, true, true,
    '+31 172 447 744', NULL,
    'https://www.archeon.nl', 'https://www.archeon.nl/tickets',
    '["https://images.pexels.com/photos/3661254/pexels-photo-3661254.jpeg","https://images.pexels.com/photos/1660995/pexels-photo-1660995.jpeg"]'::jsonb,
    4.4, 780, false, 'venue'
  )
ON CONFLICT DO NOTHING;

-- Insert Banners
INSERT INTO banners (title_en, title_nl, subtitle_en, subtitle_nl, image_url, action_type, action_value, is_active, sort_order) VALUES
  ('Summer Adventures Await!', 'Zomeravonturen wachten!', 'Discover amazing outdoor activities', 'Ontdek geweldige buitenactiviteiten', 'https://images.pexels.com/photos/1198171/pexels-photo-1198171.jpeg', 'category', 'outdoor-play', true, 1),
  ('Educational Fun', 'Educatief Plezier', 'Learn while having fun!', 'Leren terwijl je plezier hebt!', 'https://images.pexels.com/photos/256490/pexels-photo-256490.jpeg', 'category', 'educational', true, 2),
  ('Visit Efteling!', 'Bezoek Efteling!', 'Magical theme park for the whole family', 'Magisch themapark voor het hele gezin', 'https://images.pexels.com/photos/163041/pexels-photo-163041.jpeg', 'activity', 'efteling', true, 3)
ON CONFLICT DO NOTHING;
