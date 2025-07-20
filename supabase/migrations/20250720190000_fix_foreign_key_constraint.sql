-- Fix foreign key constraint issue for college admin requests

-- Drop the existing foreign key constraint
ALTER TABLE public.college_admin_requests 
DROP CONSTRAINT IF EXISTS college_admin_requests_user_id_fkey;

-- Add a more flexible constraint that allows the user_id to reference auth.users
-- but doesn't enforce it strictly during the signup process
ALTER TABLE public.college_admin_requests 
ADD CONSTRAINT college_admin_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE CASCADE 
DEFERRABLE INITIALLY DEFERRED;

-- Also ensure the RLS policies are correct
DROP POLICY IF EXISTS "requests_create_policy" ON public.college_admin_requests;
CREATE POLICY "requests_create_policy" ON public.college_admin_requests 
  FOR INSERT WITH CHECK (true);

-- Update the trigger to handle college requests better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  user_role text := 'student';
  user_name text := 'User';
  is_pending_admin boolean := false;
BEGIN
  -- Extract role and name from metadata
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    -- Check if this is a college admin request
    IF NEW.raw_user_meta_data ? 'college_request' AND 
       (NEW.raw_user_meta_data->>'college_request')::boolean = true THEN
      user_role := 'student'; -- Temporary role until approved
      is_pending_admin := true;
    ELSIF NEW.raw_user_meta_data ? 'role' AND 
          NEW.raw_user_meta_data->>'role' IN ('student', 'teacher', 'admin') THEN
      user_role := NEW.raw_user_meta_data->>'role';
    ELSIF NEW.raw_user_meta_data ? 'user_role' AND 
          NEW.raw_user_meta_data->>'user_role' IN ('student', 'teacher', 'admin') THEN
      user_role := NEW.raw_user_meta_data->>'user_role';
    END IF;
    
    -- Extract name
    IF NEW.raw_user_meta_data ? 'name' THEN
      user_name := NEW.raw_user_meta_data->>'name';
    ELSIF NEW.raw_user_meta_data ? 'full_name' THEN
      user_name := NEW.raw_user_meta_data->>'full_name';
    ELSIF NEW.email IS NOT NULL THEN
      user_name := split_part(NEW.email, '@', 1);
    END IF;
  END IF;

  -- Insert the profile
  INSERT INTO public.profiles (id, name, role, is_active, pending_approval, created_at, updated_at)
  VALUES (NEW.id, user_name, user_role::app_role, true, is_pending_admin, now(), now());
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;