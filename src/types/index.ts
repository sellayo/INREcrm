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

export interface PricingPackage {
  id: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  discountPct: number;
  description?: string;
}

export interface PricingAddon {
  id: string;
  name: string;
  price: number;
  billingType: 'one-time' | 'per-unit' | 'per-month';
  description?: string;
}

export interface PricingService {
  id: string;
  name: string;
  category: 'Market Expansion' | 'Video Translation' | 'Automation & AI' | 'Content & Social' | 'Custom';
  billingType: 'per-video' | 'one-time' | 'per-month' | 'tiered';
  basePrice: number;
  scopeDescription: string;
  durationIncluded?: string; // e.g. "1 - 1.5 min"
  packages?: PricingPackage[];
  addons?: PricingAddon[];
  isCustom?: boolean;
}

export interface CalculationOptions {
  serviceId: string;
  quantity?: number;
  packageId?: string;
  additionalLanguages?: number;
  extraDurationBlocks?: number; // 30s blocks beyond base
  extraLangDurationBlocks?: number;
  captionType?: 'none' | 'easy-medium' | 'complex';
  additionalPlatforms?: number;
  months?: number; // for monthly retainers
}

export interface CalculationResult {
  serviceName: string;
  totalPrice: number;
  basePrice: number;
  discountAmount: number;
  shortDescription: string;
  breakdown: { label: string; amount: number }[];
}

