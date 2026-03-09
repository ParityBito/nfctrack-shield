# API Integration Guide

Shield uses a hybrid approach for loading data from the backend API:

- **Server-side**: React Router loaders/actions using the `ApiFetcher` / `CRUD` classes
- **Client-side**: TanStack Query (React Query) using the `useAuthenticatedFetch` hook

The backend API is designed to be called directly from the browser. There is an ongoing migration toward client-side data loading via TanStack Query, as it provides better caching, background refetching, and optimistic updates compared to React Router's fetcher pattern. New features should prefer client-side loading unless server-side rendering is specifically required.

## Architecture Overview

```
                        ┌─────────────────────────────┐
                        │      Shield Backend API      │
                        └──────────┬──────────────────┘
                                   │
                    ┌──────────────┼──────────────────┐
                    │              │                   │
          ┌────────▼───────┐  ┌───▼────────────┐  ┌──▼───────────────┐
          │  Server-Side   │  │  Client-Side   │  │  Client-Side     │
          │  (Loaders)     │  │  (React Query) │  │  (Mutations)     │
          │  ApiFetcher    │  │  queryOptions  │  │  useMutation     │
          │  CRUD builder  │  │  + services    │  │  + fetchOrThrow  │
          └────────────────┘  └────────────────┘  └──────────────────┘
```

### Key Files

| File | Purpose |
|---|---|
| `app/.server/config.ts` | Environment config (Zod-validated) |
| `app/.server/api-utils.ts` | `ApiFetcher`, `CRUD`, and `FetchOptions` classes (server-side) |
| `app/.server/api.ts` | Server-side API endpoint definitions |
| `app/hooks/use-authenticated-fetch.tsx` | Client-side authenticated fetch hook |
| `app/lib/services/*.service.ts` | TanStack Query option factories per domain |
| `app/contexts/query-context.tsx` | QueryClient setup and hydration |
| `app/hooks/use-dehydrated-state.tsx` | Merges dehydrated state from multiple loaders |

---

## Client-Side Data Loading (TanStack Query)

This is the **preferred approach** for new features.

### The `useAuthenticatedFetch` Hook

The `useAuthenticatedFetch` hook (`app/hooks/use-authenticated-fetch.tsx`) is the client-side equivalent of the server-side `fetchAuthenticated()`. It provides a `fetch`-compatible function that:

1. Resolves relative paths against the API base URL
2. Attaches the `Authorization: Bearer <token>` header
3. Sets `X-Client-Id`, `X-Site-Id`, and `X-Access-Intent` headers from the current access context
4. Checks token expiration before each request and refreshes proactively
5. Retries on 401 responses after refreshing the token

```tsx
const { fetch, fetchOrThrow } = useAuthenticatedFetch();

// fetch: returns the Response (even on error status codes)
// fetchOrThrow: throws if response is not ok
```

### Service Layer (`app/lib/services/`)

Query logic is organized into **service files** that export `queryOptions` factories. Each factory accepts a `fetcher` function (from `useAuthenticatedFetch`) and returns a TanStack Query options object:

```ts
// app/lib/services/products.service.ts
import { queryOptions } from "@tanstack/react-query";

export const getProductsQuery = (
  fetcher: typeof fetch,
  options: GetProductsOptions = {}
) =>
  queryOptions({
    queryKey: ["primary-products", options] as const,
    queryFn: async ({ queryKey }) => {
      const { manufacturerId, productCategoryId, clientId } = queryKey[1];
      return fetcher(buildPath("/products", { manufacturerId, productCategoryId, clientId }))
        .then((r) => r.json() as Promise<ResultsPage<Product>>)
        .then((r) => r.results);
    },
  });
```

This pattern keeps data-fetching logic reusable and testable, separate from UI components.

### Using Queries in Components

```tsx
import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { getProductsQuery } from "~/lib/services/products.service";

function ProductList({ clientId }: { clientId: string }) {
  const { fetchOrThrow } = useAuthenticatedFetch();

  const { data: products = [], isLoading } = useQuery(
    getProductsQuery(fetchOrThrow, { clientId })
  );

  if (isLoading) return <Spinner />;
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

#### Conditional / Lazy Queries

Use the `enabled` option to defer fetching until needed:

```tsx
const { data: manufacturers = [], isLoading } = useQuery({
  ...getManufacturersForSelectorQueryOptions(fetchOrThrow, { clientId }),
  enabled: isDropdownOpen || !!selectedValue,
});
```

#### Suspense Queries

For components wrapped in a `<Suspense>` boundary:

```tsx
import { useSuspenseQuery } from "@tanstack/react-query";

const { data: products } = useSuspenseQuery(
  getProductsQuery(fetchOrThrow, { clientId })
);
```

### Mutations

Use `useMutation` with `fetchOrThrow` for write operations:

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

function DeleteManufacturer({ id }: { id: string }) {
  const { fetchOrThrow } = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (manufacturerId: string) =>
      fetchOrThrow(`/manufacturers/${manufacturerId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) => queryKey[0] === "manufacturers",
      });
    },
  });

  return <Button onClick={() => deleteMutation.mutate(id)}>Delete</Button>;
}
```

### Query Key Conventions

Query keys are prefixed by domain, with options as the second element:

| Domain | Key Pattern |
|---|---|
| Products | `["primary-products", { manufacturerId?, clientId? }]` |
| Manufacturers | `["manufacturers", "selector", { clientId?, accessIntent? }]` |
| Asset Questions | `["asset-questions", { productId?, type? }]` |
| Client Access | `["client-access", "me"]` |
| Sites | `["sites", { excludeGroups?, limit? }]` |
| Organization | `["my-organization", clientId, siteId]` |
| Compliance | `["compliance-history", { months, siteId? }]` |
| Product Requests | `["product-requests", { ... }]` |

### SSR Prefetching + Hydration

For critical data that should be available on first render, prefetch in a loader and hydrate on the client:

```ts
// In a route loader (server-side)
import { dehydrate, QueryClient } from "@tanstack/react-query";
import { getAuthenticatedFetcher } from "~/.server/api-utils";

export async function loader({ request }: Route.LoaderArgs) {
  const queryClient = new QueryClient();
  const fetcher = getAuthenticatedFetcher(request);

  await Promise.all([
    queryClient.prefetchQuery(getMyOrganizationQueryOptions(fetcher)),
    queryClient.prefetchQuery(getMyClientAccessQueryOptions(fetcher)),
  ]);

  return {
    dehydratedState: dehydrate(queryClient),
  };
}
```

The `useDehydratedState` hook in `app/hooks/use-dehydrated-state.tsx` merges dehydrated state from all matched route loaders, and `QueryClientProvider` wraps it with `<HydrationBoundary>` to populate the client-side cache.

### QueryClient Configuration

The QueryClient is configured in `app/contexts/query-context.tsx` with:

- **Default stale time**: 10 seconds
- **Global error handling**: via `QueryCache` and `MutationCache` `onError` callbacks
- **SSR hydration**: via `HydrationBoundary` with merged dehydrated state

---

## Server-Side Data Loading (Loaders & Actions)

Used for initial page loads and form submissions where server rendering is needed.

### The CRUD Builder

For standard REST resources, use the `CRUD` class to generate `list` and `get` methods:

```ts
import { CRUD } from "./api-utils";
import type { Asset } from "~/lib/models";

// Generates: { list, get }
const assets = CRUD.for<Asset>("/assets").all();

// Usage in a loader:
const page = await assets.list(request, { page: 1, pageSize: 20 });
const asset = await assets.get(request, assetId);
```

`CRUD.for<T>(path)` returns a builder with:

- `.all()` — returns both `list` and `get`
- `.only(["list"])` — returns only specified actions
- `.except(["get"])` — returns all except specified actions

### List response shape

All `list` calls return a `ResultsPage<T>`:

```ts
interface ResultsPage<T> {
  results: T[];
  count: number;
  limit?: number;
  offset?: number;
}
```

### The ApiFetcher

For custom endpoints beyond basic CRUD, use `ApiFetcher` directly:

```ts
import { ApiFetcher } from "./api-utils";

// GET with path parameters
const tag = await ApiFetcher
  .create(request, "/tags/for-inspection/:externalId", { externalId })
  .get<GetTagWithAccessContextResult>();

// POST with JSON body
const asset = await ApiFetcher
  .create(request, "/assets/:id/configure", { id: assetId })
  .json(configData)
  .post<Asset>();

// Set custom headers
const result = await ApiFetcher
  .create(request, "/tags/check-registration")
  .setHeader("X-Inspection-Token", token)
  .get<GetTagWithAccessContextResult>();
```

#### ApiFetcher methods

| Method | Description |
|---|---|
| `.get<T>(options?)` | Send GET request, return typed response |
| `.post<T>(options?)` | Send POST request |
| `.patch<T>(options?)` | Send PATCH request |
| `.delete<T>(options?)` | Send DELETE request |
| `.json(body)` | Set JSON request body |
| `.body(body)` | Set raw request body |
| `.setHeader(key, value)` | Set a request header |
| `.setQueryParams(params)` | Replace query parameters |
| `.addQueryParams(params)` | Append query parameters |

#### FetchBuildOptions

Pass options to control access context:

```ts
await assets.list(request, query, {
  accessIntent: "elevated",  // "system" | "elevated" | "user"
  clientId: "specific-client-id",  // Override active client
  params: { extra: "query-param" },
});
```

### Bypassing Auth (Public Endpoints)

For unauthenticated endpoints (e.g., public inspection):

```ts
await ApiFetcher
  .create(request, "/inspections-public/is-valid-tag-url", { url: tagUrl })
  .get<Result>({ bypassAuth: true });
```

---

## Authentication (Both Approaches)

Both the server-side and client-side layers handle authentication automatically with the same pattern:

1. Attach `Authorization: Bearer <token>` header
2. Attach `X-Client-Id` and `X-Site-Id` from the active access context
3. Attach `X-Access-Intent` header when specified
4. On 401 response, refresh the token and retry once
5. If refresh fails: server-side redirects to `/login`; client-side calls `refreshAuth()` which triggers re-authentication

The key difference: server-side auth reads tokens from the session cookie, while client-side auth reads tokens from the `AuthContext` (which was populated from the session during SSR).

---

## Adding a New Feature

### Option A: Client-side with TanStack Query (preferred)

#### 1. Create a service file

```ts
// app/lib/services/my-resource.service.ts
import { queryOptions } from "@tanstack/react-query";
import type { ResultsPage } from "~/lib/models";

export const MY_RESOURCE_QUERY_KEY = "my-resources";

export const getMyResourcesQuery = (
  fetcher: typeof fetch,
  options: { clientId?: string } = {}
) =>
  queryOptions({
    queryKey: [MY_RESOURCE_QUERY_KEY, options] as const,
    queryFn: ({ queryKey }) =>
      fetcher(buildPath("/my-resources", queryKey[1]))
        .then((r) => r.json() as Promise<ResultsPage<MyResource>>)
        .then((r) => r.results),
  });
```

#### 2. Use it in a component

```tsx
import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedFetch } from "~/hooks/use-authenticated-fetch";
import { getMyResourcesQuery } from "~/lib/services/my-resource.service";

export function MyResourceList() {
  const { fetchOrThrow } = useAuthenticatedFetch();
  const { data, isLoading } = useQuery(getMyResourcesQuery(fetchOrThrow));

  // render...
}
```

### Option B: Server-side with loaders

#### 1. Define the endpoint in `app/.server/api.ts`

```ts
export const api = {
  // ... existing endpoints
  myNewResource: {
    ...CRUD.for<MyType>("/my-resource").all(),
  },
};
```

#### 2. Use it in a route loader

```ts
import { api } from "~/.server/api";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  const data = await api.myNewResource.list(request);
  return { items: data.results };
}
```

---

## Error Handling

### In loaders (server-side)

Use `catchResponse` to gracefully handle API errors:

```ts
import { catchResponse } from "~/.server/api-utils";

export async function loader({ request }: Route.LoaderArgs) {
  return catchResponse(api.assets.get(request, assetId));
}
```

This returns `{ data }` on success or `{ error }` on failure, with the appropriate HTTP status code.

### In React Query (client-side)

Errors are handled globally by the `QueryCache` and `MutationCache` `onError` callbacks configured in `query-context.tsx`. For per-query error handling:

```tsx
const { data, error, isError } = useQuery(getMyResourcesQuery(fetchOrThrow));

if (isError) {
  return <ErrorMessage error={error} />;
}
```

### Response behavior (both approaches)

- **2xx**: Returns parsed JSON body
- **401**: Automatic token refresh + retry, or redirect to login
- **3xx**: Redirect responses are re-thrown for the framework to handle
- **4xx/5xx**: Throws a `Response` with the error body and status code
