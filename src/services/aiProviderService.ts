/**
 * Multi-Provider AI Service with Transparent Routing
 * Seamlessly integrates Backend Edge Proxy (Cloudflare / Deno / Render)
 * with Client-Side Bring-Your-Own-Key (BYOK) fallback.
 * 
 * Truthful error handling: Never generates fake answers.
 */

import { GoogleGenAI } from '@google/genai';
import { ProviderKeyConfig } from '../types';
import { apiClient } from './apiClient';

export const aiProviderService = {
  /**
   * Get stored user provider keys from localStorage
   */
  getStoredKeys(): ProviderKeyConfig {
    try {
      const raw = localStorage.getItem('breezy_provider_keys') || localStorage.getItem('synthexis_provider_keys');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return {};
  },

  /**
   * Save user provider keys
   */
  saveStoredKeys(config: ProviderKeyConfig) {
    try {
      localStorage.setItem('breezy_provider_keys', JSON.stringify(config));
      localStorage.setItem('synthexis_provider_keys', JSON.stringify(config));
    } catch {}
  },

  /**
   * Generate content with genuine failover across available backend and BYOK providers.
   */
  async generateWithFailover(
    prompt: string,
    systemInstruction?: string,
    temperature: number = 0.7
  ): Promise<{ text: string; providerUsed: string; modelUsed: string }> {
    const keys = this.getStoredKeys();
    const errors: string[] = [];

    // 1. Try Primary Backend Proxy first (Cloudflare / Deno / Render)
    try {
      const res = await apiClient.chatBreezy({
        prompt,
        history: [],
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        apiKey: keys.gemini || undefined,
      });

      if (res && res.text) {
        const activeBackend = apiClient.getActiveEndpoint().name;
        return {
          text: res.text,
          providerUsed: `Google Gemini (${activeBackend})`,
          modelUsed: 'gemini-3.8-flash',
        };
      }
    } catch (err: any) {
      errors.push(`Backend API: ${err.message || 'Request failed'}`);
      console.warn('Backend proxy request failed, checking client-side BYOK keys...', err);
    }

    // 2. Direct Client-Side BYOK Gemini if configured
    if (keys.gemini || import.meta.env.VITE_GEMINI_API_KEY) {
      try {
        const geminiKey = keys.gemini || import.meta.env.VITE_GEMINI_API_KEY || '';
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            temperature,
          },
        });

        if (response && response.text) {
          return {
            text: response.text,
            providerUsed: 'Google Gemini (Client BYOK)',
            modelUsed: 'gemini-3.8-flash',
          };
        }
      } catch (err: any) {
        errors.push(`Client Gemini: ${err.message || 'Failed'}`);
      }
    }

    // 3. Client-Side BYOK Groq if configured
    if (keys.groq) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${keys.groq}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
              { role: 'user', content: prompt }
            ],
            temperature,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            return {
              text,
              providerUsed: 'Groq Cloud (Client BYOK)',
              modelUsed: 'llama-3.3-70b-versatile',
            };
          }
        } else {
          errors.push(`Groq: HTTP ${res.status}`);
        }
      } catch (err: any) {
        errors.push(`Groq: ${err.message}`);
      }
    }

    // 4. Client-Side BYOK OpenRouter if configured
    if (keys.openrouter) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${keys.openrouter}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Breezy Research',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.3-70b-instruct',
            messages: [
              ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
              { role: 'user', content: prompt }
            ],
            temperature,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            return {
              text,
              providerUsed: 'OpenRouter (Client BYOK)',
              modelUsed: 'meta-llama/llama-3.3-70b-instruct',
            };
          }
        } else {
          errors.push(`OpenRouter: HTTP ${res.status}`);
        }
      } catch (err: any) {
        errors.push(`OpenRouter: ${err.message}`);
      }
    }

    // 5. Honest Failure
    const summary = errors.length > 0 ? errors.join('; ') : 'No valid API keys configured';
    throw new Error(`AI providers unavailable (${summary}). Please configure an active API key in Settings.`);
  }
};
