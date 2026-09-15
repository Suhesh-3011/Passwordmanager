import React, { useState } from 'react';
import { Shield, KeyRound, Lock, Smartphone, Laptop, Tablet, Eye, EyeOff, AlertTriangle, ArrowRight, Download, CheckCircle2, RefreshCw } from 'lucide-react';
import { calculatePasswordEntropy, generateEmergencyRecoveryKey } from '../services/crypto';

interface VaultLockScreenProps {
  hasExistingVault: boolean;
  vaultId: string | null;
  onUnlock: (password: string) => Promise<void>;
  onCreateVault: (password: string, recoveryKey: string, seedStarterData: boolean) => Promise<void>;
  onSyncExistingVault: (vaultId: string, password: string) => Promise<void>;
  onRestoreWithRecoveryKey: (recoveryKey: string, newPassword: string) => Promise<void>;
  onImportPayload?: (payload: any) => void;
}

export const VaultLockScreen: React.FC<VaultLockScreenProps> = ({
  hasExistingVault,
  vaultId,
  onUnlock,
  onCreateVault,
  onSyncExistingVault,
  onRestoreWithRecoveryKey,
  onImportPayload,
}) => {
  const [mode, setMode] = useState<'unlock' | 'create' | 'sync' | 'recovery'>(hasExistingVault ? 'unlock' : 'create');
  const [syncMethod, setSyncMethod] = useState<'file' | 'armor' | 'id'>('file');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [confirmNewMasterPassword, setConfirmNewMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [syncVaultId, setSyncVaultId] = useState(vaultId || '');
  const [armorText, setArmorText] = useState('');
  const [seedStarter, setSeedStarter] = useState(true);
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState<string>(() => generateEmergencyRecoveryKey());
  const [recoveryKeyAcknowledged, setRecoveryKeyAcknowledged] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const entropy = calculatePasswordEntropy(password);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text);
        const payload = parsed.payload || parsed;
        if (!payload.ciphertext || !payload.iv || !payload.salt) {
          throw new Error('Invalid .encvault format');
        }
        if (onImportPayload) {
          onImportPayload(payload);
          setMode('unlock');
        }
      } catch (err: any) {
        setErrorMessage('Failed to read encrypted backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      await onUnlock(password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Incorrect Master Password. Please verify and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    if (password.length < 8) {
      setErrorMessage('Master Password must be at least 8 characters for security.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (!recoveryKeyAcknowledged) {
      setErrorMessage('Please confirm you have noted or downloaded your Emergency Recovery Key.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await onCreateVault(password, generatedRecoveryKey, seedStarter);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create encrypted vault.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncVaultId.trim() || !password) {
      setErrorMessage('Please enter both Vault Sync ID and Master Password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await onSyncExistingVault(syncVaultId.trim(), password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sync vault. Verify Vault ID and Master Password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryKeyInput.trim()) {
      setErrorMessage('Please enter your 24-character Emergency Recovery Key.');
      return;
    }
    if (!newMasterPassword) {
      setErrorMessage('Please enter a new Master Password.');
      return;
    }
    if (newMasterPassword.length < 8) {
      setErrorMessage('New Master Password must be at least 8 characters.');
      return;
    }
    if (newMasterPassword !== confirmNewMasterPassword) {
      setErrorMessage('New master passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await onRestoreWithRecoveryKey(recoveryKeyInput.trim(), newMasterPassword);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to recover vault. Check your Recovery Key.');
    } finally {
      setLoading(false);
    }
  };

  const copyRecoveryKey = () => {
    navigator.clipboard.writeText(generatedRecoveryKey);
    setRecoveryKeyAcknowledged(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* App Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            AegisVault
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              E2EE
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            Zero-Knowledge Cryptographic Vault for Phone, iPad & Windows PC
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Top Mode Tabs */}
          <div className="flex rounded-lg bg-slate-950 p-1 mb-6 border border-slate-800">
            {hasExistingVault && (
              <button
                type="button"
                onClick={() => { setMode('unlock'); setErrorMessage(null); }}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                  mode === 'unlock' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Unlock Vault
              </button>
            )}
            <button
              type="button"
              onClick={() => { setMode('create'); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                mode === 'create' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New Vault
            </button>
            <button
              type="button"
              onClick={() => { setMode('sync'); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                mode === 'sync' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sync Device
            </button>
            <button
              type="button"
              onClick={() => { setMode('recovery'); setErrorMessage(null); }}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                mode === 'recovery' ? 'bg-amber-900/60 text-amber-200 shadow-sm border border-amber-700/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Recover
            </button>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/50 border border-red-800/70 text-red-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* MODE: UNLOCK */}
          {mode === 'unlock' && (
            <form onSubmit={handleUnlock} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your master password"
                    autoFocus
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deriving AES Key & Decrypting...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Unlock Aegis Vault</span>
                  </>
                )}
              </button>

              <div className="pt-2 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setMode('recovery'); setErrorMessage(null); }}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 font-medium"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Forgot Master Password? Use Emergency Recovery Key</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('sync'); setErrorMessage(null); }}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  Sync from another phone or laptop instead?
                </button>
              </div>
            </form>
          )}

          {/* MODE: CREATE VAULT */}
          {mode === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Set Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong master passphrase"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Entropy & Strength Bar */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Entropy: {entropy.bits} bits</span>
                      <span className={entropy.color}>
                        {entropy.score.toUpperCase()} &bull; Est. Crack: {entropy.crackTimeText}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          entropy.score === 'very-weak'
                            ? 'w-1/5 bg-red-500'
                            : entropy.score === 'weak'
                            ? 'w-2/5 bg-amber-500'
                            : entropy.score === 'fair'
                            ? 'w-3/5 bg-yellow-400'
                            : entropy.score === 'strong'
                            ? 'w-4/5 bg-emerald-400'
                            : 'w-full bg-cyan-400'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm Master Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat master password"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Emergency Recovery Key Box */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" /> Emergency Recovery Key
                  </span>
                  <button
                    type="button"
                    onClick={copyRecoveryKey}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    Copy Key
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-200 bg-slate-900 p-2 rounded-lg border border-slate-800 select-text break-all">
                  {generatedRecoveryKey}
                </div>
                <label className="flex items-start gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recoveryKeyAcknowledged}
                    onChange={(e) => setRecoveryKeyAcknowledged(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 leading-tight">
                    I have safely copied this recovery key. If I lose my master password, this is the only way to recover.
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="seed-starter-chk"
                  type="checkbox"
                  checked={seedStarter}
                  onChange={(e) => setSeedStarter(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="seed-starter-chk" className="text-xs text-slate-400 cursor-pointer">
                  Include sample categories (Gmail, Bank, Credit Card, Secure Note)
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !recoveryKeyAcknowledged}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Encrypting Vault (PBKDF2 600K rounds)...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Create Encrypted Vault</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE: SYNC EXISTING (iPhone / iPad / Windows Laptop) */}
          {mode === 'sync' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-xs text-emerald-300">
                <div className="font-semibold mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" /> Air-Gapped Device Sync (Option A)
                </div>
                Zero bytes leave your device. Import your encrypted backup file or enter your vault pairing code.
              </div>

              {/* Method 1: File import */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-white block">
                  Method 1: Import .encvault File (AirDrop or USB)
                </span>
                <p className="text-[11px] text-slate-400">
                  Select the encrypted backup file exported from your other device:
                </p>
                <label className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer border border-slate-700 transition-colors">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Choose .encvault File</span>
                  <input
                    type="file"
                    accept=".encvault,.json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Method 2: Pairing code */}
              <form onSubmit={handleSyncExisting} className="space-y-3 pt-2">
                <span className="text-xs font-semibold text-white block">
                  Method 2: Sync by Vault ID
                </span>
                <div>
                  <input
                    type="text"
                    value={syncVaultId}
                    onChange={(e) => setSyncVaultId(e.target.value)}
                    placeholder="Enter Vault Sync ID"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Master Password"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !syncVaultId || !password}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying & Decrypting...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>Unlock with Sync ID</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* MODE: EMERGENCY RECOVERY KEY RESTORE */}
          {mode === 'recovery' && (
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs">
                <div className="flex items-center gap-2 font-semibold text-amber-300 mb-1">
                  <KeyRound className="w-4 h-4" />
                  <span>Emergency Vault Recovery</span>
                </div>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  Enter the 24-character Emergency Recovery Key generated when your vault was created. You will be prompted to choose a new Master Password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Emergency Recovery Key
                </label>
                <input
                  type="text"
                  value={recoveryKeyInput}
                  onChange={(e) => setRecoveryKeyInput(e.target.value)}
                  placeholder="AEGIS-XXXX-XXXX-XXXX-XXXX"
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-amber-300 font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all uppercase"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Found in your saved Emergency Kit document (e.g. AEGIS-A1B2-C3D4-E5F6-G7H8)
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Set New Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newMasterPassword}
                    onChange={(e) => setNewMasterPassword(e.target.value)}
                    placeholder="Enter new master password (min 8 chars)"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm New Master Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmNewMasterPassword}
                  onChange={(e) => setConfirmNewMasterPassword(e.target.value)}
                  placeholder="Confirm new master password"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !recoveryKeyInput.trim() || !newMasterPassword}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Recovery Key & Re-encrypting...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Recover Vault & Unlock</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setMode('unlock'); setErrorMessage(null); }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Remembered your password? Back to Unlock
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security badges footer */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>AES-256-GCM</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>PBKDF2 (600,000 rounds)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Knowledge</span>
          </div>
        </div>

        {/* Supported Platforms */}
        <div className="mt-3 flex items-center justify-center gap-3 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1"><Smartphone className="w-3 h-3 text-slate-400" /> iPhone</span>
          <span className="text-slate-600">&bull;</span>
          <span className="flex items-center gap-1"><Tablet className="w-3 h-3 text-slate-400" /> iPad</span>
          <span className="text-slate-600">&bull;</span>
          <span className="flex items-center gap-1"><Laptop className="w-3 h-3 text-slate-400" /> Windows Laptop</span>
        </div>
      </div>
    </div>
  );
};
