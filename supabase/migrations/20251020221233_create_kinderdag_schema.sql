/*
  # KinderDag Database Schema

  ## Overview
  Complete database schema for the KinderDag family activity discovery platform.

  ## New Tables

  ### 1. `profiles`
  User profile information extending Supabase auth.users
  - `id` (uuid, primary key) - References auth.users
  - `full_name` (text) - User's full name
  - `language` (text) - Preferred language (en/nl)
  - `location_lat` (numeric) - User's latitude
  - `location_lng` (numeric) - User's longitude
  - `location_name` (text) - User's location name/city
  - `push_notifications_enabled` (boolean) - Push notification preference
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `kids`
  Children information linked to user profiles
  - `id` (uuid, primary key)
  - `profile_id` (uuid) - References profiles.id
  - `name` (text) - Child's name (optional)
  - `birth_year` (integer) - Year of birth for age calculation
  - `created_at` (timestamptz)

  ### 3. `activity_categories`
  Categories for organizing activities
  - `id` (uuid, primary key)
  - `name_en` (text) - Category name in English
  - `name_nl` (text) - Category name in Dutch
  - `icon` (text) - Icon identifier
  - `color` (text) - Category color hex
  - `sort_order` (integer) - Display order

  ### 4. `activities`
  Main activities/venues database
  - `id` (uuid, primary key)
  - `name` (text) - Activity/venue name
  - `description_en` (text) - English description
  - `description_nl` (text) - Dutch description
  - `location_lat` (numeric) - Latitude
  - `location_lng` (numeric) - Longitude
  - `address` (text) - Full address
  - `city` (text) - City name
  - `province` (text) - Province/region
  - `age_min` (integer) - Minimum age
  - `age_max` (integer) - Maximum age
  - `price_min` (numeric) - Minimum price in euros
  - `price_max` (numeric) - Maximum price in euros
  - `is_free` (boolean) - Whether activity is free
  - `is_indoor` (boolean) - Indoor activity
  - `is_outdoor` (boolean) - Outdoor activity
  - `weather_dependent` (boolean) - Depends on weather
  - `phone` (text) - Contact phone
  - `email` (text) - Contact email
  - `website` (text) - Website URL
  - `booking_url` (text) - Direct booking link
  - `images` (jsonb) - Array of image URLs
  - `opening_hours` (jsonb) - Operating hours structure
  - `average_rating` (numeric) - Average user rating
  - `total_reviews` (integer) - Total review count
  - `is_featured` (boolean) - Featured on homepage
  - `is_seasonal` (boolean) - Seasonal activity
  - `season_start` (date) - Season start date
  - `season_end` (date) - Season end date
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `activity_category_links`
  Many-to-many relationship between activities and categories
  - `id` (uuid, primary key)
  - `activity_id` (uuid) - References activities.id
  - `category_id` (uuid) - References activity_categories.id

  ### 6. `favorites`
  User's saved activities
  - `id` (uuid, primary key)
  - `profile_id` (uuid) - References profiles.id
  - `activity_id` (uuid) - References activities.id
  - `created_at` (timestamptz)

  ### 7. `scheduled_activities`
  User's planned activities with reminders
  - `id` (uuid, primary key)
  - `profile_id` (uuid) - References profiles.id
  - `activity_id` (uuid) - References activities.id
  - `scheduled_date` (date) - Planned date
  - `scheduled_time` (time) - Planned time
  - `notes` (text) - User notes
  - `reminder_sent` (boolean) - Reminder notification status
  - `created_at` (timestamptz)

  ### 8. `reviews`
  User reviews and ratings for activities
  - `id` (uuid, primary key)
  - `activity_id` (uuid) - References activities.id
  - `profile_id` (uuid) - References profiles.id
  - `rating` (integer) - Rating 1-5
  - `comment` (text) - Review text
  - `visit_date` (date) - Date of visit
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 9. `banners`
  Homepage promotional banners
  - `id` (uuid, primary key)
  - `title_en` (text) - English title
  - `title_nl` (text) - Dutch title
  - `subtitle_en` (text) - English subtitle
  - `subtitle_nl` (text) - Dutch subtitle
  - `image_url` (text) - Banner image
  - `action_type` (text) - Action type (activity/category/url)
  - `action_value` (text) - Action target
  - `is_active` (boolean) - Currently active
  - `sort_order` (integer) - Display order
  - `start_date` (timestamptz) - Display start
  - `end_date` (timestamptz) - Display end

  ## Security
  - Enable RLS on all tables
  - Policies for authenticated users to manage their own data
  - Public read access for activities and categories
  - Protected write access for user-generated content
*/

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

-- Create activity_categories table
CREATE TABLE IF NOT EXISTS activity_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_nl text NOT NULL,
  icon text NOT NULL,
  color text DEFAULT '#6B46C1',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON activity_categories FOR SELECT
  TO authenticated, anon
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activities"
  ON activities FOR SELECT
  TO authenticated, anon
  USING (true);

-- Create activity_category_links table
CREATE TABLE IF NOT EXISTS activity_category_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES activity_categories(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(activity_id, category_id)
);

ALTER TABLE activity_category_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity categories"
  ON activity_category_links FOR SELECT
  TO authenticated, anon
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_location ON activities(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_activities_city ON activities(city);
CREATE INDEX IF NOT EXISTS idx_activities_featured ON activities(is_featured);
CREATE INDEX IF NOT EXISTS idx_activities_rating ON activities(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_profile ON favorites(profile_id);
CREATE INDEX IF NOT EXISTS idx_favorites_activity ON favorites(activity_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_date ON scheduled_activities(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_reviews_activity ON reviews(activity_id);

-- Create function to update average rating when reviews change
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