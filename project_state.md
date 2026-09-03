# INREcrm Project State

This document tracks the major completed features, architecture decisions, and current state of the INREcrm project. You can provide this file to a new chat to resume the build.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, TypeScript
- **Backend/DB**: Supabase (PostgreSQL, Auth, RLS)
- **UI/UX Libraries**: Framer Motion (animations), Lucide React (icons)
- **PDF Generation**: html2pdf.js (Planned for Phase 3)

## Completed Phases

### Phase 1: Database & Backend Foundation (COMPLETED)
- Initialized Next.js project.
- Configured Supabase connection (`@supabase/supabase-js`).
- Created idempotent Supabase SQL Schema (`supabase/schema.sql`):
  - Defined roles (`sales`, `internal`, `admin`) and statuses.
  - Created tables: `users`, `contacts`, `invoices`, `receipts`, `activity_log`.
  - Implemented Row Level Security (RLS) using a secure `get_auth_role()` function to prevent infinite recursion.
  - Added timestamp triggers.

## In Progress

### Phase 2: Mobile-First CRM UI (IN PROGRESS)
- **Layout**: Bottom-Tab bar navigation (Home, CRM, Settings).
- **Views**: Swipeable Contact Cards for leads/clients using Framer Motion.
- **Routing**: Auth routing (Sales -> Leads, Internal -> Clients).

## Planned

### Phase 3: Context-Aware Document Generation (PLANNED)
- Invoice/Receipt generation from Contact Cards.
- Client-side PDF generation using html2pdf.js.
- Activity logging upon document generation.
