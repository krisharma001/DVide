import React from 'react';
import { ChevronDown, Share2, Plus, Sparkles } from 'lucide-react';
import { Room, RoomMember, UserProfile } from '../../types';

interface NavigationBarProps {
  currentRoom: Room | null;
  members: RoomMember[];
  currentUser: UserProfile;
  onOpenRoomSwitcher: () => void;
  onOpenInvite: () => void;
  onOpenSettings: () => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  currentRoom,
  members,
  currentUser,
  onOpenRoomSwitcher,
  onOpenInvite,
  onOpenSettings,
}) => {
  const onlineCount = Math.max(1, members.filter((m) => m.is_online).length);

  return (
    <header className="sticky top-0 z-40 w-full glass-header pt-safe">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Room Switcher Pill or Logo */}
        {currentRoom ? (
          <button
            type="button"
            onClick={onOpenRoomSwitcher}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] transition-colors ios-touch text-left shadow-sm"
          >
            <span className="text-sm font-semibold text-white tracking-tight truncate max-w-[140px] sm:max-w-[200px]">
              {currentRoom.name}
            </span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-white/10 text-[#8E8E93]">
              {currentRoom.invite_code}
            </span>
            <ChevronDown size={14} className="text-[#8E8E93]" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#30D158] to-[#0A84FF] flex items-center justify-center text-white font-black text-xs shadow-md">
              ÷
            </div>
            <span className="text-base font-bold tracking-tight text-white font-mono">DVide</span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {currentRoom && (
            <>
              {/* Online Presence Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.06] text-xs text-[#8E8E93]">
                <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
                <span>{onlineCount} in room</span>
              </div>

              {/* Share/Invite Button */}
              <button
                type="button"
                onClick={onOpenInvite}
                className="w-9 h-9 rounded-full bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-[#D1D1D6] hover:text-white transition-colors ios-touch"
                aria-label="Invite Members"
                title="Invite Members"
              >
                <Share2 size={16} />
              </button>
            </>
          )}

          {/* Profile & Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="relative w-9 h-9 rounded-full overflow-hidden border border-white/[0.15] hover:border-ios-blue transition-colors ios-touch"
            aria-label="Profile and Settings"
            title="Profile and Settings"
          >
            {currentUser.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#2C2C2E] flex items-center justify-center text-xs font-semibold text-white">
                {currentUser.name ? currentUser.name.charAt(0) : 'U'}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
