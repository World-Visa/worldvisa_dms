# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
pnpm dev      # Development server with Turbopack
pnpm build    # Production build with Turbopack
pnpm start    # Run production server
pnpm lint     # ESLint validation
pnpm test     # Run checklist validation tests
```

Package manager: **pnpm**. Requires Node.js 18+.

## Technology Stack

- **Framework**: Next.js 16 with App Router and Turbopack
- **Language**: TypeScript 5 (strict mode)
- **Styling**: TailwindCSS v4 with Shadcn UI + Radix UI
- **State Management**: TanStack Query v5 (server state)
- **Real-time**: Socket.IO Client
- **Validation**: Zod
- **Authentication**: Clerk (invite-only signups — no self-registration)
- **Error Tracking**: Sentry
- **Caching**: Upstash Redis

## Architecture Overview

### Route Structure (App Router)

- `/(admin-v2)/v2/*` - Protected admin dashboard (applications, users, clients, quality-check, requested-docs, checklist-requests, mail, messages, profile)
- `/client/*` - Protected client dashboard (applications)
- `/(auth)/auth/sign-in` - Clerk sign-in page
- `/accept-invite/[[...rest]]` - Clerk invitation acceptance (only way to sign up)
- `/verifying` - Post-sign-in role verification page
- `/api/zoho_dms/[...path]` - Catch-all proxy to the Zoho DMS backend
- `/api/realtime/*` - WebSocket / real-time routes

### Authentication — Clerk Only

Authentication is handled entirely by Clerk. There is **no custom JWT auth** — the old `src/lib/auth.ts` has been removed.

Key auth files:
- `src/lib/route-auth.ts` — `requireAuth()` for API route handlers (uses `auth()` from `@clerk/nextjs/server`)
- `src/lib/getToken.ts` — `getClerkToken()` / `setTokenProvider()` for client-side token injection into API calls
- `src/components/auth/ClerkTokenProvider.tsx` — injects Clerk token into the fetcher on mount
- `src/types/auth.ts` — `AppUser`, `UserRole`, `ClerkPublicMetadata` (role stored in Clerk public metadata)
- `src/types/globals.d.ts` — Clerk `globalMetadata` type augmentation

User roles live in Clerk's `publicMetadata.role`. Use helpers from `src/lib/roles.ts`:
- `ROLES` — typed role constants
- `ADMIN_ROLES` — array of all non-client roles
- `isAdminRole(role)` / `isClientRole(role)` — boolean checks

### User Roles

`master_admin` > `admin` > `team_leader` > `supervisor` > `client`

### Key Directories

- `src/hooks/` — Custom hooks encapsulating all business logic and API interactions
- `src/lib/api/` — API client functions with typed responses
- `src/lib/config/api.ts` — All API endpoint constants (`API_ENDPOINTS`, `ZOHO_BASE_URL`)
- `src/lib/constants/` — Domain-specific constants and pure helpers (`users.ts`, `australianData.ts`)
- `src/lib/roles.ts` — Role constants and role-check helpers
- `src/lib/route-auth.ts` — Server-side auth helper for API routes
- `src/lib/getToken.ts` — Client-side token provider
- `src/types/` — TypeScript definitions for all data models
- `src/utils/routes.ts` — All client-side navigation route constants
- `src/components/ui/` — Shadcn UI component library (reuse before creating new)
- `src/components/v2/` — Feature components for the admin v2 UI
- `src/components/auth/` — Auth-specific components

### Data Patterns

- **Query Keys**: Centralized in hooks (e.g., `NOTIFICATION_KEYS`, `APPLICATION_KEYS`)
- **Optimistic Updates**: Used with React Query mutations for immediate UI feedback
- **API Proxy**: All backend calls go through `/api/zoho_dms/[...path]` — never call the backend directly from the client
- **Token injection**: `ClerkTokenProvider` sets the token once; `getClerkToken()` is used inside `fetcher`

### WebSocket Integration

Real-time notifications via `NotificationSocketManager` in `src/lib/notificationSocket.ts`. Handles automatic reconnection with exponential backoff.

## Environment Variables

Copy `env.example` to `.env.local`:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `CLERK_SECRET_KEY` — Clerk secret key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` — `/auth/sign-in`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` — `/verifying`
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — Redis for caching
- `NEXT_PUBLIC_API_BASE_URL` — Backend API URL (`https://backend.worldvisa-api.cloud`)
- `NEXT_PUBLIC_SENTRY_DSN` — Error tracking (optional)

## Key Workflows

1. **Document Upload**: Client uploads -> Pending -> Admin review -> Approved/Rejected
2. **Quality Check**: Application ready -> Push to QC queue -> Team Leader review -> Approved or request changes
3. **Checklist**: Admin creates checklist -> Sends to client -> Client uploads documents -> Admin reviews
4. **User Onboarding**: Admin sends invite via Clerk -> User accepts via `/accept-invite` -> Role assigned in Clerk metadata

## Import Alias

Use `@/` for imports from `src/` (configured in `tsconfig.json`).

---

## Code Standards & Best Practices

### Think Before Creating — Reuse First

- **Always search** for an existing component, hook, or helper before writing a new one.
- **Never duplicate** logic. If the same pattern appears twice, extract it immediately.
- **Shared UI components** live in `src/components/ui/`. Extend via props, not copy-paste.
- **Keep files small and focused.** A file that does one thing is easier to test, read, and reuse. Break large files into smaller composable pieces.

### No Heavy Files — Break Into Small Components

- Components should have **one clear responsibility**. Split when a component grows beyond ~150 lines or handles more than one concern.
- Co-locate sub-components that are only used by one parent in the same file. Move to a separate file as soon as they are reused elsewhere.
- **No logic in JSX.** Extract conditionals and data transformations into variables or helper functions above the `return` statement.
- Keep hooks lean — if a hook is handling too many concerns, split it.

### Route Constants → `src/utils/routes.ts`

All navigation paths used in `router.push()`, `redirect()`, links, or middleware **must** be defined as named constants in `src/utils/routes.ts`.

```ts
// ✅ correct
import { ROUTES } from "@/utils/routes";
router.push(ROUTES.USER_INVITATIONS);

// ❌ wrong — hardcoded string
router.push("/v2/users/invitations");
```

### API Endpoint Constants → `src/lib/config/api.ts`

Every backend URL used in fetches or mutations **must** be defined in `API_ENDPOINTS` inside `src/lib/config/api.ts`. No inline URL strings in hooks or components.

```ts
// ✅ correct
import { API_ENDPOINTS } from "@/lib/config/api";
fetcher(API_ENDPOINTS.USERS.INVITE, { method: "POST", ... });

// ❌ wrong — inline URL
fetcher(`${ZOHO_BASE_URL}/users/invite`, { method: "POST", ... });
```

### Shared Constants & Helpers → `src/lib/constants/`

Domain-specific constants and pure helper functions used across multiple files belong in `src/lib/constants/<domain>.ts`.

- `src/lib/constants/users.ts` — `ROLE_OPTIONS`, `formatRole`, `getInitials`
- `src/lib/roles.ts` — `ROLES`, `ADMIN_ROLES`, `isAdminRole`, `isClientRole`
- Add new files per domain (e.g., `applications.ts`, `documents.ts`) as needed

```ts
// ✅ correct
import { ROLE_OPTIONS, formatRole } from "@/lib/constants/users";
import { isAdminRole } from "@/lib/roles";

// ❌ wrong — local re-definition inside a component
const ROLE_OPTIONS = [ ... ];
```

### Common Logic → Shared Files

Any logic used in more than one place **must** live in a shared file:

| What | Where |
|---|---|
| Role checks | `src/lib/roles.ts` |
| Route paths | `src/utils/routes.ts` |
| API endpoints | `src/lib/config/api.ts` |
| Domain constants / formatters | `src/lib/constants/<domain>.ts` |
| Reusable data-fetching logic | `src/hooks/use<Feature>.ts` |
| Reusable UI | `src/components/ui/` or `src/components/v2/` |

### Production-Ready Code Only

- Write **clean, simple, optimized** code. Avoid over-engineering.
- No speculative abstractions — only abstract when the pattern exists in 2+ places.
- No extra error handling for scenarios that cannot happen. Trust internal framework guarantees.
- No feature flags, backwards-compatibility shims, or `_unused` variable renames for removed code.
- Remove dead code entirely rather than commenting it out.
- Prefer early returns over nested conditionals.
