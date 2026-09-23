import { createClient } from '@supabase/supabase-js';

const url = 'https://dstdazjdzyygetcznqbm.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdGRhempkenl5Z2V0Y3pucWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzYzOTQsImV4cCI6MjEwNTY1MjM5NH0.brAjx4J3Z4d1KhCycCsbza9rcAxBdo8B2-nmktjNFWY';

const clientA = createClient(url, key);
const clientB = createClient(url, key);

async function testRealtimeBroadcast() {
  console.log('Testing Realtime Broadcast channel between Client A and Client B...');

  const channelA = clientA.channel('room:test_channel');
  const channelB = clientB.channel('room:test_channel');

  let received = false;

  channelB.on('broadcast', { event: 'new_expense' }, (payload) => {
    console.log('Client B received broadcast from Client A:', payload);
    received = true;
  });

  await channelB.subscribe((status) => {
    console.log('Client B subscription status:', status);
  });

  await channelA.subscribe(async (status) => {
    console.log('Client A subscription status:', status);
    if (status === 'SUBSCRIBED') {
      setTimeout(async () => {
        console.log('Client A sending broadcast message...');
        await channelA.send({
          type: 'broadcast',
          event: 'new_expense',
          payload: { description: 'Pizza', amount: 500, paid_by: 'Krish' }
        });
      }, 500);
    }
  });

  setTimeout(() => {
    if (received) {
      console.log('REALTIME BROADCAST TEST PASSED!');
      process.exit(0);
    } else {
      console.log('Timed out waiting for broadcast.');
      process.exit(1);
    }
  }, 4000);
}

testRealtimeBroadcast();
