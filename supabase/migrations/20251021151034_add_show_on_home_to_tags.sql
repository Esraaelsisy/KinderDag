/*
  # Add Home Visibility Flag to Tags

  1. Changes to `tags` table
    - Add `show_on_home` flag to control visibility on home screen carousel
    - Update existing tags with default value (false)

  2. Indexing
    - Add index for show_on_home for efficient filtering
    - Ensure sort_order index exists for both tags and categories

  3. Notes
    - Tags with show_on_home=true will appear as carousels on home screen
    - Sort_order determines the order of appearance
*/

-- Add show_on_home to tags if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tags' AND column_name = 'show_on_home'
  ) THEN
    ALTER TABLE tags ADD COLUMN show_on_home boolean DEFAULT false;
  END IF;
END $$;

-- Create index for filtering tags shown on home
CREATE INDEX IF NOT EXISTS idx_tags_show_on_home ON tags(show_on_home) WHERE show_on_home = true;

-- Create index for sorting tags
CREATE INDEX IF NOT EXISTS idx_tags_sort_order ON tags(sort_order);

-- Ensure activity_categories has sort_order index
CREATE INDEX IF NOT EXISTS idx_activity_categories_sort_order ON activity_categories(sort_order);