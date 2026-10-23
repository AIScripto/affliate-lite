import React, { useState } from 'react';
import { X, UserPlus, Phone, Mail, User as UserIcon, Percent, Key, AlertCircle } from 'lucide-react';
import { createSubAffiliate } from '../../services/api';
import { User } from '../../types';

interface CreateSubAffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUser: User) => void;
}

export const CreateSubAffiliateModal: React.FC<CreateSubAffiliateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [refCode, setRefCode] = useState('');
  const [splitPct, setSplitPct] = useState('60.00');
  const [status, setStatus] = useState<'active' | 'inactive'>('inactive'); // Defaults to Inactive as requested
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-suggest ref_code when typing first name if user hasn't explicitly customized it
  const handleFirstNameChange = (val: string) => {
    setFirstName(val);
    if (!refCode || refCode.startsWith('sub_')) {
      const clean = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean) {
        setRefCode(`sub_${clean}_${Math.floor(10 + Math.random() * 89)}`);
      } else {
        setRefCode('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await createSubAffiliate({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        mobile_number: mobileNumber.trim(),
        email: email.trim().toLowerCase(),
        ref_code: refCode.trim() || undefined,
        split_pct: parseFloat(splitPct || '60.00'),
        status,
      });

      onSuccess(res.user);
      onClose();
      // Reset form
      setFirstName('');
      setLastName('');
      setMobileNumber('');
      setEmail('');
      setRefCode('');
      setSplitPct('60.00');
      setStatus('inactive');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="panel-3d relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Register Sub-Affiliate</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add partner profile, mobile, commission split &amp; status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => handleFirstNameChange(e.target.value)}
                placeholder="e.g. Marcus"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Vance"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Email & Mobile Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marcus@creator.io"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-500" />
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="+1 (555) 234-5678"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Ref Code & Split Pct */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-500" />
                Tracking Ref Code (?ref=)
              </label>
              <input
                type="text"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                placeholder="sub_marcus_01"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-emerald-600 dark:text-emerald-400 font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-indigo-500" />
                Agreed Split (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={splitPct}
                onChange={(e) => setSplitPct(e.target.value)}
                placeholder="60.00"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Account Status (Inactive default) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Initial Partner Status:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                onClick={() => setStatus('inactive')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  status === 'inactive'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:border-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  checked={status === 'inactive'}
                  onChange={() => setStatus('inactive')}
                  className="mt-0.5 text-amber-500 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Inactive (Default)</div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Clicks fall back to direct master profit until approved
                  </p>
                </div>
              </label>

              <label
                onClick={() => setStatus('active')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  status === 'active'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:border-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="mt-0.5 text-emerald-500 focus:ring-0"
                />
                <div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Active</div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Immediately tracks and splits brand sales commissions
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-3d-indigo flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Partner...' : 'Create Sub-Affiliate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
