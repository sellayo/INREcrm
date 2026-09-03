import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    // If the table doesn't exist, it returns a 42P01 error, but it proves the connection is valid!
    if (error && error.code !== '42P01') {
       console.error('Connection failed:', error.message);
    } else {
       console.log('✅ Connected to Supabase successfully!');
       if (error && error.code === '42P01') {
          console.log('Note: Tables are not created yet (Schema not applied). This is expected if you haven\'t run the SQL script.');
       }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
