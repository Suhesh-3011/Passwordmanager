import React from 'react';
import { 
  Key, Building2, CreditCard, FileText, Code2, Star, Copy, Check, ExternalLink,
  ChevronRight, Lock, Eye, AlertCircle
} from 'lucide-react';
import { VaultItem } from '../types';

interface VaultItemListProps {
  items: VaultItem[];
  selectedItemId: string | null;
  onSelectItem: (item: VaultItem) => void;
  onToggleFavorite: (itemId: string, e: React.MouseEvent) => void;
  onCopyText: (text: string, label: string, e: React.MouseEvent) => void;
  copiedLabel: string | null;
  filterTitle: string;
}

export const VaultItemList: React.FC<VaultItemListProps> = ({
  items,
  selectedItemId,
  onSelectItem,
  onToggleFavorite,
  onCopyText,
  copiedLabel,
  filterTitle,
}) => {
  const getItemIcon = (type: VaultItem['type']) => {
    switch (type) {
      case 'login':
        return <Key className="w-4 h-4 text-emerald-400" />;
      case 'bank_account':
        return <Building2 className="w-4 h-4 text-cyan-400" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-amber-400" />;
      case 'secure_note':
        return <FileText className="w-4 h-4 text-purple-400" />;
      case 'api_key':
        return <Code2 className="w-4 h-4 text-rose-400" />;
    }
  };

  const getSubtitle = (item: VaultItem) => {
    switch (item.type) {
      case 'login':
        return item.username || item.website || 'Login credentials';
      case 'bank_account':
        return `${item.bankName} &bull; ${item.accountType} (${item.accountNumber ? item.accountNumber.slice(-4) : '••••'})`;
      case 'card':
        return `${item.cardBrand} &bull; Ends in ${item.cardNumber ? item.cardNumber.slice(-4) : '••••'}`;
      case 'secure_note':
        return item.category || 'Secure confidential note';
      case 'api_key':
        return item.serviceName || 'Developer API Key';
    }
  };

  const getPrimaryCopySecret = (item: VaultItem): { text: string; label: string } | null => {
    switch (item.type) {
      case 'login':
        return item.password ? { text: item.password, label: `${item.title} Password` } : null;
      case 'bank_account':
        return item.accountNumber ? { text: item.accountNumber, label: `${item.bankName} Account #` } : null;
      case 'card':
        return item.cardNumber ? { text: item.cardNumber.replace(/\s+/g, ''), label: `${item.title} Card Number` } : null;
      case 'secure_note':
        return item.content ? { text: item.content, label: `${item.title} Note` } : null;
      case 'api_key':
        return item.apiKey ? { text: item.apiKey, label: `${item.title} API Key` } : null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/40 overflow-hidden select-none">
      {/* List Header */}
      <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {filterTitle}
          </h2>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {items.length}
          </span>
        </div>
      </div>

      {/* Items Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-900/80 p-2 space-y-1">
        {items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
              <Lock className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-400">No items found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Add your Gmail password, bank account, or card using the "Add Item" button above.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isSelected = selectedItemId === item.id;
            const primaryCopy = getPrimaryCopySecret(item);
            const isCopied = primaryCopy && copiedLabel === primaryCopy.label;

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className={`group w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-900 border-slate-700 shadow-sm'
                    : 'bg-slate-900/30 border-transparent hover:bg-slate-900/70 hover:border-slate-800'
                }`}
              >
                {/* Icon & Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
                    {getItemIcon(item.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                        {item.title}
                      </span>
                      {item.tags && item.tags.length > 0 && (
                        <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {item.tags[0]}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[11px] text-slate-400 truncate mt-0.5"
                      dangerouslySetInnerHTML={{ __html: getSubtitle(item) }}
                    />
                  </div>
                </div>

                {/* Action buttons (Favorite & Quick Copy) */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Quick copy password / secret */}
                  {primaryCopy && (
                    <button
                      type="button"
                      onClick={(e) => onCopyText(primaryCopy.text, primaryCopy.label, e)}
                      title={`Copy ${item.type === 'login' ? 'password' : 'secret'} (auto-clears in 30s)`}
                      className={`p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ${
                        isCopied
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 opacity-80 group-hover:opacity-100'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {/* Favorite toggle */}
                  <button
                    type="button"
                    onClick={(e) => onToggleFavorite(item.id, e)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${item.favorite ? 'text-amber-400 fill-amber-400' : ''}`}
                    />
                  </button>

                  <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${isSelected ? 'text-emerald-400 translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
