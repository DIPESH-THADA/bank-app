# Netlify deployment

The GitHub repository root is the Angular project root. `netlify.toml` configures Node 24, `npm run build`, and `dist/nexus-bank/browser`, plus client-side route handling for page refreshes.

## Backend required

This app uses `/api` for login, registration, accounts, transfers, profile photos and notifications. `proxy.conf.json` only works with the local Angular development server; Netlify does not use it. Uploading the frontend alone does not deploy the API.

The current API is a persistent Node process backed by a local SQLite file. It needs a Node host with a persistent disk, or a migration to a hosted database and serverless API. Do not use a temporary function filesystem for the banking database.

Once the API has a public HTTPS origin, place this proxy rule **before** the SPA fallback in `netlify.toml`, replacing the example host with the actual backend:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://YOUR-BACKEND-HOST/api/:splat"
  status = 200
  force = true
```

Configure the backend with `APP_ORIGIN` matching the exact Netlify site origin, `NODE_ENV=production` for Secure cookies, and `DB_PATH` on its persistent disk. Its HTTP listener must bind to the address required by that hosting provider; the current local default is loopback. These backend settings are not Netlify frontend build variables.

## Publish after connecting the account and backend

```sh
npx netlify-cli login
npx netlify-cli link
npx netlify-cli deploy --build --prod
```

For a new project, create/import `DIPESH-THADA/bank-app` in Netlify first or use the CLI's new-project flow. For Git deployment, select branch `master` and leave the base directory empty.

Verify on the live URL: registration, sign-in, a page refresh on `/profile`, profile-photo persistence, a simulated transfer, and sign-out. A successful static build alone does not verify the banking API.
