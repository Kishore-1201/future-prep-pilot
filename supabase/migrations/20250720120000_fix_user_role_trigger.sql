-- Fix the user registration trigger to properly handle role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role app_role := 'student'::app_role;
  user_name TEXT;
BEGIN
  -- Try to get role from different metadata fields
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL AND 
     NEW.raw_user_meta_data->>'role' IN ('student', 'teacher', 'admin') THEN
    user_role := (NEW.raw_user_meta_data->>'role')::app_role;
  ELSIF NEW.raw_user_meta_data->>'user_role' IS NOT NULL AND 
        NEW.raw_user_meta_data->>'user_role' IN ('student', 'teacher', 'admin') THEN
    user_role := (NEW.raw_user_meta_data->>'user_role')::app_role;
  END IF;

  -- Get user name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'User'
  );

  -- Insert the profile with the correct role
  INSERT INTO public.profiles (id, name, role, is_active)
  VALUES (NEW.id, user_name, user_role, true)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    
    -- Try to insert with default values as fallback
    INSERT INTO public.profiles (id, name, role, is_active)
    VALUES (NEW.id, COALESCE(NEW.email, 'User'), 'student'::app_role, true)
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();