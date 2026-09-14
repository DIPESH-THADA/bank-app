import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const hash = (value) => createHash('sha256').update(value).digest('hex');
const passwordHash = (password, salt) => scryptSync(password, salt, 64).toString('hex');
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
export function createBankServer(filename = ':memory:') {
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE,name TEXT,salt TEXT,password TEXT,verified INTEGER,verification TEXT);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,userId TEXT,expires INTEGER);
    CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,userId TEXT,type TEXT,number TEXT,cents INTEGER);
    CREATE TABLE IF NOT EXISTS cards(id TEXT PRIMARY KEY,userId TEXT,status TEXT,limitCents INTEGER);
    CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,userId TEXT,accountId TEXT,reference TEXT,date TEXT,description TEXT,cents INTEGER,type TEXT,category TEXT);
    CREATE TABLE IF NOT EXISTS transfers(userId TEXT,key TEXT,payload TEXT,reference TEXT,PRIMARY KEY(userId,key));
    CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY,userId TEXT,message TEXT,read INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,userId TEXT,event TEXT,date TEXT);
    CREATE TABLE IF NOT EXISTS profiles(userId TEXT PRIMARY KEY REFERENCES users(id),phone TEXT DEFAULT '',address TEXT DEFAULT '',avatar TEXT DEFAULT '');`);
  const beneficiaries = [
    {
      id: 'b1',
      name: 'Alex Morgan',
      accountNumber: 'DEMO1001',
      bank: 'Rastriya Banijya Bank Demo',
    },
    { id: 'b2', name: 'Jamie Lee', accountNumber: 'DEMO1002', bank: 'Rastriya Banijya Bank Demo' },
  ];
  function addUser(name, email, password, verified = 0) {
    const id = randomUUID(),
      salt = randomBytes(16).toString('hex'),
      verification = randomBytes(24).toString('hex');
    db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run(
      id,
      email,
      name,
      salt,
      passwordHash(password, salt),
      verified,
      hash(verification),
    );
    for (const [type, cents] of [
      ['Checking', 1250000],
      ['Savings', 4500000],
    ]) {
      const account = randomUUID();
      db.prepare('INSERT INTO accounts VALUES(?,?,?,?,?)').run(
        account,
        id,
        type,
        String(Math.floor(1000 + Math.random() * 9000)),
        cents,
      );
      db.prepare('INSERT INTO ledger VALUES(?,?,?,?,?,?,?,?,?)').run(
        randomUUID(),
        id,
        account,
        randomUUID(),
        new Date().toISOString(),
        'Demo opening balance',
        cents,
        'credit',
        'Income',
      );
    }
    db.prepare('INSERT INTO cards VALUES(?,?,?,?)').run(randomUUID(), id, 'active', 500000);
    db.prepare('INSERT INTO notifications(id,userId,message) VALUES(?,?,?)').run(
      randomUUID(),
      id,
      'Welcome to Rastriya Banijya Bank. All balances and payments are simulated.',
    );
    return verification;
  }
  if (!db.prepare('SELECT id FROM users WHERE email=?').get('demo@nexusbank.test'))
    addUser('Demo Customer', 'demo@nexusbank.test', 'NexusDemo!2026', 1);
  const attempts = new Map();
  const publicUser = (u) => {
    const profile = db
      .prepare('SELECT phone,address,avatar FROM profiles WHERE userId=?')
      .get(u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: '',
      address: '',
      avatar: '',
      ...profile,
    };
  };
  const cardsFor = (id) =>
    db
      .prepare('SELECT * FROM cards WHERE userId=?')
      .all(id)
      .map((c) => ({
        id: c.id,
        status: c.status,
        limit: c.limitCents / 100,
        cardNumber: '**** **** **** 4582',
        expiryDate: '12/29',
        type: 'Visa',
      }));
  const server = createServer(async (req, res) => {
    const send = (status, data) => {
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(JSON.stringify(data));
    };
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      const mutation = req.method !== 'GET';
      if (mutation && req.headers['x-nexus-request'] !== '1')
        fail(403, 'Request verification failed.');
      if (
        mutation &&
        req.headers.origin &&
        req.headers.origin !== (process.env.APP_ORIGIN || 'http://localhost:4200')
      )
        fail(403, 'Origin is not allowed.');
      let body = {};
      if (mutation) {
        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (Buffer.byteLength(raw) > (path === '/api/profile' ? 1450000 : 8192))
            fail(413, 'Request too large.');
        }
        try {
          body = JSON.parse(raw || '{}');
        } catch {
          fail(400, 'Invalid JSON.');
        }
      }
      if (path.startsWith('/api/auth/') && mutation) {
        const ip = req.socket.remoteAddress,
          now = Date.now();
        for (const [key, value] of attempts) if (now > value.until) attempts.delete(key);
        const attempt = attempts.get(ip) || { count: 0, until: now + 60000 };
        if (++attempt.count > 20) fail(429, 'Too many attempts. Try again in one minute.');
        attempts.set(ip, attempt);
      }
      if (path === '/api/auth/register' && req.method === 'POST') {
        const { name, email, password } = body;
        if (
          typeof name !== 'string' ||
          !name.trim() ||
          name.length > 80 ||
          typeof email !== 'string' ||
          email.length > 254 ||
          !/^\S+@\S+\.\S+$/.test(email) ||
          typeof password !== 'string' ||
          password.length < 12 ||
          password.length > 128 ||
          !/[A-Z]/.test(password) ||
          !/[a-z]/.test(password) ||
          !/[0-9]/.test(password) ||
          !/[^A-Za-z0-9]/.test(password)
        )
          fail(
            400,
            'Use a valid name, email and a 12–128 character password with uppercase, lowercase, number and symbol.',
          );
        const normalized = email.trim().toLowerCase();
        if (db.prepare('SELECT id FROM users WHERE email=?').get(normalized))
          fail(409, 'This email is already registered.');
        const verificationToken = addUser(name.trim(), normalized, password);
        return send(201, {
          verificationToken,
          message: 'Demo verification: confirm using the button below. No email is sent.',
        });
      }
      if (path === '/api/auth/verify' && req.method === 'POST') {
        if (typeof body.token !== 'string') fail(400, 'Invalid verification token.');
        const result = db
          .prepare(
            'UPDATE users SET verified=1,verification=NULL WHERE verification=? AND verified=0',
          )
          .run(hash(body.token));
        if (!result.changes) fail(400, 'Invalid or already used verification token.');
        return send(200, { success: true });
      }
      if (path === '/api/auth/login' && req.method === 'POST') {
        if (
          typeof body.email !== 'string' ||
          typeof body.password !== 'string' ||
          body.password.length > 128
        )
          fail(401, 'Invalid email or password.');
        const user = db
          .prepare('SELECT * FROM users WHERE email=?')
          .get(body.email.trim().toLowerCase());
        const candidate = passwordHash(body.password, user?.salt || 'dummy-salt');
        if (
          !user ||
          !timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(user.password, 'hex'))
        )
          fail(401, 'Invalid email or password.');
        if (!user.verified) fail(403, 'Verify your demo account before signing in.');
        const oldToken = (req.headers.cookie || '').match(/(?:^|; )nexus_session=([^;]+)/)?.[1];
        if (oldToken) db.prepare('DELETE FROM sessions WHERE token=?').run(hash(oldToken));
        const token = randomBytes(32).toString('hex');
        db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(
          hash(token),
          user.id,
          Date.now() + 3600000,
        );
        res.setHeader(
          'Set-Cookie',
          `nexus_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
        );
        return send(200, publicUser(user));
      }
      const token = (req.headers.cookie || '').match(/(?:^|; )nexus_session=([^;]+)/)?.[1];
      const user =
        token &&
        db
          .prepare(
            'SELECT users.* FROM sessions JOIN users ON users.id=sessions.userId WHERE token=? AND expires>?',
          )
          .get(hash(token), Date.now());
      if (!user) fail(401, 'Please sign in to continue.');
      if (path === '/api/auth/me' && req.method === 'GET') return send(200, publicUser(user));
      if (path === '/api/profile' && req.method === 'PATCH') {
        const { name, email, phone, address, avatar, currentPassword } = body || {};
        if (
          typeof name !== 'string' ||
          !name.trim() ||
          name.trim().length > 80 ||
          typeof email !== 'string' ||
          email.length > 254 ||
          !/^\S+@\S+\.\S+$/.test(email.trim()) ||
          typeof phone !== 'string' ||
          phone.length > 30 ||
          (phone && !/^[+\d\s().-]+$/.test(phone)) ||
          typeof address !== 'string' ||
          address.length > 300 ||
          typeof avatar !== 'string'
        ) {
          fail(400, 'Enter a valid name, email, phone number and address.');
        }
        if (avatar) {
          const match = avatar.match(/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/);
          if (!match) fail(400, 'Upload a PNG or JPEG photo.');
          const bytes = Buffer.from(match[2], 'base64');
          if (bytes.length > 1048576) fail(413, 'Photo must be 1 MB or smaller.');
          const valid =
            match[1] === 'png'
              ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
              : bytes.length > 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
          if (!valid) fail(400, 'The photo is not a valid PNG or JPEG.');
        }
        const normalized = email.trim().toLowerCase();
        if (normalized !== user.email) {
          if (
            typeof currentPassword !== 'string' ||
            currentPassword.length > 128 ||
            !timingSafeEqual(
              Buffer.from(passwordHash(currentPassword, user.salt), 'hex'),
              Buffer.from(user.password, 'hex'),
            )
          ) {
            fail(400, 'Enter your current password to change your email.');
          }
          if (db.prepare('SELECT id FROM users WHERE email=? AND id<>?').get(normalized, user.id))
            fail(409, 'This email is already registered.');
        }
        db.exec('BEGIN IMMEDIATE');
        try {
          db.prepare('UPDATE users SET name=?,email=? WHERE id=?').run(
            name.trim(),
            normalized,
            user.id,
          );
          db.prepare(
            'INSERT INTO profiles(userId,phone,address,avatar) VALUES(?,?,?,?) ON CONFLICT(userId) DO UPDATE SET phone=excluded.phone,address=excluded.address,avatar=excluded.avatar',
          ).run(user.id, phone.trim(), address.trim(), avatar);
          db.prepare('INSERT INTO audit VALUES(?,?,?,?)').run(
            randomUUID(),
            user.id,
            'Profile updated',
            new Date().toISOString(),
          );
          db.exec('COMMIT');
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
        return send(200, publicUser({ ...user, name: name.trim(), email: normalized }));
      }
      if (path === '/api/auth/logout' && req.method === 'POST') {
        db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token));
        res.setHeader('Set-Cookie', 'nexus_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
        return send(200, { success: true });
      }
      if (path === '/api/accounts' && req.method === 'GET')
        return send(
          200,
          db
            .prepare('SELECT * FROM accounts WHERE userId=?')
            .all(user.id)
            .map((a) => ({
              id: a.id,
              type: a.type,
              accountNumber: `**** ${a.number}`,
              balance: a.cents / 100,
              currency: 'USD',
            })),
        );
      if (path === '/api/beneficiaries' && req.method === 'GET') return send(200, beneficiaries);
      if (path === '/api/transactions' && req.method === 'GET')
        return send(
          200,
          db
            .prepare('SELECT * FROM ledger WHERE userId=? ORDER BY date DESC')
            .all(user.id)
            .map((t) => ({
              id: t.id,
              reference: t.reference,
              date: t.date,
              description: t.description,
              amount: t.cents / 100,
              type: t.type,
              category: t.category,
              status: 'completed',
            })),
        );
      if (path === '/api/cards' && req.method === 'GET') return send(200, cardsFor(user.id));
      if (path.startsWith('/api/cards/') && req.method === 'PATCH') {
        const id = path.split('/')[3];
        if (!['active', 'blocked'].includes(body.status)) fail(400, 'Invalid card status.');
        if (
          !db
            .prepare('UPDATE cards SET status=? WHERE id=? AND userId=?')
            .run(body.status, id, user.id).changes
        )
          fail(404, 'Card not found.');
        db.prepare('INSERT INTO audit VALUES(?,?,?,?)').run(
          randomUUID(),
          user.id,
          `Card ${id}: ${body.status}`,
          new Date().toISOString(),
        );
        return send(200, cardsFor(user.id));
      }
      if (path === '/api/notifications' && req.method === 'GET')
        return send(
          200,
          db
            .prepare('SELECT * FROM notifications WHERE userId=?')
            .all(user.id)
            .map((n) => ({
              id: n.id,
              message: n.message.replace(
                'Welcome to NexusBank.',
                'Welcome to Rastriya Banijya Bank.',
              ),
              read: !!n.read,
              type: 'info',
              date: new Date().toISOString(),
            })),
        );
      if (path === '/api/notifications/read' && req.method === 'POST') {
        if (body.id)
          db.prepare('UPDATE notifications SET read=1 WHERE userId=? AND id=?').run(
            user.id,
            body.id,
          );
        else db.prepare('UPDATE notifications SET read=1 WHERE userId=?').run(user.id);
        return send(200, { success: true });
      }
      if (path === '/api/transfers' && req.method === 'POST') {
        const { from, to, amount, description = '', key, confirmed } = body;
        const cents = Math.round(amount * 100);
        if (
          typeof amount !== 'number' ||
          !Number.isFinite(amount) ||
          cents <= 0 ||
          Math.abs(amount * 100 - cents) > 0.000001 ||
          cents > 5000000
        )
          fail(400, 'Enter an amount from $0.01 to $50,000 with at most two decimal places.');
        if (
          confirmed !== true ||
          typeof key !== 'string' ||
          key.length < 16 ||
          key.length > 100 ||
          typeof description !== 'string' ||
          description.length > 100
        )
          fail(400, 'Confirm the transfer and provide a valid reference.');
        const payload = JSON.stringify({ from, to, amount, description });
        const previous = db
          .prepare('SELECT * FROM transfers WHERE userId=? AND key=?')
          .get(user.id, key);
        if (previous) {
          if (previous.payload !== payload) fail(409, 'Transfer reference already used.');
          return send(200, { reference: previous.reference });
        }
        const source = db
          .prepare('SELECT * FROM accounts WHERE id=? AND userId=?')
          .get(from, user.id);
        if (!source) fail(400, 'Source account not found.');
        if (from === to) fail(400, 'Cannot transfer to the same account.');
        const destination = db
          .prepare('SELECT * FROM accounts WHERE id=? AND userId=?')
          .get(to, user.id);
        const beneficiary = beneficiaries.find((b) => b.id === to);
        if (!destination && !beneficiary) fail(400, 'Destination account not found.');
        const reference = randomUUID(),
          date = new Date().toISOString();
        db.exec('BEGIN IMMEDIATE');
        try {
          if (
            !db
              .prepare('UPDATE accounts SET cents=cents-? WHERE id=? AND cents>=?')
              .run(cents, from, cents).changes
          )
            fail(400, 'Insufficient available balance.');
          if (destination)
            db.prepare('UPDATE accounts SET cents=cents+? WHERE id=?').run(cents, to);
          const insert = db.prepare('INSERT INTO ledger VALUES(?,?,?,?,?,?,?,?,?)');
          insert.run(
            randomUUID(),
            user.id,
            from,
            reference,
            date,
            description || `Transfer to ${beneficiary?.name || destination.type}`,
            cents,
            'debit',
            'Transfer',
          );
          insert.run(
            randomUUID(),
            destination ? user.id : 'external-demo',
            to,
            reference,
            date,
            'Transfer received',
            cents,
            'credit',
            'Transfer',
          );
          db.prepare('INSERT INTO transfers VALUES(?,?,?,?)').run(user.id, key, payload, reference);
          db.prepare('INSERT INTO audit VALUES(?,?,?,?)').run(
            randomUUID(),
            user.id,
            `Transfer ${reference}`,
            date,
          );
          db.prepare('INSERT INTO notifications(id,userId,message) VALUES(?,?,?)').run(
            randomUUID(),
            user.id,
            `Simulated transfer of $${amount.toFixed(2)} completed. Reference ${reference}`,
          );
          db.exec('COMMIT');
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
        return send(201, { reference });
      }
      fail(404, 'Endpoint not found.');
    } catch (error) {
      send(error.status || 500, {
        message: error.status ? error.message : 'The server could not complete the request.',
      });
    }
  });
  server.on('close', () => db.close());
  return server;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(new URL('./data/', import.meta.url), { recursive: true });
  createBankServer(
    process.env.DB_PATH || fileURLToPath(new URL('./data/nexus.sqlite', import.meta.url)),
  ).listen(Number(process.env.PORT || 3001), '127.0.0.1', () =>
    console.log('Rastriya Banijya Bank demo API: http://127.0.0.1:3001'),
  );
}
