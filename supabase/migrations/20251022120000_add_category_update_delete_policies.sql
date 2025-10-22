/*
  # Add UPDATE and DELETE Policies for Categories

  ## Overview
  Adds missing RLS policies to allow authenticated users to update and delete categories.
  This completes the admin functionality for category management.

  ## Changes
  1. Add UPDATE policy for activity_categories (authenticated users)
  2. Add DELETE policy for activity_categories (authenticated users)

  ## Security Notes
  - Currently allows all authenticated users to manage categories
  - Matches existing pattern for activities management
  - Can be restricted to specific admin roles in future updates
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
