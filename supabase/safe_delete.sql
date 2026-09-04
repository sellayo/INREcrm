-- Function to safely delete a contact and cascade delete its documents
-- This runs with elevated privileges (SECURITY DEFINER) to bypass RLS issues
CREATE OR REPLACE FUNCTION delete_contact(contact_id UUID)
RETURNS void AS $$
DECLARE
  v_type TEXT;
  v_role TEXT;
BEGIN
  -- Get the current user's role
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  
  -- Get the contact's type
  SELECT type INTO v_type FROM public.contacts WHERE id = contact_id;
  
  -- Enforcement: Sales reps can only delete leads
  IF v_role = 'sales' AND v_type = 'client' THEN
    RAISE EXCEPTION 'Sales representatives can only delete leads, not clients.';
  END IF;

  -- Cascade delete related documents
  DELETE FROM public.receipts WHERE public.receipts.contact_id = delete_contact.contact_id;
  DELETE FROM public.invoices WHERE public.invoices.contact_id = delete_contact.contact_id;
  DELETE FROM public.proposals WHERE public.proposals.contact_id = delete_contact.contact_id;
  
  -- Delete the contact
  DELETE FROM public.contacts WHERE id = delete_contact.contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
