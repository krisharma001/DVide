import { createClient } from '@supabase/supabase-js';

const url = 'https://dstdazjdzyygetcznqbm.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdGRhempkenl5Z2V0Y3pucWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzYzOTQsImV4cCI6MjEwNTY1MjM5NH0.brAjx4J3Z4d1KhCycCsbza9rcAxBdo8B2-nmktjNFWY';

const supabase = createClient(url, key);

async function testAnonAuth() {
  console.log('Testing signInAnonymously...');
  const { data, error } = await supabase.auth.signInAnonymously();
  console.log('Anon Auth result:', data?.user?.id, 'Error:', error);
}

testAnonAuth();
