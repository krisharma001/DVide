import { createClient } from '@supabase/supabase-js';

const url = 'https://dstdazjdzyygetcznqbm.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdGRhempkenl5Z2V0Y3pucWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzYzOTQsImV4cCI6MjEwNTY1MjM5NH0.brAjx4J3Z4d1KhCycCsbza9rcAxBdo8B2-nmktjNFWY';

const supabase = createClient(url, key);

async function testFK() {
  console.log('Testing profile insert with arbitrary UUID...');
  const fakeUUID = 'a0000000-0000-0000-0000-000000000001';
  const { data, error } = await supabase.from('profiles').insert({
    id: fakeUUID,
    name: 'Test'
  }).select();

  console.log('Result:', data, 'Error:', error);
}

testFK();
