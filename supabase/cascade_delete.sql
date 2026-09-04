-- Fix delete not working in Sales CRM due to foreign key constraints
-- This drops the old constraints and adds new ones with ON DELETE CASCADE

ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_contact_id_fkey;
ALTER TABLE receipts ADD CONSTRAINT receipts_contact_id_fkey 
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_contact_id_fkey;
ALTER TABLE invoices ADD CONSTRAINT invoices_contact_id_fkey 
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_contact_id_fkey;
ALTER TABLE proposals ADD CONSTRAINT proposals_contact_id_fkey 
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
