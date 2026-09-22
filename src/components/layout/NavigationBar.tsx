import React from 'react';
import { ChevronDown, Share2, Users, Sliders } from 'lucide-react';
import { Room, RoomMember, UserProfile } from '../../types';

interface NavigationBarProps {
  currentRoom: Room;
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
  const onlineCount = members.filter((m) => m.is_online).length;

  return (
    <header className="sticky top-0 z-40 w-full glass-header pt-safe">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Room Switcher Pill */}
        <button
          type="button"
          onClick={onOpenRoomSwitcher}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.08] transition-colors ios-touch text-left"
        >
          <span className="text-sm font-semibold text-white tracking-tight truncate max-w-[140px] sm:max-w-[200px]">
            {currentRoom.name}
          </span>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/10 text-[#8E8E93]">
            {currentRoom.invite_code}
          </span>
          <ChevronDown size={14} className="text-[#8E8E93]" />
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Online Presence Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.05] text-xs text-[#8E8E93]">
            <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
            <span>{onlineCount} online</span>
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
                {currentUser.name.charAt(0)}
              </div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
