import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createBankServer } from './server.mjs';

test('profile edits, photos, email confirmation and account isolation', async (t) => {
  const server = createBankServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let cookie = '';
  async function request(path, method = 'GET', body) {
    const response = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Nexus-Request': '1', Cookie: cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      body: await response.json(),
      cookie: response.headers.get('set-cookie'),
    };
  }
  const profile = {
    name: 'Updated Customer',
    email: 'demo@nexusbank.test',
    phone: '+40 123456789',
    address: 'Demo Street 1',
    avatar: '',
    currentPassword: '',
  };
  assert.equal((await request('/profile', 'PATCH', profile)).status, 401);
  const login = await request('/auth/login', 'POST', {
    email: profile.email,
    password: 'NexusDemo!2026',
  });
  cookie = login.cookie.split(';')[0];
  assert.equal((await request('/profile', 'PATCH', { ...profile, name: ' ' })).status, 400);
  assert.equal(
    (
      await request('/profile', 'PATCH', {
        ...profile,
        avatar: 'data:image/svg+xml;base64,PHN2Zz4=',
      })
    ).status,
    400,
  );
  assert.equal(
    (await request('/profile', 'PATCH', { ...profile, avatar: 'data:image/png;base64,YmFk' }))
      .status,
    400,
  );
  profile.avatar =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=';
  assert.equal((await request('/profile', 'PATCH', profile)).status, 200);
  const saved = (await request('/auth/me')).body;
  assert.equal(saved.name, profile.name);
  assert.equal(saved.avatar, profile.avatar);
  assert.equal(saved.phone, profile.phone);
  assert.equal(
    (await request('/profile', 'PATCH', { ...profile, email: 'new@example.test' })).status,
    400,
  );
  assert.equal(
    (
      await request('/profile', 'PATCH', {
        ...profile,
        email: 'new@example.test',
        currentPassword: 'NexusDemo!2026',
      })
    ).status,
    200,
  );
  const registration = await request('/auth/register', 'POST', {
    name: 'Other Customer',
    email: 'other@example.test',
    password: 'OtherPassword!2026',
  });
  await request('/auth/verify', 'POST', { token: registration.body.verificationToken });
  const otherLogin = await request('/auth/login', 'POST', {
    email: 'other@example.test',
    password: 'OtherPassword!2026',
  });
  cookie = otherLogin.cookie.split(';')[0];
  assert.equal((await request('/auth/me')).body.avatar, '');
  assert.equal(
    (
      await request('/profile', 'PATCH', {
        ...profile,
        email: 'new@example.test',
        currentPassword: 'OtherPassword!2026',
      })
    ).status,
    409,
  );
  await request('/profile', 'PATCH', { ...profile, email: 'other@example.test', userId: saved.id });
  await request('/auth/logout', 'POST', {});
  const freshLogin = await request('/auth/login', 'POST', {
    email: 'new@example.test',
    password: 'NexusDemo!2026',
  });
  assert.equal(freshLogin.status, 200);
  cookie = freshLogin.cookie.split(';')[0];
  assert.equal((await request('/auth/me')).body.email, 'new@example.test');
  assert.equal(
    (await request('/profile', 'PATCH', { ...profile, email: 'new@example.test', avatar: '' })).body
      .avatar,
    '',
  );
});

test('authentication, ownership, atomic transfers, persistence and card controls', async (t) => {
  const server = createBankServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let cookie = '';
  async function request(path, method = 'GET', body, customCookie = cookie) {
    const response = await fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Nexus-Request': '1', Cookie: customCookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      body: await response.json(),
      cookie: response.headers.get('set-cookie'),
    };
  }
  assert.equal((await request('/accounts')).status, 401);
  assert.equal(
    (await request('/auth/login', 'POST', { email: 'demo@nexusbank.test', password: 'wrong' }))
      .status,
    401,
  );
  const login = await request('/auth/login', 'POST', {
    email: 'demo@nexusbank.test',
    password: 'NexusDemo!2026',
  });
  assert.equal(login.status, 200);
  assert.match(login.cookie, /HttpOnly/);
  assert.match(login.cookie, /SameSite=Strict/);
  cookie = login.cookie.split(';')[0];
  assert.equal((await request('/auth/me')).body.email, 'demo@nexusbank.test');
  const accounts = (await request('/accounts')).body;
  const source = accounts.find((a) => a.type === 'Checking');
  const transfer = {
    from: source.id,
    to: 'b1',
    amount: 100.25,
    description: 'Test transfer',
    key: randomUUID(),
    confirmed: true,
  };
  for (const change of [
    { amount: -1 },
    { amount: 0 },
    { amount: 0.001 },
    { amount: 50001 },
    { amount: 13000 },
    { from: 'invalid' },
    { to: 'invalid' },
    { to: source.id },
    { confirmed: false },
  ]) {
    assert.equal((await request('/transfers', 'POST', { ...transfer, ...change })).status, 400);
  }
  assert.equal(
    (await request('/accounts')).body.find((a) => a.id === source.id).balance,
    source.balance,
  );
  const success = await request('/transfers', 'POST', transfer);
  assert.equal(success.status, 201);
  assert.ok(success.body.reference);
  assert.equal(
    (await request('/transfers', 'POST', transfer)).body.reference,
    success.body.reference,
  );
  assert.equal((await request('/transfers', 'POST', { ...transfer, amount: 1 })).status, 409);
  assert.equal(
    (await request('/accounts')).body.find((a) => a.id === source.id).balance,
    source.balance - 100.25,
  );
  const internal = await request('/transfers', 'POST', {
    ...transfer,
    key: randomUUID(),
    to: accounts.find((a) => a.type === 'Savings').id,
  });
  assert.equal(internal.status, 201);
  assert.equal(
    (await request('/transactions')).body.filter((tx) => tx.reference === internal.body.reference)
      .length,
    2,
  );
  const concurrent = await Promise.all(
    [1, 2].map(() =>
      request('/transfers', 'POST', { ...transfer, key: randomUUID(), amount: 10000 }),
    ),
  );
  assert.deepEqual(concurrent.map((r) => r.status).sort(), [201, 400]);
  const card = (await request('/cards')).body[0];
  assert.equal(
    (await request(`/cards/${card.id}`, 'PATCH', { status: 'blocked' })).body[0].status,
    'blocked',
  );
  assert.equal((await request('/cards')).body[0].status, 'blocked');
  assert.equal(
    (await request(`/cards/${card.id}`, 'PATCH', { status: 'active' })).body[0].status,
    'active',
  );
  await request('/notifications/read', 'POST', {});
  assert.ok((await request('/notifications')).body.every((n) => n.read));
  const registration = {
    name: 'Test User',
    email: 'test@example.test',
    password: 'TestPassword!2026',
  };
  const registered = await request('/auth/register', 'POST', registration);
  assert.equal(registered.status, 201);
  assert.equal((await request('/auth/register', 'POST', registration)).status, 409);
  assert.equal((await request('/auth/login', 'POST', registration)).status, 403);
  assert.equal(
    (await request('/auth/verify', 'POST', { token: registered.body.verificationToken })).status,
    200,
  );
  const second = await request('/auth/login', 'POST', registration, '');
  assert.equal(second.status, 200);
  const otherCookie = second.cookie.split(';')[0];
  assert.equal(
    (await request('/transfers', 'POST', { ...transfer, key: randomUUID() }, otherCookie)).status,
    400,
  );
  assert.equal(
    (await request(`/cards/${card.id}`, 'PATCH', { status: 'blocked' }, otherCookie)).status,
    404,
  );
  const csrf = await fetch(base + '/transfers', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify(transfer),
  });
  assert.equal(csrf.status, 403);
  assert.equal((await request('/auth/logout', 'POST', {})).status, 200);
  assert.equal((await request('/auth/me')).status, 401);
});

test('limits authentication attempts', async (t) => {
  const server = createBankServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  let status;
  for (let i = 0; i < 21; i++) {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/login`, {
      method: 'POST',
      headers: { 'X-Nexus-Request': '1' },
      body: '{}',
    });
    status = r.status;
    await r.text();
  }
  assert.equal(status, 429);
});
