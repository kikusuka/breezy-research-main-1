/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ConsoleTab } from './components/console/Sidebar';
import { BreezyTab } from './components/breezy/BreezySidebar';
import { ProductMode } from './components/console/TopBar';
import { SynapProduct } from './products/SynapProduct';
import { BreezyProduct } from './products/BreezyProduct';
import { SynthexisProduct } from './products/SynthexisProduct';
import {
  loadSessions,
  saveSessions,
  loadActiveSessionId,
  saveActiveSessionId,
  createNewSession,
} from './services/sessionStorage';
import { exportConsensusAsMarkdown } from './utils/exportTranscript';
import { apiClient } from './services/apiClient';
import { providerConfigService } from './services/providerConfigService';
import { computeNotebookReadiness } from './services/scheduler';

export default function App() {
  const [activeTab, setActiveTab] = useState<ConsoleTab>('chat');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [productMode, setProductMode] = useState<ProductMode>('breezy');
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [breezyTab, setBreezyTab] = useState<BreezyTab>('chat');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [appToast, setAppToast] = useState<string | null>(null);

  const toast = (msg: string) => {
    setAppToast(msg);
    setTimeout(() => setAppToast(null), 3500);
  };

  // Sessions state
  const [sessions, setSessions] = useState(() => loadSessions() || [createNewSession('First Inquiry', 'trio', [], 'balanced')]);
  const [activeSessionId, setActiveSessionId] = useState(() => loadActiveSessionId() || sessions[0]?.id);
  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const [isDeliberating, setIsDeliberating] = useState(false);
  const [activeRound, setActiveRound] = useState(1);
  const [streamingText, setStreamingText] = useState('');
  const [streamingRole, setStreamingRole] = useState('Analyst');
  const [researchEvents, setResearchEvents] = useState<string[]>([]);

  const keys = providerConfigService.getKeys();
  const handleSaveKeys = (newKeys: any) => {
    providerConfigService.saveKeys(newKeys);
    toast('API keys saved successfully.');
  };

  const aggregatedReadiness = 82; // Default mock aggregated readiness across notebooks

  return (
    <>
      {productMode === 'synap' && (
        <SynapProduct
          productMode={productMode}
          onSelectProductMode={setProductMode}
          isProfileSettingsOpen={isProfileSettingsOpen}
          onCloseProfile={() => setIsProfileSettingsOpen(false)}
          keys={keys}
          onSaveKeys={handleSaveKeys}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        />
      )}

      {productMode === 'breezy' && (
        <BreezyProduct
          breezyTab={breezyTab}
          onSelectBreezyTab={setBreezyTab}
          breezyChats={{}}
          breezyActiveId={null}
          onSelectBreezyChat={() => {}}
          onNewBreezyChat={() => {}}
          onDeleteBreezyChat={() => {}}
          productMode={productMode}
          onSelectProductMode={setProductMode}
          aggregatedReadiness={aggregatedReadiness}
          isCommandPaletteOpen={isCommandPaletteOpen}
          onOpenQuickJump={() => setIsCommandPaletteOpen(true)}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isProfileSettingsOpen={isProfileSettingsOpen}
          onCloseProfile={() => setIsProfileSettingsOpen(false)}
          keys={keys}
          onSaveKeys={handleSaveKeys}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          appToast={appToast}
          toast={toast}
        />
      )}

      {productMode === 'synthexis' && (
        <SynthexisProduct
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewSession={() => {}}
          consensusMode={true}
          onToggleConsensusMode={() => {}}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isCommandPaletteOpen={isCommandPaletteOpen}
          onCloseCommandPalette={() => setIsCommandPaletteOpen(false)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          isProfileSettingsOpen={isProfileSettingsOpen}
          onCloseProfile={() => setIsProfileSettingsOpen(false)}
          productMode={productMode}
          onSelectProductMode={setProductMode}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          currentSession={currentSession}
          isDeliberating={isDeliberating}
          activeRound={activeRound}
          streamingText={streamingText}
          streamingRole={streamingRole}
          startDebate={() => {}}
          researchEvents={researchEvents}
          handleExportMarkdown={() => {}}
          keys={keys}
          handleSaveKeys={handleSaveKeys}
          handleDeleteSession={() => {}}
          loadSessions={loadSessions}
          setSessions={setSessions}
          appToast={appToast}
        />
      )}
    </>
  );
}
