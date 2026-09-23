import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { ChatMessage, RoomMember, UserProfile } from '../../types';
import { cleanMemberName } from '../../lib/store';

interface ChatThreadProps {
  chats: ChatMessage[];
  members: RoomMember[];
  currentUser: UserProfile;
  onSendMessage: (message: string) => void;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  chats,
  members,
  currentUser,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-135px)] max-w-xl mx-auto">
      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 overscroll-contain">
        {/* Welcome Callout */}
        <div className="text-center py-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] text-[#8E8E93]">
            <Sparkles size={11} className="text-ios-blue" />
            <span>End-to-end room coordination & receipts</span>
          </div>
        </div>

        {chats.map((msg) => {
          const isMe = msg.user_id === currentUser.id;
          const isSystem = msg.user_id === 'system';

          // System notification (expense added, settlement recorded)
          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="bg-white/[0.04] border border-white/[0.07] px-3.5 py-1.5 rounded-full text-xs text-[#D1D1D6] max-w-xs text-center">
                  {msg.message}
                </div>
              </div>
            );
          }

          const member = members.find((m) => m.user_id === msg.user_id);
          const rawCandidate =
            (member?.display_name && member.display_name.trim().toLowerCase() !== 'me')
              ? member.display_name
              : (msg.display_name && msg.display_name.trim().toLowerCase() !== 'me')
              ? msg.display_name
              : (isMe ? 'You' : 'Member');
          
          let cleanSenderName = cleanMemberName(rawCandidate);
          if (!isMe && (cleanSenderName.toLowerCase() === 'me' || cleanSenderName.toLowerCase() === 'you')) {
            cleanSenderName = 'Member';
          }

          const time = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
          }).format(new Date(msg.created_at));

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!isMe && (
                <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 shrink-0 mb-0.5 border border-white/10">
                  {msg.avatar_url || member?.avatar_url ? (
                    <img
                      src={msg.avatar_url || member?.avatar_url}
                      alt={cleanSenderName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-white font-semibold flex items-center justify-center h-full">
                      {(cleanSenderName[0] || 'M').toUpperCase()}
                    </span>
                  )}
                </div>
              )}

              <div
                className={`max-w-[78%] flex flex-col ${
                  isMe ? 'items-end' : 'items-start'
                }`}
              >
                {!isMe && (
                  <span className="text-[10px] text-[#8E8E93] ml-2 mb-0.5 font-medium">
                    {cleanSenderName}
                  </span>
                )}

                <div
                  className={`px-3.5 py-2 text-sm leading-relaxed ${
                    isMe
                      ? 'bg-ios-blue text-white rounded-2xl rounded-tr-xs shadow-sm font-normal'
                      : 'bg-[#2C2C2E]/85 text-[#F2F2F7] rounded-2xl rounded-tl-xs border border-white/[0.07] font-normal'
                  }`}
                >
                  {msg.message}
                </div>

                <span className="text-[9px] text-[#636366] mt-0.5 px-1">{time}</span>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky iMessage Input Bar */}
      <div className="p-3 border-t border-white/[0.08] bg-[#121214]/90 backdrop-blur-liquid pb-safe">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="iMessage in room..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 h-10 px-4 rounded-full glass-input text-xs sm:text-sm text-white placeholder:text-[#636366]"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full bg-ios-blue hover:bg-[#0071EB] disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all ios-touch shrink-0 shadow-md"
            aria-label="Send"
          >
            <Send size={16} className="-ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
