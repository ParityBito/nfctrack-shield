# Authentication & Authorization

## Overview

Shield uses **Keycloak** for authentication via OAuth2/OIDC, and a **role-based access control (RBAC)** system managed by the backend API for authorization.

## Authentication Flow

```
User → /login → Keycloak Login Page → /callback → Session Created → App
```

1. User visits a protected route
2. If no session exists, they're redirected to `/login`
3. `/login` redirects to Keycloak's authorization endpoint
4. User authenticates with Keycloak (email/password or SSO)
5. Keycloak redirects back to `/callback` with an authorization code
6. The callback route exchanges the code for access + refresh tokens
7. Tokens are stored in a server-side session (cookie-based)
8. User is redirected to the originally requested page

### Key Files

| File | Purpose |
|---|---|
| `app/routes/auth/login.tsx` | Initiates OAuth2 flow |
| `app/routes/auth/callback.tsx` | Handles OAuth2 callback |
| `app/routes/auth/logout.tsx` | Destroys session, redirects to Keycloak logout |
| `app/.server/user-session.ts` | Session management, token refresh |
| `app/contexts/auth-context.tsx` | Client-side auth state context |

### Token Refresh

When an API call returns 401:

1. The system attempts to refresh the access token using the refresh token
2. If refresh succeeds, the API call is retried with the new token
3. If refresh fails, the user is redirected to `/login`

This is handled transparently by `fetchAuthenticated()` in `app/.server/api-utils.ts`.

## Authorization (RBAC)

### Multi-Client Access

Users can belong to multiple client organizations. Each user has one or more **access grants** that define their permissions:

```
User
  └── ClientAccess[]
        ├── client: Client
        ├── site: Site (or all sites)
        └── role: Role
```

The active client/site context is stored in the session and sent as `X-Client-Id` on API requests.

### RBAC Scope Hierarchy

Roles operate at different scopes, from broadest to narrowest:

| Scope | Description |
|---|---|
| `SYSTEM` | Full platform access (super admin) |
| `GLOBAL` | Cross-client access |
| `CLIENT` | Access within a specific client organization |
| `SITE_GROUP` | Access across a group of sites |
| `SITE` | Access within a specific site |
| `SELF` | Access only to own data |

### Permissions

Each role has a set of **capabilities** (permissions). These are checked in route loaders and UI components to control what users can see and do.

### Contexts

| Context | File | Purpose |
|---|---|---|
| `ActiveAccessGrantContext` | `app/contexts/active-access-grant-context.tsx` | Current client/site/role selection |
| `RequestedAccessContext` | `app/contexts/requested-access-context.tsx` | Access context for the current request |
| `AuthContext` | `app/contexts/auth-context.tsx` | Current user identity and tokens |

### Switching Clients

Users with multi-client access can switch between organizations. This is handled by:

1. The client switcher UI component
2. `POST /action/switch-client` action route
3. Updates the `activeClientId` in the session
4. Triggers a re-fetch of organization-specific data

## Session Structure

The server-side session (cookie-based) stores:

- **User identity**: Name, email, Keycloak subject ID
- **OAuth tokens**: Access token, refresh token, expiration
- **Active client**: Currently selected client organization ID
- **App state**: UI preferences (theme, sidebar state, etc.)

## Environment Variables

Authentication requires these environment variables:

```env
CLIENT_ID=shield-app                    # Keycloak client ID
CLIENT_SECRET=...                       # Keycloak client secret
ISSUER_URL=https://auth.../realms/...   # Keycloak realm issuer URL
USERINFO_URL=https://auth.../userinfo   # OIDC userinfo endpoint
LOGOUT_URL=https://auth.../logout       # OIDC logout endpoint
REDIRECT_URL=http://localhost:5173/callback  # OAuth callback URL
SESSION_SECRET=...                      # Secret for signing session cookies
COOKIE_SECRET=...                       # Secret for encrypting cookie data
```

## Protected Routes

All routes under the main layout (`app/routes/layout.tsx`) require authentication. The layout loader calls `requireUserSession()` which:

1. Checks for a valid session
2. Refreshes the token if needed
3. Redirects to `/login` if no valid session exists

### Public Routes

These routes do NOT require authentication:

- `/login`, `/callback`, `/logout` — Auth flow
- `/accept-invite/:code` — Invitation acceptance
- `/public-inspect/*` — Public inspection interface
- `/health` — Health check
- `/tag` — Tag reading (NFC/QR)
