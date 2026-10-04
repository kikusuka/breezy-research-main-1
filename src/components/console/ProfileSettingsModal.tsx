import React, { useState } from 'react';
import { userProfileService, UserProfile } from '../../services/userProfileService';
import { ProviderKeyConfig } from '../../types';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  keys?: ProviderKeyConfig;
  onSaveKeys?: (newKeys: ProviderKeyConfig) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => userProfileService.getProfile());
  const [displayName, setDisplayName] = useState(profile.displayName || 'Dr. Aris Vance');
  const [roleTitle, setRoleTitle] = useState(profile.roleTitle || 'Lead Analyst');
  const [organization, setOrganization] = useState(profile.organization || 'Macro-Risk Research Group');
  const [email, setEmail] = useState(profile.email || 'aris.vance@breezy-intel.io');

  // Optical directives toggles
  const [cyanGlow, setCyanGlow] = useState(true);
  const [latexRendering, setLatexRendering] = useState(true);
  const [citationPins, setCitationPins] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    userProfileService.saveProfile({
      displayName,
      roleTitle,
      organization,
      email,
    });
    if (onSave) onSave();
    onClose();
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md sm:p-space-lg bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="w-full max-w-4xl rounded-3xl bg-surface-container border border-outline-variant/40 shadow-2xl p-space-md sm:p-space-xl flex flex-col gap-space-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-space-sm border-b border-outline-variant/20">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-headline-md">badge</span>
            <div>
              <h2 className="font-headline font-bold text-headline-lg text-on-surface">
                Researcher Profile &amp; Attestation
              </h2>
              <p className="font-sans text-body-sm text-on-surface-variant">
                Verified cryptographic identity, workstation authorization, and optical directives.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-headline-sm">close</span>
          </button>
        </div>

        {/* Profile Card Banner */}
        <div className="p-space-md rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md shadow-sm">
          <div className="flex items-center gap-space-md">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-primary/30 flex items-center justify-center text-primary font-mono text-headline-md font-bold shadow-md">
                AV
              </div>
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded bg-tertiary-container text-on-tertiary-container font-mono text-[9px] font-bold">
                L9
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-headline font-bold text-headline-sm text-on-surface">{displayName}</span>
                <span className="font-mono text-code-sm text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                  ID: 0x9D4F··88C2
                </span>
              </div>
              <span className="font-sans text-body-sm text-on-surface-variant">
                {roleTitle} • {organization}
              </span>
              <div className="flex items-center gap-space-xs mt-1 font-mono text-code-sm text-tertiary">
                <span className="material-symbols-outlined text-[15px]">verified_user</span>
                <span>Key Custody Verified</span>
                <span>·</span>
                <span className="text-secondary">Zero-Log Enclave Tier 4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Inputs for Profile Edit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
          <div className="flex flex-col gap-1">
            <label className="font-sans text-label-md text-on-surface font-medium">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-space-md py-2 rounded-xl bg-surface-container-low text-on-surface font-sans text-body-md border border-outline-variant/30 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-label-md text-on-surface font-medium">Role &amp; Title</label>
            <input
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              className="w-full px-space-md py-2 rounded-xl bg-surface-container-low text-on-surface font-sans text-body-md border border-outline-variant/30 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-label-md text-on-surface font-medium">Organization / Laboratory</label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full px-space-md py-2 rounded-xl bg-surface-container-low text-on-surface font-sans text-body-md border border-outline-variant/30 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-label-md text-on-surface font-medium">Contact Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-space-md py-2 rounded-xl bg-surface-container-low text-on-surface font-sans text-body-md border border-outline-variant/30 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Client-Side Keyring Fingerprint */}
        <div className="p-space-md rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-label-sm uppercase text-outline">
              Primary Client Hash (SHA-512/256)
            </span>
            <span className="font-mono text-code-sm text-tertiary">ED25519-SK HOOKED</span>
          </div>
          <div className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container border border-outline-variant/20 font-mono text-code-sm text-on-surface">
            <span className="truncate pr-2">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
            <button
              type="button"
              onClick={handleCopyHash}
              className="px-space-sm py-1 rounded bg-surface-container-high text-primary hover:text-white font-sans text-label-sm shrink-0 transition-colors"
            >
              {copiedKey ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Workspace Optical Directives */}
        <div className="flex flex-col gap-space-sm pt-space-xs">
          <span className="font-mono text-label-sm uppercase tracking-wider text-outline">
            Workspace Optical Directives
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-sm">
            <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-sans text-label-md text-on-surface font-medium">Ambient Cyan Glow</span>
                <span className="font-sans text-label-sm text-outline">Alleviates night fatigue</span>
              </div>
              <input
                type="checkbox"
                checked={cyanGlow}
                onChange={(e) => setCyanGlow(e.target.checked)}
                className="accent-primary w-5 h-5 rounded cursor-pointer"
              />
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-sans text-label-md text-on-surface font-medium">LaTeX Inline Math</span>
                <span className="font-sans text-label-sm text-outline">Formatted symbols</span>
              </div>
              <input
                type="checkbox"
                checked={latexRendering}
                onChange={(e) => setLatexRendering(e.target.checked)}
                className="accent-primary w-5 h-5 rounded cursor-pointer"
              />
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-sans text-label-md text-on-surface font-medium">Freeze Citation Pins</span>
                <span className="font-sans text-label-sm text-outline">Fixed DOI references</span>
              </div>
              <input
                type="checkbox"
                checked={citationPins}
                onChange={(e) => setCitationPins(e.target.checked)}
                className="accent-primary w-5 h-5 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-space-sm pt-space-md border-t border-outline-variant/20">
          <button
            type="button"
            onClick={onClose}
            className="px-space-lg py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-outline hover:text-on-surface font-sans text-label-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-space-xl py-2 rounded-xl bg-primary text-on-primary font-headline font-semibold text-headline-sm hover:bg-secondary transition-all shadow-md"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
};
