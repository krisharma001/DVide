import { createClient } from '@supabase/supabase-js';

const url = 'https://dstdazjdzyygetcznqbm.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdGRhempkenl5Z2V0Y3pucWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzYzOTQsImV4cCI6MjEwNTY1MjM5NH0.brAjx4J3Z4d1KhCycCsbza9rcAxBdo8B2-nmktjNFWY';

const supabase = createClient(url, key);

async function testInsert() {
  console.log('Testing anon room insert...');
  const testCode = 'TEST' + Math.floor(Math.random() * 90 + 10);
  const { data, error } = await supabase.from('rooms').insert({
    name: 'Test Room',
    invite_code: testCode,
    currency: '₹'
  }).select();

  console.log('Insert result:', data, 'Error:', error);
}

testInsert();
