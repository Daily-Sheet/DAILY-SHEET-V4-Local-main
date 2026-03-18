# Sources of Truth

Single sources of truth for shared constants, utilities, middleware, and patterns used across the codebase. Before implementing new logic, check here first. If a source of truth exists, use or extend it. If none exists, create one and register it here.

---

## Constants

### DEPARTMENTS (user registration departments)
- **Location**: `shared/constants.ts`
- **Type**: `readonly string[]` — `["AUDIO", "LIGHTING", "VIDEO", "PRODUCTION", "BACKLINE", "DRIVER", "WAREHOUSE"]`
- **Used by**: `Landing.tsx` (registration form), `Dashboard.tsx` (profile dialog), `replitAuth.ts` (registration validation), `routes.ts` (profile update validation)
- **Rule**: Never redefine this list elsewhere. Import from `@shared/constants`.

### CONTACT_ROLES (contact role/department options)
- **Location**: `shared/constants.ts`
- **Type**: `readonly string[]` — `["Band", "Crew", "Client", "Venue", "Management", "Audio", ...]`
- **Used by**: `Admin.tsx` (contact role editor), `CreateContactDialog.tsx` (contact form)
- **Note**: These are contact-specific roles (mixed case, broader list), NOT the same as user `DEPARTMENTS` (uppercase, narrower list for registration).

---

## Server Middleware

### `requireRole(...roles: string[])` — Role-based route protection
- **Location**: `server/routes.ts` (top-level function)
- **Purpose**: Ensures the authenticated user has one of the specified workspace roles before proceeding. Attaches `req.workspaceRole` and `req.dbUser`.
- **Reads from**: `req.user.workspaceId` (the user's current workspace)
- **Used by**: All admin-only routes (`POST /api/schedules`, `POST /api/contacts`, etc.)

### `requireWorkspaceAdmin()` — Workspace admin check for workspace management routes
- **Location**: `server/routes.ts` (top-level function)
- **Purpose**: Ensures the authenticated user is an admin of the workspace specified by `req.params.id`. Attaches `req.wsMembers` (full member list) for handler reuse.
- **Reads from**: `req.params.id` (workspace ID from URL)
- **Used by**: `POST /api/workspaces/:id/invite`, `DELETE /api/workspaces/:id/members/:memberId`, `PATCH /api/workspaces/:id/members/:memberId/role`
- **Note**: This is separate from `requireRole("admin")` because it checks admin status on a URL-specified workspace (`:id`), not the user's current workspace.

### `isAuthenticated` — Session authentication check
- **Location**: `server/replit_integrations/auth/index.ts`
- **Purpose**: Ensures request has a valid session with a user. Attaches `req.user`.
- **Used by**: All authenticated routes.

---

## Server Helpers

### `getWorkspaceRole(userId, workspaceId)` — Workspace role lookup
- **Location**: `server/routes.ts` (top-level async function)
- **Purpose**: Returns the user's role within a workspace. Defaults to `"viewer"` if no workspace or no membership found.
- **Used by**: `GET /api/auth/user`, `PATCH /api/auth/profile`, `GET /api/schedules`
- **Note**: Do NOT use in middleware that needs to distinguish "not a member" from "viewer" — use direct member lookup instead (as `requireRole` does).

---

## Client Utilities

### `apiRequest(method, url, data?)` — Standardized API calls
- **Location**: `client/src/lib/queryClient.ts`
- **Purpose**: Wraps `fetch()` with JSON headers, credentials, and error throwing. Returns the raw `Response` object.
- **Used by**: All mutation hooks (`use-contacts.ts`, `use-schedules.ts`, `use-comments.ts`, `use-venue.ts`)
- **Rule**: Always use `apiRequest` for mutations (POST/PATCH/DELETE). Never use raw `fetch()` with manual headers/credentials in hooks.

### Default `queryFn` — Automatic GET fetching
- **Location**: `client/src/lib/queryClient.ts` (configured on `QueryClient`)
- **Purpose**: Joins `queryKey` segments with `/` and fetches with credentials. Handles 401 behavior.
- **Used by**: All query hooks that omit `queryFn` (e.g., `useVenues()`, `useContacts()`, `useSchedules()`, `useComments()`)
- **Rule**: For simple GET queries, omit `queryFn` and let the default handle it. Structure `queryKey` as an array of path segments (e.g., `["/api/schedules", id, "comments"]`).

---

## Data Model

### Schema definitions
- **Location**: `shared/schema.ts` (Drizzle table definitions + Zod insert schemas)
- **Rule**: Single source of truth for all table structures and validation schemas. Both client and server import types from here.

### Auth models (users, workspaces, workspace_members, sessions)
- **Location**: `shared/models/auth.ts`
- **Rule**: Auth-related table definitions live here, separate from business data tables.

### API route definitions
- **Location**: `shared/routes.ts`
- **Purpose**: Centralized route paths, methods, input schemas, and response schemas shared between client hooks and server routes.

---

## Storage

### `IStorage` interface + `DatabaseStorage` implementation
- **Location**: `server/storage.ts`
- **Purpose**: All database CRUD operations go through this abstraction. Never write raw SQL in route handlers.
- **Rule**: Add new data operations to the `IStorage` interface first, then implement in `DatabaseStorage`.
