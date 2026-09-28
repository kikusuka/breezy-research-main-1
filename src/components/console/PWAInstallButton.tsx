import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Already running in standalone PWA mode
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="w-full flex items-center justify-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all border border-emerald-500/25 cursor-pointer shadow-md"
      >
        <span className="material-symbols-outlined text-[17px]">download</span>
        <span>Install Desktop App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="w-full flex items-center justify-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all border border-emerald-500/25 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px]">download_for_offline</span>
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-[#161a22] p-6 shadow-2xl border border-white/10 text-center font-sans">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-bold text-xl mx-auto mb-4">
                ⚡
              </div>
              <h3 className="text-base font-bold text-stone-100">Add to Home Screen</h3>
              <p className="mt-3 text-xs text-stone-400 leading-relaxed text-left">
                To install **Breezy Research Suite** on your iOS device:
              </p>
              <div className="mt-4 p-3 bg-black/20 rounded-xl border border-white/5 text-left text-xs text-stone-300 leading-relaxed space-y-2">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-emerald-400 font-bold">1.</span>
                  <span>Tap the <strong className="text-white">Share</strong> button in Safari's bottom toolbar.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-emerald-400 font-bold">2.</span>
                  <span>Scroll down and select <strong className="text-white">Add to Home Screen</strong>.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-stone-100 hover:bg-white py-2.5 text-xs font-bold text-stone-950 transition-all cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
