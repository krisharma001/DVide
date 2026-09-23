import { createClient } from '@supabase/supabase-js';

const url = 'https://dstdazjdzyygetcznqbm.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdGRhempkenl5Z2V0Y3pucWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzYzOTQsImV4cCI6MjEwNTY1MjM5NH0.brAjx4J3Z4d1KhCycCsbza9rcAxBdo8B2-nmktjNFWY';

function isMatchingRoom(targetRoomId, room) {
  if (!room || !targetRoomId) return false;
  if (targetRoomId === room.id) return true;
  if (room.invite_code) {
    const code = room.invite_code.toUpperCase().trim();
    const cleanTarget = targetRoomId.toUpperCase().trim();
    if (
      cleanTarget === code ||
      cleanTarget === `ROOM_${code}` ||
      cleanTarget.replace('ROOM_', '') === code ||
      (room.id && cleanTarget === room.id.toUpperCase())
    ) {
      return true;
    }
  }
  return false;
}

async function testIncognitoJoinScenario() {
  console.log('====================================================================');
  console.log('   TESTING INCOGNITO WINDOW JOINING ROOM (KUNAL + RAHUL)            ');
  console.log('====================================================================');

  const inviteCode = 'EB5J4';
  const channelName = `dvide_room_${inviteCode}`;

  // Window 1: Regular window where Kunal created "Shangarh Trip" with legacy ID
  const roomWindow1 = {
    id: 'room_1727068523412', // legacy timestamp ID
    name: 'Shangarh Trip',
    invite_code: inviteCode,
  };
  const kunalUser = { id: 'u_kunal_' + Math.random().toString(36).slice(2, 6), name: 'Kunal' };

  // Window 2: Incognito window joins with code EB5J4
  const roomWindow2 = {
    id: `room_${inviteCode}`,
    name: `Group #${inviteCode}`,
    invite_code: inviteCode,
  };
  const rahulUser = { id: 'u_rahul_' + Math.random().toString(36).slice(2, 6), name: 'Rahul' };

  let window1Members = [
    { id: 'm_kunal', room_id: roomWindow1.id, user_id: kunalUser.id, display_name: kunalUser.name, is_online: true },
  ];
  let window2Members = [
    { id: 'm_rahul', room_id: roomWindow2.id, user_id: rahulUser.id, display_name: rahulUser.name, is_online: true },
  ];

  const c1 = createClient(url, key);
  const c2 = createClient(url, key);

  const ch1 = c1.channel(channelName, {
    config: { broadcast: { self: false }, presence: { key: kunalUser.id } },
  });
  const ch2 = c2.channel(channelName, {
    config: { broadcast: { self: false }, presence: { key: rahulUser.id } },
  });

  // Window 1 event handlers
  ch1.on('broadcast', { event: 'new_member' }, ({ payload }) => {
    console.log('[Window 1 - Kunal] Received new_member:', payload.display_name, payload.user_id);
    if (!window1Members.some(m => m.user_id === payload.user_id)) {
      window1Members.push({ ...payload, is_online: true });
    }
  });

  ch1.on('broadcast', { event: 'request_room_sync' }, ({ payload }) => {
    console.log('[Window 1 - Kunal] Received request_room_sync from:', payload);
    if (payload?.member && !window1Members.some(m => m.user_id === payload.member.user_id)) {
      window1Members.push({ ...payload.member, is_online: true });
    }
    ch1.send({
      type: 'broadcast',
      event: 'respond_room_sync',
      payload: {
        room: roomWindow1,
        members: window1Members,
      },
    });
  });

  // Window 2 event handlers
  ch2.on('broadcast', { event: 'respond_room_sync' }, ({ payload }) => {
    console.log('[Window 2 - Rahul] Received respond_room_sync from Kunal:', payload.members?.map(m => m.display_name));
    if (payload.members) {
      payload.members.forEach(m => {
        if (!window2Members.some(x => x.user_id === m.user_id)) {
          window2Members.push({ ...m, room_id: roomWindow2.id, is_online: true });
        }
      });
    }
  });

  ch2.on('broadcast', { event: 'new_member' }, ({ payload }) => {
    console.log('[Window 2 - Rahul] Received new_member:', payload.display_name);
    if (!window2Members.some(m => m.user_id === payload.user_id)) {
      window2Members.push({ ...payload, is_online: true });
    }
  });

  // Subscribe Window 1
  console.log('\n--- Window 1 (Kunal) Subscribing ---');
  await new Promise(res => ch1.subscribe(s => s === 'SUBSCRIBED' && res()));
  await ch1.track({ user_id: kunalUser.id, name: kunalUser.name });
  console.log('Window 1 Subscribed to dvide_room_EB5J4');

  await new Promise(r => setTimeout(r, 600));

  // Subscribe Window 2 (Incognito)
  console.log('\n--- Window 2 (Rahul) Subscribing from Incognito ---');
  await new Promise(res => ch2.subscribe(s => s === 'SUBSCRIBED' && res()));
  await ch2.track({ user_id: rahulUser.id, name: rahulUser.name });

  const rahulMember = {
    id: `m_${rahulUser.id}`,
    room_id: roomWindow2.id,
    user_id: rahulUser.id,
    display_name: rahulUser.name,
    is_online: true,
  };

  // Rahul sends new_member and request_room_sync
  await ch2.send({ type: 'broadcast', event: 'new_member', payload: rahulMember });
  await ch2.send({ type: 'broadcast', event: 'request_room_sync', payload: { user_id: rahulUser.id, member: rahulMember } });

  await new Promise(r => setTimeout(r, 1200));

  // Filter members using isMatchingRoom
  const w1Visible = window1Members.filter(m => isMatchingRoom(m.room_id, roomWindow1));
  const w2Visible = window2Members.filter(m => isMatchingRoom(m.room_id, roomWindow2));

  console.log('\n====================================================================');
  console.log('                       VERIFICATION REPORT                          ');
  console.log('====================================================================');
  console.log(`Window 1 (Kunal's screen) sees ${w1Visible.length} members:`, w1Visible.map(m => m.display_name));
  console.log(`Window 2 (Rahul's screen) sees ${w2Visible.length} members:`, w2Visible.map(m => m.display_name));

  c1.removeChannel(ch1);
  c2.removeChannel(ch2);

  if (w1Visible.length === 2 && w2Visible.length === 2) {
    console.log('\n🎉 SUCCESS: BOTH WINDOWS SHOW 2 USERS IN REAL TIME!');
  } else {
    console.error('\n❌ FAILURE: Member count did not reach 2 on both windows');
    process.exit(1);
  }
}

testIncognitoJoinScenario().catch(err => {
  console.error(err);
  process.exit(1);
});
