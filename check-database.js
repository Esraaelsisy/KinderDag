// Script to check current database tables
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking connected Supabase database...\n');
  console.log('📍 URL:', supabaseUrl);
  console.log('');

  try {
    // Query to get all tables in public schema
    const { data, error } = await supabase.rpc('get_tables', {});

    if (error) {
      // Fallback: try to check a few known tables
      console.log('📊 Checking for known tables:\n');

      const tablesToCheck = [
        'profiles',
        'kids',
        'activity_categories',
        'activities',
        'activity_category_links',
        'tags',
        'activity_tag_links',
        'favorites',
        'scheduled_activities',
        'reviews',
        'banners',
        'cities',
        'chat_conversations',
        'chat_messages',
        'chat_recommendations'
      ];

      for (const table of tablesToCheck) {
        try {
          const { data: tableData, error: tableError, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (!tableError) {
            console.log(`✅ ${table.padEnd(30)} (${count || 0} rows)`);
          } else {
            console.log(`❌ ${table.padEnd(30)} NOT FOUND`);
          }
        } catch (e) {
          console.log(`❌ ${table.padEnd(30)} ERROR: ${e.message}`);
        }
      }
    } else {
      console.log('📊 Tables found:\n');
      data.forEach(table => {
        console.log(`✅ ${table.table_name}`);
      });
    }

    // Check some data counts
    console.log('\n📈 Data Summary:\n');

    const checks = [
      { table: 'activity_categories', name: 'Categories' },
      { table: 'activities', name: 'Activities' },
      { table: 'tags', name: 'Tags' },
      { table: 'cities', name: 'Cities' },
      { table: 'banners', name: 'Banners' }
    ];

    for (const check of checks) {
      try {
        const { count, error } = await supabase
          .from(check.table)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          console.log(`${check.name.padEnd(20)}: ${count || 0} records`);
        }
      } catch (e) {
        // Table might not exist
      }
    }

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
}

checkDatabase();
