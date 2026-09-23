import React, { useState, useEffect } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { Badge } from '../ui/Badge';
import {
  saveSupabaseConfig,
  clearSupabaseConfig,
  supabaseUrl,
  supabaseKey,
  isSupabaseConfigured,
} from '../../lib/supabase';
import {
  Smartphone,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Database,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { cleanMemberName } from '../../lib/store';

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
  const cleanName = cleanMemberName(currentUser.name);
  const [displayName, setDisplayName] = useState(cleanName);
  const [nameSaved, setNameSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced developer connection state
  const [urlInput, setUrlInput] = useState(supabaseUrl);
  const [keyInput, setKeyInput] = useState(supabaseKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setDisplayName(cleanMemberName(currentUser.name));
  }, [currentUser.name]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanMemberName(displayName);
    if (!clean || !onUpdateProfileName) return;
    onUpdateProfileName(clean);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) return;
    saveSupabaseConfig(urlInput.trim(), keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleDisconnectSupabase = () => {
    clearSupabaseConfig();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Settings & Profile"
      subtitle="Manage your personal profile and room preferences"
    >
      <div className="space-y-4 pb-2">
        {/* User Profile Card */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/15 shrink-0 flex items-center justify-center">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={cleanName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-base font-bold text-white">
                  {(cleanName[0] || 'U').toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate">{cleanName}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/20">
                  Active
                </span>
              </div>
              <span className="text-xs text-[#8E8E93] block mt-0.5">
                Your name visible to room members
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveName} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Enter your name..."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 h-10 px-3.5 rounded-xl glass-input text-xs sm:text-sm text-white placeholder:text-[#636366]"
            />
            <button
              type="submit"
              disabled={!displayName.trim() || displayName.trim() === cleanName}
              className="px-4 h-10 rounded-xl bg-ios-blue text-white text-xs font-semibold hover:bg-[#0071EB] disabled:opacity-35 transition-all shrink-0 ios-touch"
            >
              {nameSaved ? 'Saved! ✓' : 'Save'}
            </button>
          </form>
        </div>

        {/* Sync & Realtime Status (Clean consumer view) */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#30D158] animate-pulse" />
            <div>
              <span className="text-xs font-semibold text-white block">Realtime Cloud Sync</span>
              <span className="text-[11px] text-[#8E8E93] block">
                Instant calculations & ledger balancing
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/[0.06] text-[#30D158] border border-white/[0.08]">
            Connected
          </span>
        </div>

        {/* PWA / Mobile Install Card */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
          <Smartphone size={18} className="text-[#30D158] shrink-0 mt-0.5" />
          <div className="text-xs text-[#8E8E93] space-y-0.5">
            <span className="font-semibold text-white block">Install DVide on iPhone / Android</span>
            <p>
              Tap <strong className="text-white">Share</strong> in Safari and choose{' '}
              <strong className="text-white">"Add to Home Screen"</strong> for a native app feel.
            </p>
          </div>
        </div>

        {/* Reset Cache / Start Fresh */}
        <div className="pt-1 flex justify-center">
          <button
            type="button"
            onClick={() => {
              onResetDemo();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-[#8E8E93] hover:text-[#FF453A] transition-colors py-1"
          >
            <RotateCcw size={12} />
            <span>Reset Local Cache</span>
          </button>
        </div>

        {/* Collapsible Advanced Developer Tools (Hidden by default for regular users) */}
        <div className="pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between py-1.5 text-xs text-[#636366] hover:text-[#8E8E93] transition-colors"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Database size={13} />
              <span>Advanced Developer Options</span>
            </span>
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAdvanced && (
            <div className="mt-3 p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                  Custom Supabase Endpoint
                </span>
                {isSupabaseConfigured && (
                  <Badge variant="success" size="sm" icon={<CheckCircle2 size={11} />}>
                    Active
                  </Badge>
                )}
              </div>

              <form onSubmit={handleSaveSupabase} className="space-y-2.5">
                <div>
                  <label className="text-[10px] text-[#8E8E93] block mb-1">Project URL</label>
                  <input
                    type="text"
                    placeholder="https://xyz.supabase.co"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg glass-input text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-[#8E8E93] block mb-1">Anon / Public Key</label>
                  <input
                    type="password"
                    placeholder="eyJhbGci..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg glass-input text-xs text-white font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={!urlInput.trim() || !keyInput.trim()}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white bg-ios-blue hover:bg-[#0071EB] disabled:opacity-40 transition-colors"
                  >
                    {savedSuccess ? 'Saved! ✓' : 'Update Endpoint'}
                  </button>
                  {isSupabaseConfigured && (
                    <button
                      type="button"
                      onClick={handleDisconnectSupabase}
                      className="px-2.5 py-1.5 rounded-lg text-xs text-[#FF453A] hover:bg-[#FF453A]/10 border border-[#FF453A]/30 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
