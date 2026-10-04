import React, { useEffect, useState } from 'react';
import { userProfileService, UserProfile } from '../../services/userProfileService';
import { ProviderKeyConfig } from '../../types';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  keys?: ProviderKeyConfig;
  onSaveKeys?: (newKeys: ProviderKeyConfig) => void;
}

const getInitials = (name: string) =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'B';

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => userProfileService.getProfile());
  const [displayName, setDisplayName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const current = userProfileService.getProfile();
    setProfile(current);
    setDisplayName(current.displayName || '');
    setRoleTitle(current.roleTitle || '');
    setOrganization(current.organization || '');
    setEmail(current.email || '');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated = userProfileService.saveProfile({
      displayName: displayName.trim(),
      roleTitle: roleTitle.trim(),
      organization: organization.trim(),
      email: email.trim(),
    });
    setProfile(updated);
    onSave?.();
    onClose();
  };

  const initials = getInitials(displayName || profile.displayName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-surface-container-low border border-outline-variant/40 shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 py-4 sm:px-6 border-b border-outline-variant/25 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary font-mono text-code-sm uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">person</span>
              Profile
            </div>
            <h2 id="profile-title" className="mt-1 font-headline font-semibold text-headline-lg text-on-surface">
              Your Breezy profile
            </h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Choose the identity information displayed in your workspace.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors" aria-label="Close profile">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container border border-outline-variant/25">
            <div className="w-14 h-14 rounded-xl bg-surface-container-high border border-primary/20 flex items-center justify-center text-primary font-mono text-headline-md font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-on-surface truncate">
                {displayName || 'Breezy user'}
              </div>
              <div className="text-body-sm text-on-surface-variant truncate">
                {roleTitle || 'No role set'}{organization ? ` · ${organization}` : ''}
              </div>
              <span className="inline-flex mt-1 rounded-full bg-surface-container-high px-2 py-1 font-mono text-label-sm text-outline">
                {profile.authorizationType === 'guest' ? 'Local profile' : 'Connected account'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['Display name', displayName, setDisplayName, 'Your name', 'text'],
              ['Role or title', roleTitle, setRoleTitle, 'Optional', 'text'],
              ['Organization', organization, setOrganization, 'Optional', 'text'],
              ['Email', email, setEmail, 'Optional', 'email'],
            ].map(([label, value, setter, placeholder, type]) => (
              <label key={String(label)} className="flex flex-col gap-1.5">
                <span className="text-label-md font-medium text-on-surface">{String(label)}</span>
                <input
                  type={String(type)}
                  value={String(value)}
                  onChange={(event) => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value)}
                  placeholder={String(placeholder)}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-container border border-outline-variant/30 text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 sm:px-6 border-t border-outline-variant/25 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/30 text-label-md transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="px-5 py-2 rounded-lg bg-primary text-on-primary font-semibold text-label-md hover:bg-secondary transition-colors">
            Save profile
          </button>
        </div>
      </div>
    </div>
  );
};
