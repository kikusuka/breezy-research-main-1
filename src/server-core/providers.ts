/**
 * Universal AI Provider Streaming Engine
 * 100% Web Standards (fetch, ReadableStream, TextDecoder)
 * Compatible across Cloudflare Workers, Deno Deploy, and Node.js
 */

import { CallAgentParams, BackendEnv } from './types';

/**
 * Sanitize model names to valid supported versions
 */
export function sanitizeGeminiModel(m?: string): string {
  if (!m) return 'gemini-3.8-flash';
  const clean = m.trim();
  if (
    clean.includes('gemini-2.5') ||
    clean.includes('gemini-2.0') ||
    clean.includes('gemini-1.5') ||
    clean.includes('gemini-pro')
  ) {
    return 'gemini-3.8-flash';
  }
  return clean;
}

/**
 * Stream responses from Google Gemini REST API
 */
export async function streamGeminiREST(opts: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  userPrompt: string;
  temperature?: number;
  enableSearchGrounding?: boolean;
  onChunk: (chunk: string) => void;
}): Promise<string> {
  const { apiKey, model, systemInstruction, userPrompt, temperature = 0.7, enableSearchGrounding = false, onChunk } = opts;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

  const bodyPayload: any = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature,
    },
  };

  if (systemInstruction) {
    bodyPayload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  if (enableSearchGrounding) {
    bodyPayload.tools = [{ googleSearch: {} }];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'breezy-research-engine',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API returned HTTP ${response.status}: ${errorText}`);
  }

  if (!response.body) {
    throw new Error('No response body received from Gemini API');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const dataStr = trimmed.slice(6).trim();
      if (dataStr === '[DONE]') continue;

      try {
        const json = JSON.parse(dataStr);
        const candidates = json.candidates || [];
        for (const candidate of candidates) {
          const parts = candidate.content?.parts || [];
          for (const part of parts) {
            if (part.text) {
              fullText += part.text;
              onChunk(part.text);
            }
          }
        }
      } catch {
        // Skip incomplete chunks
      }
    }
  }

  return fullText;
}

/**
 * Stream OpenAI-compatible endpoints (Groq, SambaNova, OpenRouter)
 */
export async function streamOpenAICompatible(opts: {
  endpoint: string;
  apiKey: string;
  model: string;
  systemInstruction: string;
  userPrompt: string;
  temperature?: number;
  onChunk: (chunk: string) => void;
}): Promise<string> {
  const { endpoint, apiKey, model, systemInstruction, userPrompt, temperature = 0.7, onChunk } = opts;

  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: userPrompt });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature,
      messages,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Provider API error (${res.status}): ${errorBody}`);
  }

  if (!res.body) {
    throw new Error('No response body received from provider.');
  }

  let fullContent = '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (trimmed === 'data: [DONE]') continue;

      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            onChunk(delta);
          }
        } catch {
          // ignore incomplete json chunk in buffer
        }
      }
    }
  }

  return fullContent;
}

/**
 * Universal agent caller with graceful model cascades
 */
export async function callAgentWithStream(params: CallAgentParams): Promise<string> {
  const { provider, model, apiKey, systemInstruction, userPrompt, temperature = 0.7, enableSearchGrounding = false, onChunk, env = {} } = params;

  // 1. Google Gemini
  if (provider === 'gemini') {
    const keyToUse = apiKey?.trim() || env.GEMINI_API_KEY || '';
    if (!keyToUse) {
      throw new Error('No Gemini API key available. Provide a BYOK key in settings or configure GEMINI_API_KEY.');
    }

    const rawModel = sanitizeGeminiModel(model);
    const fallbackCandidates = [
      rawModel,
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
    ];
    const modelsToTry = Array.from(new Set(fallbackCandidates.filter(Boolean)));
    let lastError: any = null;
    let hadRateLimit = false;

    for (const m of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          let fullText = '';
          let announcedFallback = false;

          await streamGeminiREST({
            apiKey: keyToUse,
            model: m,
            systemInstruction,
            userPrompt,
            temperature,
            enableSearchGrounding,
            onChunk: (chunk) => {
              if (m !== rawModel && !announcedFallback) {
                const notice = `> *Model Notice: Requested model '${rawModel}' was unavailable. Continued with '${m}'.*\n\n`;
                onChunk(notice);
                fullText += notice;
                announcedFallback = true;
              }
              fullText += chunk;
              onChunk(chunk);
            },
          });

          if (fullText && fullText.trim().length > 0) {
            return fullText;
          }
        } catch (err: any) {
          lastError = err;
          const errDesc = err?.message || String(err);
          const isOverloadedOrQuota =
            errDesc.includes('429') ||
            errDesc.includes('503') ||
            errDesc.includes('quota') ||
            errDesc.includes('resource_exhausted') ||
            errDesc.includes('high demand');

          if (isOverloadedOrQuota) {
            hadRateLimit = true;
          }

          if (attempt === 1 && isOverloadedOrQuota) {
            await new Promise((r) => setTimeout(r, 600));
          } else {
            break;
          }
        }
      }
      await new Promise((r) => setTimeout(r, 250));
    }

    let errorMsg = lastError?.message || 'Failed to generate response across all Gemini model fallbacks.';
    try {
      const parsed = JSON.parse(errorMsg);
      if (parsed?.error?.message) {
        errorMsg = parsed.error.message;
      }
    } catch {}

    if (hadRateLimit) {
      throw new Error(
        `Gemini API is currently experiencing peak traffic / temporary rate limits. Please try again in a few moments, or configure a custom API key in Settings.`
      );
    }

    throw new Error(errorMsg);
  }

  // 2. Groq
  if (provider === 'groq') {
    const keyToUse = apiKey?.trim() || env.GROQ_API_KEY || '';
    if (!keyToUse) {
      throw new Error('Groq API Key is required for Groq models. Add your key in Settings.');
    }
    const targetModel = model?.trim() || 'llama-3.3-70b-versatile';
    return await streamOpenAICompatible({
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: keyToUse,
      model: targetModel,
      systemInstruction,
      userPrompt,
      temperature,
      onChunk,
    });
  }

  // 3. SambaNova
  if (provider === 'sambanova') {
    const keyToUse = apiKey?.trim() || env.SAMBANOVA_API_KEY || '';
    if (!keyToUse) {
      throw new Error('SambaNova API Key is required. Add your key in Settings.');
    }
    const targetModel = model?.trim() || 'Meta-Llama-3.3-70B-Instruct';
    return await streamOpenAICompatible({
      endpoint: 'https://api.sambanova.ai/v1/chat/completions',
      apiKey: keyToUse,
      model: targetModel,
      systemInstruction,
      userPrompt,
      temperature,
      onChunk,
    });
  }

  // 4. OpenRouter
  if (provider === 'openrouter') {
    const keyToUse = apiKey?.trim() || env.OPENROUTER_API_KEY || '';
    if (!keyToUse) {
      throw new Error('OpenRouter API Key is required. Add your key in Settings.');
    }
    const targetModel = model?.trim() || 'meta-llama/llama-3.3-70b-instruct';
    return await streamOpenAICompatible({
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: keyToUse,
      model: targetModel,
      systemInstruction,
      userPrompt,
      temperature,
      onChunk,
    });
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
