export type ItemType = 'login' | 'bank_account' | 'card' | 'secure_note' | 'api_key';

export interface BaseVaultItem {
  id: string;
  type: ItemType;
  title: string;
  favorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface LoginItem extends BaseVaultItem {
  type: 'login';
  username: string;
  password: string;
  website?: string;
  totpSecret?: string;
  lastPasswordChange?: string;
}

export interface BankAccountItem extends BaseVaultItem {
  type: 'bank_account';
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  accountType: 'Checking' | 'Savings' | 'Business' | 'Investment' | 'Other';
  pin?: string;
  swiftBic?: string;
  onlineBankingUrl?: string;
  currency?: string;
}

export interface CardItem extends BaseVaultItem {
  type: 'card';
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  pin?: string;
  cardBrand: 'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'Debit' | 'Other';
  billingZip?: string;
}

export interface SecureNoteItem extends BaseVaultItem {
  type: 'secure_note';
  content: string;
  category?: 'Tax & ID' | 'Wi-Fi' | 'Personal' | 'Recovery Keys' | 'General';
}

export interface ApiKeyItem extends BaseVaultItem {
  type: 'api_key';
  serviceName: string;
  apiKey: string;
  apiSecret?: string;
  endpointUrl?: string;
}

export type VaultItem = LoginItem | BankAccountItem | CardItem | SecureNoteItem | ApiKeyItem;

export interface VaultData {
  version: number;
  updatedAt: string;
  items: VaultItem[];
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  salt: string;
  authChallengeHash: string;
  version: number;
}

export interface PairedDevice {
  id: string;
  vaultId?: string;
  deviceName: string;
  platform: string;
  lastActive: string;
  pairedAt?: string;
  ipHint?: string;
  isCurrent?: boolean;
}

export interface VaultSettings {
  autoLockMinutes: number; // e.g. 5, 15, 30, 0 for never
  clipboardClearSeconds: number; // 15, 30, 60
  deviceName: string;
  devicePlatform: 'Windows' | 'iPhone' | 'iPad' | 'Mac' | 'Android' | 'Web';
  theme: 'dark';
}

export interface PasswordAuditResult {
  score: number; // 0 to 100
  totalPasswords: number;
  weakCount: number;
  reusedCount: number;
  oldPasswordCount: number; // > 90 days
  weakItems: VaultItem[];
  reusedItems: { password: string; items: VaultItem[] }[];
  oldItems: VaultItem[];
}
