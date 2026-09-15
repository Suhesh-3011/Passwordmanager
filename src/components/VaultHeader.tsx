import React, { useState } from 'react';
import { Shield, Search, Lock, Plus, RefreshCw, Smartphone, Laptop, Tablet, CheckCircle, ChevronDown, Key, Building2, CreditCard, FileText, Code2, Menu } from 'lucide-react';
import { ItemType, VaultSettings } from '../types';

interface VaultHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  syncState: 'synced' | 'syncing' | 'offline' | 'error' | 'pending';
  lastSyncedText: string;
  onManualSync: () => void;
  onLockVault: () => void;
  onAddItem: (type: ItemType) => void;
  onOpenDeviceSync: () => void;
  settings: VaultSettings;
  autoLockCountdown: string;
  onToggleMobileSidebar: () => void;
}

export const VaultHeader: React.FC<VaultHeaderProps> = ({
  searchQuery,
  onSearchChange,
  syncState,
  lastSyncedText,
  onManualSync,
  onLockVault,
  onAddItem,
  onOpenDeviceSync,
  settings,
  autoLockCountdown,
  onToggleMobileSidebar,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const getDeviceIcon = () => {
    switch (settings.devicePlatform) {
      case 'iPhone':
        return <Smartphone className="w-3.5 h-3.5 text-slate-400" />;
      case 'iPad':
        return <Tablet className="w-3.5 h-3.5 text-slate-400" />;
      case 'Windows':
      default:
        return <Laptop className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-md select-none">
      {/* Left branding & mobile trigger */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-sm">
            <Shield className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5 font-bold text-sm text-white tracking-tight leading-none">
              AegisVault
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                E2EE
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">
              Zero-Knowledge Passwords
            </span>
          </div>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-md mx-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search passwords, bank accounts, cards..."
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Device & Air-Gapped status badge */}
        <button
          type="button"
          onClick={onOpenDeviceSync}
          title="Air-Gapped: Zero network requests. Click to view offline device pairing."
          className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 transition-all"
        >
          {getDeviceIcon()}
          <span className="text-slate-300 font-mono text-[11px] truncate max-w-[120px]">
            {settings.deviceName}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-semibold font-mono">
            AIR-GAPPED
          </span>
        </button>

        {/* Transfer / Backup Button */}
        <button
          type="button"
          onClick={onOpenDeviceSync}
          title="Air-gapped sync: Transfer to Phone or iPad via QR or AirDrop"
          className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden xl:inline text-[11px] text-slate-300 font-mono">
            Sync Devices
          </span>
        </button>

        {/* Auto Lock Timer Countdown */}
        {autoLockCountdown && (
          <div
            title="Auto-lock countdown (resets on activity)"
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[11px] font-mono text-slate-400"
          >
            <Lock className="w-3 h-3 text-slate-500" />
            <span>{autoLockCountdown}</span>
          </div>
        )}

        {/* Add Item Dropdown Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-emerald-500/10 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Item</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {showAddMenu && (
            <div
              className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setShowAddMenu(false)}
            >
              <button
                type="button"
                onClick={() => onAddItem('login')}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
              >
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Password / Login</span>
              </button>
              <button
                type="button"
                onClick={() => onAddItem('bank_account')}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
              >
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>Bank Account</span>
              </button>
              <button
                type="button"
                onClick={() => onAddItem('card')}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
              >
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Credit / Debit Card</span>
              </button>
              <button
                type="button"
                onClick={() => onAddItem('secure_note')}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
              >
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Secure Note</span>
              </button>
              <button
                type="button"
                onClick={() => onAddItem('api_key')}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
              >
                <Code2 className="w-4 h-4 text-rose-400" />
                <span>API Key / Secret</span>
              </button>
            </div>
          )}
        </div>

        {/* Lock Vault Button */}
        <button
          type="button"
          onClick={onLockVault}
          title="Lock Vault Now (clears decrypted keys from memory)"
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-red-950/40 hover:text-red-400 hover:border-red-800/60 border border-slate-700/60 text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5"
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lock</span>
        </button>
      </div>
    </header>
  );
};
