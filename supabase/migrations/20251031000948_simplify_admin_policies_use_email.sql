/*
  # Simplify Admin Policies - Use Email Check

  1. Changes
    - Replace all admin policies to check user email directly
    - Use auth.jwt() ->> 'email' for direct email access
    - Allow specific admin emails to perform operations

  2. Security
    - Only whitelisted admin emails can perform admin operations
    - Simple and reliable approach without metadata dependencies
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
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  );

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  );

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  );

-- Venues table policies
CREATE POLICY "Admins can insert venues"
  ON venues FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  );

CREATE POLICY "Admins can update venues"
  ON venues FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  );

CREATE POLICY "Admins can delete venues"
  ON venues FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  );

-- Places table policies
CREATE POLICY "Admins can insert places"
  ON places FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  );

CREATE POLICY "Admins can update places"
  ON places FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  );

CREATE POLICY "Admins can delete places"
  ON places FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  );

-- Event category links policies
CREATE POLICY "Admins can insert event category links"
  ON event_category_links FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  );

CREATE POLICY "Admins can delete event category links"
  ON event_category_links FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  );

-- Venue category links policies
CREATE POLICY "Admins can insert venue category links"
  ON venue_category_links FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  );

CREATE POLICY "Admins can delete venue category links"
  ON venue_category_links FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'esraa.elsisy@gmail.com'
  );
