import React, { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Plus, LogIn, Check, Trash2, AlertTriangle, Crown } from 'lucide-react';
import { Room, UserProfile } from '../../types';

interface RoomSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: Room | null;
  rooms: Room[];
  currentUser: UserProfile;
  isCurrentUserAdmin?: boolean;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (name: string, currency: string) => void;
  onJoinRoom: (code: string, userName?: string) => void;
  onDeleteRoom?: (roomId: string) => void;
}

export const RoomSwitcherModal: React.FC<RoomSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentRoom,
  rooms,
  currentUser,
  isCurrentUserAdmin,
  onSelectRoom,
  onCreateRoom,
  onJoinRoom,
  onDeleteRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'switch' | 'create' | 'join'>(() => {
    return rooms.length === 0 ? 'create' : 'switch';
  });
  const [newRoomName, setNewRoomName] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [inviteCode, setInviteCode] = useState('');
  const [joinUserName, setJoinUserName] = useState('');

  // Confirmation popup state for deleting a room
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    onCreateRoom(newRoomName.trim(), currency);
    setNewRoomName('');
    onClose();
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    onJoinRoom(inviteCode.trim(), joinUserName.trim() || undefined);
    setInviteCode('');
    setJoinUserName('');
    onClose();
  };

  const handleConfirmDelete = () => {
    if (roomToDelete && onDeleteRoom) {
      onDeleteRoom(roomToDelete.id);
      setRoomToDelete(null);
    }
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Rooms & Groups"
        subtitle="Switch, create, or join shared expense rooms"
      >
        <div className="space-y-4">
          {/* Modal Sub-navigation */}
          <div className="flex bg-[#2C2C2E]/60 p-1 rounded-xl border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setActiveTab('switch')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'switch' ? 'bg-[#3A3A3C] text-white shadow-sm' : 'text-[#8E8E93]'
              }`}
            >
              My Rooms ({rooms.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'create' ? 'bg-[#3A3A3C] text-white shadow-sm' : 'text-[#8E8E93]'
              }`}
            >
              + Create Room
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'join' ? 'bg-[#3A3A3C] text-white shadow-sm' : 'text-[#8E8E93]'
              }`}
            >
              Join with Code
            </button>
          </div>

          {/* Tab 1: Switch Rooms */}
          {activeTab === 'switch' && (
            <div className="space-y-2.5">
              {rooms.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8E8E93]">
                  No rooms joined yet. Create one or join with an invite code!
                </div>
              ) : (
                rooms.map((r) => {
                  const isSelected = currentRoom !== null && r.id === currentRoom.id;
                  const isRoomAdmin =
                    (r.created_by && r.created_by === currentUser.id) ||
                    (currentRoom?.id === r.id && isCurrentUserAdmin) ||
                    (r.created_by === 'host' && rooms[0]?.id === r.id);

                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        onSelectRoom(r.id);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ios-touch ${
                        isSelected
                          ? 'bg-ios-blue/15 border-ios-blue/40 text-white'
                          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] text-[#D1D1D6]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.08] flex items-center justify-center font-bold text-white text-sm shrink-0">
                          {r.currency}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold block text-white truncate max-w-[140px] sm:max-w-[200px]">
                              {r.name}
                            </span>
                            {isRoomAdmin && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30">
                                <Crown size={8} className="text-amber-400 fill-amber-400/30" />
                                Admin
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#8E8E93] block font-mono">
                            Code: {r.invite_code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-ios-blue flex items-center justify-center text-white shrink-0">
                            <Check size={14} />
                          </div>
                        )}

                        {/* Admin Delete Room Action Button */}
                        {isRoomAdmin && onDeleteRoom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoomToDelete(r);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8E8E93] hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                            title="Delete Room (Admin)"
                            aria-label={`Delete ${r.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: Create Room */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1.5">
                  Room Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Manali Trip, Flat #402, Dinner"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl glass-input text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1.5">
                  Currency Symbol
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {['₹', '$', '€', '£', 'AED'].map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setCurrency(cur)}
                      className={`h-10 rounded-xl text-sm font-semibold transition-all ${
                        currency === cur
                          ? 'bg-ios-blue text-white shadow-md'
                          : 'bg-white/[0.06] text-[#8E8E93] hover:text-white'
                      }`}
                    >
                      {cur}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!newRoomName.trim()}
                className="w-full h-12 rounded-xl bg-ios-blue hover:bg-[#0071EB] disabled:opacity-40 text-white font-semibold text-sm transition-all ios-touch flex items-center justify-center gap-2 shadow-lg shadow-ios-blue/30"
              >
                <Plus size={18} />
                <span>Create Room</span>
              </button>
            </form>
          )}

          {/* Tab 3: Join Room */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1.5">
                  Invite Code (5 Characters)
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  maxLength={5}
                  placeholder="e.g. 1BHDF"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full h-12 px-3.5 rounded-xl glass-input text-center text-lg font-mono tracking-widest text-white uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1.5">
                  Your Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={joinUserName}
                  onChange={(e) => setJoinUserName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl glass-input text-sm text-white"
                />
              </div>

              <button
                type="submit"
                disabled={inviteCode.trim().length < 3}
                className="w-full h-12 rounded-xl bg-[#30D158] hover:bg-[#28B84D] disabled:opacity-40 text-black font-semibold text-sm transition-all ios-touch flex items-center justify-center gap-2 shadow-lg shadow-[#30D158]/30"
              >
                <LogIn size={18} />
                <span>Enter Room</span>
              </button>
            </form>
          )}
        </div>
      </BottomSheet>

      {/* DISCLAIMER / CONFIRMATION POPUP MODAL FOR DELETING ROOM */}
      {roomToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="max-w-sm w-full p-5 rounded-2xl bg-[#1C1C1E] border border-rose-500/35 shadow-2xl space-y-4">
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
                <strong className="text-white">"{roomToDelete.name}"</strong>?
              </p>
              <div className="p-3 rounded-xl bg-rose-500/[0.08] border border-rose-500/20 text-[11px] text-rose-300 leading-relaxed">
                ⚠️ <strong>Reminder:</strong> This action is permanent and cannot be undone. All expenses, settlements, chats, and member records in this room will be deleted for everyone.
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRoomToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition-all ios-touch"
              >
                Delete Room
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
