-- Drop existing tables and types to ensure a clean slate
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS contact_type CASCADE;
DROP TYPE IF EXISTS contact_status CASCADE;
DROP TYPE IF EXISTS invoice_status CASCADE;

-- Enable the pgcrypto extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum for User Roles
CREATE TYPE user_role AS ENUM ('sales', 'internal', 'admin');
CREATE TYPE contact_type AS ENUM ('lead', 'client');
CREATE TYPE contact_status AS ENUM ('new', 'contacted', 'qualified', 'won', 'lost');
CREATE TYPE invoice_status AS ENUM ('pending', 'paid');

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'sales',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Contacts Table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type contact_type NOT NULL DEFAULT 'lead',
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    niche TEXT,
    social_media TEXT,
    status contact_status DEFAULT 'new',
    notes TEXT,
    assigned_sales_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Invoices Table
DROP TABLE IF EXISTS invoices CASCADE;
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no SERIAL,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    address TEXT,
    payment_method TEXT,
    transaction_id TEXT,
    line_items JSONB DEFAULT '[]'::jsonb,
    status invoice_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Receipts Table
DROP TABLE IF EXISTS receipts CASCADE;
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_no SERIAL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    address TEXT,
    payment_method TEXT,
    transaction_id TEXT,
    line_items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Proposals Table
DROP TABLE IF EXISTS proposals CASCADE;
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    status invoice_status NOT NULL DEFAULT 'pending',
    scope_of_work TEXT,
    terms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Activity Log Table
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- Row Level Security (RLS) Policies
-- --------------------------------------------------------

-- Function to get the current user's role without triggering RLS on users table
CREATE OR REPLACE FUNCTION get_auth_role() RETURNS text AS $$
  SELECT role::text FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Users: Admin can manage all, others can view their own
CREATE POLICY "Admin can manage all users" ON users
    FOR ALL USING (get_auth_role() = 'admin');

CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.uid());

-- Contacts: 
-- Admin: Manage all
CREATE POLICY "Admin manage all contacts" ON contacts
    FOR ALL USING (get_auth_role() = 'admin');

-- Sales: View/Update leads assigned to them
CREATE POLICY "Sales view assigned leads" ON contacts
    FOR SELECT USING (
        get_auth_role() = 'sales' 
        AND type = 'lead' 
        AND assigned_sales_id = auth.uid()
    );

CREATE POLICY "Sales update assigned leads" ON contacts
    FOR UPDATE USING (
        get_auth_role() = 'sales' 
        AND type = 'lead' 
        AND assigned_sales_id = auth.uid()
    );

CREATE POLICY "Sales insert leads" ON contacts
    FOR INSERT WITH CHECK (
        get_auth_role() = 'sales' 
        AND type = 'lead' 
        AND assigned_sales_id = auth.uid()
    );

-- Internal (Manager): View/Update clients assigned to them
CREATE POLICY "Internal view assigned clients" ON contacts
    FOR SELECT USING (
        get_auth_role() = 'internal' 
        AND type = 'client' 
        AND assigned_manager_id = auth.uid()
    );

CREATE POLICY "Internal update assigned clients" ON contacts
    FOR UPDATE USING (
        get_auth_role() = 'internal' 
        AND type = 'client' 
        AND assigned_manager_id = auth.uid()
    );

-- Invoices: Inherit from contacts
CREATE POLICY "Users see invoices for their contacts" ON invoices
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM contacts WHERE id = invoices.contact_id)
    );

CREATE POLICY "Users update invoices for their contacts" ON invoices
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM contacts WHERE id = invoices.contact_id)
    );

CREATE POLICY "Users insert invoices for their contacts" ON invoices
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM contacts WHERE id = invoices.contact_id)
    );

-- Proposals: Inherit from contacts
CREATE POLICY "Users see proposals for their contacts" ON proposals
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM contacts WHERE id = proposals.contact_id)
    );

CREATE POLICY "Users update proposals for their contacts" ON proposals
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM contacts WHERE id = proposals.contact_id)
    );

CREATE POLICY "Users insert proposals for their contacts" ON proposals
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM contacts WHERE id = proposals.contact_id)
    );

-- Receipts: Inherit from contacts
CREATE POLICY "Users see receipts for their contacts" ON receipts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM contacts WHERE id = receipts.contact_id)
    );

CREATE POLICY "Users insert receipts for their contacts" ON receipts
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM contacts WHERE id = receipts.contact_id)
    );

-- Activity Log: Admin views all, users view logs related to their contacts
CREATE POLICY "Admin view all activity log" ON activity_log
    FOR SELECT USING (get_auth_role() = 'admin');

CREATE POLICY "Users view activity log for their contacts" ON activity_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM contacts WHERE id = activity_log.contact_id)
    );

CREATE POLICY "Users can insert activity log" ON activity_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_modtime
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_invoices_modtime
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- --------------------------------------------------------
-- Auth Triggers
-- --------------------------------------------------------
-- Automatically create a user in public.users when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    'sales' -- Default role to 'sales'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
