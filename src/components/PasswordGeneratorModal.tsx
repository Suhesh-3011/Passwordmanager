import React, { useState, useEffect } from 'react';
import { 
  X, Copy, Check, RefreshCw, Sparkles, Shield, Sliders, KeyRound, CheckSquare, Square
} from 'lucide-react';
import { 
  generateSecurePassword, generatePassphrase, calculatePasswordEntropy, GeneratorOptions 
} from '../services/crypto';

interface PasswordGeneratorModalProps {
  onClose: () => void;
  onCopyPassword: (password: string) => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  onClose,
  onCopyPassword,
}) => {
  const [mode, setMode] = useState<'chars' | 'passphrase'>('chars');
  const [length, setLength] = useState(20);
  const [wordCount, setWordCount] = useState(4);
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeSimilar: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    if (mode === 'chars') {
      const pass = generateSecurePassword({ ...options, length });
      setGeneratedPassword(pass);
    } else {
      const phrase = generatePassphrase(wordCount, '-');
      setGeneratedPassword(phrase);
    }
    setCopied(false);
  };

  useEffect(() => {
    generate();
  }, [mode, length, wordCount, options]);

  const entropy = calculatePasswordEntropy(generatedPassword);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    onCopyPassword(generatedPassword);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cryptographic Password Generator</h3>
              <p className="text-[11px] text-slate-400">
                Generated locally using window.crypto.getRandomValues
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

        {/* Mode Selector */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('chars')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'chars' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            Random Characters
          </button>
          <button
            type="button"
            onClick={() => setMode('passphrase')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'passphrase' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-white'
            }`}
          >
            Diceware Passphrase
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Result Display Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="font-mono text-sm sm:text-base font-bold text-emerald-400 select-text break-all">
                {generatedPassword}
              </div>
              <button
                type="button"
                onClick={generate}
                title="Regenerate"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
              >
                <RefreshCw className="w-4 h-4 hover:rotate-180 transition-transform duration-300" />
              </button>
            </div>

            {/* Entropy and crack estimation */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Entropy: {entropy.bits} bits</span>
              <span className={`font-semibold font-mono ${entropy.color}`}>
                {entropy.score.toUpperCase()} &bull; Est: {entropy.crackTimeText}
              </span>
            </div>
          </div>

          {/* Controls */}
          {mode === 'chars' ? (
            <div className="space-y-4">
              {/* Length Slider */}
              <div>
                <div className="flex justify-between items-center text-xs text-slate-300 mb-1.5 font-medium">
                  <span>Password Length</span>
                  <span className="font-mono font-bold text-emerald-400">{length} characters</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={64}
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Character Rules Checkboxes */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.uppercase}
                    onChange={(e) => setOptions({ ...options, uppercase: e.target.checked })}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Uppercase (A-Z)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.lowercase}
                    onChange={(e) => setOptions({ ...options, lowercase: e.target.checked })}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Lowercase (a-z)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.numbers}
                    onChange={(e) => setOptions({ ...options, numbers: e.target.checked })}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Numbers (0-9)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.symbols}
                    onChange={(e) => setOptions({ ...options, symbols: e.target.checked })}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Symbols (!@#$%)</span>
                </label>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={options.excludeSimilar}
                  onChange={(e) => setOptions({ ...options, excludeSimilar: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Avoid ambiguous characters (e.g. 0, O, 1, l, I)</span>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs text-slate-300 mb-1.5 font-medium">
                  <span>Number of Words</span>
                  <span className="font-mono font-bold text-emerald-400">{wordCount} words</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={8}
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Diceware passphrases combine cryptographically random dictionary words. They are easy to memorize yet mathematically impossible for brute-force attacks.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Password'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
