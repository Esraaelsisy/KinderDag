import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://jzywicyisetnlqtuuixy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6eXdpY3lpc2V0bmxxdHV1aXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTM3MDMsImV4cCI6MjA3NjU2OTcwM30.LEZnWzGAelohvnlFSwM_b8ZKOFVjO2xFOTezhHj-LAI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const sql = readFileSync('./supabase/migrations/20251022120000_add_category_update_delete_policies.sql', 'utf8');

// Extract just the SQL statements (remove comments)
const statements = sql
  .split('\n')
  .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('/*') && !line.trim().startsWith('*') && line.trim() !== '')
  .join('\n');

console.log('Applying migration...');
console.log(statements);

const { data, error } = await supabase.rpc('exec_sql', { sql: statements });

if (error) {
  console.error('Error:', error);
} else {
  console.log('Success!');
}
