import React, { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Copy, Check, Share2, QrCode } from 'lucide-react';
import { Room } from '../../types';

interface InviteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}

export const InviteSheet: React.FC<InviteSheetProps> = ({ isOpen, onClose, room }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const inviteUrl = `${window.location.origin}/join/${room.invite_code}`;

  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${room.name} on DVide`,
          text: `Join our group expense pool "${room.name}" on DVide with code: ${room.invite_code}`,
          url: inviteUrl,
        });
      } catch {
        // User dismissed
      }
    } else {
      copyToClipboard(inviteUrl, true);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Room Members"
      subtitle={`Share "${room.name}" with your group`}
    >
      <div className="space-y-5 text-center">
        {/* Big Room Code Box */}
        <div className="bg-[#242428] border border-white/[0.12] p-5 rounded-2xl">
          <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
            Room Code
          </span>
          <span className="text-4xl font-mono font-extrabold tracking-widest text-white block select-all">
            {room.invite_code}
          </span>
          <button
            type="button"
            onClick={() => copyToClipboard(room.invite_code, false)}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-white transition-colors ios-touch"
          >
            {copiedCode ? <Check size={14} className="text-[#30D158]" /> : <Copy size={14} />}
            <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Shareable Link Box */}
        <div className="bg-white/[0.04] border border-white/[0.06] p-3.5 rounded-xl flex items-center justify-between text-left">
          <div className="truncate pr-2">
            <span className="text-[11px] text-[#8E8E93] block">Invite Link</span>
            <span className="text-xs font-mono text-white truncate block">{inviteUrl}</span>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(inviteUrl, true)}
            className="w-8 h-8 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center text-white shrink-0 transition-colors ios-touch"
            aria-label="Copy Link"
          >
            {copiedLink ? <Check size={14} className="text-[#30D158]" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Big Native Share Button */}
        <button
          type="button"
          onClick={handleNativeShare}
          className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-ios-blue hover:bg-[#0071EB] transition-colors ios-touch flex items-center justify-center gap-2 text-sm shadow-md"
        >
          <Share2 size={16} />
          <span>Share Invite with Friends</span>
        </button>
      </div>
    </BottomSheet>
  );
};
