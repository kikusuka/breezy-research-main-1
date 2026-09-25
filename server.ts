import express, { type Request as ExpressRequest, type Response as ExpressResponse } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { handleBackendRequest } from './src/server-core/router';

dotenv.config();

const app = express();
const PORT = 3000;

// Use raw body buffer so we can forward request body as-is to standard Request
app.use('/api', express.raw({ type: '*/*', limit: '10mb' }));

// Forward all /api/* requests to the shared backend router
app.all('/api/*', async (req: ExpressRequest, res: ExpressResponse) => {
  const protocol = req.protocol;
  const host = req.get('host') || `localhost:${PORT}`;
  const fullUrl = `${protocol}://${host}${req.originalUrl}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }
  }

  const webReq = new Request(fullUrl, {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' && req.body && Buffer.isBuffer(req.body) && req.body.length > 0
      ? new Uint8Array(req.body)
      : undefined,
  });

  try {
    const isDev = process.env.NODE_ENV !== 'production';
    const webRes = await handleBackendRequest(webReq, process.env as any, isDev ? 'local-dev' : 'render-node');

    res.status(webRes.status);
    webRes.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    if (webRes.body) {
      const reader = webRes.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error('API execution error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || 'Internal server error' });
    } else {
      res.end();
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: ExpressRequest, res: ExpressResponse) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Breezy Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
