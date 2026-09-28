import React from 'react';
import { BreezySidebar, BreezyTab } from '../components/breezy/BreezySidebar';
import { BreezyWorkspace } from '../components/breezy/BreezyWorkspace';
import { BreezyIdeWorkspace } from '../components/breezy/BreezyIdeWorkspace';
import { BreezyCanvasWorkspace } from '../components/breezy/BreezyCanvasWorkspace';
import { SynapHeader } from '../components/synap/SynapHeader';
import { ProfileSettingsModal } from '../components/console/ProfileSettingsModal';
import { ProductMode } from '../components/console/TopBar';

interface BreezyProductProps {
  breezyTab: BreezyTab;
  onSelectBreezyTab: (tab: BreezyTab) => void;
  breezyChats: Record<string, any>;
  breezyActiveId: string | null;
  onSelectBreezyChat: (id: string) => void;
  onNewBreezyChat: () => void;
  onDeleteBreezyChat: (id: string, e: React.MouseEvent) => void;
  productMode: ProductMode;
  onSelectProductMode: (mode: ProductMode) => void;
  aggregatedReadiness: number;
  isCommandPaletteOpen: boolean;
  onOpenQuickJump: () => void;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  isProfileSettingsOpen: boolean;
  onCloseProfile: () => void;
  keys: any;
  onSaveKeys: (keys: any) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  appToast: string | null;
  toast: (msg: string) => void;
}

export const BreezyProduct: React.FC<BreezyProductProps> = ({
  breezyTab,
  onSelectBreezyTab,
  breezyChats,
  breezyActiveId,
  onSelectBreezyChat,
  onNewBreezyChat,
  onDeleteBreezyChat,
  productMode,
  onSelectProductMode,
  aggregatedReadiness,
  onOpenQuickJump,
  isMobileMenuOpen,
  onToggleMobileMenu,
  isProfileSettingsOpen,
  onCloseProfile,
  keys,
  onSaveKeys,
  theme,
  onToggleTheme,
  appToast,
  toast,
}) => {
  return (
    <div className={`flex min-h-screen font-sans antialiased overflow-x-hidden ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-[#090d16] text-slate-100'}`}>
      <BreezySidebar
        activeTab={breezyTab}
        onSelectTab={onSelectBreezyTab}
        chats={breezyChats}
        activeId={breezyActiveId}
        onSelectChat={onSelectBreezyChat}
        onNewChat={onNewBreezyChat}
        onDeleteChat={onDeleteBreezyChat}
        onOpenProfile={() => {}}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={onToggleMobileMenu}
      />

      <div className="pl-0 lg:pl-72 flex flex-col flex-1 min-h-screen">
        <SynapHeader
          readinessPercentage={aggregatedReadiness}
          productMode={productMode}
          onSelectProductMode={onSelectProductMode}
          onOpenQuickJump={onOpenQuickJump}
          onToggleMobileMenu={onToggleMobileMenu}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />

        {breezyTab === 'chat' && (
          <BreezyWorkspace
            onOpenSettings={() => {}}
            toast={toast}
          />
        )}

        {breezyTab === 'ide' && (
          <BreezyIdeWorkspace
            onOpenSettings={() => {}}
          />
        )}

        {breezyTab === 'canvas' && (
          <BreezyCanvasWorkspace
            onOpenSettings={() => {}}
          />
        )}
      </div>

      {appToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e1e2d] text-stone-100 px-4 py-2.5 rounded-xl border border-white/10 shadow-2xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
          <span>{appToast}</span>
        </div>
      )}

      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={onCloseProfile}
        keys={keys}
        onSaveKeys={onSaveKeys}
      />
    </div>
  );
};
