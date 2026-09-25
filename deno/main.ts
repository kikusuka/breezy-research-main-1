/**
 * Deno Deploy Backend Entrypoint for Breezy Research
 * Secondary Fallback Backend Engine
 */

import { handleBackendRequest } from '../src/server-core/router.ts';
import { BackendEnv } from '../src/server-core/types.ts';

// @ts-ignore: Deno global is available in Deno runtime
if (typeof Deno !== 'undefined') {
  // @ts-ignore
  Deno.serve(async (req: Request) => {
    // @ts-ignore
    const env: BackendEnv = Deno.env.toObject ? Deno.env.toObject() : {};
    return await handleBackendRequest(req, env, 'deno-deploy');
  });
}
