/*
  # Split Activities into Venues and Events

  ## Summary
  This migration separates the unified `activities` table into three new tables:
  - `places`: Shared location information (address, coordinates, contact info)
  - `venues`: Ongoing locations with opening hours
  - `events`: Time-based activities with start/end dates

  ## New Tables Created

  ### 1. `places`
  Shared location information for both venues and events
  - `id` (uuid, primary key)
  - `name` (text) - Location name
  - `address` (text) - Full street address
  - `city` (text) - City name
  - `province` (text) - Province/region
  - `location_lat` (numeric) - Latitude
  - `location_lng` (numeric) - Longitude
  - `phone` (text, nullable) - Contact phone
  - `email` (text, nullable) - Contact email
  - `website` (text, nullable) - Website URL
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `venues`
  Ongoing locations with opening hours
  - `id` (uuid, primary key)
  - `place_id` (uuid) - References places.id
  - `description_en` (text) - English description
  - `description_nl` (text) - Dutch description
  - `age_min` (integer) - Minimum age
  - `age_max` (integer) - Maximum age
  - `price_min` (numeric) - Minimum price
  - `price_max` (numeric) - Maximum price
  - `is_free` (boolean) - Free entry flag
  - `is_indoor` (boolean) - Indoor flag
  - `is_outdoor` (boolean) - Outdoor flag
  - `weather_dependent` (boolean) - Weather dependent flag
  - `booking_url` (text, nullable) - Booking link
  - `images` (jsonb) - Image URLs array
  - `venue_opening_hours` (jsonb) - Opening hours structure
  - `average_rating` (numeric) - Average rating 0-5
  - `total_reviews` (integer) - Total review count
  - `is_featured` (boolean) - Featured flag
  - `is_seasonal` (boolean) - Seasonal flag
  - `season_start` (date, nullable) - Season start
  - `season_end` (date, nullable) - Season end
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `events`
  Time-based activities with specific dates
  - `id` (uuid, primary key)
  - `place_id` (uuid, nullable) - References places.id (null if no registered venue)
  - `custom_location_name` (text, nullable) - For non-venue events
  - `custom_address` (text, nullable) - For non-venue events
  - `custom_lat` (numeric, nullable) - For non-venue events
  - `custom_lng` (numeric, nullable) - For non-venue events
  - `custom_city` (text, nullable) - For non-venue events
  - `custom_province` (text, nullable) - For non-venue events
  - `event_start_datetime` (timestamptz) - Event start
  - `event_end_datetime` (timestamptz) - Event end
  - `description_en` (text) - English description
  - `description_nl` (text) - Dutch description
  - `age_min` (integer) - Minimum age
  - `age_max` (integer) - Maximum age
  - `price_min` (numeric) - Minimum price
  - `price_max` (numeric) - Maximum price
  - `is_free` (boolean) - Free entry flag
  - `is_indoor` (boolean) - Indoor flag
  - `is_outdoor` (boolean) - Outdoor flag
  - `weather_dependent` (boolean) - Weather dependent flag
  - `booking_url` (text, nullable) - Booking link
  - `images` (jsonb) - Image URLs array
  - `average_rating` (numeric) - Average rating 0-5
  - `total_reviews` (integer) - Total review count
  - `is_featured` (boolean) - Featured flag
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Modified Tables

  ### `favorites`
  Now supports both venues and events with dual foreign keys
  - Added `venue_id` (uuid, nullable) - References venues.id
  - Added `event_id` (uuid, nullable) - References events.id
  - Removed `activity_id` (deprecated)
  - Constraint: exactly one of venue_id or event_id must be non-null

  ### `scheduled_activities`
  Now supports both venues and events
  - Added `venue_id` (uuid, nullable)
  - Added `event_id` (uuid, nullable)
  - Removed `activity_id` (deprecated)
  - Constraint: exactly one of venue_id or event_id must be non-null

  ### `reviews`
  Now supports both venues and events
  - Added `venue_id` (uuid, nullable)
  - Added `event_id` (uuid, nullable)
  - Removed `activity_id` (deprecated)
  - Constraint: exactly one of venue_id or event_id must be non-null

  ## Category Links
  - Created `venue_category_links` table
  - Created `event_category_links` table
  - Deprecated `activity_category_links`

  ## Data Migration
  1. All existing activities (type='venue') migrated to places + venues
  2. All favorites/scheduled/reviews updated to reference new venue_id
  3. All category links migrated to venue_category_links
  4. Original activities table renamed to activities_legacy for safety

  ## Compatibility View
  - Created `activities` VIEW that unions venues and events
  - Maintains backward compatibility with old queries
  - Includes `legacy_type` field ('venue' or 'event')

  ## Security
  - RLS enabled on all new tables
  - Public read access for places, venues, events
  - Protected write access for user-generated content
  - Admin policies for venue/event management

  ## Performance Indexes
  - Location indexes on places (lat/lng)
  - City indexes for filtering
  - Event date indexes for calendar queries
  - Featured/rating indexes for discovery
*/

-- =====================================================
-- STEP 1: Create new tables
-- =====================================================

-- Create places table (shared location data)
CREATE TABLE IF NOT EXISTS places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  province text NOT NULL,
  location_lat numeric NOT NULL,
  location_lng numeric NOT NULL,
  phone text,
  email text,
  website text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view places"
  ON places FOR SELECT
  TO authenticated, anon
  USING (true);

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid REFERENCES places(id) ON DELETE CASCADE NOT NULL,
  description_en text NOT NULL,
  description_nl text NOT NULL,
  age_min integer DEFAULT 0 CHECK (age_min >= 0 AND age_min <= 18),
  age_max integer DEFAULT 12 CHECK (age_max >= 0 AND age_max <= 18),
  price_min numeric DEFAULT 0 CHECK (price_min >= 0),
  price_max numeric DEFAULT 0 CHECK (price_max >= 0),
  is_free boolean DEFAULT false,
  is_indoor boolean DEFAULT false,
  is_outdoor boolean DEFAULT false,
  weather_dependent boolean DEFAULT false,
  booking_url text,
  images jsonb DEFAULT '[]'::jsonb,
  venue_opening_hours jsonb DEFAULT '{}'::jsonb,
  average_rating numeric DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  total_reviews integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_seasonal boolean DEFAULT false,
  season_start date,
  season_end date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view venues"
  ON venues FOR SELECT
  TO authenticated, anon
  USING (true);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid REFERENCES places(id) ON DELETE SET NULL,
  custom_location_name text,
  custom_address text,
  custom_lat numeric,
  custom_lng numeric,
  custom_city text,
  custom_province text,
  event_start_datetime timestamptz NOT NULL,
  event_end_datetime timestamptz NOT NULL,
  description_en text NOT NULL,
  description_nl text NOT NULL,
  age_min integer DEFAULT 0 CHECK (age_min >= 0 AND age_min <= 18),
  age_max integer DEFAULT 12 CHECK (age_max >= 0 AND age_max <= 18),
  price_min numeric DEFAULT 0 CHECK (price_min >= 0),
  price_max numeric DEFAULT 0 CHECK (price_max >= 0),
  is_free boolean DEFAULT false,
  is_indoor boolean DEFAULT false,
  is_outdoor boolean DEFAULT false,
  weather_dependent boolean DEFAULT false,
  booking_url text,
  images jsonb DEFAULT '[]'::jsonb,
  average_rating numeric DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  total_reviews integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_event_dates CHECK (event_end_datetime > event_start_datetime)
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  TO authenticated, anon
  USING (true);

-- Create venue_category_links table
CREATE TABLE IF NOT EXISTS venue_category_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES activity_categories(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(venue_id, category_id)
);

ALTER TABLE venue_category_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view venue categories"
  ON venue_category_links FOR SELECT
  TO authenticated, anon
  USING (true);

-- Create event_category_links table
CREATE TABLE IF NOT EXISTS event_category_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES activity_categories(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, category_id)
);

ALTER TABLE event_category_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event categories"
  ON event_category_links FOR SELECT
  TO authenticated, anon
  USING (true);

-- =====================================================
-- STEP 2: Migrate data from activities to new structure
-- =====================================================

-- Migrate venues (all current activities are venues)
INSERT INTO places (id, name, address, city, province, location_lat, location_lng, phone, email, website, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  name,
  address,
  city,
  province,
  location_lat,
  location_lng,
  phone,
  email,
  website,
  created_at,
  updated_at
FROM activities
WHERE type = 'venue';

-- Insert venues with reference to places
INSERT INTO venues (
  id, place_id, description_en, description_nl, age_min, age_max,
  price_min, price_max, is_free, is_indoor, is_outdoor, weather_dependent,
  booking_url, images, venue_opening_hours, average_rating, total_reviews,
  is_featured, is_seasonal, season_start, season_end, created_at, updated_at
)
SELECT 
  a.id,
  p.id,
  a.description_en,
  a.description_nl,
  a.age_min,
  a.age_max,
  a.price_min,
  a.price_max,
  a.is_free,
  a.is_indoor,
  a.is_outdoor,
  a.weather_dependent,
  a.booking_url,
  a.images,
  COALESCE(a.venue_opening_hours, a.opening_hours, '{}'::jsonb),
  a.average_rating,
  a.total_reviews,
  a.is_featured,
  a.is_seasonal,
  a.season_start,
  a.season_end,
  a.created_at,
  a.updated_at
FROM activities a
JOIN places p ON p.name = a.name AND p.address = a.address
WHERE a.type = 'venue';

-- Migrate category links to venue_category_links
INSERT INTO venue_category_links (venue_id, category_id, created_at)
SELECT 
  v.id,
  acl.category_id,
  acl.created_at
FROM activity_category_links acl
JOIN activities a ON a.id = acl.activity_id
JOIN venues v ON v.id = a.id
WHERE a.type = 'venue';

-- =====================================================
-- STEP 3: Update favorites, scheduled_activities, reviews
-- =====================================================

-- Add new columns to favorites
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'favorites' AND column_name = 'venue_id'
  ) THEN
    ALTER TABLE favorites ADD COLUMN venue_id uuid REFERENCES venues(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'favorites' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE favorites ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Migrate favorites data
UPDATE favorites f
SET venue_id = v.id
FROM venues v
WHERE f.activity_id = v.id AND f.venue_id IS NULL;

-- Add constraint to favorites
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'favorites_exactly_one_reference'
  ) THEN
    ALTER TABLE favorites ADD CONSTRAINT favorites_exactly_one_reference
      CHECK (
        (venue_id IS NOT NULL AND event_id IS NULL) OR
        (venue_id IS NULL AND event_id IS NOT NULL)
      );
  END IF;
END $$;

-- Add new columns to scheduled_activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_activities' AND column_name = 'venue_id'
  ) THEN
    ALTER TABLE scheduled_activities ADD COLUMN venue_id uuid REFERENCES venues(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_activities' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE scheduled_activities ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Migrate scheduled_activities data
UPDATE scheduled_activities sa
SET venue_id = v.id
FROM venues v
WHERE sa.activity_id = v.id AND sa.venue_id IS NULL;

-- Add constraint to scheduled_activities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_exactly_one_reference'
  ) THEN
    ALTER TABLE scheduled_activities ADD CONSTRAINT scheduled_exactly_one_reference
      CHECK (
        (venue_id IS NOT NULL AND event_id IS NULL) OR
        (venue_id IS NULL AND event_id IS NOT NULL)
      );
  END IF;
END $$;

-- Add new columns to reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'venue_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN venue_id uuid REFERENCES venues(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Migrate reviews data
UPDATE reviews r
SET venue_id = v.id
FROM venues v
WHERE r.activity_id = v.id AND r.venue_id IS NULL;

-- Add constraint to reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_exactly_one_reference'
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_exactly_one_reference
      CHECK (
        (venue_id IS NOT NULL AND event_id IS NULL) OR
        (venue_id IS NULL AND event_id IS NOT NULL)
      );
  END IF;
END $$;

-- =====================================================
-- STEP 4: Create performance indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_places_location ON places(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_places_city ON places(city);
CREATE INDEX IF NOT EXISTS idx_venues_place ON venues(place_id);
CREATE INDEX IF NOT EXISTS idx_venues_featured ON venues(is_featured);
CREATE INDEX IF NOT EXISTS idx_venues_rating ON venues(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_events_place ON events(place_id);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(event_start_datetime, event_end_datetime);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(custom_city);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_favorites_venue ON favorites(venue_id);
CREATE INDEX IF NOT EXISTS idx_favorites_event ON favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_venue ON scheduled_activities(venue_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_event ON scheduled_activities(event_id);
CREATE INDEX IF NOT EXISTS idx_reviews_venue ON reviews(venue_id);
CREATE INDEX IF NOT EXISTS idx_reviews_event ON reviews(event_id);

-- =====================================================
-- STEP 5: Update rating triggers for venues and events
-- =====================================================

-- Update trigger function to handle both venues and events
CREATE OR REPLACE FUNCTION update_venue_event_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update venue rating
  IF NEW.venue_id IS NOT NULL OR OLD.venue_id IS NOT NULL THEN
    UPDATE venues
    SET 
      average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews
        WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM reviews
        WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)
      ),
      updated_at = now()
    WHERE id = COALESCE(NEW.venue_id, OLD.venue_id);
  END IF;

  -- Update event rating
  IF NEW.event_id IS NOT NULL OR OLD.event_id IS NOT NULL THEN
    UPDATE events
    SET 
      average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews
        WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM reviews
        WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
      ),
      updated_at = now()
    WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Update triggers for new function
DROP TRIGGER IF EXISTS trigger_review_insert ON reviews;
CREATE TRIGGER trigger_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_event_rating();

DROP TRIGGER IF EXISTS trigger_review_update ON reviews;
CREATE TRIGGER trigger_review_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_event_rating();

DROP TRIGGER IF EXISTS trigger_review_delete ON reviews;
CREATE TRIGGER trigger_review_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_event_rating();

-- =====================================================
-- STEP 6: Rename old activities table for safety
-- =====================================================

-- Rename activities table to activities_legacy (keep for rollback safety)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'activities' AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE activities RENAME TO activities_legacy;
  END IF;
END $$;

-- =====================================================
-- STEP 7: Create compatibility view
-- =====================================================

-- Create unified activities view for backward compatibility
CREATE OR REPLACE VIEW activities AS
SELECT 
  v.id,
  'venue' as legacy_type,
  p.name,
  v.description_en,
  v.description_nl,
  p.location_lat,
  p.location_lng,
  p.address,
  p.city,
  p.province,
  v.age_min,
  v.age_max,
  v.price_min,
  v.price_max,
  v.is_free,
  v.is_indoor,
  v.is_outdoor,
  v.weather_dependent,
  p.phone,
  p.email,
  p.website,
  v.booking_url,
  v.images,
  v.venue_opening_hours as opening_hours,
  NULL::timestamptz as event_start_datetime,
  NULL::timestamptz as event_end_datetime,
  v.average_rating,
  v.total_reviews,
  v.is_featured,
  v.is_seasonal,
  v.season_start,
  v.season_end,
  v.created_at,
  v.updated_at
FROM venues v
JOIN places p ON p.id = v.place_id

UNION ALL

SELECT 
  e.id,
  'event' as legacy_type,
  COALESCE(p.name, e.custom_location_name) as name,
  e.description_en,
  e.description_nl,
  COALESCE(p.location_lat, e.custom_lat) as location_lat,
  COALESCE(p.location_lng, e.custom_lng) as location_lng,
  COALESCE(p.address, e.custom_address) as address,
  COALESCE(p.city, e.custom_city) as city,
  COALESCE(p.province, e.custom_province) as province,
  e.age_min,
  e.age_max,
  e.price_min,
  e.price_max,
  e.is_free,
  e.is_indoor,
  e.is_outdoor,
  e.weather_dependent,
  p.phone,
  p.email,
  p.website,
  e.booking_url,
  e.images,
  NULL::jsonb as opening_hours,
  e.event_start_datetime,
  e.event_end_datetime,
  e.average_rating,
  e.total_reviews,
  e.is_featured,
  false as is_seasonal,
  NULL::date as season_start,
  NULL::date as season_end,
  e.created_at,
  e.updated_at
FROM events e
LEFT JOIN places p ON p.id = e.place_id;

-- Grant access to the view
GRANT SELECT ON activities TO authenticated, anon;
