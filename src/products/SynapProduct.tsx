import React from 'react';
import { SynapWorkspace } from '../components/synap/SynapWorkspace';
import { ProfileSettingsModal } from '../components/console/ProfileSettingsModal';
import { ProductMode } from '../components/console/TopBar';

interface SynapProductProps {
  productMode: ProductMode;
  onSelectProductMode: (mode: ProductMode) => void;
  isProfileSettingsOpen: boolean;
  onCloseProfile: () => void;
  keys: any;
  onSaveKeys: (keys: any) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const SynapProduct: React.FC<SynapProductProps> = ({
  productMode,
  onSelectProductMode,
  isProfileSettingsOpen,
  onCloseProfile,
  keys,
  onSaveKeys,
  theme,
  onToggleTheme,
}) => {
  return (
    <div className={`min-h-screen font-sans antialiased overflow-x-hidden ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#0A0A0F] text-[#e4e1ed]'}`}>
      <SynapWorkspace
        productMode={productMode}
        onSelectProductMode={onSelectProductMode}
        onOpenProfile={() => {}}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={onCloseProfile}
        keys={keys}
        onSaveKeys={onSaveKeys}
      />
    </div>
  );
};
