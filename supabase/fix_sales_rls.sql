-- Fix for disappearing leads (clients) in Sales CRM
-- This updates the RLS policy for the contacts table so sales reps can still see clients they transferred

-- Drop existing policies if needed (Note: change the policy names if they are different in your database)
-- DROP POLICY IF EXISTS "Sales can view their contacts" ON contacts;

CREATE POLICY "Sales can view their contacts" ON contacts
FOR SELECT USING (
  -- Admin or internal can see all, or sales can see their assigned contacts regardless of type
  auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'internal')) 
  OR 
  (auth.uid() IN (SELECT id FROM users WHERE role = 'sales') AND assigned_sales_id = auth.uid())
);
