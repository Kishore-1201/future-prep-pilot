-- Complete fix for role assignment issue
-- First, drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a robust function for handling new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  user_role text := 'student';
  user_name text := 'User';
BEGIN
  -- Debug: Log the raw metadata
  RAISE LOG 'New user metadata: %', NEW.raw_user_meta_data;
  
  -- Extract role from metadata with multiple fallback options
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    -- Try different possible role fields
    IF NEW.raw_user_meta_data ? 'role' AND NEW.raw_user_meta_data->>'role' IN ('student', 'teacher', 'admin') THEN
      user_role := NEW.raw_user_meta_data->>'role';
    ELSIF NEW.raw_user_meta_data ? 'user_role' AND NEW.raw_user_meta_data->>'user_role' IN ('student', 'teacher', 'admin') THEN
      user_role := NEW.raw_user_meta_data->>'user_role';
    END IF;
    
    -- Extract name from metadata
    IF NEW.raw_user_meta_data ? 'name' THEN
      user_name := NEW.raw_user_meta_data->>'name';
    ELSIF NEW.raw_user_meta_data ? 'full_name' THEN
      user_name := NEW.raw_user_meta_data->>'full_name';
    ELSIF NEW.email IS NOT NULL THEN
      user_name := split_part(NEW.email, '@', 1);
    END IF;
  END IF;

  -- Log what we're about to insert
  RAISE LOG 'Creating profile: user_id=%, name=%, role=%', NEW.id, user_name, user_role;

  -- Insert the profile
  INSERT INTO public.profiles (
    id, 
    name, 
    role, 
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_name,
    user_role::app_role,
    true,
    now(),
    now()
  );
  
  RAISE LOG 'Profile created successfully for user %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Also create a function to manually fix existing users
CREATE OR REPLACE FUNCTION public.fix_user_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  user_role text;
BEGIN
  -- Loop through all auth users and ensure they have profiles
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Extract role from metadata
    user_role := 'student';
    IF user_record.raw_user_meta_data IS NOT NULL THEN
      IF user_record.raw_user_meta_data ? 'role' AND user_record.raw_user_meta_data->>'role' IN ('student', 'teacher', 'admin') THEN
        user_role := user_record.raw_user_meta_data->>'role';
      ELSIF user_record.raw_user_meta_data ? 'user_role' AND user_record.raw_user_meta_data->>'user_role' IN ('student', 'teacher', 'admin') THEN
        user_role := user_record.raw_user_meta_data->>'user_role';
      END IF;
    END IF;
    
    -- Create missing profile
    INSERT INTO public.profiles (
      id, 
      name, 
      role, 
      is_active,
      created_at,
      updated_at
    ) VALUES (
      user_record.id,
      COALESCE(
        user_record.raw_user_meta_data->>'name',
        user_record.raw_user_meta_data->>'full_name',
        split_part(user_record.email, '@', 1),
        'User'
      ),
      user_role::app_role,
      true,
      now(),
      now()
    );
    
    RAISE LOG 'Created missing profile for user % with role %', user_record.id, user_role;
  END LOOP;
END;
$$;

-- Run the fix function to handle existing users
SELECT public.fix_user_roles();