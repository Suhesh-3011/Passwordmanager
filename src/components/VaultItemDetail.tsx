import React, { useState } from 'react';
import { 
  Key, Building2, CreditCard, FileText, Code2, Star, Edit3, Trash2,
  Copy, Check, Eye, EyeOff, ExternalLink, ShieldCheck, AlertTriangle,
  Clock, Shield, ArrowLeft
} from 'lucide-react';
import { VaultItem } from '../types';
import { calculatePasswordEntropy } from '../services/crypto';

interface VaultItemDetailProps {
  item: VaultItem | null;
  onEdit: (item: VaultItem) => void;
  onDelete: (itemId: string) => void;
  onToggleFavorite: (itemId: string) => void;
  onCopyText: (text: string, label: string) => void;
  copiedLabel: string | null;
  clipboardCountdown: number | null;
  onBackMobile: () => void;
}

export const VaultItemDetail: React.FC<VaultItemDetailProps> = ({
  item,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopyText,
  copiedLabel,
  clipboardCountdown,
  onBackMobile,
}) => {
  const [revealedFields, setRevealedFields] = useState<Record<string, boolean>>({});

  if (!item) {
    return (
      <div className="flex-1 hidden lg:flex flex-col items-center justify-center h-full bg-slate-950 p-8 text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-600">
          <Shield className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-300">Select an item to view details</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          All data is end-to-end encrypted with AES-256-GCM and zero-knowledge architecture.
        </p>
      </div>
    );
  }

  const toggleReveal = (fieldKey: string) => {
    setRevealedFields((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const isRevealed = (fieldKey: string) => !!revealedFields[fieldKey];

  const renderCopyButton = (value: string, label: string) => {
    const isCopied = copiedLabel === label;
    return (
      <button
        type="button"
        onClick={() => onCopyText(value, label)}
        title={`Copy ${label}`}
        className={`p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 shrink-0 ${
          isCopied
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    );
  };

  const renderField = (
    label: string,
    value: string | undefined,
    options?: { isSecret?: boolean; fieldKey?: string; isUrl?: boolean }
  ) => {
    if (!value) return null;
    const isSecret = options?.isSecret;
    const fieldKey = options?.fieldKey || label;
    const revealed = isRevealed(fieldKey);

    return (
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-3 group">
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {label}
          </span>
          <div className="text-sm font-mono text-slate-100 break-all select-text">
            {isSecret && !revealed ? '••••••••••••••••' : value}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isSecret && (
            <button
              type="button"
              onClick={() => toggleReveal(fieldKey)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title={revealed ? 'Hide' : 'Reveal'}
            >
              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}

          {options?.isUrl && (
            <a
              href={value.startsWith('http') ? value : `https://${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
              title="Open website"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {renderCopyButton(value, label)}
        </div>
      </div>
    );
  };

  const entropy = item.type === 'login' ? calculatePasswordEntropy(item.password) : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* Top Header bar */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Back to list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white truncate flex items-center gap-2">
              {item.title}
              <button
                type="button"
                onClick={() => onToggleFavorite(item.id)}
                className="p-1 text-slate-500 hover:text-amber-400"
              >
                <Star className={`w-4 h-4 ${item.favorite ? 'text-amber-400 fill-amber-400' : ''}`} />
              </button>
            </h2>
            <span className="text-xs text-slate-400 uppercase font-mono tracking-wider">
              {item.type.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Edit & Delete Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/50 transition-all"
            title="Delete this item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clipboard Countdown Warning Toast inside detail */}
      {clipboardCountdown !== null && clipboardCountdown > 0 && (
        <div className="bg-emerald-950/60 border-b border-emerald-800/60 px-4 py-2 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Copied to clipboard! Auto-clearing memory in:</span>
          </div>
          <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700/60">
            {clipboardCountdown}s
          </span>
        </div>
      )}

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-3xl">
        {/* LOGIN TYPE */}
        {item.type === 'login' && (
          <div className="space-y-3">
            {renderField('Username / Email', item.username)}
            {renderField('Password', item.password, { isSecret: true, fieldKey: 'password' })}

            {/* Password Entropy & Strength Card */}
            {entropy && (
              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    Cryptographic Strength
                  </span>
                  <span className={`font-semibold font-mono ${entropy.color}`}>
                    {entropy.bits} bits &bull; {entropy.score.toUpperCase()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Estimated brute-force crack time on high-end cluster:{' '}
                  <strong className="text-slate-200">{entropy.crackTimeText}</strong>
                </div>
              </div>
            )}

            {renderField('Website URL', item.website, { isUrl: true })}
          </div>
        )}

        {/* BANK ACCOUNT TYPE */}
        {item.type === 'bank_account' && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-900/40 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                  {item.bankName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono">
                  {item.accountType}
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-white tracking-widest my-2">
                {isRevealed('bank_acc') ? item.accountNumber : `•••• •••• •••• ${item.accountNumber.slice(-4)}`}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Routing: {item.routingNumber || 'N/A'}</span>
                <span>Currency: {item.currency || 'USD'}</span>
              </div>
            </div>

            {renderField('Account Number', item.accountNumber, { isSecret: true, fieldKey: 'bank_acc' })}
            {renderField('Routing Number (ABA)', item.routingNumber)}
            {renderField('Account PIN', item.pin, { isSecret: true, fieldKey: 'bank_pin' })}
            {renderField('SWIFT / BIC', item.swiftBic)}
            {renderField('Online Banking Portal', item.onlineBankingUrl, { isUrl: true })}
          </div>
        )}

        {/* CARD TYPE */}
        {item.type === 'card' && (
          <div className="space-y-4">
            {/* Visual Credit Card Mockup */}
            <div className="w-full max-w-sm mx-auto p-5 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start mb-6">
                <div className="w-9 h-7 rounded bg-amber-400/80 border border-amber-300/60 flex items-center justify-center">
                  <div className="w-6 h-4 border-t border-b border-amber-900/40" />
                </div>
                <span className="text-xs font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                  {item.cardBrand.toUpperCase()}
                </span>
              </div>

              <div className="text-base sm:text-lg font-mono tracking-widest my-4">
                {isRevealed('card_num')
                  ? item.cardNumber
                  : `•••• •••• •••• ${item.cardNumber ? item.cardNumber.replace(/\s+/g, '').slice(-4) : '••••'}`}
              </div>

              <div className="flex justify-between items-end text-xs font-mono">
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase">Cardholder</span>
                  <span className="font-semibold text-slate-200">{item.cardholderName || 'VALUED MEMBER'}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 uppercase">Expires</span>
                  <span className="font-semibold text-slate-200">
                    {item.expiryMonth || 'MM'}/{item.expiryYear || 'YY'}
                  </span>
                </div>
              </div>
            </div>

            {renderField('Card Number', item.cardNumber, { isSecret: true, fieldKey: 'card_num' })}
            <div className="grid grid-cols-2 gap-3">
              {renderField('Expiration', `${item.expiryMonth} / ${item.expiryYear}`)}
              {renderField('CVV / Security Code', item.cvv, { isSecret: true, fieldKey: 'card_cvv' })}
            </div>
            {renderField('Cardholder Name', item.cardholderName)}
            {renderField('Card PIN', item.pin, { isSecret: true, fieldKey: 'card_pin' })}
            {renderField('Billing ZIP Code', item.billingZip)}
          </div>
        )}

        {/* SECURE NOTE TYPE */}
        {item.type === 'secure_note' && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-400 uppercase">
                  {item.category || 'Encrypted Secure Note'}
                </span>
                {renderCopyButton(item.content, 'Secure Note Content')}
              </div>
              <div className="font-mono text-sm text-slate-200 whitespace-pre-wrap select-text leading-relaxed">
                {item.content}
              </div>
            </div>
          </div>
        )}

        {/* API KEY TYPE */}
        {item.type === 'api_key' && (
          <div className="space-y-3">
            {renderField('Service / Provider', item.serviceName)}
            {renderField('API Key', item.apiKey)}
            {renderField('API Secret', item.apiSecret, { isSecret: true, fieldKey: 'api_secret' })}
            {renderField('Endpoint URL', item.endpointUrl, { isUrl: true })}
          </div>
        )}

        {/* General Notes Section */}
        {item.notes && (
          <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Secure Notes
            </span>
            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-text font-mono">
              {item.notes}
            </p>
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Timestamps footer */}
        <div className="pt-6 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>Last modified: {new Date(item.updatedAt).toLocaleString()}</span>
          </div>
          <div>Created: {new Date(item.createdAt).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};
