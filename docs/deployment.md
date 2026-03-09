# Deployment

## Build

Shield is a React Router 7 application that compiles to a Node.js server.

```bash
npm run build
```

This produces:
- `build/server/` — Server bundle (Node.js)
- `build/client/` — Static client assets (JS, CSS, images)

## Production Server

```bash
NODE_OPTIONS='--import ./instrument.server.mjs' react-router-serve ./build/server/index.js
```

Or via npm:

```bash
npm start
```

The `instrument.server.mjs` file initializes Sentry error tracking before the app starts.

Default port is `5173` (configurable via `PORT` environment variable).

## Environment Configuration

Shield uses two environment files:

| File | Purpose |
|---|---|
| `.env` | Local development (staging services) |
| `.env.prod` | Production deployment |

Key differences between environments:

| Variable | Staging | Production |
|---|---|---|
| `API_BASE_URL` | `https://shield-api.stg.fc-safety.app` | `https://shield-api.fc-safety.app` |
| `ISSUER_URL` | `https://auth.stg.fc-safety.com/realms/shield/` | `https://auth.fc-safety.com/realms/shield/` |
| `REDIRECT_URL` | `http://localhost:5173/callback` | `https://shield.fc-safety.app/callback` |
| `APP_HOST` | `http://localhost:5173` | `https://shield.fc-safety.app` |
| `SENTRY_ENVIRONMENT` | `local` | *(not set in .env.prod)* |

Production has its own `CLIENT_SECRET`, `SESSION_SECRET`, `COOKIE_SECRET`, and `AWS_PRIVATE_CDN_*` values.

See `.env.example` for the full variable list.

## CI/CD

### GitHub Actions Workflows

**Claude Code** (`.github/workflows/claude.yml`)
- Triggers when `@claude` is mentioned in issue comments, PR reviews, or issues
- Runs Claude Code for automated assistance
- Read-only permissions (contents, PRs, issues, actions)

**Claude Code Review** (`.github/workflows/claude-code-review.yml`)
- Triggers on PR open and push events
- Automated code review for bugs and security issues
- Read-only permissions

### Pre-Deployment Checks

Before deploying, ensure:

```bash
npm run lint        # No lint errors
npm run typecheck   # No type errors
npm test            # Tests pass
npm run build       # Build succeeds
```

## Monitoring

### Sentry

Error tracking is configured via:

- `instrument.server.mjs` — Server-side Sentry initialization (loaded via `NODE_OPTIONS --import`)
- `@sentry/react-router` — Client-side React Router integration
- Vite plugin for source map uploads during build

Environment variables:
- `SENTRY_ENVIRONMENT` — Environment name (`local`, `staging`, `production`)
- `SENTRY_AUTH_TOKEN` — Auth token for source map uploads

### Health Check

The app exposes a `/health` endpoint for load balancer health checks.
