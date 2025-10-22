/*
  # Add UPDATE and DELETE policies for activity_categories

  1. Security Changes
    - Add policy allowing authenticated users to update categories
    - Add policy allowing authenticated users to delete categories
  
  2. Notes
    - These policies are required for the admin panel to edit and delete categories
    - Without these policies, UPDATE and DELETE operations fail with RLS restrictions
*/

-- Allow authenticated users to update categories
CREATE POLICY "Authenticated users can update categories"
  ON activity_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete categories
CREATE POLICY "Authenticated users can delete categories"
  ON activity_categories FOR DELETE
  TO authenticated
  USING (true);
