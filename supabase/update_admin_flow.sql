-- 1. Add status column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 2. Update existing users to be 'approved' and 'admin' so the owner is not locked out
UPDATE users SET status = 'approved', role = 'admin';

-- 3. Update the handle_new_user trigger to set status to 'pending'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, role, status)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    'sales', -- Default role to 'sales'
    'pending' -- Default status to 'pending'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
