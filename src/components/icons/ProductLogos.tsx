import React from 'react';

export const BreezyLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <img src="/breezy-logo.svg" alt="Breezy" className={`${className} object-contain shrink-0`} />
);

export const SynthexisLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="50" y1="28" x2="26" y2="72" stroke="#3b82f6" strokeWidth="7" strokeLinecap="round" />
    <line x1="26" y1="72" x2="74" y2="72" stroke="#10b981" strokeWidth="7" strokeLinecap="round" />
    <line x1="74" y1="72" x2="50" y2="28" stroke="#ef4444" strokeWidth="7" strokeLinecap="round" />
    <line x1="50" y1="28" x2="50" y2="54" stroke="currentColor" strokeWidth="4" strokeOpacity="0.6" />
    <line x1="26" y1="72" x2="50" y2="54" stroke="currentColor" strokeWidth="4" strokeOpacity="0.6" />
    <line x1="74" y1="72" x2="50" y2="54" stroke="currentColor" strokeWidth="4" strokeOpacity="0.6" />
    <circle cx="50" cy="54" r="7" fill="#3b82f6" />
    <circle cx="50" cy="28" r="11" fill="#1e293b" stroke="#3b82f6" strokeWidth="6" />
    <circle cx="50" cy="28" r="4" fill="#ffffff" />
    <circle cx="26" cy="72" r="11" fill="#1e293b" stroke="#ef4444" strokeWidth="6" />
    <circle cx="26" cy="72" r="4" fill="#ffffff" />
    <circle cx="74" cy="72" r="11" fill="#1e293b" stroke="#10b981" strokeWidth="6" />
    <circle cx="74" cy="72" r="4" fill="#ffffff" />
  </svg>
);

