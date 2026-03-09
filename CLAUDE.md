# Shield Development Guide

## Documentation

Detailed docs are in the `docs/` directory:

- [Local Development Setup](docs/setup-guide.md) — Prerequisites, environment config, troubleshooting
- [Architecture & Data Model](docs/architecture.md) — System architecture, entity relationships, route map
- [API Integration Guide](docs/api-integration.md) — Server-side and client-side data loading patterns
- [Authentication & Authorization](docs/authentication.md) — Keycloak SSO, RBAC, permissions
- [State Management](docs/state-management.md) — AppState cookies, contexts, TanStack Query, Zustand
- [Form Handling Patterns](docs/form-patterns.md) — React Hook Form + Zod, useModalFetcher, validation
- [Testing Guide](docs/testing.md) — Jest setup, patterns, conventions
- [UI Component Library](docs/ui-components.md) — Base components, usage patterns
- [Deployment](docs/deployment.md) — Build, production server, environments, CI/CD
- [Architecture Decisions](docs/decisions.md) — Key technology choices and rationale

Also see: [CONTRIBUTING.md](CONTRIBUTING.md), [CHANGELOG.md](CHANGELOG.md), [.env.example](.env.example)

## Quick Start Commands

### Development

```bash
# Start development server
npm run dev

# Run in a specific environment
NODE_ENV=development npm run dev
```

### Code Quality

```bash
# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run both lint and typecheck
npm run lint && npm run typecheck

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Build & Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
shield/
├── app/
│   ├── .server/       # Server-only code (api, auth, config, sessions)
│   ├── components/    # React components (ui/, admin/, assets/, etc.)
│   ├── contexts/      # React contexts (auth, app-state, access grant)
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Models, types, schemas, utilities
│   ├── routes/        # React Router route modules
│   └── styles/        # Global styles
├── docs/              # Project documentation
├── public/            # Static assets
└── tests/             # Test files
```

## MCP Tools Configuration

### Serena

When using Serena MCP tools, always activate the project using the Docker path:

```
/workspace/shield
```

**Do NOT use the local macOS path** (`/Users/my-name/Projects/...`). Serena runs in a Docker container and requires the container path.

---

## Common Development Tasks

### Creating a New Component

1. Create component file in `app/components/` with proper naming (e.g., `user-profile-card.tsx`)
2. Follow existing component patterns using Radix UI primitives
3. Use TypeScript interfaces for props
4. Style with Tailwind CSS v4
5. See [UI Component Library](docs/ui-components.md) for conventions

### Adding a New Route

1. Routes are added to `app/routes/` directory and configured in `app/routes.ts`
2. Export default component for the route
3. Add loader/action functions as needed for data fetching
4. Use proper error boundaries

### Working with Forms

- Most forms use `useModalFetcher` for client-side submission via `/api/proxy/*`
- Validation uses React Hook Form + Zod (`zodResolver`)
- Schemas are defined in `app/lib/schema.ts`
- See [Form Handling Patterns](docs/form-patterns.md) for full details

### API Integration

- **Server-side**: API endpoints are defined in `app/.server/api.ts` using `ApiFetcher` and `CRUD` builders
- **Client-side (preferred for new features)**: TanStack Query with service files in `app/lib/services/*.service.ts`, using `useAuthenticatedFetch` hook for auth
- See [API Integration Guide](docs/api-integration.md) for full details

## Key Libraries & Patterns

### UI Components

- **Radix UI**: For accessible, unstyled components
- **Tailwind CSS v4**: For styling
- **lucide-react**: For icons
- **cn()**: Utility for conditional classes from `app/lib/utils.ts`

### State Management

- **TanStack Query**: For server data (API responses), with service layer in `app/lib/services/`
- **AppState (cookies)**: For persistent UI preferences (dashboard filters, sidebar state, active client)
- **React Context**: For shared state (auth, active access grant, requested access)
- **Zustand**: For component-scoped multi-step wizard state only
- See [State Management](docs/state-management.md) for when to use what

### Form Handling

- **React Hook Form**: For form state and validation
- **Zod**: For schema validation (shared between client and server)
- **useModalFetcher**: Primary submission hook (posts to `/api/proxy/*`)
- **remix-hook-form**: Bridge for React Router server actions (limited use)

### Authentication

- Keycloak SSO integration via OAuth2/OIDC
- Role-based access control (RBAC) with scope hierarchy
- Multi-client access with client switching
- Protected routes with proper redirects
- See [Authentication & Authorization](docs/authentication.md)

## React Router 7 Architecture

This project uses React Router 7, which has a different architecture than Next.js.

### No "use client" or "use server" Directives

React Router 7 does **NOT** use the `"use client"` or `"use server"` directives found in Next.js. Instead, React Router uses a different model for separating server and client code:

- **Loaders**: Run on the server to fetch data before rendering. Export a `loader` function from route modules.
- **Actions**: Run on the server to handle form submissions and mutations. Export an `action` function from route modules.
- **Components**: The default export runs on both server (SSR) and client (hydration).

```tsx
// Example route module (app/routes/users.tsx)
import type { Route } from "./+types/users";

// Runs on the server - fetches data
export async function loader({ request }: Route.LoaderArgs) {
  const users = await db.users.findMany();
  return { users };
}

// Runs on the server - handles form submissions
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  await db.users.create({ name: formData.get("name") });
  return { success: true };
}

// Renders on server and client
export default function Users({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.users.map(u => <p key={u.id}>{u.name}</p>)}</div>;
}
```

### Key Differences from Next.js

| Feature | Next.js | React Router 7 |
|---------|---------|----------------|
| Server code | `"use server"` directive | `loader`/`action` exports |
| Client code | `"use client"` directive | All components hydrate by default |
| Data fetching | Server Components or API routes | Loaders + TanStack Query |
| Mutations | Server Actions | Actions via `<Form>` or `useModalFetcher` |

### Client-Only Code

For code that should only run on the client (e.g., browser APIs), use standard React patterns:

```tsx
import { useEffect, useState } from "react";

function ClientOnlyFeature() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <div>Client-only content using {window.localStorage.getItem("key")}</div>;
}
```

## Environment Variables

All environment variables are validated by the Zod schema in `app/.server/config.ts`. See `.env.example` for the full list with descriptions.

Key groups: Authentication (Keycloak), API, AWS (S3/CloudFront), Image Processing, External Services, Sentry.

## Troubleshooting

### Common Issues

1. **Type Errors**: Run `npm run typecheck` to generate React Router types
2. **Build Failures**: Clear `.cache` and `node_modules/.cache` directories
3. **Hot Reload Issues**: Restart dev server if HMR stops working
4. **Auth Redirect Loop**: Check `REDIRECT_URL` matches your local URL and `CLIENT_SECRET` is correct

### Useful Debug Commands

```bash
# Clean install
rm -rf node_modules package-lock.json && npm install

# Clear all caches
rm -rf .cache node_modules/.cache build .react-router

# Check for outdated dependencies
npm outdated
```

## Code Style Conventions

1. **File Naming**: Use kebab-case for files (e.g., `user-profile.tsx`)
2. **Component Naming**: Use PascalCase for components
3. **Imports**: Group imports by type (React, libraries, local)
4. **Props**: Define interfaces with descriptive names
5. **Hooks**: Custom hooks start with `use` prefix
6. **Constants**: Use UPPER_SNAKE_CASE for true constants

## Git Workflow

1. Create feature branches from `main`
2. Use conventional commits (feat:, fix:, chore:, etc.)
3. Run lint and tests before committing
4. Keep commits focused and atomic
5. Write descriptive commit messages
6. See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines
