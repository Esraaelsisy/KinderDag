/*
  # Admin Policies for Tags Management

  ## Overview
  Adds admin-level policies for managing tags (activities and categories already have policies).

  ## Security Rules
  - Admin users can perform all CRUD operations on tags
  - For now, all authenticated users can manage content
*/

-- Tags: Allow authenticated users to manage
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

CREATE POLICY "Authenticated users can view all tags"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

-- Tag Links: Allow authenticated users to manage
CREATE POLICY "Authenticated users can insert tag links"
  ON activity_tag_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tag links"
  ON activity_tag_links FOR DELETE
  TO authenticated
  USING (true);

-- Category Links: Allow authenticated users to manage
CREATE POLICY "Authenticated users can insert category links"
  ON activity_category_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete category links"
  ON activity_category_links FOR DELETE
  TO authenticated
  USING (true);
