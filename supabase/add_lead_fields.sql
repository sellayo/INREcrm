-- Run this script in your Supabase SQL Editor to add the missing columns

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS whatsapp_number text,
ADD COLUMN IF NOT EXISTS service text,
ADD COLUMN IF NOT EXISTS notes text;
