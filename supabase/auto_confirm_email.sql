-- Function to automatically confirm email when an admin approves a user
CREATE OR REPLACE FUNCTION public.handle_admin_approval()
RETURNS trigger AS $$
BEGIN
  -- Check if the status is changing to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Update the auth.users table to confirm the email
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the public.users table
DROP TRIGGER IF EXISTS on_admin_approval ON public.users;
CREATE TRIGGER on_admin_approval
  AFTER UPDATE OF status ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_approval();
