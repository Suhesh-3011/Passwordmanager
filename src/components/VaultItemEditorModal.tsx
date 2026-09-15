import React, { useState } from 'react';
import { 
  X, Key, Building2, CreditCard, FileText, Code2, Sparkles, Eye, EyeOff,
  Check, Shield
} from 'lucide-react';
import { ItemType, VaultItem, LoginItem, BankAccountItem, CardItem, SecureNoteItem, ApiKeyItem } from '../types';
import { calculatePasswordEntropy, generateSecurePassword } from '../services/crypto';

interface VaultItemEditorModalProps {
  initialItem?: VaultItem | null;
  defaultType?: ItemType;
  onSave: (item: VaultItem) => void;
  onClose: () => void;
}

export const VaultItemEditorModal: React.FC<VaultItemEditorModalProps> = ({
  initialItem,
  defaultType = 'login',
  onSave,
  onClose,
}) => {
  const [type, setType] = useState<ItemType>(initialItem?.type || defaultType);
  const [title, setTitle] = useState(initialItem?.title || '');
  const [notes, setNotes] = useState(initialItem?.notes || '');
  const [tagsInput, setTagsInput] = useState(initialItem?.tags?.join(', ') || '');
  const [favorite, setFavorite] = useState(initialItem?.favorite || false);

  // Login fields
  const [username, setUsername] = useState((initialItem as LoginItem)?.username || '');
  const [password, setPassword] = useState((initialItem as LoginItem)?.password || '');
  const [website, setWebsite] = useState((initialItem as LoginItem)?.website || '');
  const [showPassword, setShowPassword] = useState(false);

  // Bank fields
  const [bankName, setBankName] = useState((initialItem as BankAccountItem)?.bankName || '');
  const [accountNumber, setAccountNumber] = useState((initialItem as BankAccountItem)?.accountNumber || '');
  const [routingNumber, setRoutingNumber] = useState((initialItem as BankAccountItem)?.routingNumber || '');
  const [accountType, setAccountType] = useState<BankAccountItem['accountType']>((initialItem as BankAccountItem)?.accountType || 'Checking');
  const [bankPin, setBankPin] = useState((initialItem as BankAccountItem)?.pin || '');
  const [swiftBic, setSwiftBic] = useState((initialItem as BankAccountItem)?.swiftBic || '');
  const [onlineBankingUrl, setOnlineBankingUrl] = useState((initialItem as BankAccountItem)?.onlineBankingUrl || '');

  // Card fields
  const [cardholderName, setCardholderName] = useState((initialItem as CardItem)?.cardholderName || '');
  const [cardNumber, setCardNumber] = useState((initialItem as CardItem)?.cardNumber || '');
  const [expiryMonth, setExpiryMonth] = useState((initialItem as CardItem)?.expiryMonth || '');
  const [expiryYear, setExpiryYear] = useState((initialItem as CardItem)?.expiryYear || '');
  const [cvv, setCvv] = useState((initialItem as CardItem)?.cvv || '');
  const [cardBrand, setCardBrand] = useState<CardItem['cardBrand']>((initialItem as CardItem)?.cardBrand || 'Visa');
  const [cardPin, setCardPin] = useState((initialItem as CardItem)?.pin || '');
  const [billingZip, setBillingZip] = useState((initialItem as CardItem)?.billingZip || '');

  // Note fields
  const [noteContent, setNoteContent] = useState((initialItem as SecureNoteItem)?.content || '');
  const [noteCategory, setNoteCategory] = useState<SecureNoteItem['category']>((initialItem as SecureNoteItem)?.category || 'General');

  // API fields
  const [serviceName, setServiceName] = useState((initialItem as ApiKeyItem)?.serviceName || '');
  const [apiKey, setApiKey] = useState((initialItem as ApiKeyItem)?.apiKey || '');
  const [apiSecret, setApiSecret] = useState((initialItem as ApiKeyItem)?.apiSecret || '');
  const [endpointUrl, setEndpointUrl] = useState((initialItem as ApiKeyItem)?.endpointUrl || '');

  const isEditing = !!initialItem;
  const entropy = type === 'login' ? calculatePasswordEntropy(password) : null;

  const handleGeneratePassword = () => {
    const newPass = generateSecurePassword({
      length: 20,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeSimilar: true,
    });
    setPassword(newPass);
    setShowPassword(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const now = new Date().toISOString();
    const id = initialItem?.id || 'item_' + Math.random().toString(36).substring(2, 10);
    const createdAt = initialItem?.createdAt || now;

    let savedItem: VaultItem;

    switch (type) {
      case 'login':
        savedItem = {
          id,
          type: 'login',
          title: title.trim(),
          favorite,
          tags,
          createdAt,
          updatedAt: now,
          notes: notes.trim(),
          username: username.trim(),
          password,
          website: website.trim(),
          lastPasswordChange: now,
        };
        break;
      case 'bank_account':
        savedItem = {
          id,
          type: 'bank_account',
          title: title.trim(),
          favorite,
          tags,
          createdAt,
          updatedAt: now,
          notes: notes.trim(),
          bankName: bankName.trim() || title.trim(),
          accountNumber: accountNumber.trim(),
          routingNumber: routingNumber.trim(),
          accountType,
          pin: bankPin.trim(),
          swiftBic: swiftBic.trim(),
          onlineBankingUrl: onlineBankingUrl.trim(),
        };
        break;
      case 'card':
        savedItem = {
          id,
          type: 'card',
          title: title.trim(),
          favorite,
          tags,
          createdAt,
          updatedAt: now,
          notes: notes.trim(),
          cardholderName: cardholderName.trim(),
          cardNumber: cardNumber.trim(),
          expiryMonth: expiryMonth.trim(),
          expiryYear: expiryYear.trim(),
          cvv: cvv.trim(),
          cardBrand,
          pin: cardPin.trim(),
          billingZip: billingZip.trim(),
        };
        break;
      case 'secure_note':
        savedItem = {
          id,
          type: 'secure_note',
          title: title.trim(),
          favorite,
          tags,
          createdAt,
          updatedAt: now,
          notes: notes.trim(),
          content: noteContent,
          category: noteCategory,
        };
        break;
      case 'api_key':
        savedItem = {
          id,
          type: 'api_key',
          title: title.trim(),
          favorite,
          tags,
          createdAt,
          updatedAt: now,
          notes: notes.trim(),
          serviceName: serviceName.trim() || title.trim(),
          apiKey: apiKey.trim(),
          apiSecret: apiSecret.trim(),
          endpointUrl: endpointUrl.trim(),
        };
        break;
    }

    onSave(savedItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isEditing ? 'Edit Item' : 'New Vault Item'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Encrypted end-to-end with AES-GCM before saving
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

        {/* Type Selector (if not editing) */}
        {!isEditing && (
          <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setType('login')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                type === 'login' ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" /> Login
            </button>
            <button
              type="button"
              onClick={() => setType('bank_account')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                type === 'bank_account' ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Bank Account
            </button>
            <button
              type="button"
              onClick={() => setType('card')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                type === 'card' ? 'bg-slate-800 text-amber-400 border border-slate-700' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" /> Card
            </button>
            <button
              type="button"
              onClick={() => setType('secure_note')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                type === 'secure_note' ? 'bg-slate-800 text-purple-400 border border-slate-700' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Note
            </button>
            <button
              type="button"
              onClick={() => setType('api_key')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                type === 'api_key' ? 'bg-slate-800 text-rose-400 border border-slate-700' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> API Key
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Item Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Title <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'login'
                  ? 'e.g. Gmail - Personal, Netflix, GitHub'
                  : type === 'bank_account'
                  ? 'e.g. Chase Premier Checking, BoA Savings'
                  : type === 'card'
                  ? 'e.g. Chase Sapphire Preferred'
                  : type === 'secure_note'
                  ? 'e.g. Passport details, Wi-Fi keys'
                  : 'e.g. OpenAI API Key'
              }
              required
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* TYPE: LOGIN */}
          {type === 'login' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Username / Email
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. suheshsen@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Password <span className="text-emerald-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generate Strong
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter or generate password"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 pr-10 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Entropy & Strength Bar */}
                {password && entropy && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Strength: {entropy.score.toUpperCase()}</span>
                      <span className={entropy.color}>
                        {entropy.bits} bits &bull; {entropy.crackTimeText}
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
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Website URL
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://accounts.google.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          {/* TYPE: BANK ACCOUNT */}
          {type === 'bank_account' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Bank Institution
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. JPMorgan Chase"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                    <option value="Business">Business</option>
                    <option value="Investment">Investment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Account Number <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account number"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Routing Number (ABA)
                  </label>
                  <input
                    type="text"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="9-digit routing"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Account / ATM PIN
                  </label>
                  <input
                    type="password"
                    value={bankPin}
                    onChange={(e) => setBankPin(e.target.value)}
                    placeholder="4-6 digit PIN"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    SWIFT / BIC
                  </label>
                  <input
                    type="text"
                    value={swiftBic}
                    onChange={(e) => setSwiftBic(e.target.value)}
                    placeholder="CHASUS33"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Online Banking Portal
                  </label>
                  <input
                    type="text"
                    value={onlineBankingUrl}
                    onChange={(e) => setOnlineBankingUrl(e.target.value)}
                    placeholder="https://www.chase.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* TYPE: CARD */}
          {type === 'card' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="NAME AS PRINTED ON CARD"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Card Number <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4147 0000 0000 0000"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Brand
                  </label>
                  <select
                    value={cardBrand}
                    onChange={(e) => setCardBrand(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Amex">Amex</option>
                    <option value="Discover">Discover</option>
                    <option value="Debit">Debit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Exp. Month
                  </label>
                  <input
                    type="text"
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value)}
                    placeholder="MM (e.g. 08)"
                    maxLength={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono text-center placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Exp. Year
                  </label>
                  <input
                    type="text"
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value)}
                    placeholder="YY (e.g. 29)"
                    maxLength={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono text-center placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    CVV / CVC
                  </label>
                  <input
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="3-4 digits"
                    maxLength={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono text-center placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Card PIN
                  </label>
                  <input
                    type="password"
                    value={cardPin}
                    onChange={(e) => setCardPin(e.target.value)}
                    placeholder="ATM PIN"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Billing ZIP
                  </label>
                  <input
                    type="text"
                    value={billingZip}
                    onChange={(e) => setBillingZip(e.target.value)}
                    placeholder="Postal / ZIP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* TYPE: SECURE NOTE */}
          {type === 'secure_note' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Note Category
                </label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="General">General Confidential</option>
                  <option value="Tax & ID">Tax & ID / Passport</option>
                  <option value="Wi-Fi">Wi-Fi & Network Keys</option>
                  <option value="Recovery Keys">Emergency Recovery Keys</option>
                  <option value="Personal">Personal Records</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Note Content <span className="text-purple-400">*</span>
                </label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Enter private notes, recovery codes, or sensitive instructions..."
                  rows={6}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </>
          )}

          {/* TYPE: API KEY */}
          {type === 'api_key' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Service / API Provider
                </label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. OpenAI, AWS, Stripe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  API Key <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="pk_live_..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  API Secret
                </label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="sk_live_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Endpoint URL
                </label>
                <input
                  type="text"
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  placeholder="https://api.example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </>
          )}

          {/* Common fields: Notes and Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional private reminders or notes..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Finance, Work, Email"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
            <div className="pt-5 flex items-center gap-2">
              <input
                id="fav-chk"
                type="checkbox"
                checked={favorite}
                onChange={(e) => setFavorite(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="fav-chk" className="text-xs text-slate-300 cursor-pointer">
                Mark as Favorite
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Encrypt & Save'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
