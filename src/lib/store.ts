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

// Realistic initial demo seed
const INITIAL_USER: UserProfile = {
  id: 'u_krish',
  name: 'Krish',
  email: 'krish@dvide.app',
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
};

const INITIAL_ROOM: Room = {
  id: 'room_goa_2026',
  name: 'Goa Trip 🏖️',
  created_by: 'u_krish',
  invite_code: 'GOA26',
  currency: '₹',
  created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

const INITIAL_MEMBERS: RoomMember[] = [
  {
    id: 'm_1',
    room_id: 'room_goa_2026',
    user_id: 'u_krish',
    display_name: 'Krish (You)',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    joined_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    is_online: true,
  },
  {
    id: 'm_2',
    room_id: 'room_goa_2026',
    user_id: 'u_rahul',
    display_name: 'Rahul',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80',
    joined_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    is_online: true,
  },
  {
    id: 'm_3',
    room_id: 'room_goa_2026',
    user_id: 'u_aman',
    display_name: 'Aman',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    joined_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    is_online: false,
  },
  {
    id: 'm_4',
    room_id: 'room_goa_2026',
    user_id: 'u_riya',
    display_name: 'Riya',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
    joined_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    is_online: true,
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    room_id: 'room_goa_2026',
    created_by: 'u_krish',
    description: 'Seafood Dinner & Drinks',
    category: 'food',
    subtotal: 2400,
    tax_rate: 18,
    tax_amount: 432,
    tax_type: 'added',
    tax_split_method: 'equal',
    service_charge: 0,
    tip: 0,
    discount: 0,
    total_amount: 2832,
    currency: '₹',
    paid_by_user_id: 'u_krish',
    split_method: 'equal',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    splits: [
      { id: 's1', expense_id: 'exp_1', user_id: 'u_krish', amount: 600, tax_amount: 108, total_share: 708 },
      { id: 's2', expense_id: 'exp_1', user_id: 'u_rahul', amount: 600, tax_amount: 108, total_share: 708 },
      { id: 's3', expense_id: 'exp_1', user_id: 'u_aman', amount: 600, tax_amount: 108, total_share: 708 },
      { id: 's4', expense_id: 'exp_1', user_id: 'u_riya', amount: 600, tax_amount: 108, total_share: 708 },
    ],
  },
  {
    id: 'exp_2',
    room_id: 'room_goa_2026',
    created_by: 'u_rahul',
    description: 'Scooter Rentals (3 days)',
    category: 'transport',
    subtotal: 2000,
    tax_rate: 0,
    tax_amount: 0,
    tax_type: 'added',
    tax_split_method: 'equal',
    service_charge: 0,
    tip: 0,
    discount: 0,
    total_amount: 2000,
    currency: '₹',
    paid_by_user_id: 'u_rahul',
    split_method: 'equal',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    splits: [
      { id: 's5', expense_id: 'exp_2', user_id: 'u_krish', amount: 500, tax_amount: 0, total_share: 500 },
      { id: 's6', expense_id: 'exp_2', user_id: 'u_rahul', amount: 500, tax_amount: 0, total_share: 500 },
      { id: 's7', expense_id: 'exp_2', user_id: 'u_aman', amount: 500, tax_amount: 0, total_share: 500 },
      { id: 's8', expense_id: 'exp_2', user_id: 'u_riya', amount: 500, tax_amount: 0, total_share: 500 },
    ],
  },
  {
    id: 'exp_3',
    room_id: 'room_goa_2026',
    created_by: 'u_riya',
    description: 'Villa Groceries & Snacks',
    category: 'groceries',
    subtotal: 1200,
    tax_rate: 5,
    tax_amount: 60,
    tax_type: 'added',
    tax_split_method: 'equal',
    service_charge: 0,
    tip: 0,
    discount: 0,
    total_amount: 1260,
    currency: '₹',
    paid_by_user_id: 'u_riya',
    split_method: 'equal',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    splits: [
      { id: 's9', expense_id: 'exp_3', user_id: 'u_krish', amount: 300, tax_amount: 15, total_share: 315 },
      { id: 's10', expense_id: 'exp_3', user_id: 'u_rahul', amount: 300, tax_amount: 15, total_share: 315 },
      { id: 's11', expense_id: 'exp_3', user_id: 'u_aman', amount: 300, tax_amount: 15, total_share: 315 },
      { id: 's12', expense_id: 'exp_3', user_id: 'u_riya', amount: 300, tax_amount: 15, total_share: 315 },
    ],
  },
];

const INITIAL_CHATS: ChatMessage[] = [
  {
    id: 'c_1',
    room_id: 'room_goa_2026',
    user_id: 'u_krish',
    display_name: 'Krish',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    message: 'Welcome everyone! I created the room for our Goa trip expenses.',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'c_2',
    room_id: 'room_goa_2026',
    user_id: 'u_rahul',
    display_name: 'Rahul',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80',
    message: 'Sweet. Just added ₹2,000 for the 4 rental scooters.',
    created_at: new Date(Date.now() - 3600000 * 5.5).toISOString(),
  },
  {
    id: 'c_3',
    room_id: 'room_goa_2026',
    user_id: 'u_krish',
    display_name: 'Krish',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    message: 'Added dinner at Fisherman’s Wharf: ₹2,400 + 18% GST.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'c_4',
    room_id: 'room_goa_2026',
    user_id: 'u_riya',
    display_name: 'Riya',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
    message: 'Awesome! DVide shows my balance is +₹445 so I will settle with Aman later 👍',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export function useDVideStore() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('dvide_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [currentRoom, setCurrentRoom] = useState<Room>(() => {
    const saved = localStorage.getItem('dvide_current_room');
    return saved ? JSON.parse(saved) : INITIAL_ROOM;
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('dvide_all_rooms');
    return saved ? JSON.parse(saved) : [INITIAL_ROOM];
  });

  const [members, setMembers] = useState<RoomMember[]>(() => {
    const saved = localStorage.getItem('dvide_members');
    return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('dvide_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [chats, setChats] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('dvide_chats');
    return saved ? JSON.parse(saved) : INITIAL_CHATS;
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
    localStorage.setItem('dvide_current_room', JSON.stringify(currentRoom));
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

  // Derived financial metrics
  const roomMembers = members.filter((m) => m.room_id === currentRoom.id);
  const roomExpenses = expenses.filter((e) => e.room_id === currentRoom.id);
  const roomChats = chats.filter((c) => c.room_id === currentRoom.id);
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
    const expense: Expense = {
      ...newExp,
      id: `exp_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    setExpenses((prev) => [expense, ...prev]);

    // Add activity chat note
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
    const target = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (target) {
      const noteMsg: ChatMessage = {
        id: `sys_${Date.now()}`,
        room_id: currentRoom.id,
        user_id: 'system',
        display_name: 'DVide Bot',
        message: `🗑️ Deleted expense "${target.description}"`,
        created_at: new Date().toISOString(),
      };
      setChats((prev) => [...prev, noteMsg]);
    }
  };

  const sendChatMessage = (message: string) => {
    if (!message.trim()) return;
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

    // Record as a settlement expense to adjust ledger balance
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

    // Add settlement chat announcement
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

    // Add creator as member
    const selfMember: RoomMember = {
      id: `m_${Date.now()}`,
      room_id: newRoom.id,
      user_id: currentUser.id,
      display_name: `${currentUser.name} (Admin)`,
      avatar_url: currentUser.avatar_url,
      joined_at: new Date().toISOString(),
      is_online: true,
    };
    setMembers((prev) => [...prev, selfMember]);
  };

  const joinRoomByCode = (code: string) => {
    const targetRoom = rooms.find((r) => r.invite_code.toUpperCase() === code.toUpperCase().trim());
    if (!targetRoom) {
      // Create a new simulated room for this code if not locally present
      const generatedRoom: Room = {
        id: `room_joined_${Date.now()}`,
        name: `Group #${code.toUpperCase()}`,
        created_by: 'host',
        invite_code: code.toUpperCase().trim(),
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
    // Add current user if not already a member
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
    if (!name.trim()) return;
    const newUid = `u_${Date.now()}`;
    const newMember: RoomMember = {
      id: `m_${Date.now()}`,
      room_id: currentRoom.id,
      user_id: newUid,
      display_name: name.trim(),
      avatar_url: `https://images.unsplash.com/photo-${1535713875000 + Math.floor(Math.random() * 5000)}?auto=format&fit=crop&w=120&h=120&q=80`,
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

  const resetToDemo = () => {
    localStorage.clear();
    setCurrentUser(INITIAL_USER);
    setCurrentRoom(INITIAL_ROOM);
    setRooms([INITIAL_ROOM]);
    setMembers(INITIAL_MEMBERS);
    setExpenses(INITIAL_EXPENSES);
    setChats(INITIAL_CHATS);
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
    resetToDemo,
    isSupabaseConnected: isSupabaseConfigured,
  };
}
