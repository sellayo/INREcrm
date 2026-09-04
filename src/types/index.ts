// Shared Types for the CRM

export type UserRole = 'sales' | 'internal' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserData {
  id: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  email?: string;
}

export interface LineItem {
  id?: string;
  service: string;
  price: string;
  description: string;
}

export interface DocumentRecord {
  id: string;
  line_items: LineItem[];
  created_at: string;
  contact_id?: string;
}

export interface Contact {
  id: string;
  name: string;
  business_name?: string;
  email?: string;
  phone?: string;
  whatsapp_number?: string;
  niche: string;
  service?: string;
  notes?: string;
  social_media?: string;
  status?: string;
  type: 'lead' | 'client';
  assigned_sales_id?: string;
  receipts?: DocumentRecord[];
  invoices?: DocumentRecord[];
  proposals?: DocumentRecord[];
  created_at?: string;
}
