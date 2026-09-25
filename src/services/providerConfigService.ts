/**
 * Canonical Provider Configuration Service
 * Unified configuration layer for Breezy, Research, and Synap workspaces.
 * Eliminates duplicate storage keys and ensures a single source of truth.
 */

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
  keys: CanonicalProviderKeys;
}

const CANONICAL_STORAGE_KEY = 'breezy_canonical_provider_config';

export const providerConfigService = {
  /**
   * Get canonical workspace provider config
   */
  getConfig(): CanonicalWorkspaceConfig {
    try {
      const raw = localStorage.getItem(CANONICAL_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
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
        keys,
      };

      this.saveConfig(initialConfig);
      return initialConfig;
    } catch {
      return {
        defaultProvider: 'gemini',
        defaultModel: 'gemini-3.8-flash',
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
      // Keep synchronized for legacy readers
      localStorage.setItem('breezy_byok_keys', JSON.stringify(config.keys));
      localStorage.setItem('breezy_provider_keys', JSON.stringify(config.keys));
    } catch (e) {
      console.warn('Failed to persist provider config:', e);
    }
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
