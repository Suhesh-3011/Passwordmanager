import { EncryptedPayload, VaultData } from '../types';

const PBKDF2_ITERATIONS = 600000;
const AES_KEY_LENGTH = 256;

// Convert ArrayBuffer to Hex string
export function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex string to ArrayBuffer
export function hexToBuffer(hex: string): ArrayBuffer {
  const cleanHex = hex.replace(/\s+/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}

// Generate cryptographically random bytes
export function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return bytes;
}

// Derive AES-GCM encryption key from master password and salt using PBKDF2-HMAC-SHA256
export async function deriveKey(masterPassword: string, saltBuffer: ArrayBuffer): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// Generate Auth Challenge Hash to quickly verify password correctness
export async function generateAuthHash(masterPassword: string, saltBuffer: ArrayBuffer): Promise<string> {
  const enc = new TextEncoder();
  const authPayload = enc.encode(`${masterPassword}:::AEGIS_AUTH_VERIFIER:::${bufferToHex(saltBuffer)}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', authPayload);
  return bufferToHex(hashBuffer);
}

// Encrypt Vault Data using AES-GCM-256
export async function encryptVault(
  data: VaultData,
  masterPassword: string,
  existingSaltHex?: string
): Promise<EncryptedPayload> {
  const salt = existingSaltHex ? hexToBuffer(existingSaltHex) : getRandomBytes(32).buffer;
  const iv = getRandomBytes(12); // Standard 96-bit IV for AES-GCM

  const key = await deriveKey(masterPassword, salt);
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data));

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plaintext
  );

  const authChallengeHash = await generateAuthHash(masterPassword, salt);

  return {
    ciphertext: bufferToHex(ciphertextBuffer),
    iv: bufferToHex(iv.buffer),
    salt: bufferToHex(salt),
    authChallengeHash,
    version: data.version,
  };
}

// Decrypt Vault Data using AES-GCM-256
export async function decryptVault(
  payload: EncryptedPayload,
  masterPassword: string
): Promise<VaultData> {
  const salt = hexToBuffer(payload.salt);
  const iv = hexToBuffer(payload.iv);
  const ciphertext = hexToBuffer(payload.ciphertext);

  // Quick verification of auth challenge if present
  if (payload.authChallengeHash) {
    const computedAuth = await generateAuthHash(masterPassword, salt);
    if (computedAuth !== payload.authChallengeHash) {
      throw new Error('Incorrect Master Password. Decryption failed.');
    }
  }

  const key = await deriveKey(masterPassword, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    const jsonStr = dec.decode(decryptedBuffer);
    return JSON.parse(jsonStr) as VaultData;
  } catch (err) {
    throw new Error('Failed to decrypt vault. Either the master password is wrong or ciphertext is corrupted.');
  }
}

// Generate Emergency Recovery Key (formatted like AEGIS-XXXX-XXXX-XXXX-XXXX)
export function generateEmergencyRecoveryKey(): string {
  const bytes = getRandomBytes(16);
  const hex = bufferToHex(bytes.buffer).toUpperCase();
  return `AEGIS-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

// Calculate Password Entropy and crack time estimate
export function calculatePasswordEntropy(password: string): {
  bits: number;
  score: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
  color: string;
  crackTimeText: string;
} {
  if (!password) {
    return { bits: 0, score: 'very-weak', color: 'text-red-500', crackTimeText: 'Instant' };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33;

  const entropy = Math.round(password.length * Math.log2(Math.max(poolSize, 2)));

  // Crack time at 100 billion guesses per second (standard modern GPU cluster)
  const guesses = Math.pow(2, entropy);
  const seconds = guesses / 1e11;

  let crackTimeText = 'Instant';
  if (seconds < 1) crackTimeText = 'Under 1 second';
  else if (seconds < 60) crackTimeText = `${Math.round(seconds)} seconds`;
  else if (seconds < 3600) crackTimeText = `${Math.round(seconds / 60)} minutes`;
  else if (seconds < 86400) crackTimeText = `${Math.round(seconds / 3600)} hours`;
  else if (seconds < 31536000) crackTimeText = `${Math.round(seconds / 86400)} days`;
  else if (seconds < 31536000000) crackTimeText = `${Math.round(seconds / 31536000)} years`;
  else crackTimeText = 'Centuries+';

  let score: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong' = 'very-weak';
  let color = 'text-red-500';

  if (entropy < 35) {
    score = 'very-weak';
    color = 'text-red-500';
  } else if (entropy < 50) {
    score = 'weak';
    color = 'text-amber-500';
  } else if (entropy < 65) {
    score = 'fair';
    color = 'text-yellow-400';
  } else if (entropy < 80) {
    score = 'strong';
    color = 'text-emerald-400';
  } else {
    score = 'very-strong';
    color = 'text-cyan-400';
  }

  return { bits: entropy, score, color, crackTimeText };
}

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
}

const UPPERCASE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const UPPERCASE_ALL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijkmnopqrstuvwxyz';
const LOWERCASE_ALL = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '23456789';
const NUMBER_ALL = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// Generate cryptographically secure random password
export function generateSecurePassword(options: GeneratorOptions): string {
  let charPool = '';
  const requiredChars: string[] = [];

  const upper = options.excludeSimilar ? UPPERCASE_CHARS : UPPERCASE_ALL;
  const lower = options.excludeSimilar ? LOWERCASE_CHARS : LOWERCASE_ALL;
  const num = options.excludeSimilar ? NUMBER_CHARS : NUMBER_ALL;
  const sym = SYMBOL_CHARS;

  if (options.uppercase) {
    charPool += upper;
    requiredChars.push(upper[Math.floor(Math.random() * upper.length)]);
  }
  if (options.lowercase) {
    charPool += lower;
    requiredChars.push(lower[Math.floor(Math.random() * lower.length)]);
  }
  if (options.numbers) {
    charPool += num;
    requiredChars.push(num[Math.floor(Math.random() * num.length)]);
  }
  if (options.symbols) {
    charPool += sym;
    requiredChars.push(sym[Math.floor(Math.random() * sym.length)]);
  }

  if (charPool === '') {
    charPool = lower + num;
  }

  const randomValues = getRandomBytes(options.length);
  const result: string[] = [...requiredChars];

  for (let i = result.length; i < options.length; i++) {
    const idx = randomValues[i] % charPool.length;
    result.push(charPool[idx]);
  }

  // Shuffle array using Fisher-Yates with crypto random values
  const shuffleBytes = getRandomBytes(result.length);
  for (let i = result.length - 1; i > 0; i--) {
    const j = shuffleBytes[i] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

// Diceware Wordlist for secure passphrases
const PASSPHRASE_WORDS = [
  'aurora', 'beacon', 'canyon', 'delta', 'ember', 'falcon', 'glacier', 'horizon',
  'island', 'jupiter', 'knight', 'lagoon', 'monarch', 'nebula', 'ocean', 'prism',
  'quantum', 'radius', 'safari', 'timber', 'umbrella', 'vortex', 'whisper', 'xenon',
  'yellow', 'zenith', 'arcade', 'breeze', 'crypto', 'dynamic', 'echo', 'frost',
  'galaxy', 'harbor', 'impact', 'journey', 'kinetic', 'lunar', 'matrix', 'nova',
  'orbit', 'pulsar', 'quest', 'rocket', 'shield', 'titan', 'uranus', 'valley',
  'wave', 'apex', 'bold', 'crest', 'drift', 'flux', 'grove', 'haven', 'iron'
];

export function generatePassphrase(wordsCount = 4, separator = '-'): string {
  const selected: string[] = [];
  const randomBytes = getRandomBytes(wordsCount);

  for (let i = 0; i < wordsCount; i++) {
    const index = randomBytes[i] % PASSPHRASE_WORDS.length;
    selected.push(PASSPHRASE_WORDS[index]);
  }

  return selected.join(separator);
}
