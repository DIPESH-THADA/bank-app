import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { handleBankRequest } from './netlify-adapter.mjs';

test('serverless requests persist sessions, photos and transfers with conditional writes', async () => {
  let data = null,
    version = 0;
  const store = {
    async getWithMetadata() {
      return data ? { data: data.slice(0), etag: String(version) } : null;
    },
    async set(_key, value, options) {
      if (
        (options.onlyIfNew && data) ||
        (options.onlyIfMatch && options.onlyIfMatch !== String(version))
      )
        return { modified: false };
      data = value.slice(0);
      version++;
      return { modified: true, etag: String(version) };
    },
  };
  let cookie = '';
  async function call(path, method = 'GET', body, origin = 'https://rbb.test') {
    const response = await handleBankRequest(
      new Request(`https://rbb.test/api${path}`, {
        method,
        headers: {
          Cookie: cookie,
          Origin: origin,
          'Content-Type': 'application/json',
          'X-Nexus-Request': '1',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      { ip: '192.0.2.1' },
      store,
    );
    return {
      status: response.status,
      body: await response.json(),
      cookie: response.headers.get('set-cookie'),
    };
  }
  assert.equal((await call('/accounts')).status, 401);
  const login = await call('/auth/login', 'POST', {
    email: 'demo@nexusbank.test',
    password: 'NexusDemo!2026',
  });
  assert.equal(login.status, 200);
  assert.match(login.cookie, /Secure/);
  cookie = login.cookie.split(';')[0];
  assert.equal((await call('/auth/me')).body.email, 'demo@nexusbank.test');
  const account = (await call('/accounts')).body.find((a) => a.type === 'Checking');
  const transfer = {
    from: account.id,
    to: 'b1',
    amount: 10000,
    description: 'Online demo',
    key: randomUUID(),
    confirmed: true,
  };
  const concurrent = await Promise.all([
    call('/transfers', 'POST', transfer),
    call('/transfers', 'POST', { ...transfer, key: randomUUID() }),
  ]);
  assert.deepEqual(concurrent.map((r) => r.status).sort(), [201, 400]);
  assert.equal((await call('/accounts')).body.find((a) => a.id === account.id).balance, 2500);
  const tx = { ...transfer, amount: 1, key: randomUUID() };
  const paid = await call('/transfers', 'POST', tx);
  assert.equal((await call('/transfers', 'POST', tx)).body.reference, paid.body.reference);
  const profile = {
    name: 'Online Demo',
    email: 'demo@nexusbank.test',
    phone: '',
    address: '',
    currentPassword: '',
    avatar:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=',
  };
  assert.equal((await call('/profile', 'PATCH', profile)).status, 200);
  assert.equal((await call('/auth/me')).body.avatar, profile.avatar);
  assert.equal((await call('/profile', 'PATCH', profile, 'https://other.test')).status, 403);
  await call('/auth/logout', 'POST', {});
  assert.equal((await call('/auth/me')).status, 401);
});

test('does not report success if persistent storage rejects all writes', async () => {
  const store = {
    async getWithMetadata() {
      return null;
    },
    async set() {
      return { modified: false };
    },
  };
  const response = await handleBankRequest(
    new Request('https://rbb.test/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Nexus-Request': '1' },
      body: JSON.stringify({ email: 'demo@nexusbank.test', password: 'NexusDemo!2026' }),
    }),
    { ip: '192.0.2.2' },
    store,
  );
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('set-cookie'), null);
});
