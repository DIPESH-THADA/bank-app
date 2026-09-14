# Netlify deployment

The site is hosted at https://rastriya-banijya-bank-rbb.netlify.app. The project root is the GitHub repository root. `netlify.toml` configures Node 24, the Angular production build, `dist/nexus-bank/browser`, and SPA route fallbacks.

## Persistent demo API

`netlify/functions/bank.mjs` handles `/api/*` and delegates validation and banking logic to the same API used locally. No separate backend host or database credentials are required.

Each request loads a private SQLite snapshot from the site-wide Netlify Blobs store `rbb-banking-demo-v1` into its own temporary working directory. Mutations are saved using an ETag conditional write. A conflicting write retries from the latest snapshot, so concurrent transfers cannot silently overwrite each other. A failed save never returns a successful transfer or login response. Session and rate-limit data also persist across invocations. Temporary files are removed after requests; the durable copy is in Blobs, not the function filesystem.

This whole-database snapshot approach is for a small, low-traffic simulated portfolio demo. It is not suitable for production banking or a large user base. For greater scale, migrate to a transactional hosted database. The deployed database starts with fresh demo seed data; local customer records and photos are not uploaded.

Functions use Secure, HttpOnly, SameSite cookies, and check mutations against the request's site origin. A Netlify runtime supporting `node:sqlite` is required (Node 24 configured for this site). Email verification remains explicitly simulated.

## Publish

```sh
npx netlify-cli login
npx netlify-cli link --id f20ea76c-ad6f-44dc-9097-43b57cab46a0
npx netlify-cli env:set AWS_LAMBDA_JS_RUNTIME nodejs24.x
npm run test:api
npm run build
npx netlify-cli deploy --no-build --prod --dir dist/nexus-bank/browser --functions netlify/functions
```

The project can also be imported from `DIPESH-THADA/bank-app`, branch `master`, with an empty base directory. GitHub automatic deployment is separate from CLI publication and must be connected in Netlify.

Verify the live URL after deploying: login, `/profile` page refresh, profile-photo persistence, a simulated transfer, and sign-out. Do not publish `server/data` or include it in function bundles.
