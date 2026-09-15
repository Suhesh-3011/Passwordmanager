import { EncryptedPayload, VaultSettings, VaultItem, ItemType } from '../types';

const STORAGE_VAULT_PAYLOAD = 'aegis_vault_encrypted_payload';
const STORAGE_VAULT_ID = 'aegis_vault_id';
const STORAGE_SETTINGS = 'aegis_settings';
const STORAGE_RECOVERY_KEY = 'aegis_recovery_key';

export function detectDevicePlatform(): VaultSettings['devicePlatform'] {
  const ua = navigator.userAgent;
  if (/iPad|Macintosh/i.test(ua) && 'ontouchend' in document) {
    return 'iPad';
  }
  if (/iPhone/i.test(ua)) {
    return 'iPhone';
  }
  if (/Windows/i.test(ua)) {
    return 'Windows';
  }
  if (/Mac/i.test(ua)) {
    return 'Mac';
  }
  if (/Android/i.test(ua)) {
    return 'Android';
  }
  return 'Web';
}

export function getDefaultDeviceName(): string {
  const platform = detectDevicePlatform();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  if (platform === 'Windows') return `Windows Laptop (${randomSuffix})`;
  if (platform === 'iPhone') return `iPhone (${randomSuffix})`;
  if (platform === 'iPad') return `iPad (${randomSuffix})`;
  return `${platform} Device (${randomSuffix})`;
}

export function getStoredVaultId(): string | null {
  return localStorage.getItem(STORAGE_VAULT_ID);
}

export function saveStoredVaultId(vaultId: string): void {
  localStorage.setItem(STORAGE_VAULT_ID, vaultId);
}

export function getStoredEncryptedPayload(): EncryptedPayload | null {
  const raw = localStorage.getItem(STORAGE_VAULT_PAYLOAD);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EncryptedPayload;
  } catch {
    return null;
  }
}

export function saveStoredEncryptedPayload(payload: EncryptedPayload): void {
  localStorage.setItem(STORAGE_VAULT_PAYLOAD, JSON.stringify(payload));
}

export function getStoredRecoveryKey(): string | null {
  return localStorage.getItem(STORAGE_RECOVERY_KEY);
}

export function saveStoredRecoveryKey(key: string): void {
  localStorage.setItem(STORAGE_RECOVERY_KEY, key);
}

export function getStoredSettings(): VaultSettings {
  const raw = localStorage.getItem(STORAGE_SETTINGS);
  const platform = detectDevicePlatform();
  const defaultSettings: VaultSettings = {
    autoLockMinutes: 5,
    clipboardClearSeconds: 30,
    deviceName: getDefaultDeviceName(),
    devicePlatform: platform,
    theme: 'dark',
  };

  if (!raw) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveStoredSettings(settings: VaultSettings): void {
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
}

export function clearLocalVaultData(): void {
  localStorage.removeItem(STORAGE_VAULT_PAYLOAD);
  localStorage.removeItem(STORAGE_VAULT_ID);
  localStorage.removeItem(STORAGE_RECOVERY_KEY);
}

// Initial starter seed items for brand new vault
export function generateStarterVaultItems(): VaultItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'seed-gmail',
      type: 'login',
      title: 'Google / Gmail (Personal)',
      username: 'suheshsen@gmail.com',
      password: 'Sample-Pass-ChangeMe-2026!',
      website: 'https://accounts.google.com',
      favorite: true,
      tags: ['Primary', 'Email'],
      createdAt: now,
      updatedAt: now,
      notes: 'Primary Gmail account. Syncs with phone and Windows laptop. 2FA enabled.',
    },
    {
      id: 'seed-bank',
      type: 'bank_account',
      title: 'Chase Premier Checking',
      bankName: 'JPMorgan Chase Bank',
      accountNumber: '••••••••4892',
      routingNumber: '021000021',
      accountType: 'Checking',
      pin: '••••',
      onlineBankingUrl: 'https://www.chase.com',
      currency: 'USD',
      favorite: true,
      tags: ['Banking', 'Daily'],
      createdAt: now,
      updatedAt: now,
      notes: 'Direct deposit active. Wire routing matches electronic routing.',
    },
    {
      id: 'seed-card',
      type: 'card',
      title: 'Chase Sapphire Preferred',
      cardholderName: 'SUHESH SEN',
      cardNumber: '4147••••••••8819',
      expiryMonth: '08',
      expiryYear: '29',
      cvv: '•••',
      cardBrand: 'Visa',
      billingZip: '94043',
      favorite: true,
      tags: ['Travel', 'Rewards'],
      createdAt: now,
      updatedAt: now,
      notes: 'Primary credit card for online purchases and flight bookings.',
    },
    {
      id: 'seed-note',
      type: 'secure_note',
      title: 'Emergency Passport & ID Vault',
      content: `US Passport Number: ••••••••
Issue Date: 2023-04-12
Global Entry PASSID: ••••••••
Emergency Home Wi-Fi Password: ••••••••••••`,
      category: 'Tax & ID',
      favorite: false,
      tags: ['Identity', 'Important'],
      createdAt: now,
      updatedAt: now,
      notes: 'Encrypted offline and synced across all devices.',
    }
  ];
}

// Download printable Emergency Recovery Kit
export function downloadEmergencyRecoveryKit(vaultId: string, recoveryKey: string, salt: string): void {
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AegisVault Emergency Recovery Kit</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 40px auto; padding: 24px; border: 2px solid #e2e8f0; border-radius: 12px; }
    h1 { color: #0f172a; margin-bottom: 4px; display: flex; align-items: center; gap: 10px; }
    .badge { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px; text-transform: uppercase; margin-bottom: 16px; }
    .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin: 20px 0; font-family: monospace; font-size: 15px; word-break: break-all; }
    .label { font-weight: bold; color: #475569; font-size: 13px; text-transform: uppercase; margin-bottom: 4px; }
    .value { font-size: 16px; color: #0f172a; font-weight: 600; }
    .instructions { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 18px; margin: 20px 0; font-size: 14px; }
    .footer { font-size: 12px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="badge">CONFIDENTIAL &bull; STORE SECURELY OFFLINE</div>
  <h1>🛡️ AegisVault Emergency Kit</h1>
  <p>This document contains vital cryptographic recovery information for your zero-knowledge password vault. Print this page or store it in a physical safe.</p>

  <div class="box">
    <div class="label">Vault Identifier (Sync ID)</div>
    <div class="value">${vaultId}</div>
  </div>

  <div class="box">
    <div class="label">Emergency Recovery Key</div>
    <div class="value" style="color: #dc2626; font-size: 18px;">${recoveryKey}</div>
  </div>

  <div class="box">
    <div class="label">Cryptographic Salt (PBKDF2-HMAC-SHA256)</div>
    <div class="value" style="font-size: 13px;">${salt}</div>
  </div>

  <div class="instructions">
    <strong>How to recover on iPhone, iPad, or Windows PC:</strong>
    <ol>
      <li>Open your AegisVault application URL on any device.</li>
      <li>Click <strong>"Sync Existing Vault"</strong> or <strong>"Recovery Key Restore"</strong>.</li>
      <li>Paste your Vault Identifier and enter your Master Password or Recovery Key.</li>
      <li>Your encrypted database will immediately sync and decrypt securely in your device's memory.</li>
    </ol>
  </div>

  <div class="footer">
    Generated on ${new Date().toLocaleString()} &bull; End-to-End Encrypted with AES-GCM-256 &bull; Zero-Knowledge Architecture
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AegisVault-Emergency-Kit-${vaultId.slice(0, 8)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download raw encrypted backup (.encvault file)
export function downloadEncryptedBackup(vaultId: string, payload: EncryptedPayload): void {
  const backupData = {
    app: 'AegisVault',
    version: payload.version,
    exportedAt: new Date().toISOString(),
    vaultId,
    payload,
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AegisVault-Encrypted-Backup-${new Date().toISOString().slice(0, 10)}.encvault`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Option A: Encode encrypted payload to safe ASCII Armor for direct offline copy-pasting
export function encodeVaultPayloadToArmoredString(payload: EncryptedPayload): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return `-----BEGIN AEGISVAULT ENCRYPTED PAYLOAD-----\n${b64}\n-----END AEGISVAULT ENCRYPTED PAYLOAD-----`;
}

// Option A: Decode ASCII Armor back to EncryptedPayload
export function decodeVaultPayloadFromArmoredString(armored: string): EncryptedPayload {
  const cleaned = armored
    .replace(/-----BEGIN AEGISVAULT ENCRYPTED PAYLOAD-----/g, '')
    .replace(/-----END AEGISVAULT ENCRYPTED PAYLOAD-----/g, '')
    .replace(/\s+/g, '');
  const json = decodeURIComponent(escape(atob(cleaned)));
  const parsed = JSON.parse(json);
  if (!parsed.ciphertext || !parsed.iv || !parsed.salt) {
    throw new Error('Invalid or corrupted encrypted payload.');
  }
  return parsed as EncryptedPayload;
}

// Option A: Offline Client-Side URL Hash Transfer (#vault=...)
// The URL fragment hash is NEVER transmitted to any server in HTTP requests (RFC 3986).
export function generateOfflineHashLink(payload: EncryptedPayload): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  const base = window.location.origin + window.location.pathname;
  return `${base}#vault=${b64}`;
}

export function readOfflineHashPayload(): EncryptedPayload | null {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.includes('#vault=')) return null;
    const b64 = hash.replace('#vault=', '');
    const json = decodeURIComponent(escape(atob(b64)));
    const parsed = JSON.parse(json);
    if (parsed.ciphertext && parsed.iv && parsed.salt) {
      return parsed as EncryptedPayload;
    }
  } catch (err) {
    console.warn('Could not parse hash payload:', err);
  }
  return null;
}

