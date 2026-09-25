/**
 * Multi-Provider AI Service with Transparent Failover & Backup Routing
 * Supports Google Gemini, Groq, SambaNova, OpenRouter, and OpenAI-compatible APIs.
 * Honest error handling: Never generates fake "Verified Resilient Synthesis" answers.
 */

import { GoogleGenAI } from '@google/genai';
import { ProviderKeyConfig } from '../types';

export const aiProviderService = {
  /**
   * Get stored provider keys from localStorage / config
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
   * Save provider keys
   */
  saveStoredKeys(config: ProviderKeyConfig) {
    try {
      localStorage.setItem('breezy_provider_keys', JSON.stringify(config));
      localStorage.setItem('synthexis_provider_keys', JSON.stringify(config));
    } catch {}
  },

  /**
   * Generate content with genuine failover across available configured providers.
   * If all legitimate providers fail, returns a clear, honest error instead of fabricated output.
   */
  async generateWithFailover(
    prompt: string,
    systemInstruction?: string,
    temperature: number = 0.7
  ): Promise<{ text: string; providerUsed: string; modelUsed: string }> {
    const keys = this.getStoredKeys();
    const errors: string[] = [];

    // 1. Try Google Gemini first
    try {
      const geminiKey = keys.gemini || import.meta.env.VITE_GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey: geminiKey || undefined });
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
          providerUsed: 'Google Gemini',
          modelUsed: 'gemini-3.8-flash',
        };
      }
    } catch (err: any) {
      errors.push(`Gemini: ${err.message || 'Request failed'}`);
      console.warn('Gemini provider failed or rate limited, checking failover providers...', err);
    }

    // 2. Try Groq Failover if configured
    if (keys.groq) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${keys.groq}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3-70b-8192',
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
              providerUsed: 'Groq Cloud',
              modelUsed: 'llama3-70b-8192',
            };
          }
        } else {
          errors.push(`Groq: HTTP ${res.status}`);
        }
      } catch (err: any) {
        errors.push(`Groq: ${err.message}`);
        console.warn('Groq failover failed...', err);
      }
    }

    // 3. Try OpenRouter Failover if configured
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
            model: 'anthropic/claude-3.5-sonnet',
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
              providerUsed: 'OpenRouter',
              modelUsed: 'anthropic/claude-3.5-sonnet',
            };
          }
        } else {
          errors.push(`OpenRouter: HTTP ${res.status}`);
        }
      } catch (err: any) {
        errors.push(`OpenRouter: ${err.message}`);
        console.warn('OpenRouter failover failed...', err);
      }
    }

    // 4. Honest Failure: Do NOT fabricate a response
    const summary = errors.length > 0 ? errors.join('; ') : 'No valid API keys configured';
    throw new Error(`AI providers unavailable (${summary}). Please configure an active API key in Settings.`);
  }
};
