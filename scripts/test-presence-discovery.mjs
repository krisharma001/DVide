import { createClient } from '@supabase/supabase-js';

const url = 'https://dstdazjdzyygetcznqbm.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdGRhempkenl5Z2V0Y3pucWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzYzOTQsImV4cCI6MjEwNTY1MjM5NH0.brAjx4J3Z4d1KhCycCsbza9rcAxBdo8B2-nmktjNFWY';

async function testPresenceDiscovery() {
  console.log('Testing Automatic Presence Peer Discovery...');
  const roomCode = 'EB5J4';
  const channelName = `dvide_room_${roomCode}`;

  const c1 = createClient(url, key);
  const c2 = createClient(url, key);

  const ch1 = c1.channel(channelName, {
    config: { broadcast: { self: false }, presence: { key: 'u_kunal' } },
  });
  const ch2 = c2.channel(channelName, {
    config: { broadcast: { self: false }, presence: { key: 'u_rahul' } },
  });

  let c1SawC2InPresence = false;
  let c2SawC1InPresence = false;

  ch1.on('presence', { event: 'sync' }, () => {
    const state = ch1.presenceState();
    console.log('[Window 1 - Kunal] Presence State:', JSON.stringify(state));
    if (state['u_rahul']) {
      c1SawC2InPresence = true;
      console.log('✅ Window 1 saw Rahul in presence!');
    }
  });

  ch2.on('presence', { event: 'sync' }, () => {
    const state = ch2.presenceState();
    console.log('[Window 2 - Rahul] Presence State:', JSON.stringify(state));
    if (state['u_kunal']) {
      c2SawC1InPresence = true;
      console.log('✅ Window 2 saw Kunal in presence!');
    }
  });

  console.log('Subscribing Window 1...');
  await new Promise((res) => ch1.subscribe((s) => s === 'SUBSCRIBED' && res()));
  await ch1.track({ user_id: 'u_kunal', name: 'Kunal' });

  await new Promise((r) => setTimeout(r, 600));

  console.log('Subscribing Window 2...');
  await new Promise((res) => ch2.subscribe((s) => s === 'SUBSCRIBED' && res()));
  await ch2.track({ user_id: 'u_rahul', name: 'Rahul' });

  await new Promise((r) => setTimeout(r, 1200));

  console.log('\n--- Result ---');
  console.log('Window 1 saw Window 2:', c1SawC2InPresence);
  console.log('Window 2 saw Window 1:', c2SawC1InPresence);

  c1.removeChannel(ch1);
  c2.removeChannel(ch2);

  if (c1SawC2InPresence && c2SawC1InPresence) {
    console.log('🎉 PRESENCE DISCOVERY WORKS 100% MUTUALLY!');
  } else {
    console.error('❌ Presence discovery failed');
    process.exit(1);
  }
}

testPresenceDiscovery().catch((err) => {
  console.error(err);
  process.exit(1);
});
