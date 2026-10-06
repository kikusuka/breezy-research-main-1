/**
 * Universal AI Provider Streaming Engine
 * 100% Web Standards (fetch, ReadableStream, TextDecoder)
 * Compatible across Cloudflare Workers, Deno Deploy, and Node.js
 */

import type { CallAgentParams, BackendEnv } from './types.ts';

/**
 * Sanitize model names to valid supported versions without destructive rewriting
 */
export const SUPPORTED_PROVIDER_MODELS: Record<string, readonly string[]> = {
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
  groq: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
  sambanova: ['Meta-Llama-3.3-70B-Instruct', 'Qwen2.5-72B-Instruct'],
  openrouter: ['meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-r1'],
  // Local/custom endpoints expose their own model catalog, so the server
  // validates only that a non-empty model id was supplied for these providers.
  ollama: [],
  'openai-compatible': [],
};

export function validateProviderModel(provider: string, model?: string): { valid: boolean; error?: string } {
  const normalizedProvider = provider.trim();
  const normalizedModel = model?.trim() || '';

  if (!normalizedModel) {
    return { valid: false, error: `No model configured for provider "${normalizedProvider}". Select a model before starting a request.` };
  }

  const knownModels = SUPPORTED_PROVIDER_MODELS[normalizedProvider];
  if (!knownModels) {
    return { valid: false, error: `Unsupported provider: ${normalizedProvider}` };
  }

  if (knownModels.length > 0 && !knownModels.includes(normalizedModel)) {
    return {
      valid: false,
      error: `Model "${normalizedModel}" is not a supported configured model for provider "${normalizedProvider}". Select a model from that provider's available model list.`,
    };
  }

  return { valid: true };
}

export function sanitizeGeminiModel(m?: string): string {
  if (!m) return 'gemini-2.5-flash';
  const clean = m.trim();
  return clean || 'gemini-2.5-flash';
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
  onUsage?: (usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number; reasoningTokens?: number; cachedInputTokens?: number }) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { apiKey, model, systemInstruction, userPrompt, temperature = 0.7, enableSearchGrounding = false, onChunk, onUsage, signal } = opts;

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
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
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
    signal,
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
        if (json.usageMetadata && onUsage) {
          onUsage({
            inputTokens: json.usageMetadata.promptTokenCount,
            outputTokens: json.usageMetadata.candidatesTokenCount,
            totalTokens: json.usageMetadata.totalTokenCount,
            reasoningTokens: json.usageMetadata.thoughtsTokenCount,
            cachedInputTokens: json.usageMetadata.cachedContentTokenCount,
          });
        }
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
  onUsage?: (usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number; reasoningTokens?: number; cachedInputTokens?: number }) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { endpoint, apiKey, model, systemInstruction, userPrompt, temperature = 0.7, onChunk, onUsage, signal } = opts;

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
      stream_options: { include_usage: true },
    }),
    signal,
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
          if (json.usage && onUsage) {
            onUsage({
              inputTokens: json.usage.prompt_tokens,
              outputTokens: json.usage.completion_tokens,
              totalTokens: json.usage.total_tokens,
              reasoningTokens: json.usage.completion_tokens_details?.reasoning_tokens,
              cachedInputTokens: json.usage.prompt_tokens_details?.cached_tokens,
            });
          }
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
 * Stream responses from Anthropic Messages REST API
 */
export async function streamAnthropicREST(opts: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  userPrompt: string;
  temperature?: number;
  onChunk: (chunk: string) => void;
  onUsage?: (usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number; reasoningTokens?: number }) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { apiKey, model, systemInstruction, userPrompt, temperature = 0.7, onChunk, onUsage, signal } = opts;
  const targetModel = model?.trim() || 'claude-3-5-sonnet-20241022';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: targetModel,
      max_tokens: 4096,
      system: systemInstruction || undefined,
      messages: [{ role: 'user', content: userPrompt }],
      stream: true,
      temperature,
    }),
    signal,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${errorBody}`);
  }

  if (!res.body) {
    throw new Error('No response body received from Anthropic.');
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
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.slice(6).trim();
      if (dataStr === '[DONE]') continue;

      try {
        const json = JSON.parse(dataStr);
        if (json.type === 'message_start' && json.message?.usage && onUsage) {
          onUsage({ inputTokens: json.message.usage.input_tokens, outputTokens: json.message.usage.output_tokens, totalTokens: (json.message.usage.input_tokens || 0) + (json.message.usage.output_tokens || 0) });
        }
        if (json.type === 'message_delta' && json.usage && onUsage) {
          onUsage({ outputTokens: json.usage.output_tokens });
        }
        if (json.type === 'content_block_delta' && json.delta?.text) {
          fullContent += json.delta.text;
          onChunk(json.delta.text);
        }
      } catch {
        // ignore incomplete json chunk in stream
      }
    }
  }

  return fullContent;
}

/**
 * Universal agent caller with graceful model cascades
 */
function requireModel(model: string | undefined, providerName: string): string {
  const value = model?.trim();
  if (!value) throw new Error(`No ${providerName} model configured. Select a model before starting a request.`);
  return value;
}

export async function callAgentWithStream(params: CallAgentParams): Promise<string> {
  const { provider, model, apiKey, systemInstruction, userPrompt, temperature = 0.7, enableSearchGrounding = false, onChunk, onUsage, env = {}, signal } = params;

  // 1. Google Gemini
  if (provider === 'gemini') {
    const keyToUse = apiKey?.trim() || env.GEMINI_API_KEY || '';
    if (!keyToUse) {
      throw new Error('No Gemini API key available. Provide a BYOK key in settings or configure GEMINI_API_KEY.');
    }

    // Never silently substitute a different Gemini model. The selected model is
    // part of the user's provider configuration and must be the model that runs.
    const targetModel = sanitizeGeminiModel(requireModel(model, 'Gemini'));
    let lastError: any = null;

    // Retry the exact same model once for transient quota/rate-limit failures.
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await streamGeminiREST({
          apiKey: keyToUse,
          model: targetModel,
          systemInstruction,
          userPrompt,
          temperature,
          enableSearchGrounding,
          onChunk,
          onUsage,
          signal,
        });
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const transientQuotaError =
          msg.includes('429') ||
          msg.includes('Quota') ||
          msg.includes('RESOURCE_EXHAUSTED');

        if (attempt === 1 && transientQuotaError) {
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }
        break;
      }
    }

    throw new Error(lastError?.message || 'Gemini agent stream failed.');
  }

  // 2. Anthropic
  if (provider === 'anthropic') {
    const keyToUse = apiKey?.trim() || env.ANTHROPIC_API_KEY || '';
    if (!keyToUse) {
      throw new Error('No Anthropic API key configured.');
    }
    const targetModel = model?.trim();
    if (!targetModel) throw new Error('No Anthropic model configured. Select a model before starting a request.');
    return streamAnthropicREST({
      apiKey: keyToUse,
      model: targetModel,
      systemInstruction,
      userPrompt,
      temperature,
      onChunk,
      onUsage,
      signal,
    });
  }

  // 3. Groq
  if (provider === 'groq') {
    const keyToUse = apiKey?.trim() || env.GROQ_API_KEY || '';
    if (!keyToUse) {
      throw new Error('No Groq API key configured.');
    }
    return streamOpenAICompatible({
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: keyToUse,
      model: requireModel(model, 'Groq'),
      systemInstruction,
      userPrompt,
      temperature,
      onChunk,
      onUsage,
      signal,
    });
  }

  // 4. SambaNova
  if (provider === 'sambanova') {
    const keyToUse = apiKey?.trim() || env.SAMBANOVA_API_KEY || '';
    if (!keyToUse) {
      throw new Error('No SambaNova API key configured.');
    }
    return streamOpenAICompatible({
      endpoint: 'https://api.sambanova.ai/v1/chat/completions',
      apiKey: keyToUse,
      model: requireModel(model, 'SambaNova'),
      systemInstruction,
      userPrompt,
      temperature,
      onChunk,
      onUsage,
      signal,
    });
  }

  // 5. OpenRouter
  if (provider === 'openrouter') {
    const keyToUse = apiKey?.trim() || env.OPENROUTER_API_KEY || '';
    if (!keyToUse) {
      throw new Error('No OpenRouter API key configured.');
    }
    return streamOpenAICompatible({
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: keyToUse,
      model: requireModel(model, 'OpenRouter'),
      systemInstruction,
      userPrompt,
      temperature,
      onChunk,
      onUsage,
      signal,
    });
  }

  if (provider === 'ollama') {
    const baseUrl = (env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
    return streamOpenAICompatible({
      endpoint: `${baseUrl}/v1/chat/completions`,
      apiKey: apiKey?.trim() || 'ollama',
      model: requireModel(model, 'Ollama'),
      systemInstruction,
      userPrompt,
      temperature,
      onChunk,
      onUsage,
      signal,
    });
  }

  if (provider === 'openai-compatible') {
    const baseUrl = (env.OPENAI_COMPATIBLE_BASE_URL || '').replace(/\/$/, '');
    if (!baseUrl) throw new Error('No OpenAI-compatible base URL configured.');
    return streamOpenAICompatible({
      endpoint: `${baseUrl}/chat/completions`,
      apiKey: apiKey?.trim() || 'none',
      model: requireModel(model, 'OpenAI-compatible'),
      systemInstruction,
      userPrompt,
      temperature,
      onChunk,
      onUsage,
      signal,
    });
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
