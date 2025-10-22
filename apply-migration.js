// Complete migration script to populate all missing data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Categories data
const categories = [
  { name_en: 'Theme Parks', name_nl: 'Pretparken', icon: 'ferris-wheel', color: '#FF6B6B', sort_order: 1 },
  { name_en: 'Museums', name_nl: 'Musea', icon: 'building-2', color: '#4ECDC4', sort_order: 2 },
  { name_en: 'Outdoor Play', name_nl: 'Buiten Spelen', icon: 'trees', color: '#95E1D3', sort_order: 3 },
  { name_en: 'Animals & Nature', name_nl: 'Dieren & Natuur', icon: 'bird', color: '#F9A826', sort_order: 4 },
  { name_en: 'Indoor Play', name_nl: 'Binnen Spelen', icon: 'home', color: '#AA96DA', sort_order: 5 },
  { name_en: 'Water Activities', name_nl: 'Wateractiviteiten', icon: 'waves', color: '#5DADE2', sort_order: 6 },
  { name_en: 'Sports & Active', name_nl: 'Sport & Actief', icon: 'activity', color: '#FF8C42', sort_order: 7 },
  { name_en: 'Creative & Arts', name_nl: 'Creatief & Kunst', icon: 'palette', color: '#E74C3C', sort_order: 8 },
  { name_en: 'Educational', name_nl: 'Educatief', icon: 'book-open', color: '#3498DB', sort_order: 9 }
];

// Activity to category mappings (by activity name)
const activityCategoryMap = {
  'Efteling Theme Park': ['Theme Parks'],
  'NEMO Science Museum': ['Museums', 'Educational'],
  'Vondelpark Playground': ['Outdoor Play'],
  'Artis Royal Zoo': ['Animals & Nature', 'Outdoor Play'],
  'Madurodam Miniature Park': ['Educational', 'Outdoor Play'],
  'Indoor Playground Ballorig': ['Indoor Play', 'Sports & Active'],
  'Beach Day at Zandvoort': ['Outdoor Play', 'Water Activities'],
  'Het Amsterdamse Bos Forest': ['Outdoor Play', 'Animals & Nature'],
  'Kinderkookcafe Cooking Workshop': ['Creative & Arts', 'Educational'],
  'Archeon Historical Theme Park': ['Educational', 'Theme Parks']
};

// Activity to tag mappings (by activity name)
const activityTagMap = {
  'Efteling Theme Park': ['Popular', 'Weekend Fun'],
  'NEMO Science Museum': ['Popular', 'Rainy Day'],
  'Vondelpark Playground': ['Budget Friendly', 'Popular'],
  'Artis Royal Zoo': ['Popular', 'Weekend Fun'],
  'Madurodam Miniature Park': ['Popular'],
  'Indoor Playground Ballorig': ['Rainy Day'],
  'Beach Day at Zandvoort': ['Budget Friendly', 'Weekend Fun'],
  'Het Amsterdamse Bos Forest': ['Budget Friendly', 'Weekend Fun'],
  'Kinderkookcafe Cooking Workshop': ['New', 'Birthday Party'],
  'Archeon Historical Theme Park': ['Weekend Fun']
};

async function migrateData() {
  console.log('🚀 Starting data migration...\n');

  try {
    // Step 1: Insert categories
    console.log('📁 Step 1: Inserting categories...');

    const insertedCategories = [];
    for (const category of categories) {
      const { data, error } = await supabase
        .from('activity_categories')
        .insert(category)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error inserting category ${category.name_en}:`, error.message);
      } else {
        insertedCategories.push(data);
        console.log(`✓ ${category.name_en}`);
      }
    }

    console.log(`\n✅ Inserted ${insertedCategories.length} categories\n`);

    // Step 2: Get all activities
    console.log('📋 Step 2: Fetching activities...');
    const { data: activities, error: actError } = await supabase
      .from('activities')
      .select('id, name');

    if (actError) {
      console.error('❌ Error fetching activities:', actError.message);
      return;
    }
    console.log(`✅ Found ${activities.length} activities\n`);

    // Step 3: Get all tags
    console.log('🏷️  Step 3: Fetching tags...');
    const { data: tags, error: tagError } = await supabase
      .from('tags')
      .select('id, name');

    if (tagError) {
      console.error('❌ Error fetching tags:', tagError.message);
      return;
    }
    console.log(`✅ Found ${tags.length} tags\n`);

    // Step 4: Link activities to categories
    console.log('🔗 Step 4: Linking activities to categories...');
    const categoryLinks = [];

    for (const activity of activities) {
      const categoryNames = activityCategoryMap[activity.name] || [];

      for (const catName of categoryNames) {
        const category = insertedCategories.find(c => c.name_en === catName);
        if (category) {
          categoryLinks.push({
            activity_id: activity.id,
            category_id: category.id
          });
        }
      }
    }

    if (categoryLinks.length > 0) {
      const { error: linkError } = await supabase
        .from('activity_category_links')
        .insert(categoryLinks);

      if (linkError) {
        console.error('❌ Error linking categories:', linkError.message);
      } else {
        console.log(`✅ Created ${categoryLinks.length} activity-category links\n`);
      }
    }

    // Step 5: Link activities to tags
    console.log('🏷️  Step 5: Linking activities to tags...');
    const tagLinks = [];

    for (const activity of activities) {
      const tagNames = activityTagMap[activity.name] || [];

      for (const tagName of tagNames) {
        const tag = tags.find(t => t.name === tagName);
        if (tag) {
          tagLinks.push({
            activity_id: activity.id,
            tag_id: tag.id
          });
        }
      }
    }

    if (tagLinks.length > 0) {
      const { error: tagLinkError } = await supabase
        .from('activity_tag_links')
        .insert(tagLinks);

      if (tagLinkError) {
        console.error('❌ Error linking tags:', tagLinkError.message);
      } else {
        console.log(`✅ Created ${tagLinks.length} activity-tag links\n`);
      }
    }

    // Step 6: Verify results
    console.log('✅ Step 6: Verification\n');

    const { count: catCount } = await supabase
      .from('activity_categories')
      .select('*', { count: 'exact', head: true });

    const { count: actCatLinkCount } = await supabase
      .from('activity_category_links')
      .select('*', { count: 'exact', head: true });

    const { count: actTagLinkCount } = await supabase
      .from('activity_tag_links')
      .select('*', { count: 'exact', head: true });

    console.log('📊 Final counts:');
    console.log(`   Categories: ${catCount}`);
    console.log(`   Category links: ${actCatLinkCount}`);
    console.log(`   Tag links: ${actTagLinkCount}`);
    console.log('\n✨ Migration complete!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

migrateData();
