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

const DEFAULT_ROLES: CanonicalWorkspaceConfig['roles'] = {
  architect: { provider: 'gemini', model: 'gemini-3.8-flash' },
  skeptic: { provider: 'gemini', model: 'gemini-3.8-flash' },
  verifier: { provider: 'gemini', model: 'gemini-3.8-flash' },
  arbiter: { provider: 'gemini', model: 'gemini-3.8-flash' },
};

export const providerConfigService = {
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
    const keys = current.keys || {};

    // Auto-resolve seats based on available keys if user hasn't explicitly set custom providers
    const resolveSeat = (roleKey: keyof CanonicalWorkspaceConfig['roles'], fallbackModel: string) => {
      const assigned = roles[roleKey];
      if (assigned && keys[assigned.provider]) {
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
