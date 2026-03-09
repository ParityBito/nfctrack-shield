# Contributing to Shield

## Getting Started

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd shield
npm install
```

2. Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

The app will be available at http://localhost:5173.

## Development Workflow

### Branch Naming

Use descriptive branch names with a type prefix:

- `feat/short-description` — New features
- `fix/short-description` — Bug fixes
- `chore/short-description` — Maintenance, dependencies, config
- `refactor/short-description` — Code restructuring without behavior change
- `docs/short-description` — Documentation only

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add inspection route scheduling
fix: correct tag registration validation on NFC scan
chore: upgrade React Router to 7.9.5
refactor: extract alert resolution into shared hook
```

Keep the subject line under 72 characters. Add a body for non-trivial changes.

### Pull Requests

1. Create a feature branch from `main`
2. Make focused, atomic commits
3. Ensure all checks pass before requesting review:

```bash
npm run lint
npm run typecheck
npm test
```

4. Write a clear PR description explaining **what** changed and **why**
5. Link related issues if applicable

## Code Style

### File Naming

- **Components:** `kebab-case.tsx` (e.g., `user-profile-card.tsx`)
- **Utilities:** `kebab-case.ts` (e.g., `format-date.ts`)
- **Types/Models:** `kebab-case.ts` in `app/lib/` directories
- **Routes:** Follow React Router 7 conventions in `app/routes/`

### Component Structure

```tsx
import { cn } from "~/lib/utils";

interface MyComponentProps {
  title: string;
  className?: string;
}

export function MyComponent({ title, className }: MyComponentProps) {
  return (
    <div className={cn("base-styles", className)}>
      {title}
    </div>
  );
}
```

- Use PascalCase for component names
- Define TypeScript interfaces for all props
- Use the `cn()` utility for conditional class merging
- Build on Radix UI primitives for interactive components

### Imports

Group imports in this order, separated by blank lines:

1. React / React Router
2. Third-party libraries
3. Local components (`~/components/`)
4. Local utilities, hooks, types (`~/lib/`, `~/hooks/`, `~/contexts/`)

### State Management

| Use Case | Tool |
|---|---|
| Server data (API responses) | React Query via loaders |
| Global client state | Zustand stores |
| Shared UI state | React Context |
| Form state | React Hook Form + Zod |
| Local UI state | `useState` / `useReducer` |

### API Integration

Server-side data fetching uses the `ApiFetcher` / `CRUD` pattern in `app/.server/api.ts`. See `docs/api-integration.md` for details.

## Testing

- Write tests for critical business logic and complex utilities
- Use Jest + React Testing Library
- Co-locate test files with their source: `my-component.test.tsx`
- Mock external API calls; don't make real network requests in tests

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # With coverage report
```

## Code Quality Checks

Before pushing, run:

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript compiler + React Router type generation
npm test            # Jest tests
```

All three must pass for CI to succeed.
