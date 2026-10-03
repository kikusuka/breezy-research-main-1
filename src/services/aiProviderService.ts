/**
 * Multi-Provider AI Service with Transparent Routing
 * Seamlessly integrates Backend Edge Proxy (Cloudflare / Deno / Render)
 * with Secure Client-Side Bring-Your-Own-Key (BYOK) proxying.
 * 
 * Truthful security model: Keys are stored locally and routed securely via edge backend proxies.
 * Never performs direct third-party browser-side requests.
 */

import { ProviderKeyConfig } from '../types';
import { apiClient } from './apiClient';
import { effectiveProviderService } from './effectiveProviderService';
import { providerConfigService } from './providerConfigService';

export const aiProviderService = {
  /**
   * Get stored user provider keys from localStorage
   */
  getStoredKeys(): ProviderKeyConfig {
    return providerConfigService.getKeys();
  },

  /**
   * Save user provider keys
   */
  saveStoredKeys(config: ProviderKeyConfig) {
    providerConfigService.saveKeys(config);
  },

  /**
   * Generate content with genuine failover across only CONFIGURED and ROUTABLE providers.
   * Never fabricates execution on unconfigured providers.
   */
  async generateWithFailover(
    prompt: string,
    systemInstruction?: string,
    temperature: number = 0.7
  ): Promise<{ text: string; providerUsed: string; modelUsed: string }> {
    const keys = this.getStoredKeys();
    const errors: string[] = [];

    // Check if any provider is actually configured
    const activeModel = effectiveProviderService.getActiveRoutableModel();
    if (!activeModel) {
      throw new Error('No AI providers configured. Please add an API key in Settings (BYOK) to run AI generation.');
    }

    // 1. Try primary active routable provider
    try {
      const res = await apiClient.chatBreezy({
        prompt,
        history: [],
        provider: activeModel.provider,
        model: activeModel.model,
        apiKey: keys[activeModel.provider] || undefined,
      });

      if (res && res.text) {
        const activeBackend = apiClient.getActiveEndpoint().name;
        return {
          text: res.text,
          providerUsed: `${activeModel.provider.toUpperCase()} (${activeModel.source === 'byok' ? 'BYOK via ' : ''}${activeBackend})`,
          modelUsed: activeModel.model,
        };
      }
    } catch (err: any) {
      errors.push(`${activeModel.provider}: ${err.message || 'Request failed'}`);
    }

    // 2. Try secondary configured providers if available
    const configured = ['gemini', 'groq', 'sambanova', 'openrouter', 'anthropic'].filter(
      (p) => p !== activeModel.provider && effectiveProviderService.isRoutable(p)
    );

    for (const p of configured) {
      try {
        const apiKey = keys[p] || undefined;
        const res = await apiClient.chatBreezy({
          prompt,
          history: [],
          provider: p,
          model: p === 'groq' ? 'llama-3.3-70b-versatile' : p === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gemini-2.5-flash',
          apiKey,
        });

        if (res && res.text) {
          const activeBackend = apiClient.getActiveEndpoint().name;
          return {
            text: res.text,
            providerUsed: `${p.toUpperCase()} (BYOK via ${activeBackend})`,
            modelUsed: p,
          };
        }
      } catch (err: any) {
        errors.push(`${p}: ${err.message}`);
      }
    }

    const summary = errors.length > 0 ? errors.join('; ') : 'All configured providers failed';
    throw new Error(`AI generation failed (${summary}). Please check your API keys or switch providers in Settings.`);
  },
};
