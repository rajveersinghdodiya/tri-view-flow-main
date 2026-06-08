
-- Add aadhaar_number and license_number columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS aadhaar_number TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

-- Add trigger for handle_new_user to also store these fields from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, aadhaar_number, license_number, verification_status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'aadhaar_number',
    NEW.raw_user_meta_data ->> 'license_number',
    CASE 
      WHEN (NEW.raw_user_meta_data ->> 'role') = 'driver' THEN 'pending'
      ELSE 'verified'
    END
  );

  -- Assign role from metadata
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data ->> 'role')::app_role);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
