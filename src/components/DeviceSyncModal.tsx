import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, Smartphone, Laptop, Tablet, Copy, Check, QrCode, ShieldCheck,
  RefreshCw, Download, Upload, FileCode, CheckCircle2, ShieldAlert,
  ArrowRight, Share2, Info, Eye, EyeOff
} from 'lucide-react';
import { PairedDevice, VaultSettings, EncryptedPayload } from '../types';
import { 
  downloadEncryptedBackup, encodeVaultPayloadToArmoredString, 
  decodeVaultPayloadFromArmoredString, generateOfflineHashLink 
} from '../services/storage';
import { fetchPairedDevices, unpairDevice } from '../services/syncService';

interface DeviceSyncModalProps {
  vaultId: string;
  settings: VaultSettings;
  encryptedPayload: EncryptedPayload | null;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onImportPayload: (payload: EncryptedPayload) => void;
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({
  vaultId,
  settings,
  encryptedPayload,
  onClose,
  onShowToast,
  onImportPayload,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'file' | 'armor' | 'devices'>('qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedArmor, setCopiedArmor] = useState(false);
  const [armorInput, setArmorInput] = useState('');
  const [armorError, setArmorError] = useState<string | null>(null);

  // Generate offline client-side hash link (#vault=...)
  // RFC 3986: The fragment identifier (#) is processed entirely by the client and is NEVER sent over HTTP/HTTPS to any server.
  const offlineHashUrl = encryptedPayload ? generateOfflineHashLink(encryptedPayload) : window.location.href;
  const armoredText = encryptedPayload ? encodeVaultPayloadToArmoredString(encryptedPayload) : '';

  useEffect(() => {
    if (!offlineHashUrl) return;

    // Generate high-density QR code
    QRCode.toDataURL(offlineHashUrl, {
      width: 260,
      margin: 2,
      errorCorrectionLevel: 'L',
      color: {
        dark: '#020617', // slate-950
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => {
        // If payload is large, generate QR code with just the base URL and instruct to use file transfer
        QRCode.toDataURL(window.location.origin + window.location.pathname, {
          width: 260,
          margin: 2,
          color: { dark: '#020617', light: '#ffffff' },
        }).then(setQrDataUrl);
      });

    loadDevices();
  }, [offlineHashUrl, vaultId]);

  const loadDevices = async () => {
    const list = await fetchPairedDevices(vaultId);
    setDevices(list);
  };

  const handleCopyOfflineLink = () => {
    navigator.clipboard.writeText(offlineHashUrl);
    setCopiedLink(true);
    onShowToast('Client-side offline link copied! (Uses URL hash # so 0 bytes touch any server).');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyArmor = () => {
    navigator.clipboard.writeText(armoredText);
    setCopiedArmor(true);
    onShowToast('Encrypted armor text copied to clipboard.');
    setTimeout(() => setCopiedArmor(false), 2500);
  };

  const handleImportArmor = () => {
    setArmorError(null);
    try {
      if (!armorInput.trim()) {
        setArmorError('Please paste an armored payload block.');
        return;
      }
      const parsed = decodeVaultPayloadFromArmoredString(armorInput);
      onImportPayload(parsed);
      onShowToast('Encrypted vault imported successfully! Enter master password to unlock.');
      onClose();
    } catch (err: any) {
      setArmorError(err.message || 'Corrupted or invalid encrypted armor.');
    }
  };

  const handleExportFile = () => {
    if (!encryptedPayload) return;
    downloadEncryptedBackup(vaultId, encryptedPayload);
    onShowToast('Encrypted backup (.encvault) downloaded. Safe to AirDrop or transfer via USB.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const payloadToImport = parsed.payload || parsed;
        if (!payloadToImport.ciphertext || !payloadToImport.iv || !payloadToImport.salt) {
          throw new Error('Invalid .encvault format');
        }
        onImportPayload(payloadToImport);
        onShowToast('Vault file imported! Enter Master Password to decrypt.');
        onClose();
      } catch (err: any) {
        alert('Failed to import: ' + (err.message || 'Corrupted file'));
      }
    };
    reader.readAsText(file);
  };

  const handleUnpairDevice = async (deviceId: string) => {
    const success = await unpairDevice(vaultId, deviceId);
    if (success) {
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      onShowToast('Device record removed.');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'iphone':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'ipad':
        return <Tablet className="w-4 h-4 text-cyan-400" />;
      case 'windows':
      case 'mac':
      default:
        return <Laptop className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm select-none">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Air-Gapped Multi-Device Sync
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold tracking-wider uppercase">
                  Zero Leaks &bull; No Server
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Peer-to-peer transfer across phone, iPad, and Windows laptop without touching the internet
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 text-xs px-5 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Air-Gapped QR Scan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>AirDrop / File Transfer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('armor')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'armor'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Encrypted Text (Armor)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('devices')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'devices'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Setup Guides</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: QR CODE DIRECT SCAN */}
          {activeTab === 'qr' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-white block">
                    Zero-Network Optical Transfer
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    This QR code encodes your encrypted vault inside the URL fragment (<code className="text-emerald-400 font-mono">#vault=...</code>). 
                    Under the official HTTP/HTTPS specification, the URL hash is <strong>never transmitted to any web server</strong>. 
                    Your phone’s camera reads it directly from your screen with 100% air-gapped privacy.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="bg-white p-3 rounded-xl shadow-xl shrink-0">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Air-Gapped QR Code" className="w-48 h-48 rounded" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-3 max-w-xs text-left">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider block">
                    Instructions:
                  </span>
                  <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open <strong>Camera</strong> on your iPhone or iPad.</li>
                    <li>Point camera at the QR code on your laptop screen.</li>
                    <li>Tap the notification to open AegisVault in Safari.</li>
                    <li>Enter your <strong>Master Password</strong> to decrypt and save locally on that device!</li>
                  </ol>

                  <button
                    type="button"
                    onClick={handleCopyOfflineLink}
                    className="w-full mt-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Hash Link Copied!' : 'Copy Hash Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AIRDROP / LOCAL FILE TRANSFER */}
          {activeTab === 'file' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  Physical / AirDrop File Transfer (Most Reliable for Large Vaults)
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Export an encrypted <code className="text-emerald-400 font-mono">.encvault</code> file from your laptop. You can safely send it via Apple AirDrop, local Wi-Fi share, or USB drive to your iPad or iPhone. Even if intercepted, the file is completely indecipherable without your master password.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                      <Download className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-white">1. Export Encrypted Vault</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Generates a self-contained ciphertext file ready to transfer to your other devices.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportFile}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download .encvault</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-white">2. Import on Receiver Device</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Select the .encvault file on your phone, iPad, or laptop to load it into local storage.
                    </p>
                  </div>
                  <label className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Select File to Import</span>
                    <input
                      type="file"
                      accept=".encvault,.json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENCRYPTED TEXT ARMOR */}
          {activeTab === 'armor' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">
                  Export Encrypted Armor Block
                </span>
                <p className="text-[11px] text-slate-400">
                  Copy this encrypted ASCII text block to send to yourself via Signal, Notes, or AirDrop:
                </p>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  value={armoredText}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-emerald-400 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyArmor}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center gap-1.5 border border-slate-700"
                >
                  {copiedArmor ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedArmor ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white block">
                  Paste Armored Text to Import
                </span>
                {armorError && (
                  <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs">
                    {armorError}
                  </div>
                )}
                <textarea
                  value={armorInput}
                  onChange={(e) => setArmorInput(e.target.value)}
                  placeholder="Paste -----BEGIN AEGISVAULT ENCRYPTED PAYLOAD----- ... block here"
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleImportArmor}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                  >
                    Import Encrypted Armor
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PLATFORM SETUP GUIDES */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Offline PWA Installation (Airplane-Mode Ready)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* iPhone */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-xs text-white">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>iPhone</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    1. Open your GitHub Pages link in <strong>Safari</strong>.<br />
                    2. Tap the <strong>Share</strong> button.<br />
                    3. Tap <strong>"Add to Home Screen"</strong>.<br />
                    4. Works 100% offline, opening full-screen just like a native iOS app.
                  </p>
                </div>

                {/* iPad */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-xs text-white">
                    <Tablet className="w-4 h-4 text-cyan-400" />
                    <span>iPad</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    1. Open link in <strong>Safari</strong> on your iPad.<br />
                    2. Tap <strong>Share &rarr; Add to Home Screen</strong>.<br />
                    3. Enjoy the widescreen split-view layout for fast password lookup.
                  </p>
                </div>

                {/* Windows Laptop */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-xs text-white">
                    <Laptop className="w-4 h-4 text-amber-400" />
                    <span>Windows Laptop</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    1. Open link in <strong>Chrome</strong> or <strong>Edge</strong>.<br />
                    2. Click the <strong>Install</strong> icon in the address bar.<br />
                    3. AegisVault will run as a dedicated desktop program on Windows.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            100% Local Storage &bull; No Server Network Calls
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
