# INREcrm Project State

## Overview
INREcrm (Sellayo CRM) is a modern, responsive web-based CRM built for a multi-role team (Sales, Internal Managers, Admins) to manage leads, clients, and generate automated documents.

## Tech Stack
- **Frontend Framework**: Next.js (App Router, Turbopack)
- **Language**: Strict TypeScript (no `any` allowed for shared objects)
- **Styling**: Tailwind CSS, Framer Motion (Animations, Gestures)
- **Icons**: Lucide React
- **Notifications**: `react-hot-toast` (globally provided via Layout)
- **Backend / Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **PDF Generation**: `html2canvas` and `jspdf`

## Core Features & Workflows

### 1. Role-Based Access Control
- **Sales**: Can add and view `leads` assigned to them. Can generate receipts and invoices. Can delete leads (but NOT clients).
- **Internal**: Can view and manage `clients` assigned to them (or all clients).
- **Admin**: Has unrestricted access to all contacts, system data, and user approvals.

### 2. Contact Management (`/crm`)
- View a unified list of contacts (Leads & Clients) structured with the shared `Contact` interface (`src/types/index.ts`).
- Interactive **Swipeable Contact Cards**:
  - Swipe Right: Call Contact.
  - Swipe Left: Transfer Lead to Internal CRM (converts lead to client via RPC).
- Dynamic tag generation (e.g., "Receipt Sent") based on document history.

### 3. Document Builder (`/documents`)
- Generate **Invoices** and **Receipts**.
- Smart Pre-filling: Automatically loads the last saved address, payment method, and line items for the selected contact.
- Form Validation: Download/Save buttons are disabled unless required fields (like service description) are filled.
- PDF Export: High-quality, dynamically sized PDF export that falls back to explicit inline-styles to bypass CSS engine crashes.
- CRM Integration: Saving a document attaches it directly to the contact's timeline in the database.

## Database Schema (Key Tables)
1. `users` (id, name, role, status) - Managed via Auth triggers.
2. `contacts` (id, name, type, status, assigned_sales_id, whatsapp_number, service, notes)
3. `invoices` (id, invoice_no, contact_id, amount, line_items, ...)
4. `receipts` (id, receipt_no, contact_id, amount, line_items, ...)
5. `proposals` (id, contact_id, ...)

**Note:** All recent major Supabase database functions, triggers, and RLS policies (e.g., cascade deleting, bypassing email verification rate limits, and allowing sales to see closed clients) are consolidated in `supabase/schema_updates.sql`.

## Recent Fixes & Milestones
- **[Fixed] Database Constraint Bug**: Implemented `delete_contact` Postgres RPC with `SECURITY DEFINER` to safely cascade-delete contacts and related documents while enforcing role permissions.
- **[Fixed] Auth Email Rate Limits**: Replaced default email confirmation with a custom Postgres trigger (`handle_admin_approval`) that confirms accounts upon Admin approval in the dashboard.
- **[Refactored] Type Safety**: Centralized all core data models into `src/types/index.ts`, eliminated dangerous `any` usage, and passed strict build validation.
- **[Refactored] UI/UX**: Replaced all native browser `alert()` popups and `console.log()` debug traces with a modern, smooth `react-hot-toast` notification system.
- **[Fixed] PDF Layout & Engine Crash**: Reconfigured PDF generation to allow for variable height and removed conflicting stylesheets right before print.
- **[Implemented] Pre-filling Engine**: Document builder remembers previous document details.

## Next Steps / Pending
- Proposal generator integration.
- Analytics expansion on Dashboard.
