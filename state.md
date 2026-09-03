# INREcrm Project State

## Overview
INREcrm (Sellayo CRM) is a modern, responsive web-based CRM built for a multi-role team (Sales, Internal Managers, Admins) to manage leads, clients, and generate automated documents.

## Tech Stack
- **Frontend Framework**: Next.js (App Router, Turbopack)
- **Styling**: Tailwind CSS, Framer Motion (Animations, Gestures)
- **Icons**: Lucide React
- **Backend / Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **PDF Generation**: `html2canvas` and `jspdf`

## Core Features & Workflows

### 1. Role-Based Access Control
- **Sales**: Can add and view `leads` assigned to them. Can generate receipts and invoices.
- **Internal**: Can view and manage `clients` assigned to them (or all clients).
- **Admin**: Has unrestricted access to all contacts and system data.

### 2. Contact Management (`/crm`)
- View a unified list of contacts (Leads & Clients).
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
1. `users` (id, name, role) - Managed via Auth triggers.
2. `contacts` (id, name, type, status, assigned_sales_id, assigned_manager_id)
3. `invoices` (id, invoice_no, contact_id, amount, line_items, ...)
4. `receipts` (id, receipt_no, contact_id, amount, line_items, ...)
5. `proposals` (id, contact_id, ...)
6. `activity_log` (id, contact_id, user_id, action)

## Recent Fixes & Milestones
- **[Fixed] PDF Engine Crash**: Hardcoded Tailwind classes to raw inline-CSS to prevent the `lab()` color function crash during `html2canvas` rendering.
- **[Fixed] PDF Layout**: Reconfigured PDF generation to allow for variable height instead of forcing 11-inch pages.
- **[Implemented] Pre-filling Engine**: Document builder now remembers previous document details.
- **[Fixed] RLS Transfer Bug**: Overrode conflicting Row Level Security policies using a Postgres RPC function (`transfer_lead_to_client`) with `SECURITY DEFINER` to guarantee seamless lead transfers from Sales to Internal.

## Next Steps / Pending
- Proposal generator integration.
- Analytics expansion on Dashboard.
