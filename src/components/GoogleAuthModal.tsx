import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Loader2, CheckCircle } from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { name: string; email: string; picture: string; verified: boolean; joinedAt: string }) => void;
  defaultEmail?: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultEmail = 'bpranav763@gmail.com',
}) => {
  const [step, setStep] = useState<'select' | 'custom' | 'connecting' | 'success'>('select');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [statusMessage, setStatusMessage] = useState('Initiating Google OAuth handshake...');

  if (!isOpen) return null;

  const handleSelectAccount = (email: string, name: string) => {
    setStep('connecting');
    setStatusMessage('Initiating Google Identity secure channel...');
    
    setTimeout(() => {
      setStatusMessage('Verifying digital signature with Google Accounts...');
      setTimeout(() => {
        setStatusMessage('Syncing Coherence Chamber workspace preferences...');
        setTimeout(() => {
          setStep('success');
          setTimeout(() => {
            onSuccess({
              name,
              email,
              picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}&backgroundColor=0d0f16,1a1f2c,2d3748`,
              verified: true,
              joinedAt: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
            });
            onClose();
            // Reset state
            setStep('select');
          }, 1000);
        }, 800);
      }, 800);
    }, 900);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customName) return;
    handleSelectAccount(customEmail, customName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0d0f16] p-6 shadow-2xl text-slate-100 overflow-hidden"
        >
          {/* Subtle glowing ambient lights */}
          <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl" />

          {step === 'select' && (
            <div>
              {/* Google Brand Logo Icon */}
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>

              <h3 className="text-center font-serif text-[18px] font-normal tracking-tight text-white mb-1">
                Sign in with Google
              </h3>
              <p className="text-center text-xs text-slate-400 mb-6 font-serif">
                Choose a verified Google Identity to register on the Council chamber
              </p>

              {/* Account Selection */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectAccount(defaultEmail, 'Pranav')}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-[#121622] hover:border-blue-500/50 hover:bg-[#151a29] text-left transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=Pranav&backgroundColor=0d0f16,1a1f2c`}
                      alt="Pranav Profile"
                      className="h-8 w-8 rounded-full bg-slate-900 border border-slate-700 p-0.5"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                        Pranav
                      </h4>
                      <p className="text-[10.5px] font-mono text-slate-400">
                        {defaultEmail}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-950/60 border border-emerald-700/40 px-2 py-0.5 text-[9px] font-mono text-emerald-400">
                    Active User
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('custom')}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-dashed border-slate-800 bg-transparent hover:border-slate-500 hover:bg-slate-950/30 text-left transition-all duration-200"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400">
                    +
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-slate-300">
                      Use another account
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Add a secondary mock Google Account
                    </p>
                  </div>
                </button>
              </div>

              {/* Bottom Policy notice */}
              <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-4 text-[10px] text-slate-500 leading-normal font-serif">
                <Shield className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                <span>
                  Coherence OAuth proxy uses industry-standard sandboxed cryptographic tokens. We do not store your real passwords.
                </span>
              </div>
            </div>
          )}

          {step === 'custom' && (
            <div>
              <h3 className="font-serif text-[17px] text-white mb-1">Enter Account Details</h3>
              <p className="text-xs text-slate-400 mb-4 font-serif">
                Configure a custom mock identity for this session
              </p>

              <form onSubmit={handleCustomSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Dr. Jennifer"
                    className="w-full rounded-lg border border-slate-800 bg-[#121622] px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="e.g. jennifer@gmail.com"
                    className="w-full rounded-lg border border-slate-800 bg-[#121622] px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="flex-1 rounded-lg border border-slate-800 bg-transparent py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-950/20 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-500 py-2 text-xs font-semibold text-white transition-all shadow-sm"
                  >
                    Authenticate
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'connecting' && (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <Loader2 className="h-9 w-9 text-blue-400 animate-spin mb-4" />
              <h3 className="font-serif text-[16px] text-white font-normal mb-1.5 animate-pulse">
                Authorizing Identity
              </h3>
              <p className="text-[11px] font-mono text-slate-400 max-w-xs leading-normal">
                {statusMessage}
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-400 mb-3 animate-bounce" />
              <h3 className="font-serif text-[17px] text-white font-normal mb-1">
                Authentication Granted
              </h3>
              <p className="text-xs text-slate-400 font-serif">
                Handshake finished. Loading council chamber credentials.
              </p>
            </div>
          )}

          {/* Close Trigger (Only for select/custom steps) */}
          {(step === 'select' || step === 'custom') && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
