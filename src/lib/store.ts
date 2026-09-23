import { useState, useEffect, useRef } from 'react';
import {
  Room,
  RoomMember,
  Expense,
  ChatMessage,
  SettlementRecord,
  UserProfile,
} from '../types';
import { calculateMemberBalances, calculateRoomSummary } from './calculations';
import { generateSettlementTransfers } from './settlementEngine';
import { supabase, isSupabaseConfigured } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export function isMatchingRoom(targetRoomId: string | undefined, room: Room | null): boolean {
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

export function cleanMemberName(name: string | undefined | null): string {
  if (!name) return 'Member';
  const clean = name.replace(/\s*\((You|Admin)\)/gi, '').trim();
  return clean || 'Member';
}

export const RANDOM_NAMES = [
  'Alex', 'Rohan', 'Sam', 'Maya', 'Leo', 'Zara', 'Aarav', 'Kai',
  'Elena', 'Noah', 'Chloe', 'Liam', 'Tara', 'Lucas', 'Isha', 'Oliver',
  'Dev', 'Ananya', 'Felix', 'Sora', 'Vihaan', 'Kavya', 'Zane', 'Rhea'
];

export function getRandomFriendlyName(): string {
  return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
}

function getInitialUser(): UserProfile {
  const saved = localStorage.getItem('dvide_current_user');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const clean = cleanMemberName(parsed.name);
      if (
        clean &&
        clean.toLowerCase() !== 'me' &&
        clean.toLowerCase() !== 'you' &&
        clean.toLowerCase() !== 'member' &&
        !clean.toLowerCase().startsWith('user ')
      ) {
        return { ...parsed, name: clean };
      }
    } catch {}
  }
  return {
    id: 'u_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4),
    name: getRandomFriendlyName(),
    email: '',
    avatar_url: '',
  };
}

export function useDVideStore() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(getInitialUser);

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('dvide_all_rooms');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentRoom, setCurrentRoom] = useState<Room | null>(() => {
    const saved = localStorage.getItem('dvide_current_room');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [members, setMembers] = useState<RoomMember[]>(() => {
    const saved = localStorage.getItem('dvide_members');
    if (!saved) return [];
    try {
      const parsed: RoomMember[] = JSON.parse(saved);
      return parsed.map((m) => {
        let name = cleanMemberName(m.display_name);
        if (!name || name.toLowerCase() === 'me' || name.toLowerCase() === 'you' || name.toLowerCase() === 'member') {
          name = getRandomFriendlyName();
        }
        return {
          ...m,
          display_name: name,
        };
      });
    } catch {
      return [];
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('dvide_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [chats, setChats] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('dvide_chats');
    return saved ? JSON.parse(saved) : [];
  });

  const [settlements, setSettlements] = useState<SettlementRecord[]>(() => {
    const saved = localStorage.getItem('dvide_settlements');
    return saved ? JSON.parse(saved) : [];
  });

  // Automatically migrate legacy room IDs to canonical format room_<INVITE_CODE>
  useEffect(() => {
    if (currentRoom?.invite_code) {
      const canonicalId = `room_${currentRoom.invite_code.toUpperCase().trim()}`;
      if (currentRoom.id !== canonicalId) {
        console.log(`[DVide] Migrating room ID from ${currentRoom.id} to ${canonicalId}`);
        const updated = { ...currentRoom, id: canonicalId };
        setCurrentRoom(updated);
        setRooms((prev) =>
          prev.map((r) =>
            r.invite_code.toUpperCase() === currentRoom.invite_code.toUpperCase()
              ? { ...r, id: canonicalId }
              : r
          )
        );
        setMembers((prev) =>
          prev.map((m) =>
            isMatchingRoom(m.room_id, updated) ? { ...m, room_id: canonicalId } : m
          )
        );
      }
    }
  }, [currentRoom?.invite_code, currentRoom?.id]);

  // Active room data filters (fuzzy matching room_id so legacy IDs never drop data)
  const roomMembers = currentRoom
    ? members
        .filter((m) => isMatchingRoom(m.room_id, currentRoom))
        .map((m) => ({
          ...m,
          display_name: cleanMemberName(m.display_name),
        }))
    : [];
  const roomExpenses = currentRoom ? expenses.filter((e) => isMatchingRoom(e.room_id, currentRoom)) : [];
  const roomChats = currentRoom ? chats.filter((c) => isMatchingRoom(c.room_id, currentRoom)) : [];

  const memberBalances = calculateMemberBalances(roomMembers, roomExpenses);
  const roomSummary = calculateRoomSummary(roomMembers, roomExpenses);
  const settlementTransfers = generateSettlementTransfers(memberBalances);

  const myBalance = memberBalances.find((b) => b.user_id === currentUser.id) || {
    user_id: currentUser.id,
    display_name: currentUser.name,
    amount_paid: 0,
    amount_owed: 0,
    net_balance: 0,
  };

  const roomAdminUserId = currentRoom?.created_by && currentRoom.created_by !== 'host'
    ? currentRoom.created_by
    : roomMembers[0]?.user_id;

  const isCurrentUserAdmin = Boolean(
    currentRoom && roomAdminUserId && currentUser.id === roomAdminUserId
  );

  const channelRef = useRef<RealtimeChannel | null>(null);
  const stateRef = useRef({
    currentRoom,
    roomMembers,
    roomExpenses,
    roomChats,
    settlements,
    currentUser,
  });

  // Keep stateRef fresh at all times without triggering re-subscriptions
  useEffect(() => {
    stateRef.current = {
      currentRoom,
      roomMembers,
      roomExpenses,
      roomChats,
      settlements,
      currentUser,
    };
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('dvide_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    if (currentRoom) {
      localStorage.setItem('dvide_current_room', JSON.stringify(currentRoom));
    } else {
      localStorage.removeItem('dvide_current_room');
    }
  }, [currentRoom]);

  useEffect(() => {
    localStorage.setItem('dvide_all_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('dvide_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('dvide_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('dvide_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('dvide_settlements', JSON.stringify(settlements));
  }, [settlements]);

  // ==============================================================================
  // SUPABASE REALTIME CHANNEL SUBSCRIPTION & MULTI-DEVICE SYNC
  // ==============================================================================
  useEffect(() => {
    const client = supabase;
    if (!currentRoom || !client) return;

    // Standardize channel name based on invite code or room ID so ALL devices meet in the exact same channel
    const roomCode = currentRoom.invite_code ? currentRoom.invite_code.toUpperCase().trim() : currentRoom.id;
    const channelName = `dvide_room_${roomCode}`;

    console.log(`[DVide Realtime] Connecting to channel: ${channelName} for room: ${currentRoom.name} (${roomCode})`);

    // Create room channel
    const channel = client.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: currentUser.id },
      },
    });

    // 1. Listen for new expenses from other members
    channel.on('broadcast', { event: 'new_expense' }, ({ payload }) => {
      console.log('[DVide Realtime] Received new_expense broadcast:', payload);
      setExpenses((prev) => {
        if (prev.some((e) => e.id === payload.id)) return prev;
        return [payload, ...prev];
      });
    });

    // 2. Listen for deleted expenses
    channel.on('broadcast', { event: 'delete_expense' }, ({ payload }) => {
      console.log('[DVide Realtime] Received delete_expense broadcast:', payload);
      setExpenses((prev) => prev.filter((e) => e.id !== payload.id));
    });

    // 3. Listen for new chat messages
    channel.on('broadcast', { event: 'new_chat' }, ({ payload }) => {
      console.log('[DVide Realtime] Received new_chat broadcast:', payload);
      setChats((prev) => {
        if (prev.some((c) => c.id === payload.id)) return prev;
        return [...prev, payload];
      });
    });

    // 4. Listen for new members joining or updating name
    channel.on('broadcast', { event: 'new_member' }, ({ payload }) => {
      console.log('[DVide Realtime] Received new_member broadcast:', payload);
      if (!payload || !payload.user_id) return;
      setMembers((prev) => {
        const existingIdx = prev.findIndex(
          (m) => m.user_id === payload.user_id && isMatchingRoom(m.room_id, currentRoom)
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...payload, is_online: true };
          return updated;
        }
        return [...prev, { ...payload, is_online: true }];
      });
    });

    // 5. Listen for settlements
    channel.on('broadcast', { event: 'new_settlement' }, ({ payload }) => {
      console.log('[DVide Realtime] Received new_settlement broadcast:', payload);
      setSettlements((prev) => {
        if (prev.some((s) => s.id === payload.record.id)) return prev;
        return [payload.record, ...prev];
      });
      if (payload.expense) {
        setExpenses((prev) => {
          if (prev.some((e) => e.id === payload.expense.id)) return prev;
          return [payload.expense, ...prev];
        });
      }
    });

    // 6. Peer-to-Peer Room State Sync (when someone joins via room code)
    channel.on('broadcast', { event: 'request_room_sync' }, ({ payload }) => {
      console.log('[DVide Realtime] Received request_room_sync from:', payload);
      // Auto-register the requester as a member if their info was provided
      if (payload?.member) {
        setMembers((prev) => {
          const exists = prev.some(
            (m) => m.user_id === payload.member.user_id && isMatchingRoom(m.room_id, currentRoom)
          );
          if (exists) {
            return prev.map((m) =>
              m.user_id === payload.member.user_id ? { ...m, ...payload.member, is_online: true } : m
            );
          }
          return [...prev, { ...payload.member, is_online: true }];
        });
      }

      const state = stateRef.current;
      if (!state.currentRoom) return;

      channel.send({
        type: 'broadcast',
        event: 'respond_room_sync',
        payload: {
          room: state.currentRoom,
          members: state.roomMembers,
          expenses: state.roomExpenses,
          chats: state.roomChats,
          settlements: state.settlements.filter((s) => isMatchingRoom(s.room_id, state.currentRoom)),
        },
      });
    });

    channel.on('broadcast', { event: 'respond_room_sync' }, ({ payload }) => {
      console.log('[DVide Realtime] Received respond_room_sync:', payload);
      if (payload.room) {
        // Sync real room metadata
        setCurrentRoom((prev) => {
          if (!prev) return payload.room;
          return {
            ...prev,
            name: payload.room.name || prev.name,
            currency: payload.room.currency || prev.currency,
          };
        });
        setRooms((prev) => {
          if (prev.some((r) => isMatchingRoom(r.id, payload.room))) {
            return prev.map((r) =>
              isMatchingRoom(r.id, payload.room)
                ? { ...r, name: payload.room.name || r.name, currency: payload.room.currency || r.currency }
                : r
            );
          }
          return [payload.room, ...prev];
        });
      }

      if (payload.members?.length) {
        setMembers((prev) => {
          const existingUserIds = new Set(prev.map((m) => m.user_id));
          const fresh = payload.members
            .filter((m: RoomMember) => !existingUserIds.has(m.user_id))
            .map((m: RoomMember) => ({ ...m, room_id: currentRoom.id, is_online: true }));
          return [...prev, ...fresh];
        });
      }
      if (payload.expenses?.length) {
        setExpenses((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const fresh = payload.expenses
            .filter((e: Expense) => !existingIds.has(e.id))
            .map((e: Expense) => ({ ...e, room_id: currentRoom.id }));
          return [...prev, ...fresh];
        });
      }
      if (payload.chats?.length) {
        setChats((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const fresh = payload.chats
            .filter((c: ChatMessage) => !existingIds.has(c.id))
            .map((c: ChatMessage) => ({ ...c, room_id: currentRoom.id }));
          return [...prev, ...fresh];
        });
      }
      if (payload.settlements?.length) {
        setSettlements((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const fresh = payload.settlements
            .filter((s: SettlementRecord) => !existingIds.has(s.id))
            .map((s: SettlementRecord) => ({ ...s, room_id: currentRoom.id }));
          return [...prev, ...fresh];
        });
      }
    });

    // 6b. Listen for member removed by Admin
    channel.on('broadcast', { event: 'member_removed' }, ({ payload }) => {
      console.log('[DVide Realtime] Received member_removed broadcast:', payload);
      if (!payload || !payload.user_id) return;
      if (payload.user_id === currentUser.id) {
        setCurrentRoom(null);
        alert('You have been removed from this room by the Admin.');
      } else {
        setMembers((prev) => prev.filter((m) => m.user_id !== payload.user_id));
      }
    });

    // 6c. Listen for room details or admin transfer updated
    channel.on('broadcast', { event: 'room_updated' }, ({ payload }) => {
      console.log('[DVide Realtime] Received room_updated broadcast:', payload);
      if (!payload) return;
      setCurrentRoom((prev) => (prev ? { ...prev, ...payload } : payload));
      setRooms((prev) =>
        prev.map((r) => (isMatchingRoom(r.id, payload) ? { ...r, ...payload } : r))
      );
    });

    // 6d. Listen for ledger reset by Admin
    channel.on('broadcast', { event: 'ledger_reset' }, ({ payload }) => {
      console.log('[DVide Realtime] Received ledger_reset broadcast:', payload);
      setExpenses((prev) => prev.filter((e) => !isMatchingRoom(e.room_id, currentRoom)));
      setSettlements((prev) => prev.filter((s) => !isMatchingRoom(s.room_id, currentRoom)));
    });

    // 6e. Listen for room deleted by Admin
    channel.on('broadcast', { event: 'room_deleted' }, ({ payload }) => {
      console.log('[DVide Realtime] Received room_deleted broadcast:', payload);
      if (!payload || !payload.room_id) return;
      setRooms((prev) => prev.filter((r) => r.id !== payload.room_id && !isMatchingRoom(payload.room_id, r)));
      if (currentRoom && (currentRoom.id === payload.room_id || isMatchingRoom(payload.room_id, currentRoom))) {
        setCurrentRoom(null);
        alert(`The room "${payload.room_name || 'Room'}" was permanently deleted by the Admin.`);
      }
    });

    // 7. Presence: Track who is currently online and auto-discover peers
    const handlePresenceUpdate = () => {
      const pState = channel.presenceState();
      console.log('[DVide Realtime] Presence state updated:', pState);

      const onlineUserMap = new Map<string, { user_id: string; name: string }>();
      Object.values(pState).forEach((presences: any) => {
        presences.forEach((p: any) => {
          if (p.user_id) {
            onlineUserMap.set(p.user_id, {
              user_id: p.user_id,
              name: p.name || 'Member',
            });
          }
        });
      });

      setMembers((prev) => {
        let updated = [...prev];
        // Automatically add any presence user who is online but not yet in members!
        onlineUserMap.forEach(({ user_id, name }) => {
          const exists = updated.some(
            (m) => m.user_id === user_id && isMatchingRoom(m.room_id, currentRoom)
          );
          if (!exists && currentRoom) {
            console.log(`[DVide Realtime] Discovered new online member from presence: ${name} (${user_id})`);
            updated.push({
              id: `m_${user_id}`,
              room_id: currentRoom.id,
              user_id: user_id,
              display_name: name,
              avatar_url: '',
              joined_at: new Date().toISOString(),
              is_online: true,
            });
          }
        });

        return updated.map((m) => {
          const isOnline = onlineUserMap.has(m.user_id) || m.user_id === currentUser.id;
          const freshName = onlineUserMap.get(m.user_id)?.name;
          return {
            ...m,
            is_online: isOnline,
            display_name: freshName && freshName !== 'Me' ? freshName : m.display_name,
          };
        });
      });
    };

    channel.on('presence', { event: 'sync' }, handlePresenceUpdate);
    channel.on('presence', { event: 'join' }, handlePresenceUpdate);

    // Subscribe, track presence, and announce membership
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[DVide Realtime] Subscribed to ${channelName}!`);
        await channel.track({
          user_id: currentUser.id,
          name: currentUser.name,
          online_at: new Date().toISOString(),
        });

        const myMemberPayload: RoomMember = {
          id: `m_${currentUser.id}`,
          room_id: currentRoom.id,
          user_id: currentUser.id,
          display_name: currentUser.name,
          avatar_url: currentUser.avatar_url,
          joined_at: new Date().toISOString(),
          is_online: true,
        };

        // Immediately broadcast new_member to all connected peers
        channel.send({
          type: 'broadcast',
          event: 'new_member',
          payload: myMemberPayload,
        });

        // Ask existing peers in this room for latest state
        channel.send({
          type: 'broadcast',
          event: 'request_room_sync',
          payload: {
            user_id: currentUser.id,
            member: myMemberPayload,
          },
        });
      }
    });

    channelRef.current = channel;

    // Database hydration (if Supabase PostgreSQL tables accessible)
    const fetchFromSupabase = async () => {
      try {
        const { data: dbExpenses } = await client
          .from('expenses')
          .select('*, splits:expense_splits(*)')
          .eq('room_id', currentRoom.id);

        if (dbExpenses && dbExpenses.length > 0) {
          setExpenses((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const fresh = dbExpenses.filter((e) => !existingIds.has(e.id));
            return [...prev, ...fresh];
          });
        }

        const { data: dbMembers } = await client
          .from('room_members')
          .select('*')
          .eq('room_id', currentRoom.id);

        if (dbMembers && dbMembers.length > 0) {
          setMembers((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const fresh = dbMembers
              .filter((m: any) => !existingIds.has(m.id))
              .map((m: any) => ({
                ...m,
                display_name: cleanMemberName(m.display_name),
              }));
            return [...prev, ...fresh];
          });
        }

        const { data: dbChats } = await client
          .from('chat_messages')
          .select('*')
          .eq('room_id', currentRoom.id)
          .order('created_at', { ascending: true });

        if (dbChats && dbChats.length > 0) {
          setChats((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const fresh = dbChats
              .filter((c: any) => !existingIds.has(c.id))
              .map((c: any) => {
                const member =
                  dbMembers?.find((m: any) => m.user_id === c.user_id) ||
                  members.find((m) => m.user_id === c.user_id);
                return {
                  ...c,
                  display_name: cleanMemberName(member?.display_name || c.display_name),
                  avatar_url: member?.avatar_url || c.avatar_url,
                };
              });
            return [...prev, ...fresh];
          });
        }
      } catch (err) {
        console.warn('[DVide Realtime] DB fetch skipped (using Realtime Broadcast):', err);
      }
    };

    fetchFromSupabase();

    return () => {
      console.log(`[DVide Realtime] Unsubscribing from ${channelName}`);
      client.removeChannel(channel);
      channelRef.current = null;
    };
  }, [currentRoom?.id, currentRoom?.invite_code, currentUser.id]);

  // Actions
  const addExpense = (newExp: Omit<Expense, 'id' | 'created_at'>) => {
    if (!currentRoom) return;

    const expense: Expense = {
      ...newExp,
      id: `exp_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    setExpenses((prev) => [expense, ...prev]);

    // System announcement
    const payerName = roomMembers.find((m) => m.user_id === expense.paid_by_user_id)?.display_name || 'Someone';
    const noteMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      room_id: currentRoom.id,
      user_id: 'system',
      display_name: 'DVide Bot',
      message: `🧾 ${payerName} added "${expense.description}" for ${currentRoom.currency}${expense.total_amount.toLocaleString()}`,
      created_at: new Date().toISOString(),
    };
    setChats((prev) => [...prev, noteMsg]);

    // 🚀 REALTIME BROADCAST TO ALL CONNECTED DEVICES
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_expense',
        payload: expense,
      });
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_chat',
        payload: noteMsg,
      });
    }

    // Attempt DB insert
    const client = supabase;
    if (client) {
      (async () => {
        try {
          await client.from('expenses').insert({
            id: expense.id,
            room_id: expense.room_id,
            created_by: expense.created_by,
            description: expense.description,
            category: expense.category,
            subtotal: expense.subtotal,
            tax_rate: expense.tax_rate,
            tax_amount: expense.tax_amount,
            tax_type: expense.tax_type,
            tax_split_method: expense.tax_split_method,
            service_charge: expense.service_charge,
            tip: expense.tip,
            discount: expense.discount,
            total_amount: expense.total_amount,
            currency: expense.currency,
            paid_by_user_id: expense.paid_by_user_id,
            split_method: expense.split_method,
          });

          if (expense.splits?.length) {
            await client.from('expense_splits').insert(
              expense.splits.map((s) => ({
                expense_id: expense.id,
                user_id: s.user_id,
                amount: s.amount,
                tax_amount: s.tax_amount,
                total_share: s.total_share,
              }))
            );
          }
        } catch (e) {
          console.warn('DB expense insert:', e);
        }
      })();
    }
  };

  const deleteExpense = (id: string) => {
    if (!currentRoom) return;
    const target = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));

    if (target) {
      const noteMsg: ChatMessage = {
        id: `sys_${Date.now()}`,
        room_id: currentRoom.id,
        user_id: 'system',
        display_name: 'DVide Bot',
        message: `🗑️ Deleted "${target.description}"`,
        created_at: new Date().toISOString(),
      };
      setChats((prev) => [...prev, noteMsg]);

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'delete_expense',
          payload: { id },
        });
        channelRef.current.send({
          type: 'broadcast',
          event: 'new_chat',
          payload: noteMsg,
        });
      }

      const client = supabase;
      if (client) {
        (async () => {
          try {
            await client.from('expenses').delete().eq('id', id);
          } catch {}
        })();
      }
    }
  };

  const sendChatMessage = (message: string) => {
    if (!currentRoom || !message.trim()) return;
    const cleanName = cleanMemberName(currentUser.name);
    const chat: ChatMessage = {
      id: `msg_${Date.now()}`,
      room_id: currentRoom.id,
      user_id: currentUser.id,
      display_name: cleanName,
      avatar_url: currentUser.avatar_url,
      message: message.trim(),
      created_at: new Date().toISOString(),
    };

    setChats((prev) => [...prev, chat]);

    // 🚀 REALTIME BROADCAST
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_chat',
        payload: chat,
      });
    }

    const client = supabase;
    if (client) {
      (async () => {
        try {
          await client.from('chat_messages').insert({
            id: chat.id,
            room_id: chat.room_id,
            user_id: chat.user_id,
            message: chat.message,
          });
        } catch {}
      })();
    }
  };

  const recordSettlement = (transfer: {
    from_user_id: string;
    to_user_id: string;
    amount: number;
  }) => {
    if (!currentRoom) return;

    const record: SettlementRecord = {
      id: `stl_${Date.now()}`,
      room_id: currentRoom.id,
      from_user_id: transfer.from_user_id,
      to_user_id: transfer.to_user_id,
      amount: transfer.amount,
      is_settled: true,
      settled_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setSettlements((prev) => [record, ...prev]);

    const fromMember = roomMembers.find((m) => m.user_id === transfer.from_user_id);
    const toMember = roomMembers.find((m) => m.user_id === transfer.to_user_id);

    const settlementExpense: Expense = {
      id: `exp_settle_${Date.now()}`,
      room_id: currentRoom.id,
      created_by: transfer.from_user_id,
      description: `Payment to ${toMember?.display_name || 'Member'}`,
      category: 'other',
      subtotal: transfer.amount,
      tax_rate: 0,
      tax_amount: 0,
      tax_type: 'added',
      tax_split_method: 'equal',
      service_charge: 0,
      tip: 0,
      discount: 0,
      total_amount: transfer.amount,
      currency: currentRoom.currency,
      paid_by_user_id: transfer.from_user_id,
      split_method: 'exact',
      splits: [
        {
          id: `s_stl_${Date.now()}`,
          expense_id: `exp_settle_${Date.now()}`,
          user_id: transfer.to_user_id,
          amount: transfer.amount,
          tax_amount: 0,
          total_share: transfer.amount,
        },
      ],
      created_at: new Date().toISOString(),
    };

    setExpenses((prev) => [settlementExpense, ...prev]);

    const announce: ChatMessage = {
      id: `sys_${Date.now()}`,
      room_id: currentRoom.id,
      user_id: 'system',
      display_name: 'DVide Bot',
      message: `💸 ${fromMember?.display_name || 'Member'} paid ${currentRoom.currency}${transfer.amount.toLocaleString()} to ${toMember?.display_name || 'Member'}. Settled! 🎉`,
      created_at: new Date().toISOString(),
    };
    setChats((prev) => [...prev, announce]);

    // 🚀 REALTIME BROADCAST
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_settlement',
        payload: { record, expense: settlementExpense },
      });
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_chat',
        payload: announce,
      });
    }
  };

  const createRoom = (name: string, currency: string = '₹') => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newRoom: Room = {
      id: `room_${code}`,
      name: name.trim(),
      created_by: currentUser.id,
      invite_code: code,
      currency,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setRooms((prev) => [newRoom, ...prev]);
    setCurrentRoom(newRoom);

    const selfMember: RoomMember = {
      id: `m_${currentUser.id}_${Date.now()}`,
      room_id: newRoom.id,
      user_id: currentUser.id,
      display_name: cleanMemberName(currentUser.name),
      avatar_url: currentUser.avatar_url,
      joined_at: new Date().toISOString(),
      is_online: true,
    };
    setMembers((prev) => [...prev, selfMember]);

    const client = supabase;
    if (client) {
      (async () => {
        try {
          await client.from('rooms').insert({
            id: newRoom.id,
            name: newRoom.name,
            invite_code: newRoom.invite_code,
            currency: newRoom.currency,
          });
          await client.from('room_members').upsert({
            id: selfMember.id,
            room_id: newRoom.id,
            user_id: currentUser.id,
            display_name: selfMember.display_name,
            avatar_url: selfMember.avatar_url,
          });
        } catch {}
      })();
    }
  };

  const updateProfileName = (newName: string) => {
    if (!newName.trim()) return;
    const clean = cleanMemberName(newName);
    setCurrentUser((prev) => ({ ...prev, name: clean }));

    if (currentRoom) {
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === currentUser.id && isMatchingRoom(m.room_id, currentRoom)
            ? { ...m, display_name: clean }
            : m
        )
      );

      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'new_member',
          payload: {
            id: `m_${currentUser.id}`,
            room_id: currentRoom.id,
            user_id: currentUser.id,
            display_name: clean,
            avatar_url: currentUser.avatar_url,
            joined_at: new Date().toISOString(),
            is_online: true,
          },
        });
      }

      const client = supabase;
      if (client) {
        (async () => {
          try {
            await client.from('room_members').upsert({
              id: `m_${currentUser.id}`,
              room_id: currentRoom.id,
              user_id: currentUser.id,
              display_name: clean,
              avatar_url: currentUser.avatar_url,
            });
          } catch {}
        })();
      }
    }
  };

  const joinRoomByCode = async (code: string, userName?: string) => {
    const cleanCode = code.toUpperCase().trim();
    if (userName && userName.trim()) {
      const cleanName = cleanMemberName(userName.trim());
      setCurrentUser((prev) => ({ ...prev, name: cleanName }));
    }
    const myName = userName?.trim() || currentUser.name || getRandomFriendlyName();

    let targetRoom = rooms.find((r) => r.invite_code.toUpperCase() === cleanCode);

    const client = supabase;
    if (!targetRoom && client) {
      try {
        const { data: dbRoom } = await client
          .from('rooms')
          .select('*')
          .eq('invite_code', cleanCode)
          .single();

        if (dbRoom) {
          targetRoom = dbRoom;
        }
      } catch {
        // Fallback to generated representation
      }
    }

    if (!targetRoom) {
      targetRoom = {
        id: `room_${cleanCode}`,
        name: `Group #${cleanCode}`,
        created_by: 'host',
        invite_code: cleanCode,
        currency: '₹',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    setRooms((prev) => {
      if (prev.some((r) => isMatchingRoom(r.id, targetRoom))) return prev;
      return [targetRoom!, ...prev];
    });
    setCurrentRoom(targetRoom);

    // Add current user as member
    const cleanSelfName = cleanMemberName(myName);
    const newMember: RoomMember = {
      id: `m_${currentUser.id}_${Date.now()}`,
      room_id: targetRoom.id,
      user_id: currentUser.id,
      display_name: cleanSelfName,
      avatar_url: currentUser.avatar_url,
      joined_at: new Date().toISOString(),
      is_online: true,
    };

    setMembers((prev) => {
      if (prev.some((m) => isMatchingRoom(m.room_id, targetRoom) && m.user_id === currentUser.id)) {
        return prev.map((m) =>
          m.user_id === currentUser.id && isMatchingRoom(m.room_id, targetRoom)
            ? { ...m, display_name: cleanSelfName, is_online: true }
            : m
        );
      }
      return [...prev, newMember];
    });

    // 🚀 REALTIME BROADCAST new member to other participants
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_member',
        payload: newMember,
      });
    }

    if (client) {
      (async () => {
        try {
          await client.from('room_members').upsert({
            id: newMember.id,
            room_id: targetRoom!.id,
            user_id: currentUser.id,
            display_name: newMember.display_name,
            avatar_url: newMember.avatar_url,
          });
        } catch {}
      })();
    }

    return true;
  };

  const addMemberToRoom = (name: string) => {
    if (!currentRoom || !name.trim()) return;
    const newUid = `u_${Date.now()}`;
    const newMember: RoomMember = {
      id: `m_${Date.now()}`,
      room_id: currentRoom.id,
      user_id: newUid,
      display_name: name.trim(),
      avatar_url: '',
      joined_at: new Date().toISOString(),
      is_online: true,
    };
    setMembers((prev) => [...prev, newMember]);

    const welcomeMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      room_id: currentRoom.id,
      user_id: 'system',
      display_name: 'DVide Bot',
      message: `👋 ${name.trim()} joined the room!`,
      created_at: new Date().toISOString(),
    };
    setChats((prev) => [...prev, welcomeMsg]);

    // 🚀 REALTIME BROADCAST
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_member',
        payload: newMember,
      });
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_chat',
        payload: welcomeMsg,
      });
    }

    const client = supabase;
    if (client) {
      (async () => {
        try {
          await client.from('room_members').upsert({
            id: newMember.id,
            room_id: currentRoom.id,
            user_id: newMember.user_id,
            display_name: newMember.display_name,
            avatar_url: newMember.avatar_url,
          });
        } catch {}
      })();
    }
  };

  const removeMemberFromRoom = async (userId: string) => {
    if (!currentRoom || !isCurrentUserAdmin || userId === currentUser.id) return;
    const targetMember = roomMembers.find((m) => m.user_id === userId);
    const targetName = cleanMemberName(targetMember?.display_name);

    setMembers((prev) => prev.filter((m) => !(m.user_id === userId && isMatchingRoom(m.room_id, currentRoom))));

    const removeNotice: ChatMessage = {
      id: `sys_${Date.now()}`,
      room_id: currentRoom.id,
      user_id: 'system',
      display_name: 'DVide Bot',
      message: `🚫 ${cleanMemberName(currentUser.name)} (Admin) removed ${targetName} from the room.`,
      created_at: new Date().toISOString(),
    };
    setChats((prev) => [...prev, removeNotice]);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'member_removed',
        payload: { user_id: userId, room_id: currentRoom.id },
      });
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_chat',
        payload: removeNotice,
      });
    }

    const client = supabase;
    if (client) {
      try {
        await client
          .from('room_members')
          .delete()
          .eq('room_id', currentRoom.id)
          .eq('user_id', userId);
      } catch {}
    }
  };

  const updateRoomDetails = async (name: string, currency: string) => {
    if (!currentRoom || !isCurrentUserAdmin || !name.trim()) return;
    const updatedRoom: Room = {
      ...currentRoom,
      name: name.trim(),
      currency: currency || currentRoom.currency,
      updated_at: new Date().toISOString(),
    };

    setCurrentRoom(updatedRoom);
    setRooms((prev) => prev.map((r) => isMatchingRoom(r.id, currentRoom) ? updatedRoom : r));

    const notice: ChatMessage = {
      id: `sys_${Date.now()}`,
      room_id: currentRoom.id,
      user_id: 'system',
      display_name: 'DVide Bot',
      message: `⚙️ Room settings updated: "${updatedRoom.name}" (${updatedRoom.currency})`,
      created_at: new Date().toISOString(),
    };
    setChats((prev) => [...prev, notice]);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'room_updated',
        payload: updatedRoom,
      });
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_chat',
        payload: notice,
      });
    }

    const client = supabase;
    if (client) {
      try {
        await client
          .from('rooms')
          .update({ name: updatedRoom.name, currency: updatedRoom.currency })
          .eq('id', currentRoom.id);
      } catch {}
    }
  };

  const transferAdmin = async (newAdminUserId: string) => {
    if (!currentRoom || !isCurrentUserAdmin || newAdminUserId === currentUser.id) return;
    const newAdminMember = roomMembers.find((m) => m.user_id === newAdminUserId);
    if (!newAdminMember) return;

    const updatedRoom: Room = {
      ...currentRoom,
      created_by: newAdminUserId,
      updated_at: new Date().toISOString(),
    };

    setCurrentRoom(updatedRoom);
    setRooms((prev) => prev.map((r) => isMatchingRoom(r.id, currentRoom) ? updatedRoom : r));

    const notice: ChatMessage = {
      id: `sys_${Date.now()}`,
      room_id: currentRoom.id,
      user_id: 'system',
      display_name: 'DVide Bot',
      message: `👑 ${cleanMemberName(currentUser.name)} handed over Room Admin rights to ${cleanMemberName(newAdminMember.display_name)}.`,
      created_at: new Date().toISOString(),
    };
    setChats((prev) => [...prev, notice]);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'room_updated',
        payload: updatedRoom,
      });
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_chat',
        payload: notice,
      });
    }

    const client = supabase;
    if (client) {
      try {
        await client
          .from('rooms')
          .update({ created_by: newAdminUserId })
          .eq('id', currentRoom.id);
      } catch {}
    }
  };

  const resetRoomLedger = async () => {
    if (!currentRoom || !isCurrentUserAdmin) return;
    setExpenses((prev) => prev.filter((e) => !isMatchingRoom(e.room_id, currentRoom)));
    setSettlements((prev) => prev.filter((s) => !isMatchingRoom(s.room_id, currentRoom)));

    const notice: ChatMessage = {
      id: `sys_${Date.now()}`,
      room_id: currentRoom.id,
      user_id: 'system',
      display_name: 'DVide Bot',
      message: `🧹 Room ledger was reset by Admin (${cleanMemberName(currentUser.name)}). All expenses settled!`,
      created_at: new Date().toISOString(),
    };
    setChats((prev) => [...prev, notice]);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'ledger_reset',
        payload: { room_id: currentRoom.id },
      });
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_chat',
        payload: notice,
      });
    }

    const client = supabase;
    if (client) {
      try {
        await client.from('expenses').delete().eq('room_id', currentRoom.id);
        await client.from('settlements').delete().eq('room_id', currentRoom.id);
      } catch {}
    }
  };

  const deleteRoom = async (roomId: string) => {
    const targetRoom = rooms.find((r) => r.id === roomId || isMatchingRoom(roomId, r));
    if (!targetRoom) return;

    // Check if current user is admin of target room
    const isTargetAdmin =
      (targetRoom.created_by && targetRoom.created_by === currentUser.id) ||
      (currentRoom && isMatchingRoom(currentRoom.id, targetRoom) && isCurrentUserAdmin);

    if (!isTargetAdmin) {
      alert('Only the room Admin can delete this room.');
      return;
    }

    // Broadcast deletion to all peers in the room before tearing down
    if (channelRef.current && isMatchingRoom(currentRoom?.id, targetRoom)) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'room_deleted',
        payload: { room_id: targetRoom.id, room_name: targetRoom.name },
      });
    }

    // Remove from local state
    const remainingRooms = rooms.filter((r) => !isMatchingRoom(r.id, targetRoom));
    setRooms(remainingRooms);
    setMembers((prev) => prev.filter((m) => !isMatchingRoom(m.room_id, targetRoom)));
    setExpenses((prev) => prev.filter((e) => !isMatchingRoom(e.room_id, targetRoom)));
    setChats((prev) => prev.filter((c) => !isMatchingRoom(c.room_id, targetRoom)));
    setSettlements((prev) => prev.filter((s) => !isMatchingRoom(s.room_id, targetRoom)));

    if (currentRoom && isMatchingRoom(currentRoom.id, targetRoom)) {
      setCurrentRoom(remainingRooms[0] || null);
    }

    // Supabase DB cleanup
    const client = supabase;
    if (client) {
      try {
        await client.from('rooms').delete().eq('id', targetRoom.id);
        await client.from('room_members').delete().eq('room_id', targetRoom.id);
        await client.from('expenses').delete().eq('room_id', targetRoom.id);
        await client.from('settlements').delete().eq('room_id', targetRoom.id);
      } catch (err) {
        console.warn('Failed to delete room from Supabase:', err);
      }
    }
  };

  const switchUser = (userId: string) => {
    const member = roomMembers.find((m) => m.user_id === userId);
    if (member) {
      setCurrentUser({
        id: member.user_id,
        name: member.display_name.replace(' (You)', '').replace(' (Admin)', ''),
        avatar_url: member.avatar_url,
      });
    }
  };

  const clearAllData = () => {
    localStorage.clear();
    setCurrentUser(getInitialUser());
    setCurrentRoom(null);
    setRooms([]);
    setMembers([]);
    setExpenses([]);
    setChats([]);
    setSettlements([]);
  };

  return {
    currentUser,
    currentRoom,
    rooms,
    members: roomMembers,
    expenses: roomExpenses,
    chats: roomChats,
    settlements,
    memberBalances,
    roomSummary,
    settlementTransfers,
    myBalance,
    addExpense,
    deleteExpense,
    sendChatMessage,
    recordSettlement,
    createRoom,
    joinRoomByCode,
    addMemberToRoom,
    updateProfileName,
    switchRoom: (roomId: string) => {
      const r = rooms.find((x) => x.id === roomId);
      if (r) setCurrentRoom(r);
    },
    switchUser,
    clearAllData,
    roomAdminUserId,
    isCurrentUserAdmin,
    removeMemberFromRoom,
    updateRoomDetails,
    transferAdmin,
    resetRoomLedger,
    deleteRoom,
    isSupabaseConnected: isSupabaseConfigured,
  };
}
