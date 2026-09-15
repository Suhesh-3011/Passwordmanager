import React from 'react';
import { 
  Key, Building2, CreditCard, FileText, Code2, Star, ShieldAlert,
  Smartphone, KeyRound, Settings, HardDriveDownload, Lock, Layers,
  CheckCircle2, X
} from 'lucide-react';
import { ItemType, VaultItem } from '../types';

export type NavFilter = 'all' | 'favorites' | ItemType;

interface VaultSidebarProps {
  currentFilter: NavFilter;
  onSelectFilter: (filter: NavFilter) => void;
  items: VaultItem[];
  watchtowerRiskCount: number;
  onOpenWatchtower: () => void;
  onOpenGenerator: () => void;
  onOpenDeviceSync: () => void;
  onOpenSettings: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const VaultSidebar: React.FC<VaultSidebarProps> = ({
  currentFilter,
  onSelectFilter,
  items,
  watchtowerRiskCount,
  onOpenWatchtower,
  onOpenGenerator,
  onOpenDeviceSync,
  onOpenSettings,
  isOpenMobile,
  onCloseMobile,
}) => {
  const counts = {
    all: items.length,
    favorites: items.filter((i) => i.favorite).length,
    login: items.filter((i) => i.type === 'login').length,
    bank_account: items.filter((i) => i.type === 'bank_account').length,
    card: items.filter((i) => i.type === 'card').length,
    secure_note: items.filter((i) => i.type === 'secure_note').length,
    api_key: items.filter((i) => i.type === 'api_key').length,
  };

  const navItemClass = (isActive: boolean) =>
    `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
      isActive
        ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm border border-slate-700/60'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950/80 border-r border-slate-800/80 p-3 sm:p-4 select-none">
      {/* Mobile close header */}
      <div className="flex items-center justify-between md:hidden pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <span>Vault Navigation</span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main categories list */}
      <div className="space-y-1 flex-1 overflow-y-auto pr-1">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-1">
          Vault Items
        </div>

        <button
          type="button"
          onClick={() => { onSelectFilter('all'); onCloseMobile(); }}
          className={navItemClass(currentFilter === 'all')}
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4" />
            <span>All Vault Items</span>
          </div>
          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-400 font-mono">
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { onSelectFilter('favorites'); onCloseMobile(); }}
          className={navItemClass(currentFilter === 'favorites')}
        >
          <div className="flex items-center gap-2.5">
            <Star className="w-4 h-4 text-amber-400" />
            <span>Favorites</span>
          </div>
          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-400 font-mono">
            {counts.favorites}
          </span>
        </button>

        <div className="pt-3 pb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3">
          Categories
        </div>

        <button
          type="button"
          onClick={() => { onSelectFilter('login'); onCloseMobile(); }}
          className={navItemClass(currentFilter === 'login')}
        >
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-emerald-400" />
            <span>Logins & Gmail</span>
          </div>
          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-400 font-mono">
            {counts.login}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { onSelectFilter('bank_account'); onCloseMobile(); }}
          className={navItemClass(currentFilter === 'bank_account')}
        >
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Bank Accounts</span>
          </div>
          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-400 font-mono">
            {counts.bank_account}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { onSelectFilter('card'); onCloseMobile(); }}
          className={navItemClass(currentFilter === 'card')}
        >
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Credit & Debit Cards</span>
          </div>
          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-400 font-mono">
            {counts.card}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { onSelectFilter('secure_note'); onCloseMobile(); }}
          className={navItemClass(currentFilter === 'secure_note')}
        >
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Secure Notes</span>
          </div>
          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-400 font-mono">
            {counts.secure_note}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { onSelectFilter('api_key'); onCloseMobile(); }}
          className={navItemClass(currentFilter === 'api_key')}
        >
          <div className="flex items-center gap-2.5">
            <Code2 className="w-4 h-4 text-rose-400" />
            <span>API Keys & Secrets</span>
          </div>
          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-400 font-mono">
            {counts.api_key}
          </span>
        </button>

        <div className="pt-3 pb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3">
          Security & Tools
        </div>

        {/* Watchtower */}
        <button
          type="button"
          onClick={() => { onOpenWatchtower(); onCloseMobile(); }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-900/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Watchtower Audit</span>
          </div>
          {watchtowerRiskCount > 0 ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono">
              {watchtowerRiskCount} alerts
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-950 text-emerald-400 font-mono">
              Healthy
            </span>
          )}
        </button>

        {/* Password Generator */}
        <button
          type="button"
          onClick={() => { onOpenGenerator(); onCloseMobile(); }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-900/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>Password Generator</span>
          </div>
        </button>

        {/* Sync Devices / QR Pairing */}
        <button
          type="button"
          onClick={() => { onOpenDeviceSync(); onCloseMobile(); }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-900/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Sync Phone & iPad</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/40 font-mono">
            QR Pair
          </span>
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={() => { onOpenSettings(); onCloseMobile(); }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-900/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings & Backup</span>
          </div>
        </button>
      </div>

      {/* Bottom E2EE Status Card */}
      <div className="pt-3 mt-2 border-t border-slate-800/80">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1 text-slate-400 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zero-Knowledge Active</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Master password is never sent to the server. Decrypted solely in client memory.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
