import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'notifications' });
  
  if (error) {
    // If RPC doesn't exist, try raw selection with a better check
    console.log('RPC failed, trying raw query...');
    const { data: rawData, error: rawError } = await supabase.from('notifications').select('*').limit(1);
    if (rawError) {
      console.error('Error:', rawError);
    } else {
      console.log('Sample data:', rawData);
    }
    
    // Try to get columns via a trick
    const { data: cols, error: colError } = await supabase.from('notifications').select().limit(0);
    console.log('Columns from empty select:', colError || 'Success');
  } else {
    console.log('Columns:', data);
  }
}

check();
