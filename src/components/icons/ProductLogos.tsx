import React from 'react';

export const BreezyLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="37" cy="37" r="18" stroke="currentColor" strokeWidth="6" fill="none" />
    <circle cx="37" cy="12" r="3.5" fill="currentColor" />
    <line x1="37" y1="15.5" x2="37" y2="19" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <circle cx="31" cy="37" r="3" fill="currentColor" />
    <circle cx="43" cy="37" r="3" fill="currentColor" />
    <path d="M 12,58 C 30,58 45,45 68,45 C 80,45 88,52 82,60 C 76,68 62,65 62,56" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" fill="none" />
    <path d="M 22,72 C 38,72 52,62 72,62 C 84,62 90,69 84,76 C 78,82 66,79 66,72" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M 68,36 C 78,36 86,30 82,24 C 78,18 68,22 70,28" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" fill="none" />
  </svg>
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

export const SynapLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="28" fill="#181524" />
    <line x1="32" y1="46" x2="68" y2="46" stroke="#9d85f2" strokeWidth="7" strokeLinecap="round" />
    <line x1="32" y1="46" x2="50" y2="76" stroke="#9d85f2" strokeWidth="7" strokeLinecap="round" />
    <line x1="68" y1="46" x2="50" y2="76" stroke="#9d85f2" strokeWidth="7" strokeLinecap="round" />
    <circle cx="32" cy="46" r="10" fill="#9d85f2" />
    <circle cx="68" cy="46" r="10" fill="#9d85f2" />
    <circle cx="50" cy="76" r="10" fill="#ccbdff" stroke="#9d85f2" strokeWidth="4" />
    <circle cx="50" cy="76" r="4" fill="#ffffff" />
  </svg>
);
