# Shield - FC Safety Asset Management System

Shield is an enterprise asset management and safety compliance platform built with React Router v7 (formerly Remix). It provides comprehensive tracking of physical assets, inspection management, and safety compliance monitoring across multiple client organizations.

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Environment variables configured (see Configuration section)

### Development Setup

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run in a separate terminal for type checking
npm run typecheck -- --watch
```

The application will be available at http://localhost:5173 by default.

## 🏗️ Project Structure

```
app/
├── components/          # React components organized by feature
│   ├── ui/             # Base UI components (buttons, forms, modals)
│   ├── admin/          # Admin panel components
│   ├── assets/         # Asset management components
│   ├── clients/        # Client and site management
│   ├── dashboard/      # Dashboard charts and widgets
│   ├── inspections/    # Inspection tracking components
│   └── products/       # Product catalog components
├── contexts/           # React contexts for global state
├── hooks/              # Custom React hooks
├── lib/                # Core utilities
│   ├── models/         # TypeScript type definitions
│   ├── schemas/        # Zod validation schemas
│   ├── utils/          # Helper functions
│   └── constants/      # Application constants
├── routes/             # File-based routing
│   ├── admin/          # Admin panel routes
│   ├── api/            # API proxy routes
│   ├── assets/         # Asset management pages
│   ├── auth/           # Authentication routes
│   ├── inspect/        # Inspection workflow
│   └── products/       # Product management
└── .server/            # Server-side code
    ├── auth/           # Authentication logic
    ├── config.ts       # Environment configuration
    └── api-client.ts   # API client setup
```

## 🛠️ Development Guidelines

### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint -- --fix

# Type checking
npm run typecheck

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch
```

### Component Development

Components follow a consistent pattern:

```tsx
// Example component structure
// app/components/feature/my-component.tsx
import { cn } from "~/lib/utils";

interface MyComponentProps {
  className?: string;
  // ... other props
}

export function MyComponent({ className, ...props }: MyComponentProps) {
  return (
    <div className={cn("base-styles", className)} {...props}>
      {/* Component content */}
    </div>
  );
}
```

### State Management

- **Global State**: Zustand stores in `app/contexts/`
- **Server State**: React Query for API data fetching
- **Form State**: React Hook Form with Zod validation
- **UI State**: Local component state with useState

### API Integration

All API calls go through the centralized client:

```tsx
// Example API usage
import { apiClient } from "~/.server/api-client";

// In a loader
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await authenticator.isAuthenticated(request);
  const data = await apiClient.assets.list(session?.accessToken);
  return json(data);
}
```

### Routing

Routes follow React Router v7 conventions:

- `routes/_index.tsx` - Home page
- `routes/assets._index.tsx` - Asset listing
- `routes/assets.$id.tsx` - Asset detail page
- `routes/api.$.ts` - API proxy routes

### UI Components

The project uses a custom component library built on Radix UI:

- Import from `~/components/ui/*`
- Components use Tailwind CSS for styling
- Variants handled by class-variance-authority (CVA)
- See component examples in Storybook (if available)

## 🔐 Authentication

Shield uses Keycloak for enterprise SSO:

- OAuth2/OIDC flow handled by remix-auth-oauth2
- Session management in `app/.server/auth/`
- Protected routes use `authenticator.isAuthenticated()`
- Permissions checked via `hasPermission()` utility

## 🎨 Styling

- **Framework**: Tailwind CSS v4
- **Approach**: Utility-first with component classes
- **Animations**: Custom animations in `tailwind.config.js`
- **Theme**: Customizable via CSS variables
- **Icons**: Lucide React icons

## 📦 Key Dependencies

- **React Router v7**: Full-stack React framework
- **React 19**: Latest React with improved performance
- **TypeScript**: Type safety throughout
- **Tailwind CSS v4**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Zustand**: Lightweight state management
- **React Query**: Server state management
- **React Hook Form**: Form handling
- **Zod**: Schema validation
- **ECharts/Recharts**: Data visualization

## 🚀 Deployment

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Key environment variable groups:

| Group | Variables | Purpose |
|---|---|---|
| Authentication | `CLIENT_ID`, `CLIENT_SECRET`, `ISSUER_URL`, `USERINFO_URL`, `LOGOUT_URL`, `REDIRECT_URL` | Keycloak OAuth2/OIDC |
| Session | `SESSION_SECRET`, `COOKIE_SECRET` | Cookie signing and encryption |
| API | `API_BASE_URL` | Backend API URL |
| AWS | `AWS_ACCESS_KEY_ID`, `AWS_ACCESS_KEY_SECRET`, `AWS_REGION`, `AWS_PUBLIC_*`, `AWS_PRIVATE_*` | S3 storage and CloudFront CDN |
| Image Processing | `IMAGE_PROCESSING_CDN_HOST`, `IMAGE_PROCESSING_KEY`, `IMAGE_PROCESSING_SALT` | imgproxy image transformation |
| External Services | `ZIPCODESTACK_API_KEY`, `GOOGLE_MAPS_API_KEY` | Address lookup and maps |
| Monitoring | `SENTRY_ENVIRONMENT`, `SENTRY_AUTH_TOKEN` | Error tracking |
| App | `APP_HOST`, `PORT` | Application URL and port |

See `.env.example` for the full list with descriptions.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- path/to/test.spec.ts
```

Test files should be colocated with components:
- `my-component.tsx`
- `my-component.test.tsx`

## 📚 Documentation

### Internal Docs

- [Local Development Setup](docs/setup-guide.md) — Step-by-step setup for new developers
- [Architecture & Data Model](docs/architecture.md) — System architecture, entity relationships, and route map
- [API Integration Guide](docs/api-integration.md) — Server-side and client-side data loading patterns
- [Authentication & Authorization](docs/authentication.md) — Keycloak SSO, RBAC, and permissions
- [State Management](docs/state-management.md) — AppState, contexts, TanStack Query, and Zustand usage
- [Form Handling Patterns](docs/form-patterns.md) — React Hook Form + Zod, submission strategies, validation
- [Testing Guide](docs/testing.md) — Jest setup, patterns, and conventions
- [UI Component Library](docs/ui-components.md) — Base components, usage patterns, and conventions
- [Deployment](docs/deployment.md) — Build, production server, environments, CI/CD, monitoring
- [Architecture Decisions](docs/decisions.md) — Key technology choices and rationale
- [Invitation System API Spec](docs/invitation-system-api-spec.md) — Endpoint specification for invitations

### External References

- [React Router v7 Documentation](https://reactrouter.com/v7/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on:

- Branch naming and commit conventions
- Code style and component patterns
- Pull request process
- Testing requirements

## 📄 License

[Your License Here]
