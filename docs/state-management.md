# State Management

Shield uses several state management strategies depending on the type of data. This guide covers when to use each approach and how they work.

## SSR and Cookies

Shield is a server-side rendered (SSR) application. This has a key implication: **state that must persist across page navigations must be stored in cookies**. Unlike a pure SPA where in-memory state survives route changes, each page navigation in an SSR app triggers a server request, and the server has no access to client-side React state. Cookies are sent with every request, making them the bridge between client and server.

This is why `AppState` uses cookie storage — dashboard preferences, the active access grant, sidebar state, and other UI settings all need to survive full-page loads and be readable in route loaders.

## When to Use What

| Data Type | Tool | Example |
|---|---|---|
| Server data (API responses) | TanStack Query | Product lists, inspection history |
| Persistent UI preferences | AppState (cookies) | Sidebar state, dashboard filters, timezone |
| Active client/site/role | ActiveAccessGrantContext | Multi-client switching |
| Current user & tokens | AuthContext | Auth headers, token refresh |
| Page/component-scoped access | RequestedAccessContext | Admin client details, scoped forms |
| Multi-step wizard state | Zustand (component-scoped) | Product selector, migration assistant |
| Help sidebar | HelpSidebarContext | Open/close, content |
| Local UI state | `useState` / `useReducer` | Dropdown open, form field values |

## Provider Hierarchy

```
root.tsx
├── ThemeProvider
├── OptimizedImageProvider
├── AppStateProvider          ← cookie-backed persistent state
│   └── QueryClientProvider   ← TanStack Query
│       └── layout.tsx
│           ├── AuthProvider              ← user identity & tokens
│           └── ActiveAccessGrantProvider ← client/site/role context
│               └── RequestedAccessContextProvider (route-specific)
│                   └── HelpSidebarProvider
```

## AppState (Cookie-Backed Preferences)

`AppState` stores persistent UI preferences in a cookie (`__appState`). It survives page refreshes and is available on both server and client.

### Reading state

```tsx
import { useAppStateValue } from "~/contexts/app-state-context";

// Individual value with type inference
const [timezone, setTimezone] = useAppStateValue("timeZone");

// With a default
const [months, setMonths] = useAppStateValue("dash_comp_hist_months", 1);
```

Or read the full state:

```tsx
import { useAppState } from "~/contexts/app-state-context";

const { appState, setAppState } = useAppState();
```

### Writing state

```tsx
// Set a single value
setTimezone("America/New_York");

// Set multiple values
setAppState({ timeZone: "America/New_York", locale: "en-US" });

// Functional update
setAppState((prev) => ({ ...prev, dash_comp_hist_months: 3 }));

// With revalidation (triggers React Router loader re-runs)
setAppState({ activeAccessGrant: newGrant }, { revalidate: true });
```

### How it works

1. Root loader reads `__appState` cookie via `getAppState(request)` and passes it to `AppStateProvider`
2. `setAppState()` optimistically updates local React state, then posts the partial update to `/action/set-app-state`
3. The action route writes the merged state back to the cookie
4. The in-flight cookie store makes the updated value available to subsequent server operations in the same request

### What belongs in AppState

AppState is stored in a cookie, so keep it small. Good candidates:
- Active access grant (client/site/role selection)
- Dashboard filter preferences (date ranges, sort state)
- Sidebar expanded/collapsed state
- Timezone and locale preferences

**Don't put** large data, API responses, or frequently-changing values in AppState.

## ActiveAccessGrantContext (Multi-Client Access)

Manages which client organization the user is currently viewing.

```tsx
import { useActiveAccessGrant } from "~/contexts/active-access-grant-context";

const {
  accessibleClients,        // All user's access grants
  activeAccessGrant,        // Currently selected { clientId, siteId, roleId }
  activeClient,             // Full MyClientAccess record for the active grant
  setActiveAccessGrant,     // Switch to a different client
  hasMultipleAccessGrants,  // Whether client switcher should show
  isLoading,
  refetchClients,
} = useActiveAccessGrant();
```

### Client switching flow

1. User selects a new client in the client switcher UI
2. `setActiveAccessGrant({ clientId, siteId, roleId })` is called
3. Posts to `/action/switch-client` which refreshes the server session with new permissions
4. Updates AppState with the new grant
5. Cancels all in-flight React Query queries and clears the cache
6. Revalidates React Router loaders
7. All subsequent API calls use the new client context

### For API headers

```tsx
import { useActiveClientHeader } from "~/contexts/active-access-grant-context";

// Returns client ID string or null (null when user has single access)
const clientId = useActiveClientHeader();
```

## AuthContext

Provides the current user identity and manages token lifecycle.

```tsx
import { useAuth } from "~/contexts/auth-context";

const {
  user,             // User object with tokens, name, email
  apiUrl,           // Backend API base URL
  appHost,          // App host URL
  googleMapsApiKey, // Maps API key
  clientId,         // Keycloak client ID
  refreshAuth,      // Force token refresh
} = useAuth();
```

### Auto-refresh behavior

- Checks token expiration every 30 seconds
- Refreshes on document visibility change (when user returns to the tab)
- Deduplicates concurrent refresh requests

## RequestedAccessContext

Provides a **scoped** client/site context for specific pages, route groups, or component subtrees — without changing the global active access grant. This is useful when a page or form needs to operate on a different client or site than the one the user has globally selected.

For example, an admin viewing a specific client's details page can scope all child components and API calls to that client via `RequestedAccessContextProvider`, while the user's global `ActiveAccessGrant` remains unchanged.

```tsx
import { useRequestedAccessContext } from "~/contexts/requested-access-context";

const {
  accessIntent,     // "system" | "elevated" | "user"
  currentClientId,
  currentSiteId,
  setCurrentClientId,
  setCurrentSiteId,
} = useRequestedAccessContext();
```

Defaults to the active access grant values. Override by wrapping a page, route layout, or component subtree in a `<RequestedAccessContextProvider>` with specific props:

```tsx
<RequestedAccessContextProvider
  accessIntent="elevated"
  clientId={clientFromRouteParams}
  siteId={siteFromRouteParams}
>
  {/* All children use this client/site context for API calls */}
  <ClientDetailsForm />
  <MembersTable />
</RequestedAccessContextProvider>
```

The `useAuthenticatedFetch` hook reads from this context, so all client-side API calls within the provider automatically use the scoped client/site headers.

## Zustand (Component-Scoped Only)

Zustand is used for **component-local** multi-step wizard state, not global app state. Examples:

- Product selector steps (browse → select category → select product)
- Migration assistant steps
- Setup assistant steps

These stores are created per component instance using a factory pattern.

## TanStack Query

Server data is managed by TanStack Query. See [API Integration Guide](./api-integration.md) for full details on query patterns, service layer, and cache management.
