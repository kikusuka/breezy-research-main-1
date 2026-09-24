import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sliders,
  KeyRound,
  MessageSquare,
  LayoutGrid,
  BarChart3,
  ListOrdered,
  Flame,
  Brain,
  Play,
  FileCode,
} from 'lucide-react';
import { CouncilHeartbeat } from './CouncilHeartbeat';
import { DeliberationBlock } from './DeliberationBlock';
import { ExportTranscriptMenu } from './ExportTranscriptMenu';
import { CouncilMetricsDashboard } from './CouncilMetricsDashboard';
import { CouncilHeatmapView } from './CouncilHeatmapView';
import { CognitiveDashboard } from './CognitiveDashboard';
import { DebateStep, HeartbeatState, ProviderKeyConfig, DebateTone, DebateSession } from '../types';
import { loadSessions } from '../services/sessionStorage';
import { exportTranscriptAsMarkdown, generateMarkdownTranscript } from '../utils/exportTranscript';

interface CouncilChamberWindowProps {
  currentPrompt: string;
  isDeliberating: boolean;
  activeRound: number;
  steps: DebateStep[];
  protocol: 'trio' | 'quad' | 'duel' | 'solo';
  tone?: DebateTone;
  seats: {
    architect: { provider: string; model: string };
    skeptic: { provider: string; model: string };
    arbiter: { provider: string; model: string };
  };
  keys: ProviderKeyConfig;
  heartbeat?: HeartbeatState;
  finalOutput?: string;
  metrics?: {
    durationMs: number;
    consensusRate: number;
    contentionLevel: string;
    resolvedPointsCount: number;
  };
  sessions?: DebateSession[];
  onSelectSession?: (sessionId: string) => void;
  onOpenVault: () => void;
  onOpenCouncil: () => void;
  onOpenExplainer: () => void;
  onOpenChatWindow: () => void;
  
  interjectionEnabled?: boolean;
  onToggleInterjection?: () => void;
  interjectionActive?: boolean;
  onSetInterjectionActive?: (active: boolean) => void;
  interjectionText?: string;
  onSetInterjectionText?: (text: string) => void;
  onSubmitInterjection?: (text: string) => void;
  onBypassInterjection?: () => void;
}

export const CouncilChamberWindow: React.FC<CouncilChamberWindowProps> = ({
  currentPrompt,
  isDeliberating,
  activeRound,
  steps,
  protocol,
  tone = 'balanced',
  seats,
  keys,
  heartbeat,
  finalOutput,
  metrics,
  sessions,
  onSelectSession,
  onOpenVault,
  onOpenCouncil,
  onOpenExplainer,
  onOpenChatWindow,
  
  interjectionEnabled,
  onToggleInterjection,
  interjectionActive,
  onSetInterjectionActive,
  interjectionText,
  onSetInterjectionText,
  onSubmitInterjection,
  onBypassInterjection,
}) => {
  const [activeTab, setActiveTab] = useState<'deliberation' | 'metrics' | 'heatmap' | 'cognitive'>('deliberation');

  const [localInterjectionEnabled, setLocalInterjectionEnabled] = useState(true);
  const [localInterjectionActive, setLocalInterjectionActive] = useState(false);
  const [localInterjectionText, setLocalInterjectionText] = useState('');
  const [interjectedRound, setInterjectedRound] = useState<number | null>(null);

  const finalInterjectionEnabled = interjectionEnabled !== undefined ? interjectionEnabled : localInterjectionEnabled;
  const finalInterjectionActive = interjectionActive !== undefined ? interjectionActive : localInterjectionActive;
  const finalInterjectionText = interjectionText !== undefined ? interjectionText : localInterjectionText;

  const handleToggleInterjection = onToggleInterjection || (() => setLocalInterjectionEnabled(!localInterjectionEnabled));
  const handleSetInterjectionText = onSetInterjectionText || setLocalInterjectionText;

  useEffect(() => {
    if (isDeliberating && activeRound === 2 && finalInterjectionEnabled && interjectedRound !== 2) {
      if (onSetInterjectionActive) {
        onSetInterjectionActive(true);
      } else {
        setLocalInterjectionActive(true);
      }
      setInterjectedRound(2);
    }
  }, [isDeliberating, activeRound, finalInterjectionEnabled, interjectedRound, onSetInterjectionActive]);

  useEffect(() => {
    if (!isDeliberating && activeRound === 0) {
      setInterjectedRound(null);
      if (onSetInterjectionActive) {
        onSetInterjectionActive(false);
      } else {
        setLocalInterjectionActive(false);
      }
    }
  }, [isDeliberating, activeRound, onSetInterjectionActive]);

  const [isReplayMode, setIsReplayMode] = useState(false);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);

  useEffect(() => {
    if (isReplayMode) {
      setReplayIndex(steps.length);
    }
  }, [isReplayMode, steps.length]);

  useEffect(() => {
    let timer: any = null;
    if (isReplayMode && isReplayPlaying) {
      const intervalMs = Math.max(300, 2000 / replaySpeed);
      timer = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev >= steps.length) {
            setIsReplayPlaying(false);
            return steps.length;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isReplayMode, isReplayPlaying, steps.length, replaySpeed]);

  const handleExportMarkdownClick = () => {
    exportTranscriptAsMarkdown({
      prompt: currentPrompt || 'Research Inquiry',
      protocol,
      steps,
      finalOutput,
      metrics,
    });
  };

  const allSessions = sessions && sessions.length > 0 ? sessions : loadSessions();

  return (
    <div
      id="council-chamber-window-container"
      className="relative flex flex-col h-full rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden transition-all"
    >
      {/* Workbench Panel Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900 px-4 sm:px-5 py-2.5 gap-2 select-none">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-300">
            <LayoutGrid className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold text-slate-200">
            Analysis Workspace & Model Trace
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
            / {protocol.toUpperCase()}
          </span>

          <button
            type="button"
            onClick={onOpenCouncil}
            className="hidden md:inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
            title="Analysis tone level"
          >
            <span>Tone:</span>
            <span className="capitalize font-semibold">{tone}</span>
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('deliberation')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              activeTab === 'deliberation'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="h-3 w-3" />
            <span>Trace</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              activeTab === 'metrics'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="h-3 w-3 text-amber-400" />
            <span>Performance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('heatmap')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              activeTab === 'heatmap'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="h-3 w-3 text-emerald-400" />
            <span>Heatmap</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cognitive')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              activeTab === 'cognitive'
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="h-3 w-3 text-blue-400" />
            <span>Activity</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {steps.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsReplayMode(!isReplayMode);
                setReplayIndex(0);
                setIsReplayPlaying(false);
              }}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
                isReplayMode
                  ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                  : 'border-slate-800 bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Play className="h-3 w-3 text-indigo-400" />
              <span>{isReplayMode ? 'Exit Replay' : 'Replay'}</span>
            </button>
          )}

          {steps.length > 0 && (
            <button
              type="button"
              onClick={handleExportMarkdownClick}
              className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-all"
            >
              <FileCode className="h-3 w-3 text-amber-400" />
              <span className="hidden sm:inline">Markdown</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleInterjection}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
              finalInterjectionEnabled
                ? 'border-rose-800/60 bg-rose-950/30 text-rose-300'
                : 'border-slate-800 bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Pause mid-session if logical discrepancies are flagged"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${finalInterjectionEnabled ? 'bg-rose-500' : 'bg-slate-500'}`} />
            <span>Guard: {finalInterjectionEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {steps.length > 0 && (
            <ExportTranscriptMenu
              debate={{
                prompt: currentPrompt || 'Research Inquiry',
                protocol,
                steps,
                finalOutput,
                metrics,
              }}
              variant="secondary"
            />
          )}

          <button
            type="button"
            onClick={onOpenCouncil}
            className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Sliders className="h-3 w-3 text-slate-400" />
            <span className="hidden sm:inline">Models</span>
          </button>

          <button
            type="button"
            onClick={onOpenVault}
            className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <KeyRound className="h-3 w-3 text-slate-400" />
            <span className="hidden sm:inline">Keys</span>
          </button>

          <button
            type="button"
            onClick={onOpenChatWindow}
            className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <MessageSquare className="h-3 w-3 text-slate-400" />
            <span>Chat View</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
        {activeTab === 'metrics' ? (
          <div className="space-y-6">
            <CouncilMetricsDashboard
              sessions={allSessions}
              onSelectSession={onSelectSession}
            />
          </div>
        ) : activeTab === 'heatmap' ? (
          <CouncilHeatmapView
            sessions={allSessions}
            onSelectSession={onSelectSession}
          />
        ) : activeTab === 'cognitive' ? (
          <CognitiveDashboard
            steps={steps}
            protocol={protocol}
            consensusRate={metrics?.consensusRate || 82}
          />
        ) : (
          <>
            <CouncilHeartbeat
              heartbeat={heartbeat}
              isDeliberating={isDeliberating}
              activeRound={activeRound}
              steps={steps}
            />

            {finalInterjectionActive && (
              <div className="rounded-xl border border-rose-800/60 bg-rose-950/30 p-5 space-y-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <span className="text-xl p-1.5 bg-rose-950/60 border border-rose-800/60 rounded-lg select-none">🚨</span>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 font-mono">
                      Interjection Guard Flagged • Clarification Requested
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-normal">
                      Stream paused on Round 2 (Critic Review). Potential constraint conflict identified.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={finalInterjectionText}
                      onChange={(e) => handleSetInterjectionText(e.target.value)}
                      placeholder="Add clarification or press continue..."
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (onSubmitInterjection) onSubmitInterjection(finalInterjectionText);
                        if (onSetInterjectionActive) onSetInterjectionActive(false);
                      }}
                      className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition-colors"
                    >
                      Submit & Resume
                    </button>
                  </div>
                </div>
              </div>
            )}

            <DeliberationBlock
              steps={isReplayMode ? steps.slice(0, replayIndex) : steps}
              isDeliberating={isDeliberating}
              activeRound={activeRound}
              tone={tone}
            />
          </>
        )}
      </div>
    </div>
  );
};
