# Rastriya Banijya Bank

An Angular banking portfolio demo with a persistent local API. All balances, cards and transfers are simulated in USD; no real money is involved.

## Run locally

Use Node 24 LTS and npm. The existing environment was verified with Node 23.5.0; its SQLite module prints an experimental warning.

```sh
npm install
npm run server
```

In a second terminal in this directory:

```sh
npm start
```

Open http://localhost:4200. On PowerShell installations that block npm.ps1, use `npm.cmd` instead of `npm`.

Demo sign-in: **demo@nexusbank.test** / **NexusDemo!2026**.

Alternatively register an account with a 12-128 character password containing uppercase, lowercase, a number and a symbol. Press **Verify demo email and sign in** after registration. No email is sent; this is explicitly simulated verification. Each new account receives demo opening funds.

The Angular development server proxies `/api` to `http://127.0.0.1:3001`. The API persists data in `server/data/nexus.sqlite` (ignored by Git). Restarting the API preserves balances and users. Run both processes: a static frontend deployment alone cannot provide authentication or banking data.

If port 4200 is occupied, stop your previous app server or configure another port and set `APP_ORIGIN` to the exact frontend origin before starting the API. `PORT` and `DB_PATH` also configure the API. The API binds to loopback. There is no production deployment configuration in this project.

## Checks

```sh
npm test -- --watch=false
npm run test:api
npm run build
npm run format:check
```

The API tests use isolated in-memory databases, not your demo account's database.

## API overview

All requests return JSON. Mutations require `X-Nexus-Request: 1`; Angular supplies it through an interceptor. Authentication uses an HttpOnly, SameSite=Strict cookie with a one-hour lifetime. Banking endpoints require a valid session and enforce ownership. `NODE_ENV=production` adds the Secure cookie flag; it does not make this local demo production-ready.

| Method | Endpoint                  | Purpose                                                     |
| ------ | ------------------------- | ----------------------------------------------------------- |
| POST   | `/api/auth/register`      | Validate and register; return local demo verification token |
| POST   | `/api/auth/verify`        | Consume a demo verification token                           |
| POST   | `/api/auth/login`         | Authenticate and issue session cookie                       |
| GET    | `/api/auth/me`            | Restore the session                                         |
| POST   | `/api/auth/logout`        | Invalidate the session                                      |
| GET    | `/api/accounts`           | Customer accounts and balances                              |
| GET    | `/api/transactions`       | Customer ledger history                                     |
| GET    | `/api/beneficiaries`      | Supported demo recipients                                   |
| POST   | `/api/transfers`          | Confirm an atomic simulated transfer                        |
| GET    | `/api/cards`              | Customer cards                                              |
| PATCH  | `/api/cards/:id`          | Set `status` to `active` or `blocked`                       |
| GET    | `/api/notifications`      | Customer notifications                                      |
| POST   | `/api/notifications/read` | Mark one `id`, or all, as read                              |

Transfer body:

```json
{
  "from": "source-account-id",
  "to": "b1",
  "amount": 25.5,
  "description": "Demo payment",
  "key": "a-unique-uuid-for-this-transfer",
  "confirmed": true
}
```

Successful transfers return `{ "reference": "..." }`. Retrying the identical request with the same key returns the original reference without another debit. Reusing the key with different details returns 409. Amounts are validated and stored as integer cents. The maximum is $50,000 per transfer; there is no daily-limit or fraud engine.

CSV exports cover the entire filtered transaction result, not only the visible page. Select a transaction to view its receipt and choose Print / Save PDF, then use the browser's PDF destination.

See [AUDIT-IMPLEMENTATION.md](AUDIT-IMPLEMENTATION.md) for completed audit changes, implementation choices and remaining roadmap items.
