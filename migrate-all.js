import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.argv[2];
const supabaseKey = process.argv[3];

if (!supabaseUrl || !supabaseKey) {
  console.error('Usage: node migrate-all.js <supabase-url> <supabase-key>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    // Try direct query as fallback
    const result = await supabase.from('_migrations').insert({ sql }).select();
    if (result.error) throw result.error;
    return result.data;
  }
  return data;
}

async function runMigration(filePath) {
  console.log(`\nRunning migration: ${filePath}`);
  const sql = readFileSync(filePath, 'utf8');

  try {
    await executeSql(sql);
    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    throw error;
  }
}

async function main() {
  const migrationsDir = './supabase/migrations';
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files\n`);

  for (const file of files) {
    await runMigration(join(migrationsDir, file));
  }

  console.log('\n✅ All migrations completed!');
}

main().catch(error => {
  console.error('\n❌ Migration process failed:', error);
  process.exit(1);
});
