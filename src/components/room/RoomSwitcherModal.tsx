import React, { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Plus, LogIn, Check, RotateCcw } from 'lucide-react';
import { Room } from '../../types';

interface RoomSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: Room | null;
  rooms: Room[];
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: (name: string, currency: string) => void;
  onJoinRoom: (code: string) => void;
  onResetDemo: () => void;
}

export const RoomSwitcherModal: React.FC<RoomSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentRoom,
  rooms,
  onSelectRoom,
  onCreateRoom,
  onJoinRoom,
  onResetDemo,
}) => {
  const [activeTab, setActiveTab] = useState<'switch' | 'create' | 'join'>(() => {
    return rooms.length === 0 ? 'create' : 'switch';
  });
  const [newRoomName, setNewRoomName] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [inviteCode, setInviteCode] = useState('');

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
    onJoinRoom(inviteCode.trim());
    setInviteCode('');
    onClose();
  };

  return (
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
            {rooms.map((r) => {
              const isSelected = currentRoom !== null && r.id === currentRoom.id;
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
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.08] flex items-center justify-center font-bold text-white text-sm">
                      {r.currency}
                    </div>
                    <div>
                      <span className="text-sm font-semibold block text-white">{r.name}</span>
                      <span className="text-xs text-[#8E8E93] block font-mono">
                        Code: {r.invite_code}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-ios-blue flex items-center justify-center text-white">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Reset Demo State Option */}
            <div className="pt-4 border-t border-white/[0.08] flex justify-center">
              <button
                type="button"
                onClick={() => {
                  onResetDemo();
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs text-[#8E8E93] hover:text-white transition-colors"
              >
                <RotateCcw size={13} />
                <span>Reset to Fresh Demo Scenario</span>
              </button>
            </div>
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
                className="w-full h-11 px-3 rounded-xl glass-input text-sm text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1.5">
                Currency
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['₹', '$', '€', '£'].map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                      currency === curr
                        ? 'bg-ios-blue text-white border-ios-blue'
                        : 'bg-white/[0.04] text-[#8E8E93] border-white/[0.08]'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!newRoomName.trim()}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-ios-blue hover:bg-[#0071EB] disabled:opacity-40 transition-colors ios-touch text-sm"
            >
              Create Room
            </button>
          </form>
        )}

        {/* Tab 3: Join with Code */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1.5">
                Enter 5-Character Invite Code
              </label>
              <input
                type="text"
                maxLength={8}
                autoFocus
                required
                placeholder="e.g. GOA26"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full h-12 px-3 rounded-xl glass-input text-center text-lg font-mono font-bold uppercase tracking-widest text-white"
              />
            </div>

            <button
              type="submit"
              disabled={!inviteCode.trim()}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-ios-blue hover:bg-[#0071EB] disabled:opacity-40 transition-colors ios-touch text-sm flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              <span>Join Room</span>
            </button>
          </form>
        )}
      </div>
    </BottomSheet>
  );
};
