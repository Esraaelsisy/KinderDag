-- ============================================
-- LINK ACTIVITIES TO CATEGORIES
-- ============================================

-- Artis Royal Zoo
INSERT INTO activity_category_links (activity_id, category_id)
SELECT
  a.id,
  c.id
FROM activities a
CROSS JOIN activity_categories c
WHERE a.name = 'Artis Royal Zoo'
  AND c.name_en IN ('Animal Fun', 'Fun & Play', 'Outdoor & Nature', 'Explore The City');

-- NEMO Science Museum
INSERT INTO activity_category_links (activity_id, category_id)
SELECT
  a.id,
  c.id
FROM activities a
CROSS JOIN activity_categories c
WHERE a.name = 'NEMO Science Museum'
  AND c.name_en IN ('Fun & Play', 'Explore The City', 'Courses, Camps & Workshops');

-- Efteling Theme Park
INSERT INTO activity_category_links (activity_id, category_id)
SELECT
  a.id,
  c.id
FROM activities a
CROSS JOIN activity_categories c
WHERE a.name = 'Efteling Theme Park'
  AND c.name_en IN ('Theme Parks', 'Fun & Play', 'Outdoor & Nature');

-- Vondelpark Playground
INSERT INTO activity_category_links (activity_id, category_id)
SELECT
  a.id,
  c.id
FROM activities a
CROSS JOIN activity_categories c
WHERE a.name = 'Vondelpark Playground'
  AND c.name_en IN ('Outdoor & Nature', 'Fun & Play', 'Baby & Toddler');

-- Kinderkookcafe
INSERT INTO activity_category_links (activity_id, category_id)
SELECT
  a.id,
  c.id
FROM activities a
CROSS JOIN activity_categories c
WHERE a.name = 'Kinderkookcafe'
  AND c.name_en IN ('Courses, Camps & Workshops', 'Eat Out', 'Birthdays');

-- TunFun Indoor Playground
INSERT INTO activity_category_links (activity_id, category_id)
SELECT
  a.id,
  c.id
FROM activities a
CROSS JOIN activity_categories c
WHERE a.name = 'TunFun Indoor Playground'
  AND c.name_en IN ('Fun & Play', 'Birthdays', 'Baby & Toddler');

-- Beach at Zandvoort
INSERT INTO activity_category_links (activity_id, category_id)
SELECT
  a.id,
  c.id
FROM activities a
CROSS JOIN activity_categories c
WHERE a.name = 'Beach at Zandvoort'
  AND c.name_en IN ('Outdoor & Nature', 'Water Fun', 'Fun & Play', 'Spring Fun');

-- Micropia Microbe Museum
INSERT INTO activity_category_links (activity_id, category_id)
SELECT
  a.id,
  c.id
FROM activities a
CROSS JOIN activity_categories c
WHERE a.name = 'Micropia Microbe Museum'
  AND c.name_en IN ('Fun & Play', 'Explore The City');

-- De Ceuvel Playground
INSERT INTO activity_category_links (activity_id, category_id)
SELECT
  a.id,
  c.id
FROM activities a
CROSS JOIN activity_categories c
WHERE a.name = 'De Ceuvel Playground'
  AND c.name_en IN ('Outdoor & Nature', 'Fun & Play', 'Eat Out');

-- Kids Workshop
INSERT INTO activity_category_links (activity_id, category_id)
SELECT
  a.id,
  c.id
FROM activities a
CROSS JOIN activity_categories c
WHERE a.name = 'Kids Workshop'
  AND c.name_en IN ('Courses, Camps & Workshops', 'Art, Music & Dance', 'Afterschool Activities');

-- ============================================
-- LINK ACTIVITIES TO TAGS
-- ============================================

-- Mark popular activities as Family Favorites
INSERT INTO activity_tag_links (activity_id, tag_id)
SELECT
  a.id,
  t.id
FROM activities a
CROSS JOIN tags t
WHERE a.name IN ('Artis Royal Zoo', 'NEMO Science Museum', 'Efteling Theme Park')
  AND t.slug = 'family-favorite';

-- Mark featured activities as Hot Picks
INSERT INTO activity_tag_links (activity_id, tag_id)
SELECT
  a.id,
  t.id
FROM activities a
CROSS JOIN tags t
WHERE a.name IN ('Efteling Theme Park', 'Beach at Zandvoort')
  AND t.slug = 'hot-pick';

-- Mark seasonal activities
INSERT INTO activity_tag_links (activity_id, tag_id)
SELECT
  a.id,
  t.id
FROM activities a
CROSS JOIN tags t
WHERE a.name IN ('Beach at Zandvoort', 'Vondelpark Playground')
  AND t.slug = 'seasonal';

-- Mark must-see activities
INSERT INTO activity_tag_links (activity_id, tag_id)
SELECT
  a.id,
  t.id
FROM activities a
CROSS JOIN tags t
WHERE a.name IN ('NEMO Science Museum', 'Artis Royal Zoo')
  AND t.slug = 'dont-miss';

-- ============================================
-- VERIFY THE RESULTS
-- ============================================

-- Check how many links were created
SELECT
  (SELECT COUNT(*) FROM activity_category_links) as category_links,
  (SELECT COUNT(*) FROM activity_tag_links) as tag_links;

-- Show activities with their categories
SELECT
  a.name as activity_name,
  STRING_AGG(c.name_en, ', ' ORDER BY c.name_en) as categories
FROM activities a
LEFT JOIN activity_category_links acl ON a.id = acl.activity_id
LEFT JOIN activity_categories c ON acl.category_id = c.id
GROUP BY a.id, a.name
ORDER BY a.name;

-- Show activities with their tags
SELECT
  a.name as activity_name,
  STRING_AGG(t.name, ', ' ORDER BY t.name) as tags
FROM activities a
LEFT JOIN activity_tag_links atl ON a.id = atl.activity_id
LEFT JOIN tags t ON atl.tag_id = t.id
GROUP BY a.id, a.name
ORDER BY a.name;
