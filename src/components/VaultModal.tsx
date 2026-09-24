import React, { useState } from 'react';
import {
  X,
  Key,
  Check,
  Shield,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { ProviderKeyConfig } from '../types';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys: ProviderKeyConfig;
  onSaveKeys: (newKeys: ProviderKeyConfig) => void;
}

export const VaultModal: React.FC<VaultModalProps> = ({
  isOpen,
  onClose,
  keys,
  onSaveKeys,
}) => {
  const [formData, setFormData] = useState<ProviderKeyConfig>({ ...keys });
  const [showKeys, setShowKeys] = useState<{ [k: string]: boolean }>({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [verifying, setVerifying] = useState<{ [k: string]: boolean }>({});
  const [verificationResult, setVerificationResult] = useState<{
    [k: string]: { success: boolean; message: string };
  }>({});

  if (!isOpen) return null;

  const toggleShow = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleChange = (provider: keyof ProviderKeyConfig, value: string) => {
    setFormData((prev) => ({ ...prev, [provider]: value }));
    // Clear verification result when user edits
    if (verificationResult[provider]) {
      setVerificationResult((prev) => {
        const copy = { ...prev };
        delete copy[provider];
        return copy;
      });
    }
  };

  const handleTestKey = async (
    provider: 'gemini' | 'groq' | 'sambanova' | 'openrouter' | 'tavily' | 'serper' | 'brave'
  ) => {
    const keyVal = formData[provider]?.trim();
    if (!keyVal) {
      setVerificationResult((prev) => ({
        ...prev,
        [provider]: { success: false, message: 'Please enter an API key first' },
      }));
      return;
    }

    setVerifying((prev) => ({ ...prev, [provider]: true }));
    setVerificationResult((prev) => {
      const copy = { ...prev };
      delete copy[provider];
      return copy;
    });

    try {
      const res = await fetch('/api/vault/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: keyVal }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setVerificationResult((prev) => ({
          ...prev,
          [provider]: {
            success: true,
            message: `Verified (${data.latencyMs}ms latency)`,
          },
        }));
      } else {
        setVerificationResult((prev) => ({
          ...prev,
          [provider]: {
            success: false,
            message: data.error || 'Verification failed. Please check key format.',
          },
        }));
      }
    } catch (err: any) {
      setVerificationResult((prev) => ({
        ...prev,
        [provider]: {
          success: false,
          message: err?.message || 'Network error verifying key',
        },
      }));
    } finally {
      setVerifying((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKeys(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  const handleClearAll = () => {
    const emptyKeys: ProviderKeyConfig = {
      gemini: '',
      groq: '',
      sambanova: '',
      openrouter: '',
      tavily: '',
      serper: '',
      brave: '',
    };
    setFormData(emptyKeys);
    setVerificationResult({});
    onSaveKeys(emptyKeys);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#262b3c] bg-[#12141d] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#8c92a4] transition-colors hover:bg-[#1f2333] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">BYOK Provider Vault</h2>
            <p className="text-xs text-[#8c92a4]">
              Bring Your Own Keys. Stored locally in your browser's localStorage.
            </p>
          </div>
        </div>

        {/* Security / Privacy Banner */}
        <div className="mb-5 rounded-xl border border-indigo-950/80 bg-indigo-950/20 p-3.5 text-xs text-[#a4acc2]">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-1">
            <Shield className="h-4 w-4 text-indigo-400" />
            <span>Client-Side Local Storage Security</span>
          </div>
          <p className="leading-relaxed text-[11px] text-[#9ca3af]">
            Your API keys are stored strictly in your browser's encrypted <code className="bg-[#1f2333] px-1 py-0.5 rounded text-indigo-200">localStorage</code>. When you launch a debate, keys are transmitted via secure HTTPS headers solely to query the requested model provider.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* 1. Groq Key */}
          <div className="rounded-xl border border-[#222738] bg-[#151722] p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <span>Groq API Key</span>
                <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.2 rounded font-mono">
                  Llama 3.3 70B (300+ tok/s)
                </span>
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Get Key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showKeys.groq ? 'text' : 'password'}
                  placeholder="gsk_..."
                  value={formData.groq || ''}
                  onChange={(e) => handleChange('groq', e.target.value)}
                  className="w-full rounded-lg border border-[#262b3c] bg-[#1a1d2b] px-3 py-2 pr-9 text-xs font-mono text-white placeholder-[#535970] focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShow('groq')}
                  className="absolute right-2.5 top-2.5 text-[#717890] hover:text-white"
                >
                  {showKeys.groq ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleTestKey('groq')}
                disabled={verifying.groq}
                className="rounded-lg border border-[#2d3449] bg-[#1e2336] px-3 py-2 text-xs font-medium text-white hover:bg-[#282f48] disabled:opacity-50"
              >
                {verifying.groq ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Test Key'}
              </button>
            </div>

            {verificationResult.groq && (
              <div
                className={`flex items-center gap-1.5 text-[11px] ${
                  verificationResult.groq.success ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {verificationResult.groq.success ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{verificationResult.groq.message}</span>
              </div>
            )}
          </div>

          {/* 2. SambaNova Key */}
          <div className="rounded-xl border border-[#222738] bg-[#151722] p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <span>SambaNova API Key</span>
                <span className="text-[10px] text-purple-400 bg-purple-950/60 border border-purple-800/40 px-1.5 py-0.2 rounded font-mono">
                  SN40L RDU (Qwen 2.5 / Llama)
                </span>
              </label>
              <a
                href="https://cloud.sambanova.ai/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Get Key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showKeys.sambanova ? 'text' : 'password'}
                  placeholder="sambanova-api-key..."
                  value={formData.sambanova || ''}
                  onChange={(e) => handleChange('sambanova', e.target.value)}
                  className="w-full rounded-lg border border-[#262b3c] bg-[#1a1d2b] px-3 py-2 pr-9 text-xs font-mono text-white placeholder-[#535970] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShow('sambanova')}
                  className="absolute right-2.5 top-2.5 text-[#717890] hover:text-white"
                >
                  {showKeys.sambanova ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleTestKey('sambanova')}
                disabled={verifying.sambanova}
                className="rounded-lg border border-[#2d3449] bg-[#1e2336] px-3 py-2 text-xs font-medium text-white hover:bg-[#282f48] disabled:opacity-50"
              >
                {verifying.sambanova ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Test Key'}
              </button>
            </div>

            {verificationResult.sambanova && (
              <div
                className={`flex items-center gap-1.5 text-[11px] ${
                  verificationResult.sambanova.success ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {verificationResult.sambanova.success ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{verificationResult.sambanova.message}</span>
              </div>
            )}
          </div>

          {/* 3. Google Gemini Key */}
          <div className="rounded-xl border border-[#222738] bg-[#151722] p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <span>Google Gemini API Key</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.2 rounded font-mono">
                  Gemini 3.6 / 3.8 Flash
                </span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Get Key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showKeys.gemini ? 'text' : 'password'}
                  placeholder="AIzaSy... (optional BYOK override or leave blank for default server key)"
                  value={formData.gemini || ''}
                  onChange={(e) => handleChange('gemini', e.target.value)}
                  className="w-full rounded-lg border border-[#262b3c] bg-[#1a1d2b] px-3 py-2 pr-9 text-xs font-mono text-white placeholder-[#535970] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShow('gemini')}
                  className="absolute right-2.5 top-2.5 text-[#717890] hover:text-white"
                >
                  {showKeys.gemini ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleTestKey('gemini')}
                disabled={verifying.gemini}
                className="rounded-lg border border-[#2d3449] bg-[#1e2336] px-3 py-2 text-xs font-medium text-white hover:bg-[#282f48] disabled:opacity-50"
              >
                {verifying.gemini ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Test Key'}
              </button>
            </div>

            {verificationResult.gemini && (
              <div
                className={`flex items-center gap-1.5 text-[11px] ${
                  verificationResult.gemini.success ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {verificationResult.gemini.success ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{verificationResult.gemini.message}</span>
              </div>
            )}
            <p className="text-[10px] text-[#788094]">
              Tip: If left blank, Iris automatically utilizes the built-in server Gemini API environment key.
            </p>
          </div>

          {/* 4. OpenRouter (Optional) */}
          <div className="rounded-xl border border-[#222738] bg-[#151722] p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <span>OpenRouter API Key</span>
                <span className="text-[10px] text-[#8c92a4]">(Optional aggregator)</span>
              </label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Get Key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showKeys.openrouter ? 'text' : 'password'}
                  placeholder="sk-or-v1-..."
                  value={formData.openrouter || ''}
                  onChange={(e) => handleChange('openrouter', e.target.value)}
                  className="w-full rounded-lg border border-[#262b3c] bg-[#1a1d2b] px-3 py-2 pr-9 text-xs font-mono text-white placeholder-[#535970] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShow('openrouter')}
                  className="absolute right-2.5 top-2.5 text-[#717890] hover:text-white"
                >
                  {showKeys.openrouter ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleTestKey('openrouter')}
                disabled={verifying.openrouter}
                className="rounded-lg border border-[#2d3449] bg-[#1e2336] px-3 py-2 text-xs font-medium text-white hover:bg-[#282f48] disabled:opacity-50"
              >
                {verifying.openrouter ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Test Key'}
              </button>
            </div>

            {verificationResult.openrouter && (
              <div
                className={`flex items-center gap-1.5 text-[11px] ${
                  verificationResult.openrouter.success ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {verificationResult.openrouter.success ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{verificationResult.openrouter.message}</span>
              </div>
            )}
          </div>

          {/* Web Search Engine API Keys Section Header */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 font-mono">
                Web Search Grounding Providers (Optional BYOK)
              </span>
              <div className="h-px flex-1 bg-sky-900/40" />
            </div>
          </div>

          {/* 5. Tavily Search Key */}
          <div className="rounded-xl border border-[#222738] bg-[#151722] p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <span>Tavily Search API Key</span>
                <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.2 rounded font-mono">
                  AI Agent Search
                </span>
              </label>
              <a
                href="https://tavily.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Get Key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showKeys.tavily ? 'text' : 'password'}
                  placeholder="tvly-..."
                  value={formData.tavily || ''}
                  onChange={(e) => handleChange('tavily', e.target.value)}
                  className="w-full rounded-lg border border-[#262b3c] bg-[#1a1d2b] px-3 py-2 pr-9 text-xs font-mono text-white placeholder-[#535970] focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShow('tavily')}
                  className="absolute right-2.5 top-2.5 text-[#717890] hover:text-white"
                >
                  {showKeys.tavily ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleTestKey('tavily')}
                disabled={verifying.tavily}
                className="rounded-lg border border-[#2d3449] bg-[#1e2336] px-3 py-2 text-xs font-medium text-white hover:bg-[#282f48] disabled:opacity-50"
              >
                {verifying.tavily ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Test Key'}
              </button>
            </div>

            {verificationResult.tavily && (
              <div
                className={`flex items-center gap-1.5 text-[11px] ${
                  verificationResult.tavily.success ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {verificationResult.tavily.success ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{verificationResult.tavily.message}</span>
              </div>
            )}
          </div>

          {/* 6. Serper Key */}
          <div className="rounded-xl border border-[#222738] bg-[#151722] p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <span>Serper.dev API Key</span>
                <span className="text-[10px] text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-1.5 py-0.2 rounded font-mono">
                  Google SERP JSON
                </span>
              </label>
              <a
                href="https://serper.dev"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Get Key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showKeys.serper ? 'text' : 'password'}
                  placeholder="serper-api-key..."
                  value={formData.serper || ''}
                  onChange={(e) => handleChange('serper', e.target.value)}
                  className="w-full rounded-lg border border-[#262b3c] bg-[#1a1d2b] px-3 py-2 pr-9 text-xs font-mono text-white placeholder-[#535970] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShow('serper')}
                  className="absolute right-2.5 top-2.5 text-[#717890] hover:text-white"
                >
                  {showKeys.serper ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleTestKey('serper')}
                disabled={verifying.serper}
                className="rounded-lg border border-[#2d3449] bg-[#1e2336] px-3 py-2 text-xs font-medium text-white hover:bg-[#282f48] disabled:opacity-50"
              >
                {verifying.serper ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Test Key'}
              </button>
            </div>

            {verificationResult.serper && (
              <div
                className={`flex items-center gap-1.5 text-[11px] ${
                  verificationResult.serper.success ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {verificationResult.serper.success ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{verificationResult.serper.message}</span>
              </div>
            )}
          </div>

          {/* 7. Brave Search Key */}
          <div className="rounded-xl border border-[#222738] bg-[#151722] p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <span>Brave Search API Key</span>
                <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.2 rounded font-mono">
                  Independent Index
                </span>
              </label>
              <a
                href="https://brave.com/search/api/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Get Key <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showKeys.brave ? 'text' : 'password'}
                  placeholder="BSA..."
                  value={formData.brave || ''}
                  onChange={(e) => handleChange('brave', e.target.value)}
                  className="w-full rounded-lg border border-[#262b3c] bg-[#1a1d2b] px-3 py-2 pr-9 text-xs font-mono text-white placeholder-[#535970] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => toggleShow('brave')}
                  className="absolute right-2.5 top-2.5 text-[#717890] hover:text-white"
                >
                  {showKeys.brave ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleTestKey('brave')}
                disabled={verifying.brave}
                className="rounded-lg border border-[#2d3449] bg-[#1e2336] px-3 py-2 text-xs font-medium text-white hover:bg-[#282f48] disabled:opacity-50"
              >
                {verifying.brave ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Test Key'}
              </button>
            </div>

            {verificationResult.brave && (
              <div
                className={`flex items-center gap-1.5 text-[11px] ${
                  verificationResult.brave.success ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {verificationResult.brave.success ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{verificationResult.brave.message}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[#8c92a4] hover:bg-rose-950/30 hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Stored Keys</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-medium text-[#9da5bc] hover:bg-[#1a1d29] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:bg-indigo-500"
              >
                {savedSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Saved to Local Storage!</span>
                  </>
                ) : (
                  <span>Save Keys to Vault</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
