import React, { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Badge } from '../ui/Badge';
import {
  saveSupabaseConfig,
  clearSupabaseConfig,
  supabaseUrl,
  supabaseKey,
  isSupabaseConfigured,
} from '../../lib/supabase';
import { Database, Smartphone, Shield, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { UserProfile } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdateProfileName?: (name: string) => void;
  onResetDemo: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfileName,
  onResetDemo,
}) => {
  const [displayName, setDisplayName] = useState(currentUser.name);
  const [urlInput, setUrlInput] = useState(supabaseUrl);
  const [keyInput, setKeyInput] = useState(supabaseKey);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !onUpdateProfileName) return;
    onUpdateProfileName(displayName.trim());
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) return;
    saveSupabaseConfig(urlInput.trim(), keyInput.trim());
    setSavedSuccess(true);
  };

  const handleDisconnectSupabase = () => {
    clearSupabaseConfig();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Settings & Profile"
      subtitle="App preferences and backend configuration"
    >
      <div className="space-y-5 pb-2">
        {/* User Card */}
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/15 shrink-0">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-base font-semibold text-white flex items-center justify-center h-full">
                  {currentUser.name[0] || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white truncate">{currentUser.name}</span>
                <Badge variant="glass" size="sm">
                  Active
                </Badge>
              </div>
              <span className="text-xs text-[#8E8E93] block mt-0.5 font-mono">
                ID: {currentUser.id.slice(0, 10)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveName} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 h-9 px-3 rounded-xl glass-input text-xs text-white"
            />
            <button
              type="submit"
              disabled={!displayName.trim() || displayName.trim() === currentUser.name}
              className="px-3.5 h-9 rounded-xl bg-ios-blue text-white text-xs font-semibold hover:bg-[#0071EB] disabled:opacity-30 transition-all shrink-0"
            >
              {nameSaved ? 'Saved! ✓' : 'Update'}
            </button>
          </form>
        </div>

        {/* Backend & Supabase Integration */}
        <div className="p-4 rounded-2xl bg-[#202024] border border-white/[0.09] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-ios-blue" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Backend Connection
              </span>
            </div>
            {isSupabaseConfigured ? (
              <Badge variant="success" size="sm" icon={<CheckCircle2 size={11} />}>
                Supabase Live
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                Local Sandbox Mode
              </Badge>
            )}
          </div>

          <p className="text-xs text-[#8E8E93] leading-relaxed">
            DVide works immediately with zero setup using local persistence. You can connect your
            live Supabase PostgreSQL database anytime below.
          </p>

          <form onSubmit={handleSaveSupabase} className="space-y-2.5 pt-1">
            <div>
              <label className="text-[11px] font-medium text-[#8E8E93] block mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full h-9 px-3 rounded-lg glass-input text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#8E8E93] block mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIs..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full h-9 px-3 rounded-lg glass-input text-xs text-white font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={!urlInput.trim() || !keyInput.trim()}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-ios-blue hover:bg-[#0071EB] disabled:opacity-40 transition-colors ios-touch"
              >
                Connect Supabase
              </button>
              {isSupabaseConfigured && (
                <button
                  type="button"
                  onClick={handleDisconnectSupabase}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-[#FF453A] hover:bg-[#FF453A]/10 border border-[#FF453A]/30 transition-colors"
                >
                  Disconnect
                </button>
              )}
            </div>
          </form>
        </div>

        {/* PWA Info Card */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
          <Smartphone size={20} className="text-[#30D158] shrink-0 mt-0.5" />
          <div className="text-xs text-[#8E8E93] space-y-1">
            <span className="font-semibold text-white block">Install DVide on iPhone / Android</span>
            <p>
              Tap the <strong>Share</strong> icon in Safari and select{' '}
              <strong className="text-white">"Add to Home Screen"</strong> to run DVide as a
              native full-screen app.
            </p>
          </div>
        </div>

        {/* Reset Demo Data */}
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={() => {
              onResetDemo();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-[#8E8E93] hover:text-[#FF453A] transition-colors"
          >
            <RotateCcw size={12} />
            <span>Reset Demo Local Data</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
