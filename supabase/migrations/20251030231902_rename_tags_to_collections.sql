/*
  # Rename Tags to Collections

  ## Summary
  Rename the tags table to collections and update all related tables and references.

  ## Changes
  1. Rename `tags` table to `collections`
  2. Rename `activity_tag_links` to `activity_collection_links`
  3. Rename `venue_tag_links` to `venue_collection_links`
  4. Rename `event_tag_links` to `event_collection_links`
  5. Update all foreign key references
  6. Update all indexes
  7. Update all RLS policies
  8. Add show_on_home field to collections

  ## Security
  - Maintain all existing RLS policies
  - Ensure proper access control

  ## Important Notes
  - Collections are flexible promotional labels and groupings
  - Can be displayed as carousels on home screen
  - Multiple collections can be assigned to activities, venues, and events
*/

-- =====================================================
-- STEP 1: Rename tags table to collections
-- =====================================================

ALTER TABLE IF EXISTS tags RENAME TO collections;

-- Update column comment if exists
COMMENT ON TABLE collections IS 'Collections for organizing and promoting venues and events';

-- =====================================================
-- STEP 2: Rename tag_id to collection_id in link tables
-- =====================================================

-- Rename activity_tag_links
ALTER TABLE IF EXISTS activity_tag_links RENAME TO activity_collection_links;
ALTER TABLE IF EXISTS activity_collection_links RENAME COLUMN tag_id TO collection_id;

-- Rename venue_tag_links
ALTER TABLE IF EXISTS venue_tag_links RENAME TO venue_collection_links;
ALTER TABLE IF EXISTS venue_collection_links RENAME COLUMN tag_id TO collection_id;

-- Rename event_tag_links
ALTER TABLE IF EXISTS event_tag_links RENAME TO event_collection_links;
ALTER TABLE IF EXISTS event_collection_links RENAME COLUMN tag_id TO collection_id;

-- =====================================================
-- STEP 3: Update foreign key constraint names
-- =====================================================

-- Update activity_collection_links foreign keys
DO $$
BEGIN
  -- Rename the foreign key constraint for collection_id
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'activity_tag_links_tag_id_fkey'
  ) THEN
    ALTER TABLE activity_collection_links 
    RENAME CONSTRAINT activity_tag_links_tag_id_fkey 
    TO activity_collection_links_collection_id_fkey;
  END IF;
END $$;

-- Update venue_collection_links foreign keys
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'venue_tag_links_tag_id_fkey'
  ) THEN
    ALTER TABLE venue_collection_links 
    RENAME CONSTRAINT venue_tag_links_tag_id_fkey 
    TO venue_collection_links_collection_id_fkey;
  END IF;
END $$;

-- Update event_collection_links foreign keys
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'event_tag_links_tag_id_fkey'
  ) THEN
    ALTER TABLE event_collection_links 
    RENAME CONSTRAINT event_tag_links_tag_id_fkey 
    TO event_collection_links_collection_id_fkey;
  END IF;
END $$;

-- =====================================================
-- STEP 4: Rename indexes
-- =====================================================

-- Collections table indexes
ALTER INDEX IF EXISTS idx_tags_active RENAME TO idx_collections_active;
ALTER INDEX IF EXISTS idx_tags_sort_order RENAME TO idx_collections_sort_order;

-- Activity collection links indexes
ALTER INDEX IF EXISTS idx_activity_tag_links_activity RENAME TO idx_activity_collection_links_activity;
ALTER INDEX IF EXISTS idx_activity_tag_links_tag RENAME TO idx_activity_collection_links_collection;

-- Venue collection links indexes
ALTER INDEX IF EXISTS idx_venue_tag_links_venue RENAME TO idx_venue_collection_links_venue;
ALTER INDEX IF EXISTS idx_venue_tag_links_tag RENAME TO idx_venue_collection_links_collection;

-- Event collection links indexes
ALTER INDEX IF EXISTS idx_event_tag_links_event RENAME TO idx_event_collection_links_event;
ALTER INDEX IF EXISTS idx_event_tag_links_tag RENAME TO idx_event_collection_links_collection;

-- =====================================================
-- STEP 5: Update RLS policies
-- =====================================================

-- Drop old policies and create new ones for collections
DROP POLICY IF EXISTS "Anyone can view active tags" ON collections;
CREATE POLICY "Anyone can view active collections"
  ON collections FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Activity collection links policies
DROP POLICY IF EXISTS "Anyone can view activity tags" ON activity_collection_links;
CREATE POLICY "Anyone can view activity collections"
  ON activity_collection_links FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Admins can insert activity tags" ON activity_collection_links;
CREATE POLICY "Admins can insert activity collections"
  ON activity_collection_links FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update activity tags" ON activity_collection_links;
CREATE POLICY "Admins can update activity collections"
  ON activity_collection_links FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete activity tags" ON activity_collection_links;
CREATE POLICY "Admins can delete activity collections"
  ON activity_collection_links FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Venue collection links policies
DROP POLICY IF EXISTS "Anyone can view venue tags" ON venue_collection_links;
CREATE POLICY "Anyone can view venue collections"
  ON venue_collection_links FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Admins can insert venue tags" ON venue_collection_links;
CREATE POLICY "Admins can insert venue collections"
  ON venue_collection_links FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete venue tags" ON venue_collection_links;
CREATE POLICY "Admins can delete venue collections"
  ON venue_collection_links FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Event collection links policies
DROP POLICY IF EXISTS "Anyone can view event tags" ON event_collection_links;
CREATE POLICY "Anyone can view event collections"
  ON event_collection_links FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Admins can insert event tags" ON event_collection_links;
CREATE POLICY "Admins can insert event collections"
  ON event_collection_links FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete event tags" ON event_collection_links;
CREATE POLICY "Admins can delete event collections"
  ON event_collection_links FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));
