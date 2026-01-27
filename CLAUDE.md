# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev      # Development server with Turbopack
npm run build    # Production build with Turbopack
npm run start    # Run production server
npm run lint     # ESLint validation
npm run test     # Run checklist validation tests
```

Requires Node.js 18+.

## Technology Stack

- **Framework**: Next.js 16 with App Router and Turbopack
- **Language**: TypeScript 5 (strict mode)
- **Styling**: TailwindCSS v4 with Shadcn UI + Radix UI
- **State Management**: Zustand (client state with persistence) + TanStack Query v5 (server state)
- **Real-time**: Socket.IO Client
- **Validation**: Zod
- **Authentication**: JWT with role-based access (jose library)
- **Error Tracking**: Sentry
- **Caching**: Upstash Redis

## Architecture Overview

### Route Structure (App Router)
- `/(public)/*` - Public routes (admin-login, client-login, portal)
- `/admin/*` - Protected admin dashboard (applications, checklist-requests, quality-check, requested-docs, manage-users)
- `/client/*` - Protected client dashboard (applications)
- `/api/*` - Backend API routes proxying to Zoho DMS

### User Roles
Master Admin > Admin > Team Leader > Supervisor > Client

### Key Directories
- `src/hooks/` - 61 custom hooks encapsulating business logic and API interactions
- `src/lib/api/` - API client functions with typed responses
- `src/lib/config/` - Configuration including API endpoints
- `src/store/` - Zustand stores (auth state with localStorage persistence)
- `src/types/` - TypeScript definitions for all data models
- `src/components/ui/` - Shadcn UI component library

### Data Patterns
- **Query Keys**: Centralized in hooks (e.g., `NOTIFICATION_KEYS`, `APPLICATION_KEYS`)
- **Optimistic Updates**: Used with React Query mutations for immediate UI feedback
- **API Base URL**: Configured via `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_ZOHO_BASE_URL`

### WebSocket Integration
Real-time notifications via `NotificationSocketManager` class in `src/lib/notificationSocket.ts`. Handles automatic reconnection with exponential backoff.

## Environment Variables

Copy `env.example` to `.env.local`:
- `JWT_SECRET` - JWT signing key
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Redis for caching
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL (https://backend.worldvisa-api.cloud)
- `NEXT_PUBLIC_ZOHO_BASE_URL` - Zoho DMS API endpoint
- `NEXT_PUBLIC_SENTRY_DSN` - Error tracking (optional)

## Key Workflows

1. **Document Upload**: Client uploads -> Pending -> Admin review -> Approved/Rejected
2. **Quality Check**: Application ready -> Push to QC queue -> Team Leader review -> Approved or request changes
3. **Checklist**: Admin creates checklist -> Sends to client -> Client uploads documents -> Admin reviews

## Import Alias

Use `@/` for imports from `src/` directory (configured in tsconfig.json).
