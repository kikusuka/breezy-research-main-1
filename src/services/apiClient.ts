/**
 * Unified Breezy API Client with Intelligent Backend Failover
 * 
 * Order of Preference:
 * 1. Cloudflare Worker (Primary)
 * 2. Deno Deploy (Secondary Fallback)
 * 3. Render / Node Server (Emergency Fallback)
 * 
 * Safe Failover Policy:
 * - Bounded retries (failover only on network disconnect, 502, 503, 504 before body transfer)
 * - Never duplicate destructive operations or ongoing SSE streams
 * - Cached health checks (no aggressive polling)
 */

export interface BackendEndpoint {
  id: 'cloudflare' | 'deno' | 'render' | 'local';
  name: string;
  url: string;
  tierInfo: string;
}

export interface BackendState {
  activeId: 'cloudflare' | 'deno' | 'render' | 'local';
  activeName: string;
  isOnline: boolean;
  lastChecked: number;
  failoverReason?: string;
}

type BackendListener = (state: BackendState) => void;

class ApiClient {
  private endpoints: BackendEndpoint[];
  private currentEndpointIndex: number = 0;
  private listeners: Set<BackendListener> = new Set();
  private healthCache: Map<string, { ok: boolean; timestamp: number }> = new Map();
  private isCheckingHealth = false;

  constructor() {
    const primaryUrl = import.meta.env.VITE_PRIMARY_API_URL?.replace(/\/$/, '') || '';
    const secondaryUrl = import.meta.env.VITE_SECONDARY_API_URL?.replace(/\/$/, '') || '';
    const fallbackUrl = import.meta.env.VITE_FALLBACK_API_URL?.replace(/\/$/, '') || '';

    this.endpoints = [
      {
        id: 'cloudflare',
        name: 'Cloudflare Worker',
        url: primaryUrl, // empty string means same-origin relative '/api/...'
        tierInfo: 'Primary Edge (100k req/day)',
      },
      ...(secondaryUrl
        ? [
            {
              id: 'deno' as const,
              name: 'Deno Deploy',
              url: secondaryUrl,
              tierInfo: 'Secondary Backup (1M req/mo)',
            },
          ]
        : []),
      ...(fallbackUrl
        ? [
            {
              id: 'render' as const,
              name: 'Render Node',
              url: fallbackUrl,
              tierInfo: 'Emergency Fallback',
            },
          ]
        : []),
      ...(primaryUrl && !fallbackUrl
        ? [
            {
              id: 'local' as const,
              name: 'Same-Origin Server',
              url: '',
              tierInfo: 'Direct Relative Route',
            },
          ]
        : []),
    ];
  }

  public getEndpoints(): BackendEndpoint[] {
    return [...this.endpoints];
  }

  public getActiveEndpoint(): BackendEndpoint {
    return this.endpoints[this.currentEndpointIndex] || this.endpoints[0];
  }

  public subscribe(listener: BackendListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify(reason?: string) {
    const state = this.getState(reason);
    this.listeners.forEach((fn) => fn(state));
  }

  public getState(reason?: string): BackendState {
    const active = this.getActiveEndpoint();
    return {
      activeId: active.id,
      activeName: active.name,
      isOnline: true,
      lastChecked: Date.now(),
      failoverReason: reason,
    };
  }

  public setEndpointManually(id: 'cloudflare' | 'deno' | 'render' | 'local') {
    const idx = this.endpoints.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.currentEndpointIndex = idx;
      this.notify('Manual selection');
    }
  }

  /**
   * Health check with 30-second TTL cache to prevent request storms
   */
  public async checkHealth(force: boolean = false): Promise<boolean> {
    const endpoint = this.getActiveEndpoint();
    const cached = this.healthCache.get(endpoint.id);
    const now = Date.now();

    if (!force && cached && now - cached.timestamp < 30000) {
      return cached.ok;
    }

    if (this.isCheckingHealth) return cached?.ok ?? true;
    this.isCheckingHealth = true;

    try {
      const url = `${endpoint.url}/api/health`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const ok = res.ok;
      this.healthCache.set(endpoint.id, { ok, timestamp: now });
      return ok;
    } catch (e) {
      this.healthCache.set(endpoint.id, { ok: false, timestamp: now });
      return false;
    } finally {
      this.isCheckingHealth = false;
    }
  }

  /**
   * Execute fetch with automatic, bounded backend failover
   */
  private async fetchWithFailover(
    path: string,
    options: RequestInit = {},
    onFailoverNotice?: (msg: string) => void
  ): Promise<Response> {
    const attempts = this.endpoints.length;
    let lastError: any = null;

    for (let i = 0; i < attempts; i++) {
      const endpointIndex = (this.currentEndpointIndex + i) % this.endpoints.length;
      const endpoint = this.endpoints[endpointIndex];
      const targetUrl = `${endpoint.url}${path}`;

      try {
        const response = await fetch(targetUrl, {
          ...options,
          headers: {
            ...options.headers,
            'X-Breezy-Client': 'web-spa',
          },
        });

        // 502 / 503 / 504 are candidate errors for backend failover
        if ((response.status === 502 || response.status === 503 || response.status === 504) && i < attempts - 1) {
          console.warn(`Endpoint ${endpoint.name} returned status ${response.status}. Attempting backup backend...`);
          if (onFailoverNotice) {
            onFailoverNotice(`Primary service temporarily busy (${response.status}). Switching to backup service...`);
          }
          continue;
        }

        // If this endpoint succeeded and was a failover, update active index
        if (endpointIndex !== this.currentEndpointIndex && response.ok) {
          this.currentEndpointIndex = endpointIndex;
          this.notify(`Switched to ${endpoint.name}`);
          if (onFailoverNotice) {
            onFailoverNotice(`Connected to backup service (${endpoint.name}).`);
          }
        }

        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`Network failure on ${endpoint.name}: ${err.message}. Checking next backend...`);
        if (i < attempts - 1 && onFailoverNotice) {
          onFailoverNotice(`Primary service unavailable. Connecting to backup service...`);
        }
      }
    }

    throw new Error(
      lastError?.message
        ? `All backends unavailable: ${lastError.message}`
        : 'All API backends are currently unreachable. Please check your network connection or configure client BYOK in Settings.'
    );
  }

  /**
   * Debate & Multi-Model Research SSE Stream
   */
  public async streamDebate(
    payload: any,
    options: {
      onEvent: (event: any) => void;
      signal?: AbortSignal;
      onNotice?: (msg: string) => void;
    }
  ): Promise<void> {
    const res = await this.fetchWithFailover(
      '/api/debate/stream',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: options.signal,
      },
      options.onNotice
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Research API failed (${res.status}): ${errText || 'Stream initiation error'}`);
    }

    if (!res.body) {
      throw new Error('No response body stream received from backend.');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          options.onEvent(json);
        } catch {
          // Skip incomplete json chunk
        }
      }
    }
  }

  /**
   * Conversational Chat with Breezy
   */
  public async chatBreezy(
    payload: {
      prompt: string;
      history?: any[];
      provider?: string;
      model?: string;
      apiKey?: string;
    },
    options?: { signal?: AbortSignal; onNotice?: (msg: string) => void }
  ): Promise<{ text: string }> {
    const res = await this.fetchWithFailover(
      '/api/breezy/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: options?.signal,
      },
      options?.onNotice
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${res.status}`);
    }

    return await res.json();
  }

  /**
   * Executive summary generation
   */
  public async summarizeDebate(payload: { session: any; providerKeyConfig?: any }): Promise<{ summary: string; category: string }> {
    const res = await this.fetchWithFailover('/api/debate/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to summarize session (${res.status})`);
    }

    return await res.json();
  }

  /**
   * Verify provider key
   */
  public async verifyKey(provider: string, apiKey: string): Promise<{ valid: boolean; message?: string; error?: string }> {
    const res = await this.fetchWithFailover('/api/vault/verify-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey }),
    });

    return await res.json();
  }
}

export const apiClient = new ApiClient();
