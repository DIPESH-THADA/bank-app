import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createBankServer } from './server.mjs';

// Each request uses an isolated SQLite working copy. Only an atomic conditional
// blob write publishes that copy; a competing write forces a fresh retry.
// This is deliberately a low-traffic portfolio demo, not a production bank DB.
export async function handleBankRequest(request, context, store) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/'))
    return Response.json({ message: 'Not found.' }, { status: 404 });
  const mutation = request.method !== 'GET';
  const limit = url.pathname === '/api/profile' ? 1450000 : 8192;
  const reader = request.body?.getReader();
  let size = 0;
  const chunks = [];
  if (reader) {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        return Response.json({ message: 'Request too large.' }, { status: 413 });
      }
      chunks.push(Buffer.from(value));
    }
  }
  const body = Buffer.concat(chunks);
  for (let attempt = 0; attempt < 5; attempt++) {
    const snapshot = await store.getWithMetadata('bank.sqlite', {
      type: 'arrayBuffer',
      consistency: 'strong',
    });
    const directory = await mkdtemp(join(tmpdir(), 'rbb-request-'));
    const filename = join(directory, 'bank.sqlite');
    let server;
    try {
      if (snapshot) await writeFile(filename, Buffer.from(snapshot.data));
      server = createBankServer(filename, {
        origin: url.origin,
        secureCookies: true,
        clientIp: context.ip || 'unknown',
      });
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
      });
      const headers = new Headers();
      for (const name of ['cookie', 'origin', 'content-type', 'x-nexus-request']) {
        const value = request.headers.get(name);
        if (value) headers.set(name, value);
      }
      const result = await fetch(
        `http://127.0.0.1:${server.address().port}${url.pathname}${url.search}`,
        {
          method: request.method,
          headers,
          body: mutation ? body : undefined,
        },
      );
      const responseBody = await result.text();
      const responseHeaders = new Headers({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      const cookie = result.headers.get('set-cookie');
      if (cookie) responseHeaders.set('Set-Cookie', cookie);
      await new Promise((resolve) => server.close(resolve));
      server = null;
      if (mutation || !snapshot) {
        const data = await readFile(filename);
        const bytes = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        const saved = await store.set(
          'bank.sqlite',
          bytes,
          snapshot ? { onlyIfMatch: snapshot.etag } : { onlyIfNew: true },
        );
        if (!saved.modified) continue;
      }
      return new Response(responseBody, { status: result.status, headers: responseHeaders });
    } finally {
      if (server) await new Promise((resolve) => server.close(resolve));
      // directory is a unique mkdtemp child created for this request.
      await rm(directory, { recursive: true, force: true });
    }
  }
  return Response.json(
    { message: 'The demo is busy. Please retry your request.' },
    { status: 503, headers: { 'Retry-After': '2', 'Cache-Control': 'no-store' } },
  );
}
