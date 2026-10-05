import { describe, it, expect } from 'vitest';
import { handleBackendRequest } from '../src/server-core/router';

describe('Server & Backend Router Core', () => {
  it('handles health check endpoint with JSON status', async () => {
    const req = new Request('http://localhost:3000/api/health', {
      method: 'GET',
    });

    const res = await handleBackendRequest(req, {}, 'local-dev');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe('ok');
    expect(body.backend).toBe('local-dev');
  });

  it('returns 404 for unknown endpoints', async () => {
    const req = new Request('http://localhost:3000/api/unknown-endpoint', {
      method: 'GET',
    });

    const res = await handleBackendRequest(req, {}, 'local-dev');
    expect(res.status).toBe(404);
  });

  it('handles CORS OPTIONS preflight', async () => {
    const req = new Request('http://localhost:3000/api/health', {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:3000' },
    });

    const res = await handleBackendRequest(req, {}, 'local-dev');
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('rejects SSRF loopback URLs in webhook test endpoint', async () => {
    const req = new Request('http://localhost:3000/api/webhook/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: 'http://127.0.0.1:8080/admin' }),
    });

    const res = await handleBackendRequest(req, {}, 'local-dev');
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error).toContain('prohibited');
  });

  it('validates vault verify-key required parameters', async () => {
    const req = new Request('http://localhost:3000/api/vault/verify-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await handleBackendRequest(req, {}, 'local-dev');
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('rejects oversized chat prompts before provider execution', async () => {
    const req = new Request('http://localhost:3000/api/breezy/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'x'.repeat(20001) }),
    });
    const res = await handleBackendRequest(req, {}, 'local-dev');
    expect(res.status).toBe(413);
  });

  it('rejects unsupported explicitly selected providers instead of substituting another provider', async () => {
    const req = new Request('http://localhost:3000/api/breezy/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'hello', provider: 'not-a-provider', model: 'fake-model' }),
    });
    const res = await handleBackendRequest(req, {}, 'local-dev');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Unsupported provider');
  });

  it('rejects chat when no provider is configured', async () => {
    const req = new Request('http://localhost:3000/api/breezy/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'hello' }),
    });
    const res = await handleBackendRequest(req, {}, 'local-dev');
    expect(res.status).toBe(503);
  });

  it('rejects oversized chat history before provider execution', async () => {
    const history = Array.from({ length: 21 }, (_, i) => ({ role: 'user', content: String(i) }));
    const req = new Request('http://localhost:3000/api/breezy/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'hello', history }),
    });
    const res = await handleBackendRequest(req, {}, 'local-dev');
    expect(res.status).toBe(400);
  });

  it('rejects oversized research prompts before opening an SSE stream', async () => {
    const req = new Request('http://localhost:3000/api/debate/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'x'.repeat(20001) }),
    });
    const res = await handleBackendRequest(req, {}, 'local-dev');
    expect(res.status).toBe(413);
  });

  it('rejects unsupported research protocols before starting the pipeline', async () => {
    const req = new Request('http://localhost:3000/api/debate/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'hello', protocol: 'invalid-protocol' }),
    });
    const res = await handleBackendRequest(req, {}, 'local-dev');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Unsupported research protocol');
  });

  it('does not reflect an unrelated origin when CORS is not explicitly configured', async () => {
    const req = new Request('https://api.example.com/api/health', {
      method: 'GET',
      headers: { Origin: 'https://evil.example' },
    });
    const res = await handleBackendRequest(req, {}, 'local-dev');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('null');
  });

});
