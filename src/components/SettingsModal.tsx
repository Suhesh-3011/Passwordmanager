import React, { useState } from 'react';
import { 
  X, Settings, Shield, Laptop, Clock, Download, Upload, Key,
  AlertTriangle, FileText, Check, Smartphone, Tablet
} from 'lucide-react';
import { VaultSettings, EncryptedPayload, VaultData } from '../types';
import { 
  downloadEmergencyRecoveryKit, downloadEncryptedBackup, getStoredRecoveryKey 
} from '../services/storage';

interface SettingsModalProps {
  settings: VaultSettings;
  onSaveSettings: (newSettings: VaultSettings) => void;
  vaultId: string;
  encryptedPayload: EncryptedPayload | null;
  onClose: () => void;
  onChangeMasterPassword: (oldPass: string, newPass: string) => Promise<void>;
  onImportBackup: (importedPayload: EncryptedPayload) => Promise<void>;
  onPurgeVault: () => void;
  onShowToast: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  vaultId,
  encryptedPayload,
  onClose,
  onChangeMasterPassword,
  onImportBackup,
  onPurgeVault,
  onShowToast,
}) => {
  const [deviceName, setDeviceName] = useState(settings.deviceName);
  const [devicePlatform, setDevicePlatform] = useState(settings.devicePlatform);
  const [autoLockMinutes, setAutoLockMinutes] = useState(settings.autoLockMinutes);
  const [clipboardClearSeconds, setClipboardClearSeconds] = useState(settings.clipboardClearSeconds);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  const recoveryKey = getStoredRecoveryKey() || 'NOT_STORED_LOCALLY';

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      deviceName: deviceName.trim() || settings.deviceName,
      devicePlatform,
      autoLockMinutes,
      clipboardClearSeconds,
    });
    onShowToast('Settings and auto-lock preferences saved.');
    onClose();
  };

  const handleDownloadEmergencyKit = () => {
    if (!encryptedPayload) return;
    downloadEmergencyRecoveryKit(vaultId, recoveryKey, encryptedPayload.salt);
    onShowToast('Emergency Recovery Kit downloaded. Store in a secure physical location.');
  };

  const handleExportBackup = () => {
    if (!encryptedPayload) return;
    downloadEncryptedBackup(vaultId, encryptedPayload);
    onShowToast('Encrypted vault backup exported (.encvault).');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const payloadToImport = parsed.payload || parsed;
        if (!payloadToImport.ciphertext || !payloadToImport.iv || !payloadToImport.salt) {
          throw new Error('Invalid .encvault format');
        }
        await onImportBackup(payloadToImport);
        onShowToast('Encrypted backup imported successfully!');
        onClose();
      } catch (err: any) {
        alert('Failed to import backup: ' + (err.message || 'Corrupted file'));
      }
    };
    reader.readAsText(file);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 8) {
      setPasswordChangeError('New Master Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }

    setPasswordChangeLoading(true);
    setPasswordChangeError(null);
    try {
      await onChangeMasterPassword(currentPassword, newPassword);
      onShowToast('Master password successfully updated! Vault re-encrypted.');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordChangeError(err.message || 'Failed to update master password. Check existing password.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Vault Settings & Security</h3>
              <p className="text-[11px] text-slate-400">
                Manage sync device identity, auto-lock timeouts, and backups
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* General Device Preferences Form */}
          <form onSubmit={handleSavePreferences} className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Device Identity & Auto-Lock
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Device Name
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. Windows Laptop, iPhone 15"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Device Platform
                </label>
                <select
                  value={devicePlatform}
                  onChange={(e) => setDevicePlatform(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Windows">Windows Laptop / PC</option>
                  <option value="iPhone">iPhone</option>
                  <option value="iPad">iPad</option>
                  <option value="Mac">Mac</option>
                  <option value="Android">Android</option>
                  <option value="Web">Web Browser</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Inactivity Auto-Lock
                </label>
                <select
                  value={autoLockMinutes}
                  onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value={1}>1 minute</option>
                  <option value={5}>5 minutes (Recommended)</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={0}>Never (Keep unlocked)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Clipboard Auto-Clear
                </label>
                <select
                  value={clipboardClearSeconds}
                  onChange={(e) => setClipboardClearSeconds(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds (Recommended)</option>
                  <option value={60}>60 seconds</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </form>

          {/* Backup & Recovery */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Cryptographic Backups & Emergency Kit
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadEmergencyKit}
                className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors group"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
                  <FileText className="w-4 h-4" />
                  <span>Emergency Recovery Kit</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Download printable HTML sheet containing your Vault Sync ID and recovery instructions.
                </p>
              </button>

              <button
                type="button"
                onClick={handleExportBackup}
                className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors group"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                  <Download className="w-4 h-4" />
                  <span>Export Encrypted Backup</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Save cold offline .encvault file. Ciphertext remains encrypted with your master password.
                </p>
              </button>
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Import Encrypted Backup (.encvault)</span>
                <input
                  type="file"
                  accept=".encvault,.json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Master Password Change */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Change Master Password
              </h4>
              <button
                type="button"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-xs text-emerald-400 hover:underline"
              >
                {showPasswordChange ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordChange && (
              <form onSubmit={handleChangePasswordSubmit} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                {passwordChangeError && (
                  <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
                    {passwordChangeError}
                  </div>
                )}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Current Master Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">New Master Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Repeat New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={passwordChangeLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {passwordChangeLoading ? 'Re-encrypting Vault...' : 'Update & Re-encrypt'}
                </button>
              </form>
            )}
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Danger Zone
            </h4>
            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-rose-300 block">
                  Purge Local Vault Cache
                </span>
                <span className="text-[11px] text-slate-400">
                  Clears local browser memory and cached ciphertexts on this device.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to purge local vault cache on this device? Ensure you have your sync ID and master password.')) {
                    onPurgeVault();
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold transition-colors shrink-0"
              >
                Purge Vault
              </button>
            </div>
          </div>
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
