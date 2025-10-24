/*
  # Fix Favorites and Tags Rewiring

  ## Summary
  Complete the rewiring of favorites and tags to work with venues and events tables.

  ## Changes

  ### 1. Favorites Table
  - Make activity_id nullable (for backward compatibility)
  - Ensure constraints are properly enforced
  - Update policies if needed

  ### 2. Tags System
  - Create venue_tag_links table
  - Create event_tag_links table
  - Migrate existing activity_tag_links to venue_tag_links
  - Keep activity_tag_links for compatibility view

  ## Security
  - Enable RLS on new tables
  - Add appropriate policies
*/

-- =====================================================
-- STEP 1: Fix favorites table
-- =====================================================

-- Make activity_id nullable
DO $$
BEGIN
  -- Drop the NOT NULL constraint if it exists
  ALTER TABLE favorites ALTER COLUMN activity_id DROP NOT NULL;
END $$;

-- Update the constraint to allow activity_id OR (venue_id OR event_id)
DO $$
BEGIN
  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'favorites_exactly_one_reference'
  ) THEN
    ALTER TABLE favorites DROP CONSTRAINT favorites_exactly_one_reference;
  END IF;

  -- Add new constraint
  ALTER TABLE favorites ADD CONSTRAINT favorites_exactly_one_reference
    CHECK (
      -- Either use the new system (venue_id or event_id)
      (venue_id IS NOT NULL AND event_id IS NULL AND activity_id IS NULL) OR
      (venue_id IS NULL AND event_id IS NOT NULL AND activity_id IS NULL) OR
      -- Or use the old system (activity_id for compatibility)
      (venue_id IS NULL AND event_id IS NULL AND activity_id IS NOT NULL)
    );
END $$;

-- =====================================================
-- STEP 2: Fix scheduled_activities table
-- =====================================================

DO $$
BEGIN
  -- Make activity_id nullable
  ALTER TABLE scheduled_activities ALTER COLUMN activity_id DROP NOT NULL;

  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_exactly_one_reference'
  ) THEN
    ALTER TABLE scheduled_activities DROP CONSTRAINT scheduled_exactly_one_reference;
  END IF;

  -- Add new constraint
  ALTER TABLE scheduled_activities ADD CONSTRAINT scheduled_exactly_one_reference
    CHECK (
      (venue_id IS NOT NULL AND event_id IS NULL AND activity_id IS NULL) OR
      (venue_id IS NULL AND event_id IS NOT NULL AND activity_id IS NULL) OR
      (venue_id IS NULL AND event_id IS NULL AND activity_id IS NOT NULL)
    );
END $$;

-- =====================================================
-- STEP 3: Fix reviews table
-- =====================================================

DO $$
BEGIN
  -- Make activity_id nullable
  ALTER TABLE reviews ALTER COLUMN activity_id DROP NOT NULL;

  -- Drop old constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_exactly_one_reference'
  ) THEN
    ALTER TABLE reviews DROP CONSTRAINT reviews_exactly_one_reference;
  END IF;

  -- Add new constraint
  ALTER TABLE reviews ADD CONSTRAINT reviews_exactly_one_reference
    CHECK (
      (venue_id IS NOT NULL AND event_id IS NULL AND activity_id IS NULL) OR
      (venue_id IS NULL AND event_id IS NOT NULL AND activity_id IS NULL) OR
      (venue_id IS NULL AND event_id IS NULL AND activity_id IS NOT NULL)
    );
END $$;

-- =====================================================
-- STEP 4: Create venue_tag_links table
-- =====================================================

CREATE TABLE IF NOT EXISTS venue_tag_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(venue_id, tag_id)
);

ALTER TABLE venue_tag_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view venue tags"
  ON venue_tag_links FOR SELECT
  TO authenticated, anon
  USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_venue_tag_links_venue ON venue_tag_links(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_tag_links_tag ON venue_tag_links(tag_id);

-- =====================================================
-- STEP 5: Create event_tag_links table
-- =====================================================

CREATE TABLE IF NOT EXISTS event_tag_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, tag_id)
);

ALTER TABLE event_tag_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event tags"
  ON event_tag_links FOR SELECT
  TO authenticated, anon
  USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_event_tag_links_event ON event_tag_links(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tag_links_tag ON event_tag_links(tag_id);

-- =====================================================
-- STEP 6: Migrate existing activity_tag_links to venue_tag_links
-- =====================================================

-- Migrate tags for activities that became venues
INSERT INTO venue_tag_links (venue_id, tag_id, created_at)
SELECT 
  v.id,
  atl.tag_id,
  atl.created_at
FROM activity_tag_links atl
JOIN venues v ON v.id = atl.activity_id
ON CONFLICT (venue_id, tag_id) DO NOTHING;

-- =====================================================
-- STEP 7: Add admin policies for tag management
-- =====================================================

-- Check if is_admin function exists, if not create a placeholder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_admin'
  ) THEN
    -- Create a simple is_admin function
    -- You can update this later with your actual admin check logic
    CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
    RETURNS boolean AS $func$
    BEGIN
      -- For now, check if user has a specific role or metadata
      -- This is a placeholder - adjust based on your auth setup
      RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = user_id
        AND raw_app_meta_data->>'role' = 'admin'
      );
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
  END IF;
END $$;

-- Add admin policies for venue_tag_links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'venue_tag_links' 
    AND policyname = 'Admins can insert venue tags'
  ) THEN
    CREATE POLICY "Admins can insert venue tags"
      ON venue_tag_links FOR INSERT
      TO authenticated
      WITH CHECK (is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'venue_tag_links' 
    AND policyname = 'Admins can delete venue tags'
  ) THEN
    CREATE POLICY "Admins can delete venue tags"
      ON venue_tag_links FOR DELETE
      TO authenticated
      USING (is_admin(auth.uid()));
  END IF;
END $$;

-- Add admin policies for event_tag_links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'event_tag_links' 
    AND policyname = 'Admins can insert event tags'
  ) THEN
    CREATE POLICY "Admins can insert event tags"
      ON event_tag_links FOR INSERT
      TO authenticated
      WITH CHECK (is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'event_tag_links' 
    AND policyname = 'Admins can delete event tags'
  ) THEN
    CREATE POLICY "Admins can delete event tags"
      ON event_tag_links FOR DELETE
      TO authenticated
      USING (is_admin(auth.uid()));
  END IF;
END $$;
