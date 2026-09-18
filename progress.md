# INREcrm (Sellayo CRM) - Project Progress & Master Context

> **Notice for Future Agents & Chats**: This document is the single source of truth for the codebase. Read this file to understand the architecture, database schema, role permissions, routes, and recent milestones without having to re-analyze every file.

---

## 1. Project Overview & Tech Stack
INREcrm is a high-performance, mobile-first CRM and business operations suite designed for a multi-role agency/team (Sales, Internal Managers, Administrators) to manage leads, clients, pricing, and automated document generation.

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: Strict TypeScript (no `any` in shared models)
- **Styling & Animation**: Tailwind CSS, Vanilla CSS, Framer Motion
- **Icons**: Lucide React
- **Notifications**: `react-hot-toast` (rendered globally in Layout)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Auth triggers)
- **PDF Generation**: `html2canvas` + `jspdf` (with CSS engine crash bypass)

---

## 2. Role-Based Access Control (RBAC)

| Role | CRM Scope | Services & Pricing | Documents | Administration |
|---|---|---|---|---|
| **Sales** | Manages assigned leads; adds leads; transfers won leads to internal CRM; deletes leads. | Uses live Price Calculator & views Rate Card. | Generates Invoices & Receipts for assigned contacts; pastes calculated quotes. | None. |
| **Internal (Manager)** | Manages clients across the agency; tracks project delivery. | Uses Price Calculator; views Rate Card; views full Client History timeline. | Generates Invoices & Receipts for clients. | None. |
| **Admin** | Unrestricted access across all leads, clients, and pipelines. | Views & updates pricing rates; adds new services; deletes custom services; views Client History. | Full access to document generator and financial documents. | Approves/rejects new user signups; manages user roles; reassigns leads in bulk; sets starting doc numbering. |

---

## 3. Database Schema & Key Database Functions

### Core Tables
1. `users`: `id UUID PK REFERENCES auth.users`, `name TEXT`, `role user_role` (`sales`, `internal`, `admin`), `status user_status` (`pending`, `approved`, `rejected`), `created_at TIMESTAMPTZ`.
2. `contacts`: `id UUID PK`, `name TEXT`, `business_name TEXT`, `email TEXT`, `phone TEXT`, `whatsapp_number TEXT`, `niche TEXT`, `service TEXT`, `notes TEXT`, `social_media TEXT`, `type contact_type` (`lead`, `client`), `status contact_status` (`new`, `contacted`, `qualified`, `won`, `lost`), `assigned_sales_id UUID REFERENCES users`, `assigned_manager_id UUID REFERENCES users`, `created_at`, `updated_at`.
3. `invoices`: `id UUID PK`, `invoice_no SERIAL`, `contact_id UUID REFERENCES contacts ON DELETE CASCADE`, `amount NUMERIC`, `address TEXT`, `payment_method TEXT`, `transaction_id TEXT`, `line_items JSONB`, `status invoice_status` (`pending`, `paid`), `created_at`, `updated_at`.
4. `receipts`: `id UUID PK`, `receipt_no SERIAL`, `invoice_id UUID REFERENCES invoices ON DELETE SET NULL`, `contact_id UUID REFERENCES contacts ON DELETE CASCADE`, `amount NUMERIC`, `address TEXT`, `payment_method TEXT`, `transaction_id TEXT`, `line_items JSONB`, `created_at`.
5. `proposals`: `id UUID PK`, `contact_id UUID REFERENCES contacts ON DELETE CASCADE`, `amount NUMERIC`, `status invoice_status`, `scope_of_work TEXT`, `terms TEXT`, `created_at`, `updated_at`.
6. `app_settings`: `id INT PK DEFAULT 1`, `next_invoice_number INT DEFAULT 101`, `next_receipt_number INT DEFAULT 101`, `pricing_catalog JSONB`.
7. `activity_log`: `id UUID PK`, `action TEXT`, `contact_id UUID`, `user_id UUID`, `details JSONB`, `created_at`.

### Key PostgreSQL RPCs & Triggers (`supabase/schema_updates.sql`)
- `get_auth_role()`: Returns user role bypassing RLS recursion.
- `handle_admin_approval()`: Trigger on `users.status = 'approved'` that automatically confirms `auth.users.email_confirmed_at`, bypassing SMTP rate limits.
- `assign_doc_number()`: Atomic trigger ensuring invoice/receipt numbers increment monotonically via `app_settings`.
- `delete_contact(contact_id UUID)`: `SECURITY DEFINER` function that cascade deletes contacts and attached documents while enforcing that sales reps cannot delete converted clients.
- `transfer_lead_to_client(contact_id UUID)`: RPC converting a lead to client type and setting status to `won`.

---

## 4. Application Routes & Architecture

### `/dashboard` - Executive Performance Hub
- **CRM Overview Tab**:
  - 5 Overview KPI Cards: Total Leads, Closed Won, Lost, Invoices Sent, Receipts Sent.
  - Conversion metrics: Win Rate %, Active Pipeline count, Document Flow.
  - Time filter: 1 day, 7 days, 1 month, 6 months, 1 year, All time.
  - Quick & prominent "Add New Lead" button (available to Sales and Admin).
- **Financial Overview Tab (Admin Only)**:
  - 5 Financial KPI Cards: Total Revenue (₹ collected via receipts), Total Invoiced (₹ billed), Pending Receivables (₹), Average Deal Size (₹), Collection Rate (%).
  - Payment Methods breakdown with visual share progress bars.
  - Recent Financial Transactions ledger with filters (`All`, `Receipts`, `Invoices`).
- **Add New Lead Wizard**:
  - 9-step responsive modal with full dark-mode contrast.
  - Collects Lead Name, Page/Business Name, Email, Phone, Niche, Social, WhatsApp, Service, Notes.

### `/crm` - Lead & Client Network
- Unified list of contacts with status tabs (`All`, `New`, `Contacted`, `Qualified`, `Closed`, `Lost`).
- Interactive Swipeable Contact Cards (`src/components/ui/ContactCard.tsx`):
  - Swipe Right: Direct Call / WhatsApp.
  - Swipe Left: Transfer to Internal CRM as a Client.
- Contact Details modal with edit capabilities and document history tags.

### `/services` - Services & Operations Hub (Consolidated)
- Navigation item in desktop sidebar and mobile bottom tab bar (accessible to Sales, Internal, and Admin).
- **Tab 1: Pricing & Packages**:
  - **Live Price Calculator** (`src/components/ui/PriceCalculator.tsx`):
    - Configures services, quantity sliders, package buttons, duration, extra languages, 30s blocks, caption editing, additional platforms, and retainers.
    - Displays real-time Total Price (₹), savings badges, itemized breakdown, and auto-generated client proposal description.
    - "Copy Proposal Quote" button (copies formatted quote to clipboard).
    - "Create Invoice / Document with Quote" button (saves quote to `sessionStorage` and navigates to `/documents`).
  - **Official Rate Card**:
    - Complete catalog of services with base rates and scope descriptions.
    - Admin Controls: "Add New Service" modal, "Edit Pricing" modal, delete custom service, and "Reset to Defaults".
- **Tab 2: Client History (Admin & Internal)**:
  - Full client directory, search, and chronological timeline of invoices & receipts.

### `/documents` - Document Generator
- Generates professional Invoices and Receipts.
- Client selection with live search.
- **"Paste Calculated Price" Button**:
  - Detects quotes generated from the Price Calculator.
  - 1-click replaces the line items with the calculated service, price, and description while preserving contact name and address.
  - Saving to CRM commits it to the contact timeline and updates future prefill data; unsaved changes do not overwrite existing contact records.
- Export to high-resolution variable-height PDF bypassing stylesheet crashes.

### `/team` - Team & Lead Management (Admin Only)
- User approvals (Pending -> Approved / Rejected).
- Role assignment (Sales, Internal, Admin).
- Bulk lead reassignment across sales reps.

### `/settings` - Profile & System Settings
- User profile information and password update.
- Admin Document Numbering sequencer (`next_invoice_number`, `next_receipt_number`).
- Dark mode toggle.

### `/pending` - Approval Waiting Room
- State gate for unapproved registrations.

---

## 5. Pricing Catalog Baseline

Initial catalog configured in `src/lib/pricingData.ts`:
1. **AI Video Translation**:
   - Tiered Packages: Single Video (₹700), 10 Videos (₹6,300), 20 Videos (₹11,900), 30 Videos (₹16,800), 50 Videos (₹26,250), 100 Videos (₹50,000).
   - Add-ons: Additional languages (+₹600/video), Extra duration 30s blocks (+₹200/block), Extra duration on additional language (+₹200/block), Caption editing (Easy/Medium @ ₹350, Complex @ ₹500).
2. **AI Chatbot Setup**: ₹10,000 base (covers 2 platforms), +₹7,000 per additional platform.
3. **AI Automation (Sales Agent)**: Month 1 Setup ₹15,000 + ₹10,000/mo retainer; Additional platform: +₹5,000 setup + ₹2,000/mo retainer.
4. **Website Development**: ₹20,000 one-time setup.
5. **Social Media Management**: ₹10,000 per page / month.
6. **Meta Ads Management**: ₹25,000 per month.
7. **AI Video / Ad Creation**: ₹5,000 per video.
8. **Caption Editing**: ₹350 Easy/Medium, ₹500 Complex.

---

## 6. Recent Milestones & Changes

- **[Fixed] Dark Mode Contrast**: Step 1 lead name input and all step headings in the Add Lead wizard now have dark styling (`dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white`).
- **[Feature] Admin Lead Creation**: Added Add Lead button on admin dashboard with success notifications.
- **[Feature] Admin Financial Overview Tab**: Executive financial tab featuring Revenue, Invoiced, Pending, Avg Deal Size, Collection Rate KPIs, Payment Methods distribution, and Recent Transactions ledger.
- **[Feature] Interactive Price Calculator**: Built real-time pricing calculator supporting tiered volume discounts, add-on parameters, and proposal text generation.
- **[Feature] 1-Click Quote Transfer**: "Create Invoice with Quote" button copies values and enables a "Paste Calculated Price" button inside the document builder.
- **[Refactored] Navigation Consolidation**: Replaced standalone "History" with "Services" across mobile bottom navigation and sidebar, accommodating Sales access while preventing mobile layout overflow.
- **[Feature] Admin Pricing Manager**: Enabled admins to create new services, edit rates, and restore default rate cards.

---

## 7. Next Steps & Pending Features
- Proposal builder expansion (contract terms, scope agreement exports).
- Webhook / Automated notification on lead transfer.
- Extended analytics (sales rep leaderboard and individual conversion tracking).
