import { EncryptedPayload, PairedDevice, VaultSettings } from '../types';
import { saveStoredEncryptedPayload, getStoredEncryptedPayload } from './storage';

export interface SyncStatus {
  state: 'synced' | 'air_gapped' | 'offline';
  lastSynced: string | null;
  remoteVersion: number;
  localVersion: number;
  message?: string;
}

const LOCAL_PAIRED_DEVICES_KEY = 'aegis_local_paired_devices';

// Air-gapped: Zero network requests are made. All payloads live in encrypted storage.
export async function checkServerStatus(vaultId: string): Promise<{ version: number; updatedAt: string; salt: string } | null> {
  const local = getStoredEncryptedPayload();
  if (local) {
    return {
      version: local.version,
      updatedAt: new Date().toISOString(),
      salt: local.salt,
    };
  }
  return null;
}

export async function fetchRemoteEncryptedVault(vaultId: string): Promise<EncryptedPayload | null> {
  // Option A: 100% offline & local
  return getStoredEncryptedPayload();
}

export async function pushEncryptedVault(
  vaultId: string,
  payload: EncryptedPayload,
  settings: VaultSettings
): Promise<{ success: boolean; version?: number; error?: string }> {
  // Option A: Pure local encrypted persistence with Zero Network leaks
  try {
    saveStoredEncryptedPayload(payload);
    registerDeviceLocally(vaultId, settings);
    return { success: true, version: payload.version };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function getPairedDevicesLocally(vaultId: string): PairedDevice[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_PAIRED_DEVICES_KEY}_${vaultId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function fetchPairedDevices(vaultId: string): Promise<PairedDevice[]> {
  return getPairedDevicesLocally(vaultId);
}

export function registerDeviceLocally(vaultId: string, settings: VaultSettings): boolean {
  try {
    const devices = getPairedDevicesLocally(vaultId);
    const existingIndex = devices.findIndex((d) => d.deviceName === settings.deviceName);

    const now = new Date().toISOString();
    const updatedDevice: PairedDevice = {
      id: existingIndex >= 0 ? devices[existingIndex].id : 'dev-' + Math.random().toString(36).substring(2, 8),
      deviceName: settings.deviceName,
      platform: settings.devicePlatform,
      lastActive: now,
      pairedAt: existingIndex >= 0 ? devices[existingIndex].pairedAt : now,
    };

    let updatedList: PairedDevice[];
    if (existingIndex >= 0) {
      updatedList = [...devices];
      updatedList[existingIndex] = updatedDevice;
    } else {
      updatedList = [updatedDevice, ...devices];
    }

    localStorage.setItem(`${LOCAL_PAIRED_DEVICES_KEY}_${vaultId}`, JSON.stringify(updatedList));
    return true;
  } catch {
    return false;
  }
}

export async function registerDevice(vaultId: string, settings: VaultSettings): Promise<boolean> {
  return registerDeviceLocally(vaultId, settings);
}

export async function unpairDevice(vaultId: string, deviceId: string): Promise<boolean> {
  try {
    const devices = getPairedDevicesLocally(vaultId);
    const filtered = devices.filter((d) => d.id !== deviceId);
    localStorage.setItem(`${LOCAL_PAIRED_DEVICES_KEY}_${vaultId}`, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}
