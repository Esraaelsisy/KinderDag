/*
  # Add Admin Policies for Activity Management

  ## Overview
  Adds RLS policies to allow authenticated users to manage activities and categories.
  This enables the admin panel functionality for curating activities.

  ## Changes
  1. Add INSERT policy for activities (authenticated users)
  2. Add UPDATE policy for activities (authenticated users)
  3. Add DELETE policy for activities (authenticated users)
  4. Add INSERT policy for activity_category_links (authenticated users)
  5. Add DELETE policy for activity_category_links (authenticated users)
  6. Add INSERT policy for activity_categories (authenticated users)

  ## Security Notes
  - Currently allows all authenticated users to manage activities
  - Can be restricted to specific admin roles in future updates
  - Categories and activities remain publicly readable
*/

-- Allow authenticated users to insert activities
CREATE POLICY "Authenticated users can insert activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update activities
CREATE POLICY "Authenticated users can update activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete activities
CREATE POLICY "Authenticated users can delete activities"
  ON activities FOR DELETE
  TO authenticated
  USING (true);

-- Allow authenticated users to link categories to activities
CREATE POLICY "Authenticated users can link categories"
  ON activity_category_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to unlink categories from activities
CREATE POLICY "Authenticated users can unlink categories"
  ON activity_category_links FOR DELETE
  TO authenticated
  USING (true);

-- Allow authenticated users to create new categories
CREATE POLICY "Authenticated users can insert categories"
  ON activity_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);