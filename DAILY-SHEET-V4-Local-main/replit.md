# Daily Sheet

## Overview

Daily Sheet is a full-stack live show production dashboard designed to streamline production crews' workflows. It offers tools for managing schedules, contacts, show files, and venue details through a tabbed dashboard interface. Key features include multi-day scheduling, a "Send Daily" function for emailing formatted daily sheets, an Organization → Manager → Crew hierarchy with manager-level project isolation, and role-based access control. The application also supports AI-powered venue creation from tech packet documents and offers comprehensive administration panels. The business vision is to provide a centralized, efficient platform for live show production management, enhancing coordination and communication among crew members.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite.
- **Routing**: Wouter for client-side routing.
- **State Management & Data Fetching**: TanStack React Query.
- **Forms**: React Hook Form with Zod for validation.
- **UI Components**: shadcn/ui (new-york style) built on Radix UI, styled with Tailwind CSS.
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode) and custom fonts.
- **Animations**: Framer Motion.
- **Native Wrapper**: Capacitor 7 for iOS deployment.

### Backend
- **Runtime**: Node.js with TypeScript (Express 5).
- **API Pattern**: RESTful JSON API using shared Zod schemas for validation.
- **Storage Layer**: Abstracted `IStorage` interface with `DatabaseStorage` implementation.
- **Build**: Custom build script using Vite for client and esbuild for server.

### Shared Code (`shared/`)
- **`schema.ts`**: Drizzle ORM table definitions and Zod insert schemas.
- **`routes.ts`**: Centralized API route definitions with schemas.

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect.
- **Database**: PostgreSQL via `node-postgres` with connection pooling.
- **Schema Management**: `drizzle-kit push`.
- **Session Store**: `connect-pg-simple` for Express sessions.

### Core Architectural Decisions
- **Role Hierarchy**: Three-tier permission system (Manager, Admin, Commenter) with project isolation and role-based access control.
- **Multi-Tenancy**: Data isolated by `workspaceId` (organization); venues are global.
- **Shared Resources**: Venues and contacts are shared within organizations or globally.
- **User Management**: Invite-only registration, self-service admin signup, and organization renaming.
- **Dashboard Features**: View-only tabbed interface for daily information (Overview, Schedule, Assigned Crew, Contacts, Files, Venue, Activity). Includes multi-select show-switcher, DayNavigator, and dashboard search.
- **Project Page as Management Hub**: `/project/:id` is the primary editing interface for schedules, crew assignments, venue management, file management, and travel days.
- **Calendar**: Standalone monthly calendar view with role-based filtering and navigation to daily sheets or project pages.
- **Communication**: "Group Text" functionality, "Send Daily" function, and "Invite via Text".
- **Venue Management**: Quick select for changing venues, AI-powered tech packet parser for venue details.
- **Crew Management**: Availability indicators, check-in/out system, and department grouping.
- **File Management**: Polished file storage with type icons, thumbnails, metadata, nested folders, multi-file upload, search, and inline preview.
- **User Activity**: Tracking `lastActiveAt` and an "Activity" tab for audit trails.
- **UI/UX**: Liquid glass styling (backdrop-blur, rounded-xl, Framer Motion), swipe navigation, direct header buttons, offline indicator, and `ColorSchemeProvider` with 8 palettes.
- **Schedule Management**: Real-time urgency status, expandable show cards, Gantt timeline view, drag-and-drop reordering, and "Copy Day" function.
- **Project Management**: Project numbers, project-level show creation, "Festival Mode" for expanded visibility, and "Tour Mode" with route maps, itinerary views, travel days, and distance calculations.
- **Tour Mode**: `isTour` boolean unlocks touring features including itinerary view, Haversine distance, "On Tour" dashboard widget, crew auto-assignment, and bulk tour show generation.
- **Crew Travel Logistics**: Stores per-crew-member travel details (flight, hotel, ground transport) per travel day, managed from the itinerary.
- **Daily Check-In/Out**: Tracks per-day crew check-in/out, accessible via Dashboard Crew tab and admin toggles. All actions logged to Activity tab.
- **Time Sheets**: Admin tab for entering crew hours, spreadsheet-style table, PDF generation, and CSV/Excel export.
- **Template Management**: Admin Settings for schedule templates.
- **Command Palette**: Cmd+K searchable command palette for quick navigation.
- **"What Changed" Banner**: Dismissible banner showing activity summary since last visit.
- **Venue Map View**: Interactive Leaflet map in Admin Venues tab and mini-map widget on Dashboard Venue tab.
- **Notifications**: In-app notifications with unread counts.
- **Weather Integration**: Live weather data on Dashboard Overview using Open-Meteo and Nominatim.
- **Show Templates**: Multi-day show templates with `offsetDays`.
- **Gear Requests**: Onsite gear request form, generates branded PDF, sends email via Resend, and records history.
- **Festival Crew Assignment**: `project_assignments` table enables project-level crew assignment for festivals and tours, providing "All Stages"/"All Shows" visibility.
- **Festival Venue Consolidation**: Dashboard Venue tab groups stages sharing the same venue into a single consolidated card.
- **Contact Deduplication**: `createContact` upserts by `userId` + `workspaceId` to prevent duplicate user-linked contacts.
- **Custom Date/Time Pickers**: All date/time inputs use custom scroll-wheel pickers.
- **Mobile Dialog Safety**: Dialogs use `w-[calc(100vw-2rem)]`, `p-4 sm:p-6`, `rounded-xl`, with scrolling applied per-dialog.
- **Push Notifications**: Groundwork laid for native platform push notifications.
- **Temporary Access Links**: Time-limited, show-scoped URLs (`/access/:token`) for sharing read-only daily sheets with contacts who don't have accounts. `access_links` table stores token, contactId, eventName, expiresAt, and revoked status. Created from People tab in admin, with expiry presets (today/3 days/1 week/show duration/custom). Public endpoint validates token expiry and workspace scope, returns schedule + venue data.
- **Unified People Tab**: Single "People" tab in admin replaces separate Contacts/Users/Invites tabs. Shows status badges (Active/Invited/No Login), inline role editing, one-click invite, and access link sharing.

## Deployment (Split Architecture)

The app supports a split deployment: **Cloudflare Pages** for the frontend SPA and **Render** for the backend API.

### Frontend → Cloudflare Pages
- **Config**: `wrangler.jsonc` at project root
- **Build**: `npx tsx script/build-client.ts` produces `dist/public/`
- **SPA Routing**: `client/public/_redirects` handles client-side routes
- **Environment Variable**: Set `VITE_API_URL` to the Render backend URL (e.g., `https://daily-sheet-api.onrender.com`) at build time
  - In Cloudflare dashboard: Settings → Environment Variables → Add `VITE_API_URL`
- **Deploy**: `npx wrangler pages deploy dist/public` or connect GitHub repo in Cloudflare dashboard

### Backend → Render
- **Config**: `render.yaml` (Render Blueprint) at project root
- **Build**: `npm install && npx tsx script/build-server.ts` produces `dist/index.cjs`
- **Start**: `node dist/index.cjs`
- **Required Environment Variables**:
  - `DATABASE_URL` — PostgreSQL connection string
  - `SESSION_SECRET` — auto-generated by Render
  - `CORS_ORIGIN` — Cloudflare Pages URL (e.g., `https://daily-sheet.pages.dev`); supports comma-separated list for multiple origins
  - `RESEND_API_KEY` — for email functionality
  - `AI_INTEGRATIONS_OPENAI_API_KEY` — for AI features (optional)
  - `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI base URL (optional)

### How They Connect
- Frontend uses `VITE_API_URL` (set at build time) to prefix all API calls (`client/src/lib/queryClient.ts`)
- Backend CORS config accepts requests from Cloudflare Pages domain via `CORS_ORIGIN` env var
- Session cookies use `sameSite: "none"` + `secure: true` in production for cross-domain auth
- `trust proxy` is enabled for correct cookie handling behind Render's proxy

## External Dependencies

- **PostgreSQL**: Primary data persistence.
- **Google Fonts**: Custom typography.
- **XLSX (SheetJS)**: Client-side Excel/CSV parsing for bulk contact imports.
- **Resend**: Transactional email service.
- **Open-Meteo**: Free weather API for forecasts.
- **Nominatim (OpenStreetMap)**: Free geocoding API for address-to-coordinates conversion.
- **@capacitor/push-notifications**: Push notification plugin for native iOS/Android.
- **Leaflet + react-leaflet**: Interactive maps for venue visualization.
- **@dnd-kit**: Drag-and-drop toolkit for schedule item reordering.