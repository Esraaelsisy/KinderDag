/*
  # Fix Admin Policies - Use JWT Metadata

  1. Changes
    - Replace all admin policies to use JWT metadata directly
    - Remove dependency on querying auth.users table
    - Check raw_app_meta_data->>'role' = 'admin' from JWT

  2. Security
    - Admin users identified by JWT metadata only
    - No table queries needed, preventing permission errors
*/

-- Drop existing policies
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
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Venues table policies
CREATE POLICY "Admins can insert venues"
  ON venues FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update venues"
  ON venues FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete venues"
  ON venues FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Places table policies
CREATE POLICY "Admins can insert places"
  ON places FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update places"
  ON places FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete places"
  ON places FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Event category links policies
CREATE POLICY "Admins can insert event category links"
  ON event_category_links FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete event category links"
  ON event_category_links FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Venue category links policies
CREATE POLICY "Admins can insert venue category links"
  ON venue_category_links FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete venue category links"
  ON venue_category_links FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
