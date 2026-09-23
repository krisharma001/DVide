import { useState, useEffect } from 'react';
import {
  Room,
  RoomMember,
  Expense,
  ChatMessage,
  SettlementRecord,
  UserProfile,
  ExpenseSplit,
} from '../types';
import { calculateMemberBalances, calculateRoomSummary } from './calculations';
import { generateSettlementTransfers } from './settlementEngine';
import { supabase, isSupabaseConfigured } from './supabase';

const DEFAULT_USER: UserProfile = {
  id: 'u_me',
  name: 'Krish (You)',
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

  // Local storage synchronization
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

  // Actions
  const addExpense = (newExp: Omit<Expense, 'id' | 'created_at'>) => {
    if (!currentRoom) return;

    const expense: Expense = {
      ...newExp,
      id: `exp_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    setExpenses((prev) => [expense, ...prev]);

    // System notification
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
  };

  const createRoom = (name: string, currency: string = '₹') => {
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newRoom: Room = {
      id: `room_${Date.now()}`,
      name: name.trim(),
      created_by: currentUser.id,
      invite_code: code,
      currency,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setRooms((prev) => [newRoom, ...prev]);
    setCurrentRoom(newRoom);

    // Creator is first member
    const selfMember: RoomMember = {
      id: `m_${Date.now()}`,
      room_id: newRoom.id,
      user_id: currentUser.id,
      display_name: currentUser.name || 'Admin',
      avatar_url: currentUser.avatar_url,
      joined_at: new Date().toISOString(),
      is_online: true,
    };
    setMembers((prev) => [...prev, selfMember]);

    const welcomeMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      room_id: newRoom.id,
      user_id: 'system',
      display_name: 'DVide Bot',
      message: `🎉 Created room "${name.trim()}". Invite friends using code: ${code}`,
      created_at: new Date().toISOString(),
    };
    setChats((prev) => [...prev, welcomeMsg]);
  };

  const joinRoomByCode = (code: string) => {
    const cleanCode = code.toUpperCase().trim();
    const targetRoom = rooms.find((r) => r.invite_code.toUpperCase() === cleanCode);

    if (!targetRoom) {
      // Create room representation for this code
      const generatedRoom: Room = {
        id: `room_joined_${Date.now()}`,
        name: `Group #${cleanCode}`,
        created_by: 'host',
        invite_code: cleanCode,
        currency: '₹',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setRooms((prev) => [generatedRoom, ...prev]);
      setCurrentRoom(generatedRoom);

      const newMember: RoomMember = {
        id: `m_${Date.now()}`,
        room_id: generatedRoom.id,
        user_id: currentUser.id,
        display_name: currentUser.name,
        avatar_url: currentUser.avatar_url,
        joined_at: new Date().toISOString(),
        is_online: true,
      };
      setMembers((prev) => [...prev, newMember]);
      return true;
    }

    setCurrentRoom(targetRoom);
    const isMember = members.some((m) => m.room_id === targetRoom.id && m.user_id === currentUser.id);
    if (!isMember) {
      const newMember: RoomMember = {
        id: `m_${Date.now()}`,
        room_id: targetRoom.id,
        user_id: currentUser.id,
        display_name: currentUser.name,
        avatar_url: currentUser.avatar_url,
        joined_at: new Date().toISOString(),
        is_online: true,
      };
      setMembers((prev) => [...prev, newMember]);
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
    switchRoom: (roomId: string) => {
      const r = rooms.find((x) => x.id === roomId);
      if (r) setCurrentRoom(r);
    },
    switchUser,
    clearAllData,
    isSupabaseConnected: isSupabaseConfigured,
  };
}
