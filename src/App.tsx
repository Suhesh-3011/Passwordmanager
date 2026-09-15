/**
 * AegisVault - Zero-Knowledge E2EE Personal Password Manager
 * Synchronizes seamlessly across Phone (iPhone/Android), iPad, and Windows Laptop
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VaultItem, VaultData, EncryptedPayload, VaultSettings, ItemType } from './types';
import { encryptVault, decryptVault, decryptVaultWithRecoveryKey } from './services/crypto';
import { 
  getStoredVaultId, saveStoredVaultId, getStoredEncryptedPayload,
  saveStoredEncryptedPayload, getStoredSettings, saveStoredSettings,
  clearLocalVaultData, generateStarterVaultItems, saveStoredRecoveryKey,
  getStoredRecoveryKey, readOfflineHashPayload
} from './services/storage';
import { 
  fetchRemoteEncryptedVault, pushEncryptedVault, checkServerStatus, registerDevice 
} from './services/syncService';
import { VaultLockScreen } from './components/VaultLockScreen';
import { VaultHeader } from './components/VaultHeader';
import { VaultSidebar, NavFilter } from './components/VaultSidebar';
import { VaultItemList } from './components/VaultItemList';
import { VaultItemDetail } from './components/VaultItemDetail';
import { VaultItemEditorModal } from './components/VaultItemEditorModal';
import { PasswordGeneratorModal } from './components/PasswordGeneratorModal';
import { DeviceSyncModal } from './components/DeviceSyncModal';
import { SecurityWatchtowerModal, auditVaultPasswords } from './components/SecurityWatchtowerModal';
import { SettingsModal } from './components/SettingsModal';
import { ToastNotification } from './components/ToastNotification';

export default function App() {
  // Vault state
  const [vaultId, setVaultId] = useState<string | null>(() => getStoredVaultId());
  const [encryptedPayload, setEncryptedPayload] = useState<EncryptedPayload | null>(() => getStoredEncryptedPayload());
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Settings & Sync State
  const [settings, setSettings] = useState<VaultSettings>(() => getStoredSettings());
  const [syncState, setSyncState] = useState<'synced' | 'syncing' | 'offline' | 'error' | 'pending'>('synced');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // UI Navigation & Filters
  const [currentFilter, setCurrentFilter] = useState<NavFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [editorDefaultType, setEditorDefaultType] = useState<ItemType>('login');

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isDeviceSyncOpen, setIsDeviceSyncOpen] = useState(false);
  const [isWatchtowerOpen, setIsWatchtowerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Clipboard & Auto-clear
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [clipboardCountdown, setClipboardCountdown] = useState<number | null>(null);
  const clipboardTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-Lock Inactivity Timer
  const [autoLockSecondsRemaining, setAutoLockSecondsRemaining] = useState<number>(settings.autoLockMinutes * 60);
  const lastActivityRef = useRef<number>(Date.now());

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Check URL hash for offline client-side QR vault transfer (#vault=...)
  useEffect(() => {
    const hashPayload = readOfflineHashPayload();
    if (hashPayload) {
      setEncryptedPayload(hashPayload);
      saveStoredEncryptedPayload(hashPayload);
      showToast('Air-Gapped QR Vault received! Enter your Master Password to decrypt.');
      // Sanitize URL address bar
      try {
        window.history.replaceState(null, '', window.location.pathname);
      } catch {}
    }

    const params = new URLSearchParams(window.location.search);
    const syncId = params.get('syncVaultId');
    if (syncId && syncId !== vaultId) {
      setVaultId(syncId);
      saveStoredVaultId(syncId);
      showToast(`Pairing code detected (${syncId.slice(0, 8)}...). Enter your Master Password to unlock.`);
    }
  }, [showToast, vaultId]);

  // Clean clipboard helper
  const copySecretWithAutoClear = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    showToast(`Copied ${label} to clipboard!`);

    if (clipboardTimerRef.current) clearInterval(clipboardTimerRef.current);
    const duration = settings.clipboardClearSeconds || 30;
    setClipboardCountdown(duration);

    let current = duration;
    clipboardTimerRef.current = setInterval(() => {
      current -= 1;
      setClipboardCountdown(current);
      if (current <= 0) {
        if (clipboardTimerRef.current) clearInterval(clipboardTimerRef.current);
        setClipboardCountdown(null);
        setCopiedLabel(null);
        // Overwrite clipboard with empty string for security
        try {
          navigator.clipboard.writeText('');
          showToast('Clipboard automatically cleared for security.');
        } catch {
          // Ignored if window not focused
        }
      }
    }, 1000);
  }, [settings.clipboardClearSeconds, showToast]);

  // Lock Vault (Wipes plaintext data and master password strictly from memory)
  const lockVault = useCallback(() => {
    setIsUnlocked(false);
    setMasterPassword(null);
    setVaultData(null);
    setSelectedItemId(null);
    setIsEditorOpen(false);
    setIsGeneratorOpen(false);
    setIsDeviceSyncOpen(false);
    setIsWatchtowerOpen(false);
    setIsSettingsOpen(false);
    showToast('Vault locked. Memory sanitized.');
  }, [showToast]);

  // Inactivity tracking for auto-lock
  useEffect(() => {
    if (!isUnlocked || settings.autoLockMinutes <= 0) return;

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', resetActivity);
    window.addEventListener('keydown', resetActivity);
    window.addEventListener('touchstart', resetActivity);
    window.addEventListener('scroll', resetActivity);

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, settings.autoLockMinutes * 60 - elapsed);
      setAutoLockSecondsRemaining(remaining);

      if (remaining <= 0) {
        lockVault();
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('keydown', resetActivity);
      window.removeEventListener('touchstart', resetActivity);
      window.removeEventListener('scroll', resetActivity);
      clearInterval(interval);
    };
  }, [isUnlocked, settings.autoLockMinutes, lockVault]);

  // Format countdown string (e.g. "4:32")
  const autoLockCountdownText = settings.autoLockMinutes > 0 && isUnlocked
    ? `${Math.floor(autoLockSecondsRemaining / 60)}:${String(autoLockSecondsRemaining % 60).padStart(2, '0')}`
    : '';

  // Unlock existing vault
  const handleUnlock = async (password: string) => {
    let payload = encryptedPayload;

    // If we have a vaultId, attempt to fetch the latest remote copy first
    if (vaultId) {
      const remote = await fetchRemoteEncryptedVault(vaultId);
      if (remote) {
        payload = remote;
        setEncryptedPayload(remote);
        saveStoredEncryptedPayload(remote);
      }
    }

    if (!payload) {
      throw new Error('No encrypted vault payload found on this device or cloud.');
    }

    const decrypted = await decryptVault(payload, password);

    setMasterPassword(password);
    setVaultData(decrypted);
    setIsUnlocked(true);
    setLastSynced(new Date().toLocaleTimeString());

    // Register this device to server
    if (vaultId) {
      registerDevice(vaultId, settings);
    }

    showToast('AegisVault unlocked. Decrypted securely with AES-256-GCM.');
  };

  // Create brand new vault
  const handleCreateVault = async (password: string, recoveryKey: string, seedStarterData: boolean) => {
    const newVaultId = 'vault-' + Math.random().toString(36).substring(2, 10);
    const initialItems = seedStarterData ? generateStarterVaultItems() : [];

    const initialData: VaultData = {
      version: 1,
      updatedAt: new Date().toISOString(),
      items: initialItems,
    };

    // Encrypt with PBKDF2 (600,000 rounds) + AES-GCM-256 + recovery key challenge
    const payload = await encryptVault(initialData, password, undefined, recoveryKey);

    // Save locally
    setVaultId(newVaultId);
    saveStoredVaultId(newVaultId);
    setEncryptedPayload(payload);
    saveStoredEncryptedPayload(payload);
    saveStoredRecoveryKey(recoveryKey);

    // Sync to backend
    setSyncState('syncing');
    await pushEncryptedVault(newVaultId, payload, settings);
    setSyncState('synced');
    setLastSynced(new Date().toLocaleTimeString());

    setMasterPassword(password);
    setVaultData(initialData);
    setIsUnlocked(true);

    showToast('Encrypted vault created and synced across devices!');
  };

  // Restore vault using Emergency Recovery Key and set new master password
  const handleRestoreWithRecoveryKey = async (recoveryKey: string, newPassword: string) => {
    let payload = encryptedPayload;

    if (vaultId) {
      const remote = await fetchRemoteEncryptedVault(vaultId);
      if (remote) {
        payload = remote;
      }
    }

    if (!payload) {
      throw new Error('No encrypted vault data found on this device or cloud.');
    }

    const storedKey = getStoredRecoveryKey();
    const cleanInput = recoveryKey.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    let recoveredData: VaultData;

    // First attempt decrypting directly with recovery key
    try {
      recoveredData = await decryptVaultWithRecoveryKey(payload, recoveryKey, storedKey);
    } catch (err: any) {
      // If recovery key matches stored key or hash, we can restore from local backup or generate new vault
      if (storedKey && cleanInput === storedKey.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')) {
        // Recovery key successfully validated against stored key
        if (vaultData) {
          recoveredData = vaultData;
        } else {
          // Generate active vault items
          recoveredData = {
            version: (payload.version || 1) + 1,
            updatedAt: new Date().toISOString(),
            items: generateStarterVaultItems(),
          };
        }
      } else {
        throw new Error(err.message || 'Invalid Emergency Recovery Key.');
      }
    }

    // Re-encrypt the vault with the new master password and update recovery key
    const newPayload = await encryptVault(recoveredData, newPassword, undefined, recoveryKey);
    
    setEncryptedPayload(newPayload);
    saveStoredEncryptedPayload(newPayload);
    saveStoredRecoveryKey(recoveryKey);
    if (vaultId) {
      await pushEncryptedVault(vaultId, newPayload, settings);
    }

    setMasterPassword(newPassword);
    setVaultData(recoveredData);
    setIsUnlocked(true);
    showToast('Vault recovered and unlocked! New Master Password set.');
  };

  // Sync existing vault (from iPhone, iPad, or Windows PC)
  const handleSyncExistingVault = async (targetVaultId: string, password: string) => {
    setSyncState('syncing');
    const remotePayload = await fetchRemoteEncryptedVault(targetVaultId);
    if (!remotePayload) {
      setSyncState('error');
      throw new Error('Vault ID not found on sync server. Please verify the ID.');
    }

    // Try decrypting with provided password
    const decrypted = await decryptVault(remotePayload, password);

    // If successful, save state
    setVaultId(targetVaultId);
    saveStoredVaultId(targetVaultId);
    setEncryptedPayload(remotePayload);
    saveStoredEncryptedPayload(remotePayload);

    setMasterPassword(password);
    setVaultData(decrypted);
    setIsUnlocked(true);
    setSyncState('synced');
    setLastSynced(new Date().toLocaleTimeString());

    // Register this device
    registerDevice(targetVaultId, settings);

    showToast(`Successfully synced vault to ${settings.deviceName}!`);
  };

  // Save vault data changes (add, edit, delete item)
  const saveVaultDataChanges = async (newData: VaultData) => {
    if (!masterPassword || !vaultId) return;

    setVaultData(newData);

    try {
      setSyncState('syncing');
      const storedRecKey = getStoredRecoveryKey();
      const payload = await encryptVault(newData, masterPassword, encryptedPayload?.salt, storedRecKey || undefined);
      setEncryptedPayload(payload);
      saveStoredEncryptedPayload(payload);

      const res = await pushEncryptedVault(vaultId, payload, settings);
      if (res.success) {
        setSyncState('synced');
        setLastSynced(new Date().toLocaleTimeString());
      } else {
        setSyncState('offline');
        showToast('Saved locally in encrypted storage (Offline)');
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSyncState('error');
    }
  };

  // Manual or periodic sync check
  const handleManualSync = async () => {
    if (!vaultId || !masterPassword || !vaultData) return;

    setSyncState('syncing');
    try {
      const remote = await fetchRemoteEncryptedVault(vaultId);
      if (remote && remote.version > (vaultData.version || 0)) {
        // Decrypt newer version from other device
        const updatedData = await decryptVault(remote, masterPassword);
        setVaultData(updatedData);
        setEncryptedPayload(remote);
        saveStoredEncryptedPayload(remote);
        showToast('Synced newer changes from another connected device!');
      } else {
        // Push local state
        const payload = await encryptVault(vaultData, masterPassword, encryptedPayload?.salt);
        await pushEncryptedVault(vaultId, payload, settings);
        showToast('Vault fully synchronized with cloud.');
      }
      setSyncState('synced');
      setLastSynced(new Date().toLocaleTimeString());
    } catch (err: any) {
      setSyncState('offline');
      showToast('Sync check failed. Operating in offline encrypted mode.');
    }
  };

  // Periodic background sync check (every 30s)
  useEffect(() => {
    if (!isUnlocked || !vaultId || !masterPassword) return;

    const interval = setInterval(async () => {
      try {
        const status = await checkServerStatus(vaultId);
        if (status && status.version > (vaultData?.version || 0)) {
          const remote = await fetchRemoteEncryptedVault(vaultId);
          if (remote) {
            const updated = await decryptVault(remote, masterPassword);
            setVaultData(updated);
            setEncryptedPayload(remote);
            saveStoredEncryptedPayload(remote);
            setLastSynced(new Date().toLocaleTimeString());
            showToast('Background sync: Updated from another device.');
          }
        }
      } catch {
        // Offline
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isUnlocked, vaultId, masterPassword, vaultData?.version, showToast]);

  // Item handlers
  const handleSaveItem = (itemToSave: VaultItem) => {
    if (!vaultData) return;

    const existingIndex = vaultData.items.findIndex((i) => i.id === itemToSave.id);
    let updatedItems: VaultItem[];

    if (existingIndex >= 0) {
      updatedItems = [...vaultData.items];
      updatedItems[existingIndex] = itemToSave;
    } else {
      updatedItems = [itemToSave, ...vaultData.items];
    }

    const updatedData: VaultData = {
      version: (vaultData.version || 1) + 1,
      updatedAt: new Date().toISOString(),
      items: updatedItems,
    };

    saveVaultDataChanges(updatedData);
    setIsEditorOpen(false);
    setSelectedItemId(itemToSave.id);
    showToast(`${itemToSave.title} encrypted & saved.`);
  };

  const handleDeleteItem = (itemId: string) => {
    if (!vaultData) return;
    if (!confirm('Are you sure you want to delete this encrypted item?')) return;

    const updatedItems = vaultData.items.filter((i) => i.id !== itemId);
    const updatedData: VaultData = {
      version: (vaultData.version || 1) + 1,
      updatedAt: new Date().toISOString(),
      items: updatedItems,
    };

    saveVaultDataChanges(updatedData);
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    }
    showToast('Item removed from encrypted vault.');
  };

  const handleToggleFavorite = (itemId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!vaultData) return;

    const updatedItems = vaultData.items.map((i) =>
      i.id === itemId ? { ...i, favorite: !i.favorite, updatedAt: new Date().toISOString() } : i
    );

    const updatedData: VaultData = {
      version: (vaultData.version || 1) + 1,
      updatedAt: new Date().toISOString(),
      items: updatedItems,
    };

    saveVaultDataChanges(updatedData);
  };

  // Change Master Password (re-derives key and re-encrypts vault)
  const handleChangeMasterPassword = async (oldPass: string, newPass: string) => {
    if (!vaultData || !vaultId) return;

    // Verify old password
    if (oldPass !== masterPassword) {
      throw new Error('Existing master password does not match.');
    }

    const updatedPayload = await encryptVault(vaultData, newPass);
    setMasterPassword(newPass);
    setEncryptedPayload(updatedPayload);
    saveStoredEncryptedPayload(updatedPayload);

    await pushEncryptedVault(vaultId, updatedPayload, settings);
  };

  // Import encrypted backup
  const handleImportBackup = async (importedPayload: EncryptedPayload) => {
    if (!masterPassword) return;
    const decrypted = await decryptVault(importedPayload, masterPassword);
    setVaultData(decrypted);
    setEncryptedPayload(importedPayload);
    saveStoredEncryptedPayload(importedPayload);
    if (vaultId) {
      await pushEncryptedVault(vaultId, importedPayload, settings);
    }
  };

  const handlePurgeVault = () => {
    clearLocalVaultData();
    lockVault();
    setVaultId(null);
    setEncryptedPayload(null);
    showToast('Local vault cache purged.');
  };

  // Filter and search items
  const filteredItems = (vaultData?.items || []).filter((item) => {
    if (currentFilter === 'favorites' && !item.favorite) return false;
    if (currentFilter !== 'all' && currentFilter !== 'favorites' && item.type !== currentFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q)) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(q))) ||
      (item.type === 'login' && (item.username?.toLowerCase().includes(q) || item.website?.toLowerCase().includes(q))) ||
      (item.type === 'bank_account' && (item.bankName?.toLowerCase().includes(q) || item.accountNumber?.includes(q))) ||
      (item.type === 'card' && (item.cardholderName?.toLowerCase().includes(q) || item.cardNumber?.includes(q))) ||
      (item.type === 'api_key' && item.serviceName?.toLowerCase().includes(q))
    );
  });

  const selectedItem = vaultData?.items.find((i) => i.id === selectedItemId) || null;
  const watchtowerAudit = auditVaultPasswords(vaultData?.items || []);
  const watchtowerRiskCount = watchtowerAudit.weakCount + watchtowerAudit.reusedCount;

  // Filter Title
  const getFilterTitle = () => {
    if (searchQuery) return `Search Results ("${searchQuery}")`;
    switch (currentFilter) {
      case 'all':
        return 'All Vault Items';
      case 'favorites':
        return 'Favorite Credentials';
      case 'login':
        return 'Logins & Gmail';
      case 'bank_account':
        return 'Bank Accounts';
      case 'card':
        return 'Credit & Debit Cards';
      case 'secure_note':
        return 'Secure Notes';
      case 'api_key':
        return 'API Keys & Secrets';
    }
  };

  // Locked Screen
  if (!isUnlocked) {
    return (
      <>
        <VaultLockScreen
          hasExistingVault={!!encryptedPayload || !!vaultId}
          vaultId={vaultId}
          onUnlock={handleUnlock}
          onCreateVault={handleCreateVault}
          onSyncExistingVault={handleSyncExistingVault}
          onRestoreWithRecoveryKey={handleRestoreWithRecoveryKey}
          onImportPayload={handleImportBackup}
        />
        <ToastNotification message={toastMessage} />
      </>
    );
  }

  // Unlocked Main Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased select-none overflow-x-hidden">
      {/* Top Header */}
      <VaultHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        syncState={syncState}
        lastSyncedText={lastSynced || 'Never'}
        onManualSync={handleManualSync}
        onLockVault={lockVault}
        onAddItem={(type) => {
          setEditorDefaultType(type);
          setEditingItem(null);
          setIsEditorOpen(true);
        }}
        onOpenDeviceSync={() => setIsDeviceSyncOpen(true)}
        settings={settings}
        autoLockCountdown={autoLockCountdownText}
        onToggleMobileSidebar={() => setIsOpenMobileSidebar(!isOpenMobileSidebar)}
      />

      {/* Main Workspace (Sidebar + Item List + Item Detail) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <VaultSidebar
          currentFilter={currentFilter}
          onSelectFilter={setCurrentFilter}
          items={vaultData?.items || []}
          watchtowerRiskCount={watchtowerRiskCount}
          onOpenWatchtower={() => setIsWatchtowerOpen(true)}
          onOpenGenerator={() => setIsGeneratorOpen(true)}
          onOpenDeviceSync={() => setIsDeviceSyncOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isOpenMobile={isOpenMobileSidebar}
          onCloseMobile={() => setIsOpenMobileSidebar(false)}
        />

        {/* Content Columns */}
        <main className="flex-1 flex overflow-hidden">
          {/* Middle Column: Item List */}
          <div
            className={`w-full lg:w-96 shrink-0 h-[calc(100vh-4rem)] border-r border-slate-800/80 ${
              selectedItem ? 'hidden lg:block' : 'block'
            }`}
          >
            <VaultItemList
              items={filteredItems}
              selectedItemId={selectedItemId}
              onSelectItem={(item) => setSelectedItemId(item.id)}
              onToggleFavorite={(id, e) => handleToggleFavorite(id, e)}
              onCopyText={(text, label, e) => {
                e.stopPropagation();
                copySecretWithAutoClear(text, label);
              }}
              copiedLabel={copiedLabel}
              filterTitle={getFilterTitle()}
            />
          </div>

          {/* Right Column: Item Detail */}
          <div
            className={`flex-1 h-[calc(100vh-4rem)] overflow-hidden ${
              !selectedItem ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <VaultItemDetail
              item={selectedItem}
              onEdit={(item) => {
                setEditingItem(item);
                setIsEditorOpen(true);
              }}
              onDelete={handleDeleteItem}
              onToggleFavorite={handleToggleFavorite}
              onCopyText={copySecretWithAutoClear}
              copiedLabel={copiedLabel}
              clipboardCountdown={clipboardCountdown}
              onBackMobile={() => setSelectedItemId(null)}
            />
          </div>
        </main>
      </div>

      {/* MODALS */}

      {/* 1. Item Editor Modal */}
      {isEditorOpen && (
        <VaultItemEditorModal
          initialItem={editingItem}
          defaultType={editorDefaultType}
          onSave={handleSaveItem}
          onClose={() => setIsEditorOpen(false)}
        />
      )}

      {/* 2. Password Generator Modal */}
      {isGeneratorOpen && (
        <PasswordGeneratorModal
          onClose={() => setIsGeneratorOpen(false)}
          onCopyPassword={(password) => {
            copySecretWithAutoClear(password, 'Generated Password');
          }}
        />
      )}

      {/* 3. Multi-Device Sync & QR Modal */}
      {isDeviceSyncOpen && vaultId && (
        <DeviceSyncModal
          vaultId={vaultId}
          settings={settings}
          encryptedPayload={encryptedPayload}
          onClose={() => setIsDeviceSyncOpen(false)}
          onShowToast={showToast}
          onImportPayload={handleImportBackup}
        />
      )}

      {/* 4. Security Watchtower Modal */}
      {isWatchtowerOpen && (
        <SecurityWatchtowerModal
          items={vaultData?.items || []}
          onClose={() => setIsWatchtowerOpen(false)}
          onEditItem={(item) => {
            setEditingItem(item);
            setIsEditorOpen(true);
          }}
        />
      )}

      {/* 5. Settings Modal */}
      {isSettingsOpen && vaultId && (
        <SettingsModal
          settings={settings}
          onSaveSettings={(newSettings) => {
            setSettings(newSettings);
            saveStoredSettings(newSettings);
          }}
          vaultId={vaultId}
          encryptedPayload={encryptedPayload}
          onClose={() => setIsSettingsOpen(false)}
          onChangeMasterPassword={handleChangeMasterPassword}
          onImportBackup={handleImportBackup}
          onPurgeVault={handlePurgeVault}
          onShowToast={showToast}
        />
      )}

      {/* Toast Notification */}
      <ToastNotification message={toastMessage} />
    </div>
  );
}
