import { createClient } from '@supabase/supabase-js';

const url = 'https://dstdazjdzyygetcznqbm.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdGRhempkenl5Z2V0Y3pucWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzYzOTQsImV4cCI6MjEwNTY1MjM5NH0.brAjx4J3Z4d1KhCycCsbza9rcAxBdo8B2-nmktjNFWY';

async function runMultiClientTest() {
  console.log('=== Starting 4-Client Realtime Room Simulation ===');

  const roomId = 'room_realtime_sim_' + Date.now();

  // Create 4 distinct client instances simulating 4 different devices / people
  const clientKrish = createClient(url, key);
  const clientRahul = createClient(url, key);
  const clientAman = createClient(url, key);
  const clientRiya = createClient(url, key);

  const channelKrish = clientKrish.channel(`room:${roomId}`);
  const channelRahul = clientRahul.channel(`room:${roomId}`);
  const channelAman = clientAman.channel(`room:${roomId}`);
  const channelRiya = clientRiya.channel(`room:${roomId}`);

  let rahulReceivedExpense = false;
  let amanReceivedExpense = false;
  let riyaReceivedExpense = false;
  let krishReceivedChat = false;
  let allReceivedSettlement = 0;

  // Listeners on Rahul's phone
  channelRahul.on('broadcast', { event: 'new_expense' }, (payload) => {
    console.log('📱 Rahul received expense from Krish:', payload.payload.description, '₹' + payload.payload.total_amount);
    rahulReceivedExpense = true;
  });

  // Listeners on Aman's phone
  channelAman.on('broadcast', { event: 'new_expense' }, (payload) => {
    console.log('📱 Aman received expense from Krish:', payload.payload.description);
    amanReceivedExpense = true;
  });

  // Listeners on Riya's phone
  channelRiya.on('broadcast', { event: 'new_expense' }, (payload) => {
    console.log('📱 Riya received expense from Krish:', payload.payload.description);
    riyaReceivedExpense = true;
  });

  // Listeners on Krish's phone
  channelKrish.on('broadcast', { event: 'new_chat' }, (payload) => {
    console.log('💬 Krish received chat from Rahul:', payload.payload.message);
    krishReceivedChat = true;
  });

  // Settlement listeners on all
  const onSettle = (who) => {
    console.log(`🎉 ${who} received settlement confirmation!`);
    allReceivedSettlement++;
  };
  channelKrish.on('broadcast', { event: 'new_settlement' }, () => onSettle('Krish'));
  channelRahul.on('broadcast', { event: 'new_settlement' }, () => onSettle('Rahul'));
  channelAman.on('broadcast', { event: 'new_settlement' }, () => onSettle('Aman'));
  channelRiya.on('broadcast', { event: 'new_settlement' }, () => onSettle('Riya'));

  // Subscribe all 4 clients
  console.log('Connecting 4 clients to Supabase Realtime channel...');
  await Promise.all([
    new Promise((res) => channelKrish.subscribe(res)),
    new Promise((res) => channelRahul.subscribe(res)),
    new Promise((res) => channelAman.subscribe(res)),
    new Promise((res) => channelRiya.subscribe(res)),
  ]);

  console.log('All 4 clients successfully connected to real-time channel!');

  // 1. Krish adds dinner expense
  console.log('\n--- Action 1: Krish adds Dinner expense (₹2,832) ---');
  await channelKrish.send({
    type: 'broadcast',
    event: 'new_expense',
    payload: {
      id: 'exp_1',
      description: 'Dinner at Fisherman’s Wharf',
      total_amount: 2832,
      paid_by: 'Krish',
    }
  });

  await new Promise((r) => setTimeout(r, 600));

  // 2. Rahul sends a chat message
  console.log('\n--- Action 2: Rahul sends chat message ---');
  await channelRahul.send({
    type: 'broadcast',
    event: 'new_chat',
    payload: {
      id: 'msg_1',
      user: 'Rahul',
      message: 'Looks great! Sending my share now.'
    }
  });

  await new Promise((r) => setTimeout(r, 600));

  // 3. Aman records settlement
  console.log('\n--- Action 3: Aman records settlement to Krish ---');
  await channelAman.send({
    type: 'broadcast',
    event: 'new_settlement',
    payload: {
      from: 'Aman',
      to: 'Krish',
      amount: 708
    }
  });

  await new Promise((r) => setTimeout(r, 800));

  console.log('\n=== Simulation Results ===');
  console.log('Rahul received expense:', rahulReceivedExpense);
  console.log('Aman received expense:', amanReceivedExpense);
  console.log('Riya received expense:', riyaReceivedExpense);
  console.log('Krish received chat:', krishReceivedChat);
  console.log('Clients received settlement event:', allReceivedSettlement, '/ 4');

  if (rahulReceivedExpense && amanReceivedExpense && riyaReceivedExpense && krishReceivedChat && allReceivedSettlement >= 3) {
    console.log('\nSUCCESS: 4-client real-time synchronization is 100% operational!');
    process.exit(0);
  } else {
    console.log('\nFAILED: Some messages were not received.');
    process.exit(1);
  }
}

runMultiClientTest();
