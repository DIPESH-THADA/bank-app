# Audit implementation

Source: `nexusbank-audit.pdf`, supplied by the project owner. The PDF is an audit and three-phase roadmap, rather than a production banking specification.

## Implemented

- Fixed component test imports and the obsolete starter-page assertion; removed empty duplicate services.
- Server-backed authentication with salted scrypt password hashes, one-hour HttpOnly/SameSite cookie sessions, session restoration, logout invalidation, request verification and authentication rate limiting.
- Reactive login, registration and transfer forms, validation and API error/loading handling. Registration detects duplicate emails and requires a single-use **demo** verification step. No email is sent.
- Server authentication for all banking endpoints and Angular guards for dashboard, transactions, transfers and accounts. Every account/card operation checks ownership.
- Persistent SQLite storage for users, sessions, accounts, cards, ledger entries, notifications and an internal audit log.
- Atomic simulated transfers using integer cents, account checks, self-transfer rejection, available-balance checks, a $50,000 per-transfer cap, explicit confirmation, paired ledger entries, transaction references and idempotency keys. The UI offers seeded beneficiaries; the API additionally supports transfers between the customer's accounts.
- Persistent card freeze/unfreeze and notification read state.
- Search, category/type/date/status/amount filters, pagination, transaction receipt details, CSV statements and browser Print / Save PDF receipts.
- Dashboard balance hiding and income/spending summaries. Summaries include opening demo balances and exclude transfers, as labelled in the UI.
- Consistent Rastriya Banijya Bank branding, a custom demo card visual, USD and a prominent simulation label. Removed unsupported real-bank marketing claims.
- OnPush change detection on API-backed screens, explicit models, lifecycle cleanup for long-lived user subscriptions and formatting checks.
- API regression coverage for authentication, verification, logout, ownership, invalid transfers, duplicate/concurrent transfers, cards, notifications and rate limiting; Angular tests for routes, forms, filters and theme persistence.

## Deliberate local-demo choices

The audit recommends Express/NestJS, PostgreSQL and Prisma. This implementation uses Node's HTTP server and SQLite to run with the installed toolchain without another service or dependency installation. It is a local, single-process demo. SQLite is experimental in the Node 23 runtime used for verification. Use a supported Node 24 LTS installation for ongoing development and retest there.

Email verification is explicitly simulated: its token is returned to the registering browser. This demonstrates the state transition, **not proof of email ownership**. The seeded demo credentials are public. The API binds to loopback and is not a production authentication service. It does not move real money. The Netlify deployment now uses a serverless adapter with private, conditional-write snapshot storage; see DEPLOYMENT.md.

## Remaining roadmap work

- PostgreSQL/Prisma migration, Express/NestJS structure, Docker Compose and Swagger/OpenAPI.
- Real email delivery and expiring verification/resend/recovery flows, deployment hardening and optional MFA.
- Savings goals, upcoming bills and bill payment, beneficiary CRUD, lost/replacement cards, editable spending limits, expiry warnings and card-specific history.
- Rich time-series charts, downloadable PDF generation independent of browser printing, accessible modal receipt presentation and a user-facing audit log.
- ESLint and committed Playwright end-to-end coverage. Interactive browser verification was unavailable because the browser connector failed during initialization.

These roadmap items are not represented as completed features. Existing disabled bill-payment controls continue to say “Soon”.
