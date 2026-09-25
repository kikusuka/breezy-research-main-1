import React, { useState } from 'react';
import { SynapProviderConfig } from '../../types/synap';

interface SynapProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SynapProviderConfig;
  onSaveConfig: (config: SynapProviderConfig) => void;
}

export const SynapProviderModal: React.FC<SynapProviderModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [type, setType] = useState<'gemini' | 'openai' | 'anthropic'>(
    config.type || 'gemini'
  );
  const [baseUrl, setBaseUrl] = useState(config.baseUrl || '');
  const [model, setModel] = useState(config.model || 'gemini-3.8-flash');
  const [key, setKey] = useState(config.key || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      type,
      baseUrl: type === 'openai' ? baseUrl.trim() : undefined,
      model: model.trim(),
      key: key.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#181824] rounded-2xl border border-white/10 p-6 shadow-2xl flex flex-col gap-4 text-stone-100">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ccbdff] text-[22px]">
              settings_suggest
            </span>
            <h2 className="font-sans text-base font-bold">
              Provider Settings (BYOK)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#cac4d4] hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <p className="font-sans text-xs text-[#cac4d4] leading-relaxed">
          Keys are stored locally in your browser and used only to query model endpoints directly.
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] text-[#cac4d4]">
              Provider Architecture
            </label>
            <select
              value={type}
              onChange={(e) => {
                const val = e.target.value as any;
                setType(val);
                if (val === 'gemini') setModel('gemini-3.8-flash');
                else if (val === 'anthropic') setModel('claude-3-5-sonnet-20241022');
                else setModel('llama3-70b-8192');
              }}
              className="bg-[#0E0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2]"
            >
              <option value="gemini">Google Gemini (Default)</option>
              <option value="openai">OpenAI-Compatible (Groq, Together, Ollama)</option>
              <option value="anthropic">Anthropic Claude</option>
            </select>
          </div>

          {type === 'openai' && (
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[11px] text-[#cac4d4]">
                Base Endpoint URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.groq.com/openai/v1"
                className="bg-[#0E0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2]"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] text-[#cac4d4]">
              Model Name
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gemini-3.8-flash or llama3-70b-8192"
              className="bg-[#0E0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] text-[#cac4d4]">
              API Key (BYOK)
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Paste provider key (sk-... or AIza...)"
              className="bg-[#0E0E16] border border-white/10 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-[#9d85f2]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#cac4d4] hover:text-white hover:bg-white/5 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#ccbdff] text-[#331282] text-xs font-bold hover:bg-white transition-all shadow-md cursor-pointer"
          >
            Save Provider Settings
          </button>
        </div>
      </div>
    </div>
  );
};
