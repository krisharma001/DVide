export type SplitMethod = 'equal' | 'percentage' | 'exact' | 'shares';
export type TaxSplitMethod = 'proportional' | 'equal' | 'custom';
export type TaxType = 'added' | 'included';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'hotel'
  | 'shopping'
  | 'entertainment'
  | 'tickets'
  | 'groceries'
  | 'other';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
}

export interface Room {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  joined_at: string;
  is_online?: boolean;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  tax_amount: number;
  total_share: number;
  created_at?: string;
}

export interface Expense {
  id: string;
  room_id: string;
  created_by: string;
  description: string;
  category: ExpenseCategory;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  tax_type: TaxType;
  tax_split_method: TaxSplitMethod;
  service_charge: number;
  tip: number;
  discount: number;
  total_amount: number;
  currency: string;
  paid_by_user_id: string;
  split_method: SplitMethod;
  splits?: ExpenseSplit[];
  created_at: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  message: string;
  created_at: string;
}

export interface SettlementTransfer {
  from_user_id: string;
  from_name: string;
  to_user_id: string;
  to_name: string;
  amount: number;
}

export interface SettlementRecord {
  id: string;
  room_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  is_settled: boolean;
  settled_at?: string;
  created_at: string;
}

export interface MemberBalance {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  amount_paid: number;
  amount_owed: number;
  net_balance: number;
}

export interface RoomSummary {
  total_spent: number;
  total_tax: number;
  total_service_charges: number;
  total_tips: number;
  total_discounts: number;
  expense_count: number;
  member_count: number;
}
