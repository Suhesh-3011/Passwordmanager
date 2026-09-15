import React from 'react';
import { 
  X, ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw, Key, ArrowRight,
  Sparkles, CheckCircle2, Lock
} from 'lucide-react';
import { VaultItem, LoginItem, PasswordAuditResult } from '../types';
import { calculatePasswordEntropy } from '../services/crypto';

interface SecurityWatchtowerModalProps {
  items: VaultItem[];
  onClose: () => void;
  onEditItem: (item: VaultItem) => void;
}

export function auditVaultPasswords(items: VaultItem[]): PasswordAuditResult {
  const loginItems = items.filter((i): i is LoginItem => i.type === 'login' && !!i.password);
  
  const weakItems: VaultItem[] = [];
  const passwordUsageMap = new Map<string, VaultItem[]>();
  const oldItems: VaultItem[] = [];

  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

  loginItems.forEach((item) => {
    // Weakness check
    const entropy = calculatePasswordEntropy(item.password);
    if (entropy.bits < 50 || item.password.length < 12) {
      weakItems.push(item);
    }

    // Reused check
    const existingList = passwordUsageMap.get(item.password) || [];
    existingList.push(item);
    passwordUsageMap.set(item.password, existingList);

    // Age check
    if (item.lastPasswordChange) {
      const changedTime = new Date(item.lastPasswordChange).getTime();
      if (changedTime < ninetyDaysAgo) {
        oldItems.push(item);
      }
    }
  });

  const reusedItems: { password: string; items: VaultItem[] }[] = [];
  passwordUsageMap.forEach((list, pass) => {
    if (list.length > 1) {
      reusedItems.push({ password: pass, items: list });
    }
  });

  // Calculate overall score: start at 100
  let score = 100;
  if (loginItems.length > 0) {
    score -= weakItems.length * 15;
    score -= reusedItems.length * 20;
    score -= oldItems.length * 5;
    score = Math.max(10, Math.min(100, score));
  }

  return {
    score,
    totalPasswords: loginItems.length,
    weakCount: weakItems.length,
    reusedCount: reusedItems.length,
    oldPasswordCount: oldItems.length,
    weakItems,
    reusedItems,
    oldItems,
  };
}

export const SecurityWatchtowerModal: React.FC<SecurityWatchtowerModalProps> = ({
  items,
  onClose,
  onEditItem,
}) => {
  const audit = auditVaultPasswords(items);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
    if (score >= 60) return 'text-yellow-400 border-yellow-500/30 bg-yellow-950/20';
    return 'text-rose-400 border-rose-500/30 bg-rose-950/20';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Security Watchtower</h3>
              <p className="text-[11px] text-slate-400">
                Auditing credential entropy, reuse, and vulnerability
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Health Score Overview */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Overall Vault Health
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {audit.score >= 85
                  ? 'Strong Cryptographic Health'
                  : audit.score >= 60
                  ? 'Moderate Vulnerabilities Detected'
                  : 'High Risk: Action Required'}
              </h2>
              <p className="text-xs text-slate-400 max-w-sm">
                AegisVault checks all stored accounts against weak passwords, duplicate credentials, and aging security keys.
              </p>
            </div>

            {/* Score Ring / Pill */}
            <div className={`p-4 rounded-2xl border text-center shrink-0 w-28 ${getScoreColor(audit.score)}`}>
              <div className="text-3xl font-extrabold font-mono leading-none">
                {audit.score}%
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider mt-1 block">
                Security Score
              </span>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-lg font-bold font-mono text-rose-400">
                {audit.reusedCount}
              </span>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                Reused Passwords
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-lg font-bold font-mono text-amber-400">
                {audit.weakCount}
              </span>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                Weak Passwords
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <span className="text-lg font-bold font-mono text-cyan-400">
                {audit.oldPasswordCount}
              </span>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                Over 90 Days Old
              </span>
            </div>
          </div>

          {/* Section: Reused Passwords (CRITICAL) */}
          {audit.reusedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Reused Across Multiple Accounts (Critical Vulnerability)</span>
              </div>
              <p className="text-xs text-slate-400">
                If one service suffers a credential breach, attackers can use this identical password to access your other accounts:
              </p>
              <div className="space-y-2">
                {audit.reusedItems.map((group, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-300">
                        Password: •••••••• (Used on {group.items.length} accounts)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onClose();
                            onEditItem(item);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-white flex items-center gap-1.5 transition-colors"
                        >
                          <Key className="w-3 h-3 text-rose-400" />
                          <span>{item.title}</span>
                          <span className="text-[10px] text-emerald-400 font-medium">&rarr; Fix</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Weak Passwords */}
          {audit.weakItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Weak or Low Entropy Passwords (&lt; 12 chars)</span>
              </div>
              <div className="divide-y divide-slate-800 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                {audit.weakItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">{item.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {(item as LoginItem).username || 'Login'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEditItem(item);
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Strengthen</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If everything is clean! */}
          {audit.reusedItems.length === 0 && audit.weakItems.length === 0 && (
            <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">No Vulnerabilities Found!</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All stored logins use unique, high-entropy passwords with maximum AES-GCM protection.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
