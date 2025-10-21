/*
  # Tags System for Activities

  ## New Tables Created
  
  ### 1. `tags`
  Tags for special activity promotions and categories
  - `id` (uuid, primary key)
  - `name` (text, unique) - Tag name (e.g., "Don't Miss This Week", "Season", "Offers")
  - `slug` (text, unique) - URL-friendly slug
  - `description` (text) - Tag description
  - `color` (text) - Display color hex code
  - `icon` (text) - Icon identifier
  - `is_active` (boolean) - Whether tag is currently active
  - `sort_order` (integer) - Display order
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `activity_tag_links`
  Many-to-many relationship between activities and tags
  - `id` (uuid, primary key)
  - `activity_id` (uuid) - References activities.id
  - `tag_id` (uuid) - References tags.id
  - `created_at` (timestamptz)
  - Unique constraint on (activity_id, tag_id)

  ## Security
  - Enable RLS on both tables
  - Public read access for tags and links
  - Admin policies will be added separately for write operations

  ## Important Notes
  - Tags are flexible promotional labels that can be assigned to activities
  - Common examples: "Don't Miss", "Seasonal", "Limited Offer", "Hot Pick", "Catch It Before It Ends"
  - Multiple tags can be assigned to a single activity
  - Tags can be activated/deactivated without deleting them
*/

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'tag',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tags"
  ON tags FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Create activity_tag_links table
CREATE TABLE IF NOT EXISTS activity_tag_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(activity_id, tag_id)
);

ALTER TABLE activity_tag_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity tags"
  ON activity_tag_links FOR SELECT
  TO authenticated, anon
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tags_active ON tags(is_active);
CREATE INDEX IF NOT EXISTS idx_tags_sort_order ON tags(sort_order);
CREATE INDEX IF NOT EXISTS idx_activity_tag_links_activity ON activity_tag_links(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_tag_links_tag ON activity_tag_links(tag_id);

-- Insert some common default tags
INSERT INTO tags (name, slug, description, color, icon, sort_order) VALUES
  ('Don''t Miss This Week', 'dont-miss', 'Must-see activities this week', '#EF4444', 'star', 1),
  ('Seasonal Activity', 'seasonal', 'Available only during specific seasons', '#F59E0B', 'calendar', 2),
  ('Special Offer', 'special-offer', 'Activities with special discounts or promotions', '#10B981', 'tag', 3),
  ('Hot Pick', 'hot-pick', 'Popular activities with high ratings', '#F97316', 'flame', 4),
  ('Catch It Before It Ends', 'ending-soon', 'Activities ending soon', '#8B5CF6', 'clock', 5),
  ('Family Favorite', 'family-favorite', 'Loved by families', '#EC4899', 'heart', 6)
ON CONFLICT (slug) DO NOTHING;
