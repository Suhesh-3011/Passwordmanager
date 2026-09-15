import React from 'react';
import { CheckCircle2, AlertCircle, Info, ShieldCheck } from 'lucide-react';

interface ToastNotificationProps {
  message: string | null;
  type?: 'success' | 'info' | 'warning';
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 select-none">
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 border border-slate-700/80 text-white shadow-2xl text-xs font-medium backdrop-blur-md max-w-sm">
        {type === 'success' ? (
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : type === 'warning' ? (
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
        ) : (
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        )}
        <span className="leading-snug">{message}</span>
      </div>
    </div>
  );
};
