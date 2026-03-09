# Architecture Decisions

Key technology choices and the reasoning behind them.

---

## React Router 7 (formerly Remix)

**Decision:** Use React Router 7 as the full-stack framework instead of Next.js or a pure SPA.

**Rationale:**
- Server-side rendering with a simple mental model (loaders for data, actions for mutations)
- No `"use client"` / `"use server"` directives — all components hydrate by default
- Built-in cookie session management needed for Keycloak SSO
- File-based routing with nested layouts
- Originally started as Remix; React Router 7 is the natural successor

---

## TanStack Query over React Router Fetchers

**Decision:** Migrate toward TanStack Query for data loading instead of relying solely on React Router loaders/fetchers.

**Status:** In progress. New features should prefer client-side loading.

**Rationale:**
- Better caching and background refetching
- Built-in optimistic updates and cache invalidation
- More flexible than React Router's fetcher pattern for complex UIs
- The backend API is designed to be called directly from the browser
- Loaders still used for SSR-critical data (auth, initial page load) via prefetch + hydration

---

## Radix UI + Tailwind CSS v4

**Decision:** Build the component library on Radix UI primitives styled with Tailwind.

**Rationale:**
- Radix provides fully accessible, unstyled primitives (dialogs, dropdowns, etc.)
- Tailwind v4 gives utility-first styling with CSS variables for theming
- `class-variance-authority` (CVA) handles component variants cleanly
- No dependency on a heavy component library like MUI or Ant Design

---

## Zustand for Component State Only

**Decision:** Use Zustand only for component-scoped state (multi-step wizards), not global app state.

**Rationale:**
- Global persistent state must live in cookies (SSR requirement)
- React Context handles shared state that doesn't need persistence
- TanStack Query handles server state
- Zustand fills the niche of complex local component state (step wizards) where `useState` becomes unwieldy

---

## Cookie-Based AppState

**Decision:** Persist UI preferences (dashboard filters, sidebar state, active client) in a signed cookie.

**Rationale:**
- SSR requires state to be available on the server during page load
- Cookies are sent with every request, making them accessible in loaders
- Flat structure keeps cookie size manageable
- In-flight cookie store allows actions and loaders in the same request to share state

**Trade-off:** Cookie size limit (~4KB) constrains what can be stored. Only small, serializable preferences belong here.

---

## Keycloak for Authentication

**Decision:** Use Keycloak as the identity provider via OAuth2/OIDC.

**Rationale:**
- Enterprise SSO requirement (supports SAML, OIDC, LDAP federation)
- Centralized user management across multiple FC Safety applications
- Built-in login UI with customizable themes
- `remix-auth-oauth2` provides clean integration with React Router sessions

---

## Multi-Client Access Model

**Decision:** Users can have access to multiple client organizations, each with different roles and site assignments.

**Rationale:**
- Real-world use case: consultants and regional managers work across multiple client organizations
- Access grants are the join between person, client, site, and role
- `ActiveAccessGrantContext` manages the global selection
- `RequestedAccessContext` allows pages/components to scope to a specific client without changing the global selection
- Client switching clears the React Query cache to prevent data leakage between organizations

---

## Server-Side API Proxy

**Decision:** Client-side API calls go through `/api/proxy/*` rather than directly to the backend.

**Rationale:**
- Keeps the backend API URL private (not exposed to the browser)
- Server-side proxy attaches auth tokens from the session
- Consistent authentication for both loader-based and client-side requests
- Note: `useAuthenticatedFetch` also supports direct browser-to-API calls for TanStack Query patterns

---

## Zod for Validation

**Decision:** Use Zod for both client-side form validation and server-side action validation.

**Rationale:**
- Single schema works in both environments
- TypeScript type inference via `z.infer<typeof schema>`
- Composable schemas (extend, pick, omit, merge)
- Dynamic schema builders for runtime-dependent validation (e.g., inspection questions)
- `zodResolver` bridges Zod with React Hook Form
