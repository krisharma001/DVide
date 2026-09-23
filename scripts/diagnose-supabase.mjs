import { createClient } from '@supabase/supabase-js';

const url = 'https://dstdazjdzyygetcznqbm.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdGRhempkenl5Z2V0Y3pucWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzYzOTQsImV4cCI6MjEwNTY1MjM5NH0.brAjx4J3Z4d1KhCycCsbza9rcAxBdo8B2-nmktjNFWY';

const supabase = createClient(url, key);

async function testSupabase() {
  console.log('Testing Supabase connection...');

  // 1. Test anonymous auth or session
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  console.log('Current Session:', sessionData?.session ? 'Active' : 'No session', sessionErr || '');

  // 2. Test querying rooms
  const { data: rooms, error: roomsErr } = await supabase.from('rooms').select('*');
  console.log('Rooms query result:', rooms, 'Error:', roomsErr);

  // 3. Test querying profiles
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');
  console.log('Profiles query result:', profiles, 'Error:', profErr);
}

testSupabase();
