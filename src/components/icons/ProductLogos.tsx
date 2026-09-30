import React from 'react';

export const BreezyLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Robot Head */}
    <circle cx="36" cy="38" r="18" stroke="currentColor" strokeWidth="5.5" fill="none" />
    {/* Antenna Bulb and Stem */}
    <circle cx="36" cy="11.5" r="3.8" fill="currentColor" />
    <line x1="36" y1="15" x2="36" y2="19.5" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
    {/* Eyes */}
    <circle cx="30" cy="38" r="3.2" fill="currentColor" />
    <circle cx="42" cy="38" r="3.2" fill="currentColor" />
    {/* Dynamic Smooth Aerodynamic Wind Swooshes */}
    <path
      d="M 58,28 C 68,26 80,24 86,28 C 91,31 90,38 84,40 C 78,42 72,37 74,31"
      stroke="currentColor"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M 12,58 C 28,58 44,48 66,48 C 79,48 90,55 88,65 C 86,73 75,75 67,69 C 63,65 64,59 69,57"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M 20,74 C 36,74 52,66 72,66 C 84,66 93,73 89,80 C 85,86 74,86 68,80"
      stroke="currentColor"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
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
