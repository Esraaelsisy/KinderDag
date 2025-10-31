/*
  # Add Admin Policies for Events and Venues

  1. Changes
    - Add INSERT policy for events table (admin users only)
    - Add UPDATE policy for events table (admin users only)
    - Add DELETE policy for events table (admin users only)
    - Add INSERT policy for venues table (admin users only)
    - Add UPDATE policy for venues table (admin users only)
    - Add DELETE policy for venues table (admin users only)
    - Add INSERT policy for places table (admin users only)
    - Add UPDATE policy for places table (admin users only)
    - Add DELETE policy for places table (admin users only)
    - Add policies for event_category_links and venue_category_links tables

  2. Security
    - All admin operations require authentication
    - Admin users identified by checking app_metadata.role = 'admin'
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can insert events" ON events;
DROP POLICY IF EXISTS "Admins can update events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;
DROP POLICY IF EXISTS "Admins can insert venues" ON venues;
DROP POLICY IF EXISTS "Admins can update venues" ON venues;
DROP POLICY IF EXISTS "Admins can delete venues" ON venues;
DROP POLICY IF EXISTS "Admins can insert places" ON places;
DROP POLICY IF EXISTS "Admins can update places" ON places;
DROP POLICY IF EXISTS "Admins can delete places" ON places;
DROP POLICY IF EXISTS "Admins can insert event category links" ON event_category_links;
DROP POLICY IF EXISTS "Admins can delete event category links" ON event_category_links;
DROP POLICY IF EXISTS "Admins can insert venue category links" ON venue_category_links;
DROP POLICY IF EXISTS "Admins can delete venue category links" ON venue_category_links;

-- Events table policies
CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Venues table policies
CREATE POLICY "Admins can insert venues"
  ON venues FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update venues"
  ON venues FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete venues"
  ON venues FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Places table policies
CREATE POLICY "Admins can insert places"
  ON places FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update places"
  ON places FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete places"
  ON places FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Event category links policies
CREATE POLICY "Admins can insert event category links"
  ON event_category_links FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete event category links"
  ON event_category_links FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Venue category links policies
CREATE POLICY "Admins can insert venue category links"
  ON venue_category_links FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete venue category links"
  ON venue_category_links FOR DELETE
  TO authenticated
  USING (
    (auth.jwt()->>'email')::text IN (
      SELECT email FROM auth.users WHERE raw_app_meta_data->>'role' = 'admin'
    )
  );
