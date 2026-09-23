import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/calculations';
import {
  UserPlus,
  UserMinus,
  Crown,
  Sparkles,
  Pencil,
  RotateCcw,
  Settings2,
  Trash2,
  AlertTriangle,
  X,
  Check,
  UserCheck,
} from 'lucide-react';
import { RoomMember, MemberBalance, UserProfile, Room } from '../../types';
import { cleanMemberName } from '../../lib/store';

interface RoomMemberListProps {
  members: RoomMember[];
  balances: MemberBalance[];
  currentUser: UserProfile;
  currentRoom: Room;
  currency: string;
  adminUserId?: string;
  isCurrentUserAdmin?: boolean;
  onAddMember: (name: string) => void;
  onSwitchUser: (userId: string) => void;
  onUpdateProfileName?: (name: string) => void;
  onRemoveMember?: (userId: string) => void;
  onUpdateRoomDetails?: (name: string, currency: string) => void;
  onTransferAdmin?: (newAdminUserId: string) => void;
  onResetRoomLedger?: () => void;
  onDeleteRoom?: (roomId: string) => void;
}

export const RoomMemberList: React.FC<RoomMemberListProps> = ({
  members,
  balances,
  currentUser,
  currentRoom,
  currency,
  adminUserId,
  isCurrentUserAdmin,
  onAddMember,
  onSwitchUser,
  onUpdateProfileName,
  onRemoveMember,
  onUpdateRoomDetails,
  onTransferAdmin,
  onResetRoomLedger,
  onDeleteRoom,
}) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingMyName, setIsEditingMyName] = useState(false);
  const [editNameInput, setEditNameInput] = useState(cleanMemberName(currentUser.name));

  // Admin Modal States
  const [memberToRemove, setMemberToRemove] = useState<RoomMember | null>(null);
  const [memberToPromote, setMemberToPromote] = useState<RoomMember | null>(null);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  const [editRoomName, setEditRoomName] = useState(currentRoom.name);
  const [editRoomCurrency, setEditRoomCurrency] = useState(currentRoom.currency);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const isSelfInMembers = members.some((m) => m.user_id === currentUser.id);

  const handleSaveMyName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNameInput.trim() || !onUpdateProfileName) return;
    onUpdateProfileName(cleanMemberName(editNameInput));
    setIsEditingMyName(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    onAddMember(newMemberName.trim());
    setNewMemberName('');
    setIsAdding(false);
  };

  const handleAddMyself = () => {
    onAddMember(cleanMemberName(currentUser.name));
  };

  const handleConfirmRemove = () => {
    if (memberToRemove && onRemoveMember) {
      onRemoveMember(memberToRemove.user_id);
      setMemberToRemove(null);
    }
  };

  const handleConfirmTransfer = () => {
    if (memberToPromote && onTransferAdmin) {
      onTransferAdmin(memberToPromote.user_id);
      setMemberToPromote(null);
    }
  };

  const handleSaveRoomDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateRoomDetails && editRoomName.trim()) {
      onUpdateRoomDetails(editRoomName.trim(), editRoomCurrency);
      setIsAdminSettingsOpen(false);
    }
  };

  const handleConfirmResetLedger = () => {
    if (onResetRoomLedger) {
      onResetRoomLedger();
      setIsResetConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Room Members</h2>
            {isCurrentUserAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-[0_0_12px_rgba(251,191,36,0.18)]">
                <Crown size={10} className="text-amber-400 fill-amber-400/30" />
                You are Admin
              </span>
            )}
          </div>
          <p className="text-xs text-[#8E8E93] mt-0.5">
            {members.length} participants in this expense pool
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Room Settings Button */}
          {isCurrentUserAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditRoomName(currentRoom.name);
                setEditRoomCurrency(currentRoom.currency);
                setIsAdminSettingsOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-xs font-semibold text-amber-300 border border-amber-400/25 transition-all ios-touch"
              title="Admin Room Settings"
            >
              <Settings2 size={13} />
              <span>Room Settings</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-colors ios-touch"
          >
            <UserPlus size={14} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Admin Fast Action Banner if user is not in member list */}
      {!isSelfInMembers && (
        <GlassCard variant="elevated" className="p-3.5 border-ios-blue/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white">
            <UserCheck size={16} className="text-ios-blue shrink-0" />
            <span>You haven't joined the members list yet.</span>
          </div>
          <button
            type="button"
            onClick={handleAddMyself}
            className="px-3 py-1.5 rounded-xl bg-ios-blue hover:bg-[#0071EB] text-xs font-semibold text-white transition-colors ios-touch"
          >
            + Add Yourself
          </button>
        </GlassCard>
      )}

      {/* Quick Add Member Form */}
      {isAdding && (
        <GlassCard variant="elevated" className="p-3.5 border-ios-blue/30 animate-in fade-in">
          <form onSubmit={handleAddSubmit} className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              placeholder="Enter person's name..."
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="flex-1 h-9 px-3 rounded-lg glass-input text-xs text-white"
            />
            <button
              type="submit"
              disabled={!newMemberName.trim()}
              className="h-9 px-3.5 rounded-lg bg-ios-blue hover:bg-[#0071EB] disabled:opacity-40 text-xs font-semibold text-white transition-colors ios-touch"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="h-9 px-2.5 rounded-lg text-xs text-[#8E8E93] hover:text-white"
            >
              Cancel
            </button>
          </form>
        </GlassCard>
      )}

      {/* Members Grid */}
      <div className="space-y-3">
        {[...members]
          .sort((a, b) => {
            // 1. Room Admin is always at the top for all users
            const aIsAdmin = adminUserId && a.user_id === adminUserId;
            const bIsAdmin = adminUserId && b.user_id === adminUserId;
            if (aIsAdmin && !bIsAdmin) return -1;
            if (!aIsAdmin && bIsAdmin) return 1;

            // 2. Active user ("You") comes next if not admin
            const aIsMe = a.user_id === currentUser.id;
            const bIsMe = b.user_id === currentUser.id;
            if (aIsMe && !bIsMe) return -1;
            if (!aIsMe && bIsMe) return 1;

            return 0;
          })
          .map((member) => {
          const balance = balances.find((b) => b.user_id === member.user_id) || {
            amount_paid: 0,
            amount_owed: 0,
            net_balance: 0,
          };

          const isMe = member.user_id === currentUser.id;
          const isCreatorAdmin = Boolean(adminUserId && member.user_id === adminUserId);
          const isPos = balance.net_balance > 0.009;
          const isNeg = balance.net_balance < -0.009;
          const cleanName = cleanMemberName(member.display_name);

          return (
            <GlassCard
              key={member.id}
              variant="surface"
              className={`p-4 border transition-all ${
                isCreatorAdmin
                  ? 'border-amber-400/25 bg-amber-400/[0.02]'
                  : 'border-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Member Info */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className={`w-11 h-11 rounded-full overflow-hidden bg-white/10 border ${
                        isCreatorAdmin ? 'border-amber-400/40 ring-1 ring-amber-400/30' : 'border-white/10'
                      }`}
                    >
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={cleanName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-white flex items-center justify-center h-full">
                          {(cleanName[0] || 'M').toUpperCase()}
                        </span>
                      )}
                    </div>
                    {member.is_online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#30D158] ring-2 ring-[#1C1C1E]" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-white">
                        {cleanName}
                      </span>

                      {/* Visible Admin Badge: Visible to ALL members in the room */}
                      {isCreatorAdmin && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-[0_0_10px_rgba(251,191,36,0.15)]">
                          <Crown size={10} className="text-amber-400 fill-amber-400/30" />
                          Admin
                        </span>
                      )}

                      {isMe && (
                        <Badge variant="glass" size="sm">
                          You
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-[#8E8E93] mt-0.5 block">
                      Paid: {formatCurrency(balance.amount_paid, currency)} • Share:{' '}
                      {formatCurrency(balance.amount_owed, currency)}
                    </span>
                  </div>
                </div>

                {/* Net Balance & Actions */}
                <div className="text-right">
                  <span
                    className={`text-sm font-bold tnum block ${
                      isPos
                        ? 'text-[#30D158]'
                        : isNeg
                        ? 'text-[#FF453A]'
                        : 'text-[#8E8E93]'
                    }`}
                  >
                    {isPos ? '+' : ''}
                    {formatCurrency(balance.net_balance, currency)}
                  </span>

                  <div className="flex items-center justify-end gap-2 mt-1">
                    {/* Persona Switcher */}
                    {!isMe && (
                      <button
                        type="button"
                        onClick={() => onSwitchUser(member.user_id)}
                        className="text-[11px] font-medium text-ios-blue hover:text-white transition-colors"
                      >
                        Switch to view as
                      </button>
                    )}

                    {/* Active User Name Editor */}
                    {isMe && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditNameInput(cleanName);
                          setIsEditingMyName(!isEditingMyName);
                        }}
                        className="text-[11px] font-medium text-ios-blue hover:text-white transition-colors flex items-center gap-1"
                        title="Edit your name"
                      >
                        <Pencil size={11} />
                        <span>Edit Name</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Actions Bar for Other Members */}
              {isCurrentUserAdmin && !isMe && (
                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#8E8E93]">Admin Options:</span>
                  <div className="flex items-center gap-2">
                    {/* Transfer Admin Rights */}
                    <button
                      type="button"
                      onClick={() => setMemberToPromote(member)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-amber-400/15 text-[11px] font-medium text-amber-300/80 hover:text-amber-300 border border-white/[0.08] hover:border-amber-400/30 transition-all ios-touch"
                      title="Make this member Room Admin"
                    >
                      <Crown size={11} />
                      <span>Make Admin</span>
                    </button>

                    {/* Remove Member */}
                    <button
                      type="button"
                      onClick={() => setMemberToRemove(member)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-[11px] font-medium text-rose-400 border border-rose-500/20 transition-all ios-touch"
                      title="Remove member from room"
                    >
                      <UserMinus size={11} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Inline Name Editor for Active User */}
              {isMe && isEditingMyName && (
                <form
                  onSubmit={handleSaveMyName}
                  className="mt-3 pt-3 border-t border-white/[0.08] flex items-center gap-2 animate-in fade-in"
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter your name..."
                    value={editNameInput}
                    onChange={(e) => setEditNameInput(e.target.value)}
                    className="flex-1 h-8 px-3 rounded-lg glass-input text-xs text-white"
                  />
                  <button
                    type="submit"
                    disabled={!editNameInput.trim()}
                    className="h-8 px-3 rounded-lg bg-ios-blue hover:bg-[#0071EB] disabled:opacity-40 text-xs font-semibold text-white transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingMyName(false)}
                    className="h-8 px-2.5 rounded-lg text-xs text-[#8E8E93] hover:text-white"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </GlassCard>
          );
        })}
      </div>

      {/* Developer / Demo Persona Switcher Callout */}
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-[#8E8E93] flex items-center gap-2">
        <Sparkles size={14} className="text-ios-blue shrink-0" />
        <span>
          Tip: Tap <strong>"Switch to view as"</strong> on any member to instantly view the app
          and balances from their perspective!
        </span>
      </div>

      {/* MODAL 1: CONFIRM REMOVE MEMBER */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <GlassCard variant="elevated" className="max-w-sm w-full p-5 border-rose-500/30 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <UserMinus size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remove Member</h3>
                <p className="text-xs text-[#8E8E93]">Admin action</p>
              </div>
            </div>

            <p className="text-xs text-[#D1D1D6] leading-relaxed">
              Are you sure you want to remove{' '}
              <strong className="text-white">
                {cleanMemberName(memberToRemove.display_name)}
              </strong>{' '}
              from <strong>{currentRoom.name}</strong>? They will be immediately disconnected from the room.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition-all ios-touch"
              >
                Remove Member
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* MODAL 2: CONFIRM TRANSFER ADMIN */}
      {memberToPromote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <GlassCard variant="elevated" className="max-w-sm w-full p-5 border-amber-400/30 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
                <Crown size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Transfer Admin Rights</h3>
                <p className="text-xs text-[#8E8E93]">Ownership transfer</p>
              </div>
            </div>

            <p className="text-xs text-[#D1D1D6] leading-relaxed">
              Pass full Room Admin controls to{' '}
              <strong className="text-white">
                {cleanMemberName(memberToPromote.display_name)}
              </strong>
              ? They will be able to manage room settings and remove members.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMemberToPromote(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-xs font-bold text-black shadow-lg shadow-amber-500/20 transition-all ios-touch"
              >
                Confirm Transfer
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* MODAL 3: ADMIN ROOM SETTINGS & LEDGER RESET */}
      {isAdminSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <GlassCard variant="elevated" className="max-w-md w-full p-5 border-amber-400/30 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Crown size={16} className="text-amber-400" />
                <h3 className="text-base font-bold text-white">Room Admin Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminSettingsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X size={14} />
              </button>
            </div>

            {/* Room Details Form */}
            <form onSubmit={handleSaveRoomDetails} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-[#8E8E93] block mb-1.5">
                  Room Name
                </label>
                <input
                  type="text"
                  value={editRoomName}
                  onChange={(e) => setEditRoomName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl glass-input text-sm text-white"
                  placeholder="e.g. Goa Trip, Flatmates"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#8E8E93] block mb-1.5">
                  Currency Symbol
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {['₹', '$', '€', '£', 'AED'].map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setEditRoomCurrency(cur)}
                      className={`h-9 rounded-xl text-xs font-bold transition-all ${
                        editRoomCurrency === cur
                          ? 'bg-amber-400 text-black shadow-md'
                          : 'bg-white/[0.06] text-[#8E8E93] hover:text-white'
                      }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!editRoomName.trim()}
                  className="w-full py-2.5 rounded-xl bg-ios-blue hover:bg-[#0071EB] disabled:opacity-40 text-xs font-semibold text-white transition-all ios-touch"
                >
                  Save Room Details
                </button>
              </div>
            </form>

            {/* Danger Zone: Reset Ledger & Delete Room */}
            <div className="pt-3 border-t border-white/[0.08] space-y-2.5">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">
                Danger Zone
              </span>
              <p className="text-xs text-[#8E8E93]">
                Irreversible administrative actions for this room.
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminSettingsOpen(false);
                    setIsResetConfirmOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ios-touch"
                >
                  <RotateCcw size={13} />
                  <span>Reset Room Ledger</span>
                </button>

                {onDeleteRoom && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminSettingsOpen(false);
                      setIsDeleteConfirmOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ios-touch"
                  >
                    <Trash2 size={13} />
                    <span>Delete Room Permanently</span>
                  </button>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* MODAL 4: CONFIRM RESET LEDGER */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <GlassCard variant="elevated" className="max-w-sm w-full p-5 border-rose-500/30 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Room Ledger?</h3>
                <p className="text-xs text-[#8E8E93]">Permanent action</p>
              </div>
            </div>

            <p className="text-xs text-[#D1D1D6] leading-relaxed">
              This will permanently delete all expenses and settled transactions in{' '}
              <strong className="text-white">{currentRoom.name}</strong>. Members will not be removed.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetLedger}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition-all ios-touch"
              >
                Reset Ledger
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* MODAL 5: CONFIRM DELETE ROOM (ADMIN DISCLAIMER) */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <GlassCard variant="elevated" className="max-w-sm w-full p-5 border-rose-500/35 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Room?</h3>
                <p className="text-xs text-[#8E8E93]">Admin Disclaimer</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-[#E5E5EA] leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-white">"{currentRoom.name}"</strong>?
              </p>
              <div className="p-3 rounded-xl bg-rose-500/[0.08] border border-rose-500/20 text-[11px] text-rose-300 leading-relaxed">
                ⚠️ <strong>Reminder:</strong> This action is permanent and cannot be undone. All expenses, settlements, chats, and member records in this room will be deleted for everyone.
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteRoom) {
                    onDeleteRoom(currentRoom.id);
                  }
                  setIsDeleteConfirmOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition-all ios-touch"
              >
                Delete Room
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
