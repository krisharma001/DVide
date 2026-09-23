import { createClient } from '@supabase/supabase-js';

const url = 'https://dstdazjdzyygetcznqbm.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdGRhempkenl5Z2V0Y3pucWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzYzOTQsImV4cCI6MjEwNTY1MjM5NH0.brAjx4J3Z4d1KhCycCsbza9rcAxBdo8B2-nmktjNFWY';

async function testBroadcastAndJoin() {
  console.log('Testing Broadcast new_member & presence join...');
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

  let c1ReceivedRahul = false;
  let c2ReceivedKunal = false;

  ch1.on('broadcast', { event: 'new_member' }, ({ payload }) => {
    console.log('📱 Window 1 (Kunal) heard new_member:', payload.display_name);
    c1ReceivedRahul = true;
  });

  ch1.on('broadcast', { event: 'request_room_sync' }, ({ payload }) => {
    console.log('📱 Window 1 (Kunal) received request_room_sync from:', payload.user_id);
    ch1.send({
      type: 'broadcast',
      event: 'respond_room_sync',
      payload: {
        members: [{ user_id: 'u_kunal', display_name: 'Kunal' }],
      },
    });
  });

  ch2.on('broadcast', { event: 'respond_room_sync' }, ({ payload }) => {
    console.log('📱 Window 2 (Rahul) received respond_room_sync members:', payload.members);
    c2ReceivedKunal = true;
  });

  ch1.on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('👥 Window 1 presence JOIN event for key:', key, newPresences);
    c1ReceivedRahul = true;
  });

  // Subscribe Window 1
  await new Promise((res) => ch1.subscribe((s) => s === 'SUBSCRIBED' && res()));
  await ch1.track({ user_id: 'u_kunal', name: 'Kunal' });
  console.log('Window 1 connected.');

  await new Promise((r) => setTimeout(r, 500));

  // Subscribe Window 2
  await new Promise((res) => ch2.subscribe((s) => s === 'SUBSCRIBED' && res()));
  await ch2.track({ user_id: 'u_rahul', name: 'Rahul' });
  console.log('Window 2 connected.');

  // Window 2 broadcasts new_member & request_room_sync
  await ch2.send({
    type: 'broadcast',
    event: 'new_member',
    payload: { user_id: 'u_rahul', display_name: 'Rahul' },
  });
  await ch2.send({
    type: 'broadcast',
    event: 'request_room_sync',
    payload: { user_id: 'u_rahul' },
  });

  await new Promise((r) => setTimeout(r, 1000));

  console.log('\n--- Final Verification ---');
  console.log('Window 1 received Rahul:', c1ReceivedRahul);
  console.log('Window 2 received Kunal:', c2ReceivedKunal);

  c1.removeChannel(ch1);
  c2.removeChannel(ch2);

  if (c1ReceivedRahul && c2ReceivedKunal) {
    console.log('🎉 BOTH WINDOWS INSTANTLY SYNCHRONIZED AND SAW EACH OTHER!');
  } else {
    process.exit(1);
  }
}

testBroadcastAndJoin().catch((err) => {
  console.error(err);
  process.exit(1);
});
