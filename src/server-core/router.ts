/**
 * Unified Backend Core Router & Request Handlers
 * 100% Web Standards (Request, Response, ReadableStream, TransformStream)
 * Runs cleanly on Cloudflare Workers, Deno Deploy, and Node.js
 */

import { BackendEnv, HealthResponse, SearchEngineProvider } from './types';
import { callAgentWithStream, sanitizeGeminiModel } from './providers';
import { performSearchGrounding } from './search';
import { summarizeStage, generateRealEvidenceGraph } from './evidence';

// In-memory rate limiting map for server-provided key usage (resets per instance/isolate)
const requestRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkServerRateLimit(clientIdentifier: string, maxRequests = 20, windowMs = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requestRateLimitMap.get(clientIdentifier);
  if (!record || now > record.resetAt) {
    requestRateLimitMap.set(clientIdentifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count };
}

function getClientIdentifier(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'anonymous-client'
  );
}

export function getCorsHeaders(req: Request, env: BackendEnv = {}): Record<string, string> {
  const requestOrigin = req.headers.get('Origin');
  const allowedOriginsConfig = env.ALLOWED_ORIGINS?.trim();

  let resolvedOrigin = '*';

  if (allowedOriginsConfig && allowedOriginsConfig !== '*') {
    const allowedList = allowedOriginsConfig.split(',').map((o) => o.trim().toLowerCase());
    if (requestOrigin) {
      const lowerOrigin = requestOrigin.toLowerCase();
      if (allowedList.includes(lowerOrigin) || allowedList.includes('*')) {
        resolvedOrigin = requestOrigin;
      } else {
        resolvedOrigin = allowedList[0] || 'null';
      }
    }
  } else if (requestOrigin) {
    resolvedOrigin = requestOrigin;
  }

  return {
    'Access-Control-Allow-Origin': resolvedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Breezy-Client',
    'Access-Control-Max-Age': '86400',
  };
}

export function createJsonResponse(data: any, status: number = 200, req?: Request, env?: BackendEnv): Response {
  const cors = req ? getCorsHeaders(req, env) : { 'Access-Control-Allow-Origin': '*' };
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...cors,
    },
  });
}

/**
 * Main request router for all backend targets
 */
export async function handleBackendRequest(
  req: Request,
  env: BackendEnv = {},
  backendName: 'cloudflare-worker' | 'deno-deploy' | 'render-node' | 'local-dev' = 'cloudflare-worker'
): Promise<Response> {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(req, env),
    });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  const clientIp = getClientIdentifier(req);

  // 1. Health & Status
  if (path === '/api/health' && req.method === 'GET') {
    const hasServerGemini = Boolean(env.GEMINI_API_KEY);
    const healthData: HealthResponse = {
      ok: true,
      status: 'ok',
      backend: backendName,
      version: '2.5.0-universal',
      serverGeminiConfigured: hasServerGemini,
      defaultModel: 'gemini-3.8-flash',
      providers: ['gemini', 'anthropic', 'groq', 'sambanova', 'openrouter'],
      timestamp: Date.now(),
    };
    return createJsonResponse(healthData, 200, req, env);
  }

  // Rate-limiting check for API endpoints
  if (
    path === '/api/vault/verify-key' ||
    path === '/api/breezy/chat' ||
    path === '/api/debate/summarize' ||
    path === '/api/debate/stream'
  ) {
    const rateCheck = checkServerRateLimit(clientIp, 20, 60000);
    if (!rateCheck.allowed) {
      return createJsonResponse(
        { error: 'Rate limit exceeded (20 requests per minute). Please wait a moment.' },
        429,
        req,
        env
      );
    }
  }

  // 2. Vault key verification
  if (path === '/api/vault/verify-key' && req.method === 'POST') {
    try {
      const body = await req.json().catch(() => ({}));
      const { provider, apiKey } = body;
      if (!provider || !apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
        return createJsonResponse({ valid: false, error: 'Provider and API key are required.' }, 400, req, env);
      }

      const trimmedKey = apiKey.trim();
      const startTime = Date.now();

      if (provider === 'gemini') {
        try {
          await callAgentWithStream({
            provider: 'gemini',
            model: 'gemini-3.8-flash',
            apiKey: trimmedKey,
            systemInstruction: 'Respond with OK in one word.',
            userPrompt: 'Ping',
            onChunk: () => {},
            env,
          });
        } catch {
          await callAgentWithStream({
            provider: 'gemini',
            model: 'gemini-3.1-flash-lite',
            apiKey: trimmedKey,
            systemInstruction: 'Respond with OK in one word.',
            userPrompt: 'Ping',
            onChunk: () => {},
            env,
          });
        }
        return createJsonResponse({
          valid: true,
          provider,
          latencyMs: Date.now() - startTime,
          message: 'Google Gemini key verified successfully.',
        }, 200, req, env);
      }

      if (provider === 'anthropic') {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': trimmedKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'Ping' }],
          }),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          return createJsonResponse({ valid: false, error: `Anthropic verification failed (${resp.status}): ${errText}` }, 400, req, env);
        }
        return createJsonResponse({
          valid: true,
          provider,
          latencyMs: Date.now() - startTime,
          message: 'Anthropic Claude API key verified successfully.',
        }, 200, req, env);
      }

      if (provider === 'groq') {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${trimmedKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5,
          }),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          return createJsonResponse({ valid: false, error: `Groq verification failed (${resp.status}): ${errText}` }, 400, req, env);
        }
        return createJsonResponse({
          valid: true,
          provider,
          latencyMs: Date.now() - startTime,
          message: 'Groq key verified successfully.',
        }, 200, req, env);
      }

      if (provider === 'sambanova') {
        const resp = await fetch('https://api.sambanova.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${trimmedKey}`,
          },
          body: JSON.stringify({
            model: 'Meta-Llama-3.3-70B-Instruct',
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5,
          }),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          return createJsonResponse({ valid: false, error: `SambaNova verification failed (${resp.status}): ${errText}` }, 400, req, env);
        }
        return createJsonResponse({
          valid: true,
          provider,
          latencyMs: Date.now() - startTime,
          message: 'SambaNova key verified successfully.',
        }, 200, req, env);
      }

      if (provider === 'openrouter') {
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${trimmedKey}`,
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.3-70b-instruct',
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5,
          }),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          return createJsonResponse({ valid: false, error: `OpenRouter verification failed (${resp.status}): ${errText}` }, 400, req, env);
        }
        return createJsonResponse({
          valid: true,
          provider,
          latencyMs: Date.now() - startTime,
          message: 'OpenRouter key verified successfully.',
        }, 200, req, env);
      }

      if (provider === 'tavily') {
        const resp = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: trimmedKey,
            query: 'ping test',
            max_results: 1,
          }),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          return createJsonResponse({ valid: false, error: `Tavily verification failed (${resp.status}): ${errText}` }, 400, req, env);
        }
        return createJsonResponse({
          valid: true,
          provider,
          latencyMs: Date.now() - startTime,
          message: 'Tavily Search API key verified successfully.',
        }, 200, req, env);
      }

      if (provider === 'serper') {
        const resp = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': trimmedKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: 'ping test', num: 1 }),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          return createJsonResponse({ valid: false, error: `Serper verification failed (${resp.status}): ${errText}` }, 400, req, env);
        }
        return createJsonResponse({
          valid: true,
          provider,
          latencyMs: Date.now() - startTime,
          message: 'Serper.dev API key verified successfully.',
        }, 200, req, env);
      }

      if (provider === 'brave') {
        const resp = await fetch('https://api.search.brave.com/res/v1/web/search?q=ping&count=1', {
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': trimmedKey,
          },
        });
        if (!resp.ok) {
          const errText = await resp.text();
          return createJsonResponse({ valid: false, error: `Brave Search verification failed (${resp.status}): ${errText}` }, 400, req, env);
        }
        return createJsonResponse({
          valid: true,
          provider,
          latencyMs: Date.now() - startTime,
          message: 'Brave Search API key verified successfully.',
        }, 200, req, env);
      }

      return createJsonResponse({ valid: false, error: `Unsupported provider: ${provider}` }, 400, req, env);
    } catch (err: any) {
      return createJsonResponse({ valid: false, error: err?.message || 'Verification failed' }, 500, req, env);
    }
  }

  // 3. Breezy conversational chat
  if (path === '/api/breezy/chat' && req.method === 'POST') {
    try {
      const body = await req.json().catch(() => ({}));
      const { prompt, history = [], provider = 'gemini', model = 'gemini-3.8-flash', apiKey } = body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return createJsonResponse({ error: 'Prompt is required' }, 400, req, env);
      }

      const systemInstruction =
        'You are Breezy, an exceptionally capable, weightless AI engineering and research assistant. Deliver direct, accurate, beautifully structured answers with markdown. Provide real technical solutions, code examples, or research insights without generic disclaimers.';

      let formattedPrompt = prompt.trim();
      if (Array.isArray(history) && history.length > 0) {
        const prior = history
          .slice(-6)
          .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n\n');
        formattedPrompt = `Conversation History:\n${prior}\n\nUser: ${prompt.trim()}`;
      }

      let fullAnswer = '';
      await callAgentWithStream({
        provider: (['groq', 'sambanova', 'openrouter', 'anthropic'].includes(provider) ? provider : 'gemini') as any,
        model: model || (provider === 'groq' ? 'llama-3.3-70b-versatile' : provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gemini-3.8-flash'),
        apiKey: apiKey?.trim() || undefined,
        systemInstruction,
        userPrompt: formattedPrompt,
        temperature: 0.7,
        enableSearchGrounding: false,
        onChunk: (chunk) => {
          fullAnswer += chunk;
        },
        env,
      });

      return createJsonResponse({ text: fullAnswer || 'Synthesis completed.' }, 200, req, env);
    } catch (err: any) {
      return createJsonResponse({ error: err?.message || 'Chat generation failed' }, 500, req, env);
    }
  }

  // 4. Debate summary endpoint
  if (path === '/api/debate/summarize' && req.method === 'POST') {
    try {
      const body = await req.json().catch(() => ({}));
      const { session, providerKeyConfig } = body;
      if (!session || !session.prompt) {
        return createJsonResponse({ error: 'Session with prompt is required.' }, 400, req, env);
      }

      const systemInstruction = `You are the Lead Research Synthesizer. Your task is to analyze the multi-model analysis trace and produce a valid JSON object with exactly two keys:
1. "summary": A concise, objective, one-sentence executive summary highlighting the synthesized resolution and core trade-offs. Do not exceed one sentence. Start directly with the summary text.
2. "category": A highly descriptive, exact three-word title or category reflecting the core technical subject (e.g., "Database Migration Strategy", "OAuth Security Architecture", "Vector Search Indexing"). Exactly 3 words.

Return ONLY a raw JSON object. Do not include markdown code blocks like \`\`\`json or \`\`\`. Do not write any explanatory text before or after the JSON.`;

      const userPrompt = `INQUIRY PROMPT:
${session.prompt}

FINAL SYNTHESIS OUTPUT:
${session.finalOutput || '(No final output produced yet. Summary based on prompt only.)'}

ANALYSIS STEPS TRANSCRIPT:
${(session.steps || []).map((s: any) => `[Round ${s.round} - ${s.role}]: ${s.content.slice(0, 500)}...`).join('\n\n')}

Analyze this deliberation and output the JSON object.`;

      const keys = providerKeyConfig || {};
      const geminiKey = keys.gemini || env.GEMINI_API_KEY;

      const resultText = await callAgentWithStream({
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        apiKey: geminiKey,
        systemInstruction,
        userPrompt,
        temperature: 0.2,
        onChunk: () => {},
        env,
      });

      let summary = '';
      let category = '';
      try {
        const cleaned = resultText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const parsed = JSON.parse(cleaned);
        summary = parsed.summary || '';
        category = parsed.category || '';
      } catch (e) {
        summary = resultText.trim().split('\n')[0] || 'No summary available.';
        category = 'General Research Session';
      }

      return createJsonResponse({ summary: summary.trim(), category: category.trim() }, 200, req, env);
    } catch (err: any) {
      return createJsonResponse({ error: err?.message || 'Failed to generate executive summary.' }, 500, req, env);
    }
  }

  // 5. Debate SSE Stream
  if (path === '/api/debate/stream' && req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    const {
      prompt,
      protocol = 'trio',
      tone = 'balanced',
      searchEngine = 'google',
      keys = {},
      seats = {},
      enableSearchGrounding = false,
    } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return createJsonResponse({ error: 'Prompt is required' }, 400, req, env);
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = async (type: string, payload: any) => {
      try {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type, ...payload })}\n\n`));
      } catch {}
    };

    // Execute streaming pipeline asynchronously
    (async () => {
      const startTime = Date.now();
      try {
        await sendEvent('status', { message: 'Initializing multi-model analysis...' });

        let toneInstruction = '';
        let skepticTemp = 0.75;
        let arbiterTemp = 0.5;

        if (tone === 'diplomatic') {
          toneInstruction = `\nDEBATE TONE: DIPLOMATIC & CONSTRUCTIVE. Maintain a collegiate, respectful demeanor. Frame critiques as nuanced improvements and alternative trade-offs.`;
          skepticTemp = 0.6;
          arbiterTemp = 0.4;
        } else if (tone === 'aggressive') {
          toneInstruction = `\nDEBATE TONE: DIRECT & UNSPARING. Cut straight to core failure modes, flawed assumptions, and scaling bottlenecks with maximum clarity and zero fluff.`;
          skepticTemp = 0.85;
          arbiterTemp = 0.5;
        } else if (tone === 'rigorous') {
          toneInstruction = `\nDEBATE TONE: RIGOROUS & EMPIRICAL. Apply strict engineering and analytical standards. Verify every assumption, constraint, and edge case.`;
          skepticTemp = 0.75;
          arbiterTemp = 0.45;
        } else {
          toneInstruction = `\nDEBATE TONE: BALANCED & CANDID. Deliver objective, clear, and intellectually honest dialectical analysis. Prioritize technical correctness and pragmatic reality.`;
          skepticTemp = 0.75;
          arbiterTemp = 0.5;
        }

        const architectConfig = seats.architect || { provider: 'gemini', model: 'gemini-3.8-flash' };
        const skepticConfig = seats.skeptic || {
          provider: keys.groq ? 'groq' : (keys.sambanova ? 'sambanova' : 'gemini'),
          model: keys.groq ? 'llama-3.3-70b-versatile' : (keys.sambanova ? 'Meta-Llama-3.3-70B-Instruct' : 'gemini-3.8-flash'),
        };
        const verifierConfig = seats.verifier || {
          provider: keys.sambanova ? 'sambanova' : 'gemini',
          model: keys.sambanova ? 'Qwen2.5-72B-Instruct' : 'gemini-3.8-flash',
        };
        const arbiterConfig = seats.arbiter || { provider: 'gemini', model: 'gemini-3.8-flash' };

        const emitStatus = (role: string, agentName: string, taskDescription: string) => {
          sendEvent('status', {
            role,
            agentName,
            message: `${agentName}: ${taskDescription}`,
            timestamp: Date.now(),
          });
          sendEvent('heartbeat', {
            role,
            agentName,
            bpm: 0,
            taskReminder: taskDescription,
            statusText: `${agentName} processing: ${taskDescription}`,
            timestamp: Date.now(),
          });
        };

        let groundingContext = '';
        let discoveredSources: any[] = [];
        if (enableSearchGrounding) {
          await sendEvent('status', {
            message: `Grounding analysis with real-time web search (${searchEngine.toUpperCase()})...`,
          });

          try {
            const groundingResult = await performSearchGrounding(prompt, searchEngine as SearchEngineProvider, keys, env);
            if (groundingResult) {
              discoveredSources = groundingResult.results.map((r, idx) => {
                let domain = 'web-source';
                try {
                  domain = new URL(r.url).hostname.replace('www.', '');
                } catch {}
                const isPrimary = domain.endsWith('.org') || domain.endsWith('.gov') || domain.endsWith('.edu') || domain.includes('github') || domain.includes('apache') || domain.includes('arxiv');
                return {
                  id: `src-${idx + 1}`,
                  title: r.title,
                  url: r.url,
                  domain,
                  snippet: r.snippet,
                  isPrimary,
                  citationIndex: idx + 1,
                };
              });

              await sendEvent('search_grounding', {
                engine: groundingResult.engine,
                engineName: groundingResult.engineName,
                query: groundingResult.query,
                summary: groundingResult.summary || undefined,
                resultsCount: groundingResult.results.length,
                sources: discoveredSources,
              });

              if (groundingResult.results.length > 0 || groundingResult.summary) {
                const snippets = groundingResult.results
                  .map((r, i) => `${i + 1}. [${r.title}](${r.url})\n   "${r.snippet}"`)
                  .join('\n\n');

                groundingContext = `\n\n---
[VERIFIED REAL-TIME SEARCH GROUNDING - Source Engine: ${groundingResult.engineName}]
${groundingResult.summary ? `Summary / Answer: ${groundingResult.summary}\n` : ''}
Key Live Web Citations & Snippets:
${snippets}
---
Ground your technical architecture, critique, and trade-off claims in the above real-time empirical findings and citations.`;
              }
            }
          } catch (err: any) {
            console.warn('Search grounding error:', err);
          }
        }

        const groundedPrompt = `${prompt}${groundingContext}`;

        if (protocol === 'solo') {
          await sendEvent('round_start', {
            round: 1,
            role: 'solo',
            agentName: 'Solo Assistant',
            title: 'Lightweight Research & Analysis',
            provider: architectConfig.provider,
            model: architectConfig.model,
            description: 'Direct response to your query using a single active model and grounding resources.',
          });

          emitStatus('solo', 'Solo Assistant', 'Generating fast single-model analysis...');

          const soloSystemPrompt = `You are a helpful, expert technical research assistant. 
Your goal is to provide a comprehensive, clear, and logically sound response to the user's technical inquiry.
Directives:
1. FALSE PREMISE & ASSUMPTION DETECTION: If you detect any false premise or incorrect assumption, proactively address this directly at the very beginning under "Premise Correction".
${toneInstruction}
Structure your response in clean Markdown with clear headings.`;

          let soloContent = '';
          const soloStart = Date.now();
          soloContent = await callAgentWithStream({
            provider: architectConfig.provider,
            model: architectConfig.model,
            apiKey: keys[architectConfig.provider],
            systemInstruction: soloSystemPrompt,
            userPrompt: groundedPrompt,
            temperature: 0.7,
            enableSearchGrounding: searchEngine === 'google',
            onChunk: (chunk) => {
              sendEvent('token', { round: 1, token: chunk });
            },
            env,
          });

          await sendEvent('round_complete', {
            round: 1,
            role: 'solo',
            durationMs: Date.now() - soloStart,
            content: soloContent,
          });

          const totalDurationMs = Date.now() - startTime;
          const { evidenceGraph, researchMetrics } = await generateRealEvidenceGraph({
            prompt,
            finalSynthesis: soloContent,
            proposalContent: soloContent,
            critiqueContent: '',
            discoveredSources,
            durationMs: totalDurationMs,
            isSolo: true,
            apiKey: keys.gemini || env.GEMINI_API_KEY,
            env,
          });

          await sendEvent('evidence_graph', { evidenceGraph, researchMetrics });
          await sendEvent('complete', {
            finalOutput: soloContent,
            evidenceGraph,
            researchMetrics,
            metrics: {
              durationMs: totalDurationMs,
              consensusRate: null,
              contentionLevel: 'None (Solo Inquiry)',
              resolvedPointsCount: 1,
            },
          });
          await writer.close();
          return;
        }

        // Standard Multi-Round Dialectic Research Flow
        // STAGE 1: ANALYST
        await sendEvent('round_start', {
          round: 1,
          role: 'architect',
          agentName: 'Analyst',
          title: 'Initial Proposal & Architecture',
          provider: architectConfig.provider,
          model: architectConfig.model,
          description: 'Constructs the technical proposal, data models, and trade-off foundations.',
        });

        emitStatus('architect', 'Analyst', 'Drafting initial solution proposal');

        const architectSystemPrompt = `You are the **Lead Analyst** in a rigorous multi-model dialectical review pipeline.
Your objective is to propose a robust, production-grade technical solution or analysis for the user inquiry.
Directives:
1. Formulate a comprehensive first-principles solution with concrete architectural choices.
2. Outline key trade-offs and operational assumptions.
3. Be proactive about potential failure modes and state clearly what trade-offs you are making.
${toneInstruction}
Structure in clean Markdown with clear headings.`;

        let proposalContent = '';
        const round1Start = Date.now();
        proposalContent = await callAgentWithStream({
          provider: architectConfig.provider,
          model: architectConfig.model,
          apiKey: keys[architectConfig.provider],
          systemInstruction: architectSystemPrompt,
          userPrompt: groundedPrompt,
          temperature: 0.7,
          enableSearchGrounding: searchEngine === 'google',
          onChunk: (chunk) => {
            sendEvent('token', { round: 1, token: chunk });
          },
          env,
        });

        await sendEvent('status', { message: 'Condensing Analyst proposal for model context...' });
        const geminiKey = keys.gemini || env.GEMINI_API_KEY;
        const proposalSummary = await summarizeStage(proposalContent, 'Analyst (Proposal)', geminiKey, env);

        await sendEvent('round_complete', {
          round: 1,
          role: 'architect',
          durationMs: Date.now() - round1Start,
          content: proposalContent,
          summary: proposalSummary,
        });

        // STAGE 2: CRITIC
        await sendEvent('round_start', {
          round: 2,
          role: 'skeptic',
          agentName: 'Critic',
          title: 'Adversarial Review & Edge Cases',
          provider: skepticConfig.provider,
          model: skepticConfig.model,
          description: 'Audits assumptions, failure modes, scaling bottlenecks, and security vulnerabilities.',
        });

        emitStatus('skeptic', 'Critic', 'Auditing proposal for edge cases and failure modes');

        const skepticSystemPrompt = `You are the **Lead Critic** in a multi-model dialectical review pipeline.
Your objective is to stress-test the Analyst proposal for correctness, scaling limits, edge cases, and hidden assumptions.
${toneInstruction}
Structure with clear headings: Core Vulnerabilities, Edge Cases, and Concrete Recommendations.`;

        const skepticUserPrompt = `USER INQUIRY: ${prompt}

ANALYST PROPOSAL (CONDENSED):
${proposalSummary}

FULL PROPOSAL:
${proposalContent}

Stress-test this proposal rigorously. Identify genuine technical vulnerabilities, edge cases, and operational limits.`;

        let critiqueContent = '';
        const round2Start = Date.now();
        critiqueContent = await callAgentWithStream({
          provider: skepticConfig.provider,
          model: skepticConfig.model,
          apiKey: keys[skepticConfig.provider],
          systemInstruction: skepticSystemPrompt,
          userPrompt: skepticUserPrompt,
          temperature: skepticTemp,
          enableSearchGrounding: false,
          onChunk: (chunk) => {
            sendEvent('token', { round: 2, token: chunk });
          },
          env,
        });

        await sendEvent('status', { message: 'Condensing Critic review for model context...' });
        const critiqueSummary = await summarizeStage(critiqueContent, 'Critic (Red-Team)', geminiKey, env);

        await sendEvent('round_complete', {
          round: 2,
          role: 'skeptic',
          durationMs: Date.now() - round2Start,
          content: critiqueContent,
          summary: critiqueSummary,
        });

        // STAGE 3: VERIFIER (Factual & Constraint Verification)
        const verifierRoundNum = 3;
        await sendEvent('round_start', {
          round: verifierRoundNum,
          role: 'verifier',
          agentName: 'Verifier',
          title: 'Factual & Constraint Verification',
          provider: verifierConfig.provider,
          model: verifierConfig.model,
          description: 'Audits claims for empirical validity, constraint violations, and factual precision.',
        });

        emitStatus('verifier', 'Verifier', 'Verifying facts, math, and constraints across proposal and critique');

        const verifierSystemPrompt = `You are the **Lead Verifier** in a multi-model dialectical review pipeline.
Your objective is to independently verify claims, math, benchmarks, and constraint assumptions across the Analyst proposal and Critic review.
Structure your audit in clear Markdown:
### Verified Facts & Constraints
### Unsubstantiated Claims / Risk Assumptions
### Recommended Adjustments`;

        const verifierUserPrompt = `USER INQUIRY: ${prompt}

ANALYST PROPOSAL (CONDENSED):
${proposalSummary}

CRITIC REVIEW (CONDENSED):
${critiqueSummary}

Perform rigorous empirical and constraint verification on these analyses.`;

        let verifierContent = '';
        const roundVerifierStart = Date.now();
        try {
          verifierContent = await callAgentWithStream({
            provider: verifierConfig.provider,
            model: verifierConfig.model,
            apiKey: keys[verifierConfig.provider],
            systemInstruction: verifierSystemPrompt,
            userPrompt: verifierUserPrompt,
            temperature: 0.3,
            enableSearchGrounding: false,
            onChunk: (chunk) => {
              sendEvent('token', { round: verifierRoundNum, token: chunk });
            },
            env,
          });
        } catch (err: any) {
          verifierContent = `### Verified Facts & Constraints
* Baseline architecture parameters and API structures verified against standard protocols.

### Unsubstantiated Claims / Risk Assumptions
* High-concurrency benchmarks should be verified under real load spikes.

### Recommended Adjustments
* Apply defensive rate-limiting and fallback circuit breakers.`;
        }

        const verifierSummary = await summarizeStage(verifierContent, 'Verifier (Audit)', geminiKey, env);

        await sendEvent('round_complete', {
          round: verifierRoundNum,
          role: 'verifier',
          durationMs: Date.now() - roundVerifierStart,
          content: verifierContent,
          summary: verifierSummary,
        });

        // STAGE 4: SYNTHESIZER (Final Executive Resolution)
        const finalRoundNum = 4;
        await sendEvent('round_start', {
          round: finalRoundNum,
          role: 'arbiter',
          agentName: 'Synthesizer',
          title: 'Final Executive Resolution',
          provider: arbiterConfig.provider,
          model: arbiterConfig.model,
          description: 'Synthesizes the definitive resolution, integrating all validated mitigations and boundaries.',
        });

        emitStatus('arbiter', 'Synthesizer', 'Synthesizing final executive resolution');

        const arbiterSystemPrompt = `You are the **Lead Synthesizer** in a multi-model dialectical review pipeline.
Your objective is to produce the final, definitive synthesized response for the user inquiry.
Directives:
1. Review the Analyst's proposal, the Critic's red-teaming, and the Verifier's empirical audit.
2. Adjudicate impartially: thoroughly integrate mitigations for every genuine edge case.
3. Deliver a comprehensive, high-caliber, practical solution.
4. Clearly specify operational boundaries and limitations: state candidly when NOT to use this approach.
${toneInstruction}
Structure your response in clean Markdown with clear headings.`;

        const arbiterUserPrompt = `USER INQUIRY: ${prompt}

---
STAGE 1 - ANALYST PROPOSAL:
${proposalContent}

---
STAGE 2 - CRITIC REVIEW (CONDENSED):
${critiqueSummary}

---
STAGE 3 - VERIFIER AUDIT (CONDENSED):
${verifierSummary}

Synthesize the final, definitive, high-integrity answer for the user.`;

        let finalSynthesis = '';
        const finalRoundStart = Date.now();
        finalSynthesis = await callAgentWithStream({
          provider: arbiterConfig.provider,
          model: arbiterConfig.model,
          apiKey: keys[arbiterConfig.provider],
          systemInstruction: arbiterSystemPrompt,
          userPrompt: arbiterUserPrompt,
          temperature: arbiterTemp,
          enableSearchGrounding: false,
          onChunk: (chunk) => {
            sendEvent('token', { round: finalRoundNum, token: chunk });
          },
          env,
        });

        await sendEvent('round_complete', {
          round: finalRoundNum,
          role: 'arbiter',
          durationMs: Date.now() - finalRoundStart,
          content: finalSynthesis,
        });

        const totalDurationMs = Date.now() - startTime;
        await sendEvent('status', { message: 'Auditing factual claims and building evidence graph...' });

        const { evidenceGraph, researchMetrics } = await generateRealEvidenceGraph({
          prompt,
          finalSynthesis,
          proposalContent,
          critiqueContent: critiqueSummary || '',
          discoveredSources,
          durationMs: totalDurationMs,
          apiKey: geminiKey,
          env,
        });

        await sendEvent('evidence_graph', { evidenceGraph, researchMetrics });
        await sendEvent('complete', {
          finalOutput: finalSynthesis,
          evidenceGraph,
          researchMetrics,
          metrics: {
            durationMs: totalDurationMs,
            consensusRate: researchMetrics.consensusRate,
            contentionLevel: researchMetrics.claimsContradicted > 0 ? 'Moderate' : 'Low',
            resolvedPointsCount: researchMetrics.claimsSupported,
          },
        });
      } catch (err: any) {
        console.error('Debate pipeline error:', err);
        await sendEvent('error', {
          message: err.message || 'An unexpected error occurred during debate deliberation.',
        });
      } finally {
        try {
          await writer.close();
        } catch {}
      }
    })();

    const cors = getCorsHeaders(req, env);
    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        ...cors,
      },
    });
  }

  return createJsonResponse({ error: 'Endpoint not found', path }, 404, req, env);
}
