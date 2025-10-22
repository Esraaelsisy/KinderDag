/*
  Populate Missing Data for Kinderdag App

  This script:
  1. Inserts 9 activity categories
  2. Links 10 existing activities to their appropriate categories
  3. Links activities to existing tags

  Safe to run multiple times - uses ON CONFLICT DO NOTHING
*/

-- =============================================
-- 1. INSERT CATEGORIES
-- =============================================

INSERT INTO activity_categories (name_en, name_nl, icon, color, sort_order) VALUES
  ('Theme Parks', 'Pretparken', 'ferris-wheel', '#FF6B6B', 1),
  ('Museums', 'Musea', 'building-2', '#4ECDC4', 2),
  ('Outdoor Play', 'Buiten Spelen', 'trees', '#95E1D3', 3),
  ('Animals & Nature', 'Dieren & Natuur', 'bird', '#F9A826', 4),
  ('Indoor Play', 'Binnen Spelen', 'home', '#AA96DA', 5),
  ('Water Activities', 'Wateractiviteiten', 'waves', '#5DADE2', 6),
  ('Sports & Active', 'Sport & Actief', 'activity', '#FF8C42', 7),
  ('Creative & Arts', 'Creatief & Kunst', 'palette', '#E74C3C', 8),
  ('Educational', 'Educatief', 'book-open', '#3498DB', 9)
ON CONFLICT DO NOTHING;

-- =============================================
-- 2. LINK ACTIVITIES TO CATEGORIES
-- =============================================

-- Efteling Theme Park → Theme Parks
INSERT INTO activity_category_links (activity_id, category_id)
SELECT a.id, c.id
FROM activities a, activity_categories c
WHERE a.name = 'Efteling Theme Park' AND c.name_en = 'Theme Parks'
ON CONFLICT DO NOTHING;

-- NEMO Science Museum → Museums, Educational
INSERT INTO activity_category_links (activity_id, category_id)
SELECT a.id, c.id
FROM activities a, activity_categories c
WHERE a.name = 'NEMO Science Museum' AND c.name_en IN ('Museums', 'Educational')
ON CONFLICT DO NOTHING;

-- Vondelpark Playground → Outdoor Play
INSERT INTO activity_category_links (activity_id, category_id)
SELECT a.id, c.id
FROM activities a, activity_categories c
WHERE a.name = 'Vondelpark Playground' AND c.name_en = 'Outdoor Play'
ON CONFLICT DO NOTHING;

-- Artis Royal Zoo → Animals & Nature, Outdoor Play
INSERT INTO activity_category_links (activity_id, category_id)
SELECT a.id, c.id
FROM activities a, activity_categories c
WHERE a.name = 'Artis Royal Zoo' AND c.name_en IN ('Animals & Nature', 'Outdoor Play')
ON CONFLICT DO NOTHING;

-- Madurodam Miniature Park → Educational, Outdoor Play
INSERT INTO activity_category_links (activity_id, category_id)
SELECT a.id, c.id
FROM activities a, activity_categories c
WHERE a.name = 'Madurodam Miniature Park' AND c.name_en IN ('Educational', 'Outdoor Play')
ON CONFLICT DO NOTHING;

-- Indoor Playground Ballorig → Indoor Play, Sports & Active
INSERT INTO activity_category_links (activity_id, category_id)
SELECT a.id, c.id
FROM activities a, activity_categories c
WHERE a.name = 'Indoor Playground Ballorig' AND c.name_en IN ('Indoor Play', 'Sports & Active')
ON CONFLICT DO NOTHING;

-- Beach Day at Zandvoort → Outdoor Play, Water Activities
INSERT INTO activity_category_links (activity_id, category_id)
SELECT a.id, c.id
FROM activities a, activity_categories c
WHERE a.name = 'Beach Day at Zandvoort' AND c.name_en IN ('Outdoor Play', 'Water Activities')
ON CONFLICT DO NOTHING;

-- Het Amsterdamse Bos Forest → Outdoor Play, Animals & Nature
INSERT INTO activity_category_links (activity_id, category_id)
SELECT a.id, c.id
FROM activities a, activity_categories c
WHERE a.name = 'Het Amsterdamse Bos Forest' AND c.name_en IN ('Outdoor Play', 'Animals & Nature')
ON CONFLICT DO NOTHING;

-- Kinderkookcafe Cooking Workshop → Creative & Arts, Educational
INSERT INTO activity_category_links (activity_id, category_id)
SELECT a.id, c.id
FROM activities a, activity_categories c
WHERE a.name = 'Kinderkookcafe Cooking Workshop' AND c.name_en IN ('Creative & Arts', 'Educational')
ON CONFLICT DO NOTHING;

-- Archeon Historical Theme Park → Educational, Theme Parks
INSERT INTO activity_category_links (activity_id, category_id)
SELECT a.id, c.id
FROM activities a, activity_categories c
WHERE a.name = 'Archeon Historical Theme Park' AND c.name_en IN ('Educational', 'Theme Parks')
ON CONFLICT DO NOTHING;

-- =============================================
-- 3. LINK ACTIVITIES TO TAGS
-- =============================================

-- Efteling Theme Park → Popular, Weekend Fun
INSERT INTO activity_tag_links (activity_id, tag_id)
SELECT a.id, t.id
FROM activities a, tags t
WHERE a.name = 'Efteling Theme Park' AND t.name IN ('Popular', 'Weekend Fun')
ON CONFLICT DO NOTHING;

-- NEMO Science Museum → Popular, Rainy Day
INSERT INTO activity_tag_links (activity_id, tag_id)
SELECT a.id, t.id
FROM activities a, tags t
WHERE a.name = 'NEMO Science Museum' AND t.name IN ('Popular', 'Rainy Day')
ON CONFLICT DO NOTHING;

-- Vondelpark Playground → Budget Friendly, Popular
INSERT INTO activity_tag_links (activity_id, tag_id)
SELECT a.id, t.id
FROM activities a, tags t
WHERE a.name = 'Vondelpark Playground' AND t.name IN ('Budget Friendly', 'Popular')
ON CONFLICT DO NOTHING;

-- Artis Royal Zoo → Popular, Weekend Fun
INSERT INTO activity_tag_links (activity_id, tag_id)
SELECT a.id, t.id
FROM activities a, tags t
WHERE a.name = 'Artis Royal Zoo' AND t.name IN ('Popular', 'Weekend Fun')
ON CONFLICT DO NOTHING;

-- Madurodam Miniature Park → Popular
INSERT INTO activity_tag_links (activity_id, tag_id)
SELECT a.id, t.id
FROM activities a, tags t
WHERE a.name = 'Madurodam Miniature Park' AND t.name = 'Popular'
ON CONFLICT DO NOTHING;

-- Indoor Playground Ballorig → Rainy Day
INSERT INTO activity_tag_links (activity_id, tag_id)
SELECT a.id, t.id
FROM activities a, tags t
WHERE a.name = 'Indoor Playground Ballorig' AND t.name = 'Rainy Day'
ON CONFLICT DO NOTHING;

-- Beach Day at Zandvoort → Budget Friendly, Weekend Fun
INSERT INTO activity_tag_links (activity_id, tag_id)
SELECT a.id, t.id
FROM activities a, tags t
WHERE a.name = 'Beach Day at Zandvoort' AND t.name IN ('Budget Friendly', 'Weekend Fun')
ON CONFLICT DO NOTHING;

-- Het Amsterdamse Bos Forest → Budget Friendly, Weekend Fun
INSERT INTO activity_tag_links (activity_id, tag_id)
SELECT a.id, t.id
FROM activities a, tags t
WHERE a.name = 'Het Amsterdamse Bos Forest' AND t.name IN ('Budget Friendly', 'Weekend Fun')
ON CONFLICT DO NOTHING;

-- Kinderkookcafe Cooking Workshop → New, Birthday Party
INSERT INTO activity_tag_links (activity_id, tag_id)
SELECT a.id, t.id
FROM activities a, tags t
WHERE a.name = 'Kinderkookcafe Cooking Workshop' AND t.name IN ('New', 'Birthday Party')
ON CONFLICT DO NOTHING;

-- Archeon Historical Theme Park → Weekend Fun
INSERT INTO activity_tag_links (activity_id, tag_id)
SELECT a.id, t.id
FROM activities a, tags t
WHERE a.name = 'Archeon Historical Theme Park' AND t.name = 'Weekend Fun'
ON CONFLICT DO NOTHING;

-- =============================================
-- 4. VERIFICATION
-- =============================================

-- Show counts
SELECT
  'Categories' as table_name,
  COUNT(*) as count
FROM activity_categories
UNION ALL
SELECT
  'Category Links' as table_name,
  COUNT(*) as count
FROM activity_category_links
UNION ALL
SELECT
  'Tag Links' as table_name,
  COUNT(*) as count
FROM activity_tag_links;
