# Local Development Setup

## Prerequisites

- **Node.js** >= 24.0.0 (see `.nvmrc`)
- **npm** (comes with Node.js)
- Access to the Shield staging environment (Keycloak, API, AWS)

## Step-by-Step Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd shield
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values. You'll need credentials for:

| Service          | What You Need                                                     | Who to Ask         |
| ---------------- | ----------------------------------------------------------------- | ------------------ |
| Keycloak         | `CLIENT_SECRET`                                                   | Team lead / DevOps |
| AWS              | `AWS_ACCESS_KEY_ID`, `AWS_ACCESS_KEY_SECRET`, `AWS_PRIVATE_CDN_*` | DevOps             |
| Image Processing | `IMAGE_PROCESSING_KEY`, `IMAGE_PROCESSING_SALT`                   | DevOps             |
| Sentry           | `SENTRY_AUTH_TOKEN`                                               | DevOps             |
| ZipCodeStack     | `ZIPCODESTACK_API_KEY`                                            | Team lead          |
| Google Maps      | `GOOGLE_MAPS_API_KEY`                                             | Team lead          |

The defaults in `.env.example` point to the **staging** environment for the API and Keycloak. This is the standard setup for local development.

### 3. Start the Dev Server

```bash
npm run dev
```

The app runs at http://localhost:5173 with hot module replacement (HMR).

### 4. Run Type Checking (Optional, Recommended)

In a separate terminal:

```bash
npm run typecheck -- --watch
```

This generates React Router types and runs the TypeScript compiler in watch mode.

## Connecting to Different Environments

### Staging (Default)

The `.env.example` defaults point to staging:

```
API_BASE_URL=https://shield-api.stg.fc-safety.app
ISSUER_URL=https://auth.stg.fc-safety.com/realms/shield/
```

### Local Backend API

If running the Shield API locally:

```
API_BASE_URL=http://localhost:3000
```

### Local Keycloak

If running Keycloak locally (e.g., via Docker):

```
CLIENT_SECRET=<local-keycloak-client-secret>
ISSUER_URL=http://localhost:8443/realms/shield/
USERINFO_URL=http://localhost:8443/realms/shield/protocol/openid-connect/userinfo
LOGOUT_URL=http://localhost:8443/realms/shield/protocol/openid-connect/logout
```

## Available Scripts

| Command                  | Description                              |
| ------------------------ | ---------------------------------------- |
| `npm run dev`            | Start dev server with HMR (port 5173)    |
| `npm run build`          | Production build                         |
| `npm start`              | Start production server                  |
| `npm run lint`           | Run ESLint                               |
| `npm run typecheck`      | Generate types + run TypeScript compiler |
| `npm test`               | Run Jest tests                           |
| `npm test -- --watch`    | Tests in watch mode                      |
| `npm test -- --coverage` | Tests with coverage report               |

## Troubleshooting

### "Cannot find module" or type errors after pulling

```bash
npm run typecheck
```

React Router 7 generates route types via `react-router typegen`. Running `typecheck` triggers this.

### HMR stops working

Restart the dev server. If persistent:

```bash
rm -rf .cache node_modules/.cache
npm run dev
```

### Authentication redirect loop

- Verify `REDIRECT_URL` matches your local URL (http://localhost:5173/callback)
- Check that `CLIENT_SECRET` and `ISSUER_URL` are correct
- Ensure the Keycloak realm has your redirect URL whitelisted

### Build fails with stale cache

```bash
rm -rf .cache node_modules/.cache build .react-router
npm run build
```

### Clean reinstall

```bash
rm -rf node_modules package-lock.json .cache build .react-router
npm install
```
