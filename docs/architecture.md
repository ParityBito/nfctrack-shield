# Architecture & Data Model

## System Architecture

Shield is a **React Router 7** full-stack application that serves as the frontend for the FC Safety asset management platform. It communicates with a separate backend API for all data operations.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Shield (Frontend)                        │
│                                                                  │
│  Browser (React)  ←→  React Router Server  ←→  Shield Backend API│
│                         ├── Loaders                              │
│                         ├── Actions                              │
│                         └── API Proxy                            │
│                                                                  │
│  External Services:                                              │
│  ├── Keycloak (Authentication)                                   │
│  ├── AWS S3 / CloudFront (File storage & CDN)                    │
│  ├── imgproxy (Image transformation)                             │
│  ├── Sentry (Error tracking)                                     │
│  ├── Google Maps (Location services)                             │
│  └── ZipCodeStack (Address lookup)                               │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | React Router 7 (formerly Remix) |
| UI | React 19, Radix UI, Tailwind CSS v4 |
| State | Zustand, React Query, React Context |
| Forms | React Hook Form + Zod |
| Charts | ECharts |
| Auth | Keycloak via remix-auth-oauth2 |
| Build | Vite |
| Testing | Jest + React Testing Library |
| Monitoring | Sentry |

## Data Model

### Core Entity Relationships

```
Client (Organization)
├── Site[] (Locations)
│   ├── Asset[] (Physical equipment)
│   │   ├── Tag (NFC/QR identifier)
│   │   ├── Product (What the asset is)
│   │   │   ├── Manufacturer
│   │   │   ├── ProductCategory
│   │   │   └── ConsumableProducts[] (Replacement parts)
│   │   ├── Consumable[] (Tracked supplies on the asset)
│   │   ├── Inspection[] (Inspection records)
│   │   │   ├── AssetQuestionResponse[] (Answers)
│   │   │   └── Alert[] (Triggered alerts)
│   │   ├── ProductRequest[] (Supply reorders)
│   │   └── InspectionRoutePoint[] (Position in routes)
│   ├── InspectionRoute[] (Ordered inspection paths)
│   │   ├── InspectionRoutePoint[] (Stops)
│   │   └── InspectionSession[] (Active walk-throughs)
│   └── Member[] (People with access)
│       └── ClientAccess[] (Role assignments)
└── VaultOwnership[] (Private file access records)
```

### Key Entities

#### Asset
The central entity. Represents a physical piece of equipment (e.g., a fire extinguisher, first aid kit, AED) at a specific location within a client's site.

- Linked to a **Product** (what it is) and a **Tag** (how it's identified)
- Has **Consumables** (supplies that expire and need replacement)
- Gets **Inspections** recorded against it
- Can trigger **Alerts** based on inspection responses
- Belongs to a **Site** within a **Client**

#### Inspection
A record of someone checking an asset. Captures:
- Who inspected (inspector), when, where (GPS coordinates)
- Device info (user agent, IP)
- Question responses and any triggered alerts
- Status: `PENDING` or `COMPLETE`

#### Tag
An NFC tag or QR code physically attached to an asset. Has an `externalId` (the readable identifier) and a `serialNumber`. Tags can exist without being assigned to an asset (for batch registration).

#### Client & Site
- **Client**: An organization using Shield (e.g., a company)
- **Site**: A physical location belonging to a client (e.g., a building, floor, or room)
- Sites can have parent-child relationships (subsites)

#### InspectionRoute & InspectionSession
- **InspectionRoute**: An ordered list of assets to inspect at a site
- **InspectionSession**: An active walk-through of a route, tracking which points have been completed
- Session statuses: `PENDING`, `COMPLETE`, `EXPIRED`, `CANCELLED`

#### AssetQuestion
Configurable questions asked during inspections or asset setup. Features:
- Multiple types: `CONFIGURATION`, `SETUP`, `INSPECTION`, `SETUP_AND_INSPECTION`
- Multiple response types: `BINARY`, `TEXT`, `SELECT`, `DATE`, `NUMBER`, `IMAGE`, etc.
- Can have **alert criteria** that automatically create alerts based on answers
- Can have **conditions** that control when the question applies (by region, manufacturer, category, etc.)
- Support parent/variant relationships for question variations

#### Alert
Generated when an inspection response matches alert criteria. Levels: `CRITICAL`, `WARNING`, `INFO`, `AUDIT`. Can be resolved with a note.

#### ProductRequest
Supply reorder requests created during inspections. Workflow: `NEW` → `APPROVED` → `PROCESSING` → `FULFILLED` → `COMPLETE`.

### Access Control Entities

#### Role
Defines a set of capabilities at a specific scope level.
- Scopes: `SYSTEM` > `GLOBAL` > `CLIENT` > `SITE_GROUP` > `SITE` > `SELF`
- Has a list of capability strings checked by the frontend

#### ClientAccess
The join between a person, a client, a site, and a role. A person can have multiple access grants across different clients and sites.

#### Invitation
Allows existing users to invite new members. Invitations have a code, optional email restriction, optional pre-assigned role/site, and status tracking (`PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`).

## Application Routes

### Public (No Auth Required)
| Route | Purpose |
|---|---|
| `/login`, `/callback`, `/logout` | Authentication flow |
| `/accept-invite/:code` | Invitation acceptance |
| `/public-inspect/*` | Public inspection (token-based) |
| `/tag` | NFC/QR tag reading |
| `/health` | Health check |

### Inspect (Authenticated Inspector View)
| Route | Purpose |
|---|---|
| `/inspect` | Inspector home |
| `/inspect/setup` | Begin inspection |
| `/inspect/next` | Next asset in sequence |
| `/inspect/routes` | View inspection routes |
| `/inspect/register` | Register new tags/assets |
| `/inspect/reorder-supplies` | Submit supply requests |

### My Shield (Authenticated User View)
| Route | Purpose |
|---|---|
| `/command-center` | Quick actions dashboard |
| `/dashboard` | Analytics and charts |
| `/assets` | Asset management |
| `/inspection-routes` | Route management |
| `/reports` | Canned reports |
| `/my-organization` | Org settings, members, sites |

### Admin (Elevated Access)
| Route | Purpose |
|---|---|
| `/admin/clients` | Client organization management |
| `/admin/tags` | Tag inventory management |
| `/admin/users` | User management |
| `/admin/roles` | Role/permission configuration |
| `/admin/product-requests` | Supply request management |
| `/admin/settings` | Global application settings |
| `/admin/advanced` | Background jobs, system tools |

### Products (Catalog Management)
| Route | Purpose |
|---|---|
| `/products/all` | Product catalog |
| `/products/categories` | Product categories |
| `/products/manufacturers` | Manufacturer directory |
| `/products/questions` | Inspection/setup questions |

## State Management Strategy

| Type | Tool | Location |
|---|---|---|
| Server data | React Query (via loaders) | Route modules |
| Active access grant | React Context | `app/contexts/active-access-grant-context.tsx` |
| Auth state | React Context | `app/contexts/auth-context.tsx` |
| Image optimization | React Context | `app/contexts/optimized-image-context.tsx` |
| Help sidebar | React Context | `app/contexts/help-sidebar-context.tsx` |
| Query client | React Context | `app/contexts/query-context.tsx` |
| UI preferences | Cookie-based AppState | `app/contexts/app-state-context.tsx` |
| Form state | React Hook Form | Per-form component |

## File Organization

```
app/
├── .server/           # Server-only code (never sent to browser)
│   ├── api.ts         # All API endpoint definitions
│   ├── api-utils.ts   # ApiFetcher, CRUD, FetchOptions classes
│   ├── config.ts      # Zod-validated environment config
│   ├── logger.ts      # Pino logger setup
│   └── user-session.ts # Session management
├── components/        # React components
│   ├── ui/            # Generic UI primitives (button, dialog, etc.)
│   ├── admin/         # Admin panel components
│   ├── assets/        # Asset management UI
│   ├── inspections/   # Inspection workflow UI
│   └── ...            # Feature-specific components
├── contexts/          # React contexts
├── hooks/             # Custom React hooks
├── lib/
│   ├── models.ts      # Core domain type definitions
│   ├── types.ts       # Additional types (roles, access, etc.)
│   ├── permissions.ts # Permission/capability constants
│   ├── schema.ts      # Zod validation schemas
│   ├── urls.ts        # URL building utilities
│   └── utils.ts       # General utilities (cn, etc.)
└── routes/            # React Router route modules
    ├── admin/         # Admin panel routes
    ├── auth/          # Login/logout/callback
    ├── inspect/       # Inspector workflow
    ├── my-shield/     # User dashboard
    ├── products/      # Product catalog
    ├── api/           # API proxy routes
    └── actions/       # Server-side action routes
```
