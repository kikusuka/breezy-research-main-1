/**
 * Canonical Provider Configuration Service
 * Unified configuration layer for Breezy, Research, and Synap workspaces.
 * Eliminates duplicate storage keys and ensures a single source of truth.
 */

export interface RoleSeatConfig {
  provider: 'gemini' | 'groq' | 'sambanova' | 'openrouter' | 'anthropic';
  model: string;
}

export interface CanonicalProviderKeys {
  gemini?: string;
  groq?: string;
  sambanova?: string;
  openrouter?: string;
  tavily?: string;
  serper?: string;
  brave?: string;
  anthropic?: string;
  [key: string]: string | undefined;
}

export const AVAILABLE_MODELS: Record<string, { id: string; name: string; description: string }[]> = {
  gemini: [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', description: 'Fast, highly intelligent reasoning & code' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', description: 'Ultra-lightweight low-latency model' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Best-in-class deep reasoning & analytical synthesis' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Ultra-fast lightweight Claude model' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', description: 'Groq LPUs ultra-fast open weights reasoning' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B Instruct', description: 'Fast MoE architecture' },
  ],
  sambanova: [
    { id: 'Meta-Llama-3.3-70B-Instruct', name: 'Meta Llama 3.3 70B', description: 'High-speed SambaNova reconfigurable dataflow' },
    { id: 'Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B Instruct', description: 'Top open coding & math model' },
  ],
  openrouter: [
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (OpenRouter)', description: 'Unified router access' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (OpenRouter)', description: 'Deep reasoning & chain-of-thought verification' },
  ],
};

export interface CanonicalWorkspaceConfig {
  defaultProvider: 'gemini' | 'groq' | 'sambanova' | 'openrouter' | 'anthropic';
  defaultModel: string;
  preset: 'fast' | 'balanced' | 'deep' | 'custom';
  roles: {
    architect: RoleSeatConfig;
    skeptic: RoleSeatConfig;
    verifier: RoleSeatConfig;
    arbiter: RoleSeatConfig;
  };
  fallback: {
    enabled: boolean;
    provider: 'gemini';
    model: string;
  };
  keys: CanonicalProviderKeys;
}

const CANONICAL_STORAGE_KEY = 'breezy_canonical_provider_config';

export const PRESET_ROLE_CONFIGS: Record<string, CanonicalWorkspaceConfig['roles']> = {
  fast: {
    architect: { provider: 'gemini', model: 'gemini-3.8-flash' },
    skeptic: { provider: 'gemini', model: 'gemini-3.8-flash' },
    verifier: { provider: 'gemini', model: 'gemini-3.8-flash' },
    arbiter: { provider: 'gemini', model: 'gemini-3.8-flash' },
  },
  balanced: {
    architect: { provider: 'gemini', model: 'gemini-3.8-flash' },
    skeptic: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
    verifier: { provider: 'gemini', model: 'gemini-3.8-flash' },
    arbiter: { provider: 'gemini', model: 'gemini-3.8-flash' },
  },
  deep: {
    architect: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
    skeptic: { provider: 'groq', model: 'llama-3.3-70b-versatile' },
    verifier: { provider: 'sambanova', model: 'Qwen2.5-72B-Instruct' },
    arbiter: { provider: 'gemini', model: 'gemini-3.8-flash' },
  },
};

const DEFAULT_ROLES: CanonicalWorkspaceConfig['roles'] = PRESET_ROLE_CONFIGS.balanced;

export const providerConfigService = {
  /**
   * Apply preset and update role seat assignments canonically
   */
  applyPreset(presetId: 'fast' | 'balanced' | 'deep' | 'custom'): CanonicalWorkspaceConfig {
    const current = this.getConfig();
    const targetRoles = PRESET_ROLE_CONFIGS[presetId];
    const updated: CanonicalWorkspaceConfig = {
      ...current,
      preset: presetId,
      roles: targetRoles ? { ...targetRoles } : current.roles,
    };
    this.saveConfig(updated);
    return updated;
  },

  /**
   * Get canonical workspace provider config
   */
  getConfig(): CanonicalWorkspaceConfig {
    try {
      const raw = localStorage.getItem(CANONICAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          defaultProvider: parsed.defaultProvider || 'gemini',
          defaultModel: parsed.defaultModel || 'gemini-3.8-flash',
          preset: parsed.preset || 'balanced',
          roles: { ...DEFAULT_ROLES, ...parsed.roles },
          fallback: parsed.fallback || { enabled: true, provider: 'gemini', model: 'gemini-3.8-flash' },
          keys: parsed.keys || {},
        };
      }

      // Backwards-compatibility migration from legacy keys
      const legacyKeysRaw =
        localStorage.getItem('breezy_byok_keys') ||
        localStorage.getItem('breezy_provider_keys') ||
        localStorage.getItem('synthexis_byok_keys');
      const legacySynapRaw = localStorage.getItem('synap:provider');

      const keys: CanonicalProviderKeys = legacyKeysRaw ? JSON.parse(legacyKeysRaw) : {};
      let defaultProvider: any = 'gemini';
      let defaultModel = 'gemini-3.8-flash';

      if (legacySynapRaw) {
        try {
          const synap = JSON.parse(legacySynapRaw);
          if (synap.key && !keys[synap.type]) {
            keys[synap.type] = synap.key;
          }
        } catch {}
      }

      const initialConfig: CanonicalWorkspaceConfig = {
        defaultProvider,
        defaultModel,
        preset: 'balanced',
        roles: DEFAULT_ROLES,
        fallback: { enabled: true, provider: 'gemini', model: 'gemini-3.8-flash' },
        keys,
      };

      this.saveConfig(initialConfig);
      return initialConfig;
    } catch {
      return {
        defaultProvider: 'gemini',
        defaultModel: 'gemini-3.8-flash',
        preset: 'balanced',
        roles: DEFAULT_ROLES,
        fallback: { enabled: true, provider: 'gemini', model: 'gemini-3.8-flash' },
        keys: {},
      };
    }
  },

  /**
   * Save canonical configuration
   */
  saveConfig(config: CanonicalWorkspaceConfig): void {
    try {
      localStorage.setItem(CANONICAL_STORAGE_KEY, JSON.stringify(config));
      localStorage.setItem('breezy_byok_keys', JSON.stringify(config.keys));
      localStorage.setItem('breezy_provider_keys', JSON.stringify(config.keys));
    } catch (e) {
      console.warn('Failed to persist provider config:', e);
    }
  },

  /**
   * Build seats payload for streamDebate API request
   */
  getSeatsPayload(config?: CanonicalWorkspaceConfig) {
    const current = config || this.getConfig();
    const roles = current.roles || DEFAULT_ROLES;

    const resolveSeat = (roleKey: keyof CanonicalWorkspaceConfig['roles'], fallbackModel: string) => {
      const assigned = roles[roleKey];
      if (assigned && assigned.provider && assigned.model) {
        return { provider: assigned.provider, model: assigned.model };
      }
      return { provider: 'gemini', model: fallbackModel };
    };

    return {
      architect: resolveSeat('architect', 'gemini-3.8-flash'),
      skeptic: resolveSeat('skeptic', 'gemini-3.8-flash'),
      verifier: resolveSeat('verifier', 'gemini-3.8-flash'),
      arbiter: resolveSeat('arbiter', 'gemini-3.8-flash'),
    };
  },

  /**
   * Get all active keys
   */
  getKeys(): CanonicalProviderKeys {
    return this.getConfig().keys;
  },

  /**
   * Save updated keys
   */
  saveKeys(keys: CanonicalProviderKeys): void {
    const config = this.getConfig();
    config.keys = keys;
    this.saveConfig(config);
  },

  /**
   * Get a specific key
   */
  getKey(provider: string): string | undefined {
    return this.getKeys()[provider];
  },
};
