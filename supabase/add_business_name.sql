-- Add business_name to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS business_name TEXT;
