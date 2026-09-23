import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../lib/calculations';
import { UserPlus, UserCheck, Shield, Sparkles, Pencil, Check } from 'lucide-react';
import { RoomMember, MemberBalance, UserProfile } from '../../types';
import { cleanMemberName } from '../../lib/store';

interface RoomMemberListProps {
  members: RoomMember[];
  balances: MemberBalance[];
  currentUser: UserProfile;
  currency: string;
  onAddMember: (name: string) => void;
  onSwitchUser: (userId: string) => void;
  onUpdateProfileName?: (name: string) => void;
}

export const RoomMemberList: React.FC<RoomMemberListProps> = ({
  members,
  balances,
  currentUser,
  currency,
  onAddMember,
  onSwitchUser,
  onUpdateProfileName,
}) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingMyName, setIsEditingMyName] = useState(false);
  const [editNameInput, setEditNameInput] = useState(cleanMemberName(currentUser.name));

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

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pt-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Room Members</h2>
          <p className="text-xs text-[#8E8E93] mt-0.5">
            {members.length} participants in this expense pool
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-colors ios-touch"
        >
          <UserPlus size={14} />
          <span>Add Member</span>
        </button>
      </div>

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
        {members.map((member) => {
          const balance = balances.find((b) => b.user_id === member.user_id) || {
            amount_paid: 0,
            amount_owed: 0,
            net_balance: 0,
          };

          const isMe = member.user_id === currentUser.id;
          const isPos = balance.net_balance > 0.009;
          const isNeg = balance.net_balance < -0.009;
          const cleanName = cleanMemberName(member.display_name);

          return (
            <GlassCard
              key={member.id}
              variant="surface"
              className="p-4 border border-white/[0.08]"
            >
              <div className="flex items-center justify-between">
                {/* Member Info */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-white/10 border border-white/10">
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">
                        {cleanName}
                      </span>
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

                {/* Net Balance & Switch Persona Action */}
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

                  {!isMe ? (
                    <button
                      type="button"
                      onClick={() => onSwitchUser(member.user_id)}
                      className="text-[11px] font-medium text-ios-blue hover:text-white mt-1 transition-colors"
                    >
                      Switch to view as
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditNameInput(cleanName);
                        setIsEditingMyName(!isEditingMyName);
                      }}
                      className="text-[11px] font-medium text-ios-blue hover:text-white mt-1 transition-colors flex items-center gap-1 ml-auto"
                      title="Edit your name"
                    >
                      <Pencil size={11} />
                      <span>Edit Name</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Name Editor for Active User */}
              {isMe && isEditingMyName && (
                <form onSubmit={handleSaveMyName} className="mt-3 pt-3 border-t border-white/[0.08] flex items-center gap-2 animate-in fade-in">
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
    </div>
  );
};
