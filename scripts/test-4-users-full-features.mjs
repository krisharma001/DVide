import { createClient } from '@supabase/supabase-js';

const url = 'https://dstdazjdzyygetcznqbm.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdGRhempkenl5Z2V0Y3pucWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzYzOTQsImV4cCI6MjEwNTY1MjM5NH0.brAjx4J3Z4d1KhCycCsbza9rcAxBdo8B2-nmktjNFWY';

async function runFullE2ETest() {
  console.log('===============================================================');
  console.log('   DVIDE REAL-TIME E2E MULTI-USER VALIDATION (4 PEOPLE)       ');
  console.log('===============================================================');

  const roomCode = 'TEST' + Math.floor(10 + Math.random() * 90);
  const channelName = `dvide_room_${roomCode}`;
  console.log(`\n🔑 Room Invite Code: ${roomCode} | Channel: ${channelName}`);

  // 4 Client Instances simulating 4 devices
  const cKrish = createClient(url, key);
  const cRahul = createClient(url, key);
  const cAman = createClient(url, key);
  const cRiya = createClient(url, key);

  const chKrish = cKrish.channel(channelName, { config: { broadcast: { self: false } } });
  const chRahul = cRahul.channel(channelName, { config: { broadcast: { self: false } } });
  const chAman = cAman.channel(channelName, { config: { broadcast: { self: false } } });
  const chRiya = cRiya.channel(channelName, { config: { broadcast: { self: false } } });

  // Tracking state on each simulated client
  const clientStates = {
    Krish: { members: new Set(['Krish']), expenses: [], chats: [], settlements: [] },
    Rahul: { members: new Set(), expenses: [], chats: [], settlements: [] },
    Aman: { members: new Set(), expenses: [], chats: [], settlements: [] },
    Riya: { members: new Set(), expenses: [], chats: [], settlements: [] },
  };

  const registerListeners = (name, channel) => {
    channel.on('broadcast', { event: 'new_member' }, ({ payload }) => {
      clientStates[name].members.add(payload.display_name);
      console.log(`[${name}] 👥 Heard new member: ${payload.display_name}`);
    });

    channel.on('broadcast', { event: 'new_expense' }, ({ payload }) => {
      clientStates[name].expenses.push(payload);
      console.log(`[${name}] 🧾 Heard new expense: "${payload.description}" for ₹${payload.total_amount} (by ${payload.paid_by})`);
    });

    channel.on('broadcast', { event: 'new_chat' }, ({ payload }) => {
      clientStates[name].chats.push(payload);
      console.log(`[${name}] 💬 Heard chat message from ${payload.display_name}: "${payload.message}"`);
    });

    channel.on('broadcast', { event: 'new_settlement' }, ({ payload }) => {
      clientStates[name].settlements.push(payload);
      console.log(`[${name}] 💸 Heard settlement: ₹${payload.record.amount} settled!`);
    });

    channel.on('broadcast', { event: 'request_room_sync' }, () => {
      if (name === 'Krish') {
        console.log(`[Krish] 🔄 Received request_room_sync, sending current state snapshot...`);
        channel.send({
          type: 'broadcast',
          event: 'respond_room_sync',
          payload: {
            room: { id: `room_${roomCode}`, name: 'Goa Weekend 2026', invite_code: roomCode },
            members: Array.from(clientStates.Krish.members).map(n => ({ display_name: n })),
            expenses: clientStates.Krish.expenses,
          },
        });
      }
    });

    channel.on('broadcast', { event: 'respond_room_sync' }, ({ payload }) => {
      console.log(`[${name}] 📥 Received sync snapshot with ${payload.members?.length || 0} members, ${payload.expenses?.length || 0} expenses`);
      if (payload.members) {
        payload.members.forEach(m => clientStates[name].members.add(m.display_name));
      }
      if (payload.expenses) {
        payload.expenses.forEach(e => {
          if (!clientStates[name].expenses.some(x => x.id === e.id)) {
            clientStates[name].expenses.push(e);
          }
        });
      }
    });
  };

  registerListeners('Krish', chKrish);
  registerListeners('Rahul', chRahul);
  registerListeners('Aman', chAman);
  registerListeners('Riya', chRiya);

  console.log('\n--- Step 1: Connecting All 4 Clients to Channel ---');
  const subscribeClient = (ch, name) =>
    new Promise((resolve, reject) => {
      ch.subscribe((status, err) => {
        console.log(`[${name}] Status: ${status}`);
        if (status === 'SUBSCRIBED') {
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reject(new Error(`Failed to subscribe ${name}: ${status}`));
        }
      });
    });

  await Promise.all([
    subscribeClient(chKrish, 'Krish'),
    subscribeClient(chRahul, 'Rahul'),
    subscribeClient(chAman, 'Aman'),
    subscribeClient(chRiya, 'Riya'),
  ]);
  console.log('✅ All 4 clients subscribed to Supabase Realtime channel!');

  await new Promise(r => setTimeout(r, 400));

  // Step 2: 3 members join room
  console.log('\n--- Step 2: Rahul, Aman, Riya Join Room via Code ---');
  await chRahul.send({
    type: 'broadcast',
    event: 'new_member',
    payload: { id: 'm_rahul', user_id: 'u_rahul', display_name: 'Rahul', room_id: `room_${roomCode}` },
  });
  await chRahul.send({ type: 'broadcast', event: 'request_room_sync', payload: { user: 'Rahul' } });

  await new Promise(r => setTimeout(r, 300));

  await chAman.send({
    type: 'broadcast',
    event: 'new_member',
    payload: { id: 'm_aman', user_id: 'u_aman', display_name: 'Aman', room_id: `room_${roomCode}` },
  });

  await new Promise(r => setTimeout(r, 300));

  await chRiya.send({
    type: 'broadcast',
    event: 'new_member',
    payload: { id: 'm_riya', user_id: 'u_riya', display_name: 'Riya', room_id: `room_${roomCode}` },
  });

  await new Promise(r => setTimeout(r, 600));

  // Step 3: Members add personal expenses (Section 47 / Dinner Scenario)
  console.log('\n--- Step 3: Members Add Personal Dishes & Items ---');
  // Krish adds Butter Chicken
  await chKrish.send({
    type: 'broadcast',
    event: 'new_expense',
    payload: {
      id: 'exp_1',
      description: 'Butter Chicken & Roti',
      subtotal: 550,
      total_amount: 550,
      paid_by: 'Krish',
      paid_by_user_id: 'u_krish',
    },
  });
  clientStates.Krish.expenses.push({ id: 'exp_1', description: 'Butter Chicken & Roti', total_amount: 550 });

  await new Promise(r => setTimeout(r, 300));

  // Rahul adds Paneer Lababdar
  await chRahul.send({
    type: 'broadcast',
    event: 'new_expense',
    payload: {
      id: 'exp_2',
      description: 'Paneer Lababdar & Rice',
      subtotal: 420,
      total_amount: 420,
      paid_by: 'Rahul',
      paid_by_user_id: 'u_rahul',
    },
  });
  clientStates.Rahul.expenses.push({ id: 'exp_2', description: 'Paneer Lababdar & Rice', total_amount: 420 });

  await new Promise(r => setTimeout(r, 300));

  // Aman adds Garlic Naan & Dal
  await chAman.send({
    type: 'broadcast',
    event: 'new_expense',
    payload: {
      id: 'exp_3',
      description: 'Garlic Naan & Dal Makhani',
      subtotal: 380,
      total_amount: 380,
      paid_by: 'Aman',
      paid_by_user_id: 'u_aman',
    },
  });
  clientStates.Aman.expenses.push({ id: 'exp_3', description: 'Garlic Naan & Dal Makhani', total_amount: 380 });

  await new Promise(r => setTimeout(r, 300));

  // Riya adds Dessert
  await chRiya.send({
    type: 'broadcast',
    event: 'new_expense',
    payload: {
      id: 'exp_4',
      description: 'Mocktails & Tiramisu',
      subtotal: 450,
      total_amount: 450,
      paid_by: 'Riya',
      paid_by_user_id: 'u_riya',
    },
  });
  clientStates.Riya.expenses.push({ id: 'exp_4', description: 'Mocktails & Tiramisu', total_amount: 450 });

  await new Promise(r => setTimeout(r, 600));

  // Step 4: Admin applies Table Tax Divider
  console.log('\n--- Step 4: Admin (Krish) Applies Table Tax & Service Charge ---');
  // Bill total: 550 + 420 + 380 + 450 = 1800
  // Tax 18% = 324, Tip = 180, Total Bill = 2304
  const tableTaxExpense = {
    id: 'exp_table_tax_1',
    description: 'Table Bill: 18% GST + Service Charge',
    subtotal: 1800,
    tax_rate: 18,
    tax_amount: 324,
    tax_type: 'added',
    tax_split_method: 'proportional',
    service_charge: 180,
    total_amount: 504, // 324 tax + 180 service charge
    paid_by: 'Krish',
    paid_by_user_id: 'u_krish',
    splits: [
      { user_id: 'u_krish', amount: 154 },
      { user_id: 'u_rahul', amount: 117.6 },
      { user_id: 'u_aman', amount: 106.4 },
      { user_id: 'u_riya', amount: 126 },
    ],
  };

  await chKrish.send({
    type: 'broadcast',
    event: 'new_expense',
    payload: tableTaxExpense,
  });
  clientStates.Krish.expenses.push(tableTaxExpense);

  await new Promise(r => setTimeout(r, 500));

  // Step 5: Chat conversation across room
  console.log('\n--- Step 5: Real-time Group Chat Across All 4 Devices ---');
  await chKrish.send({
    type: 'broadcast',
    event: 'new_chat',
    payload: { id: 'm1', display_name: 'Krish', message: 'Added the 18% GST and service charge to the table bill 👍' },
  });
  await new Promise(r => setTimeout(r, 200));

  await chRahul.send({
    type: 'broadcast',
    event: 'new_chat',
    payload: { id: 'm2', display_name: 'Rahul', message: 'Checking it now, proportional split looks clean!' },
  });
  await new Promise(r => setTimeout(r, 200));

  await chAman.send({
    type: 'broadcast',
    event: 'new_chat',
    payload: { id: 'm3', display_name: 'Aman', message: 'Settling my share via UPI right away.' },
  });
  await new Promise(r => setTimeout(r, 200));

  await chRiya.send({
    type: 'broadcast',
    event: 'new_chat',
    payload: { id: 'm4', display_name: 'Riya', message: 'Transferred my part too! 🎉' },
  });

  await new Promise(r => setTimeout(r, 600));

  // Step 6: Settlements
  console.log('\n--- Step 6: 1-Tap Settlement Sync Across All Clients ---');
  const settlementAman = {
    record: { id: 'stl_1', from_user: 'Aman', to_user: 'Krish', amount: 486.4, settled_at: new Date().toISOString() },
    expense: { id: 'exp_stl_1', description: 'Payment to Krish', total_amount: 486.4, paid_by: 'Aman' },
  };

  await chAman.send({
    type: 'broadcast',
    event: 'new_settlement',
    payload: settlementAman,
  });

  await new Promise(r => setTimeout(r, 800));

  // Verification & Assertions
  console.log('\n===============================================================');
  console.log('                   VERIFICATION RESULTS                        ');
  console.log('===============================================================');

  const results = [
    { client: 'Rahul', gotExpenses: clientStates.Rahul.expenses.length, gotChats: clientStates.Rahul.chats.length, gotSettlements: clientStates.Rahul.settlements.length },
    { client: 'Aman', gotExpenses: clientStates.Aman.expenses.length, gotChats: clientStates.Aman.chats.length, gotSettlements: clientStates.Aman.settlements.length },
    { client: 'Riya', gotExpenses: clientStates.Riya.expenses.length, gotChats: clientStates.Riya.chats.length, gotSettlements: clientStates.Riya.settlements.length },
    { client: 'Krish', gotExpenses: clientStates.Krish.expenses.length, gotChats: clientStates.Krish.chats.length, gotSettlements: clientStates.Krish.settlements.length },
  ];

  console.table(results);

  // Unsubscribe all
  cKrish.removeChannel(chKrish);
  cRahul.removeChannel(chRahul);
  cAman.removeChannel(chAman);
  cRiya.removeChannel(chRiya);

  const passed = results.every(r => r.gotChats >= 3);
  if (passed) {
    console.log('\n🎉 ALL 4 CLIENTS SUCCESSFULLY COMMUNICATED IN REAL-TIME OVER SUPABASE!');
  } else {
    console.error('\n❌ Some real-time messages were dropped.');
    process.exit(1);
  }
}

runFullE2ETest().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
