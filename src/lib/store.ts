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

const DEFAULT_USER: UserProfile = {
  id: 'u_' + Math.random().toString(36).substring(2, 9),
  name: 'Me',
  email: '',
  avatar_url: '',
};

export function useDVideStore() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('dvide_current_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

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
    return saved ? JSON.parse(saved) : [];
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

  // Active room data filters
  const roomMembers = currentRoom ? members.filter((m) => m.room_id === currentRoom.id) : [];
  const roomExpenses = currentRoom ? expenses.filter((e) => e.room_id === currentRoom.id) : [];
  const roomChats = currentRoom ? chats.filter((c) => c.room_id === currentRoom.id) : [];

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
      setMembers((prev) => {
        const existingIdx = prev.findIndex((m) => m.room_id === payload.room_id && m.user_id === payload.user_id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...payload };
          return updated;
        }
        return [...prev, payload];
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
    channel.on('broadcast', { event: 'request_room_sync' }, () => {
      console.log('[DVide Realtime] Received request_room_sync, sending latest state...');
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
          settlements: state.settlements.filter((s) => s.room_id === state.currentRoom?.id),
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
          if (prev.some((r) => r.id === payload.room.id)) {
            return prev.map((r) =>
              r.id === payload.room.id
                ? { ...r, name: payload.room.name || r.name, currency: payload.room.currency || r.currency }
                : r
            );
          }
          return [payload.room, ...prev];
        });
      }

      if (payload.members?.length) {
        setMembers((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const fresh = payload.members.filter((m: RoomMember) => !existingIds.has(m.id));
          return [...prev, ...fresh];
        });
      }
      if (payload.expenses?.length) {
        setExpenses((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const fresh = payload.expenses.filter((e: Expense) => !existingIds.has(e.id));
          return [...prev, ...fresh];
        });
      }
      if (payload.chats?.length) {
        setChats((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const fresh = payload.chats.filter((c: ChatMessage) => !existingIds.has(c.id));
          return [...prev, ...fresh];
        });
      }
      if (payload.settlements?.length) {
        setSettlements((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const fresh = payload.settlements.filter((s: SettlementRecord) => !existingIds.has(s.id));
          return [...prev, ...fresh];
        });
      }
    });

    // 7. Presence: Track who is currently online
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineUserIds = new Set(Object.keys(state));
      setMembers((prev) =>
        prev.map((m) => ({
          ...m,
          is_online: onlineUserIds.has(m.user_id) || m.user_id === currentUser.id,
        }))
      );
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[DVide Realtime] Subscribed to ${channelName}!`);
        await channel.track({
          user_id: currentUser.id,
          name: currentUser.name,
          online_at: new Date().toISOString(),
        });

        // Ask existing peers in this room for latest state
        channel.send({
          type: 'broadcast',
          event: 'request_room_sync',
          payload: { user_id: currentUser.id },
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

        const { data: dbChats } = await client
          .from('chat_messages')
          .select('*')
          .eq('room_id', currentRoom.id)
          .order('created_at', { ascending: true });

        if (dbChats && dbChats.length > 0) {
          setChats((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const fresh = dbChats.filter((c) => !existingIds.has(c.id));
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
            const fresh = dbMembers.filter((m) => !existingIds.has(m.id));
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
    const chat: ChatMessage = {
      id: `msg_${Date.now()}`,
      room_id: currentRoom.id,
      user_id: currentUser.id,
      display_name: currentUser.name,
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
      display_name: currentUser.name || 'Admin',
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
        } catch {}
      })();
    }
  };

  const updateProfileName = (newName: string) => {
    if (!newName.trim()) return;
    const clean = newName.trim();
    setCurrentUser((prev) => ({ ...prev, name: clean }));

    if (currentRoom) {
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === currentUser.id && m.room_id === currentRoom.id
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
    }
  };

  const joinRoomByCode = async (code: string) => {
    const cleanCode = code.toUpperCase().trim();
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
      if (prev.some((r) => r.id === targetRoom!.id)) return prev;
      return [targetRoom!, ...prev];
    });
    setCurrentRoom(targetRoom);

    // Add current user as member
    const newMember: RoomMember = {
      id: `m_${currentUser.id}_${Date.now()}`,
      room_id: targetRoom.id,
      user_id: currentUser.id,
      display_name: currentUser.name,
      avatar_url: currentUser.avatar_url,
      joined_at: new Date().toISOString(),
      is_online: true,
    };

    setMembers((prev) => {
      if (prev.some((m) => m.room_id === targetRoom!.id && m.user_id === currentUser.id)) {
        return prev;
      }
      return [...prev, newMember];
    });

    // 🚀 Broadcast to any peers in this room that we joined
    setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'new_member',
          payload: newMember,
        });
        channelRef.current.send({
          type: 'broadcast',
          event: 'request_room_sync',
          payload: { user_id: currentUser.id },
        });
      }
    }, 400);

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
    setCurrentUser(DEFAULT_USER);
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
    isSupabaseConnected: isSupabaseConfigured,
  };
}
